/*
 * API do painel. Exige login da equipe (checado no middleware e de novo aqui).
 *
 *   GET    ?acao=lista                     propostas com status, totais e links
 *   GET    ?acao=proposta&slug=            modelo, dados calculados e links
 *   PUT    ?acao=salvar&slug=              grava campos, listas de itens e status
 *   POST   ?acao=link&slug=                cria link de cliente { rotulo, dias }
 *   DELETE ?acao=link&token=               remove link de cliente
 */

import { PROPOSTAS, STATUS, proposta } from '../lib/registro.js';
import { carregar, calcular, listasBase } from '../lib/calc.js';
import { logado, tokenAleatorio } from '../lib/auth.js';
import { redis, lerJSON, gravarJSON, persistente } from '../lib/store.js';

const json = (dados, status = 200) =>
  Response.json(dados, { status, headers: { 'Cache-Control': 'no-store' } });

async function links(slug) {
  const tokens = await redis('SMEMBERS', 'links:' + slug);
  if (!tokens.length) return [];
  const chaves = tokens.flatMap((t) => [`link:${t}`, `link:${t}:v`, `link:${t}:u`]);
  const vals = await redis('MGET', ...chaves);
  const lista = [];
  tokens.forEach((t, i) => {
    const bruto = vals[i * 3];
    if (!bruto) return;
    const l = JSON.parse(bruto);
    lista.push({
      token: t, rotulo: l.rotulo, criado: l.criado, expira: l.expira || null,
      acessos: Number(vals[i * 3 + 1] || 0), ultimoAcesso: vals[i * 3 + 2] ? Number(vals[i * 3 + 2]) : null,
    });
  });
  return lista.sort((a, b) => b.criado - a.criado);
}

async function autorizado(req) {
  if (!(await logado(req))) return false;
  if (req.method !== 'GET') {
    const origem = req.headers.get('origin');
    if (origem && new URL(origem).host !== new URL(req.url).host) return false;
  }
  return true;
}

async function tratar(req) {
  if (!(await autorizado(req))) return json({ erro: 'não autenticado' }, 401);
  const q = new URL(req.url).searchParams;
  const acao = q.get('acao');

  if (req.method === 'GET' && acao === 'lista') {
    const lista = await Promise.all(PROPOSTAS.map(async (p) => {
      const c = p.modelo ? calcular(p, (await carregar(p.slug)).salvo) : null;
      return {
        slug: p.slug, cliente: p.cliente, titulo: p.titulo, unidade: c?.campos.local || p.unidade,
        editavel: Boolean(p.modelo), status: c?.status || null, atualizado: c?.atualizado || null,
        total: c?.geral || null, links: (await links(p.slug)).length,
      };
    }));
    return json({ propostas: lista, persistente });
  }

  if (acao === 'link' && req.method === 'DELETE') {
    const token = q.get('token') || '';
    const link = await lerJSON('link:' + token);
    if (!link) return json({ erro: 'link não encontrado' }, 404);
    await redis('DEL', `link:${token}`, `link:${token}:v`, `link:${token}:u`);
    await redis('SREM', 'links:' + link.slug, token);
    return json({ ok: true });
  }

  const p = proposta(q.get('slug'));
  if (!p) return json({ erro: 'proposta não encontrada' }, 404);

  if (req.method === 'GET' && acao === 'proposta') {
    const { salvo } = await carregar(p.slug);
    return json({
      proposta: { slug: p.slug, cliente: p.cliente, titulo: p.titulo, unidade: p.unidade },
      modelo: p.modelo || null, padroes: p.padroes || {}, status: STATUS, salvo,
      listas: p.modelo ? listasBase(p, salvo) : null,
      calculo: p.modelo ? calcular(p, salvo) : null,
      links: await links(p.slug), persistente,
    });
  }

  if (req.method === 'PUT' && acao === 'salvar') {
    if (!p.modelo) return json({ erro: 'proposta sem campos' }, 400);
    const corpo = await req.json().catch(() => null);
    if (!corpo) return json({ erro: 'corpo inválido' }, 400);
    const ids = new Set(p.modelo.campos.map((c) => c.id));
    const campos = {};
    for (const [k, v] of Object.entries(corpo.campos || {})) {
      if (ids.has(k)) campos[k] = typeof v === 'boolean' ? v : String(v ?? '').slice(0, 500);
    }
    const listas = {};
    for (const nome of Object.keys(p.modelo.listas)) {
      const itens = corpo.listas?.[nome];
      if (!Array.isArray(itens)) continue;
      listas[nome] = itens.slice(0, 150).filter((v) => v && typeof v === 'object').map((v, i) => {
        const item = { id: String(v.id || `i${Date.now().toString(36)}${i}`).slice(0, 40) };
        for (const [f, max] of [['grupo', 60], ['item', 160], ['spec', 300], ['ref', 160]]) {
          const t = String(v[f] ?? '').trim().slice(0, max);
          if (t) item[f] = t;
        }
        for (const f of ['qtd', 'custo', 'margem', 'preco']) {
          const n = v[f];
          if (n !== '' && n !== null && n !== undefined && Number.isFinite(Number(n))) item[f] = Number(n);
        }
        return item;
      });
    }
    const salvo = {
      campos, listas,
      status: STATUS.includes(corpo.status) ? corpo.status : 'Rascunho',
      atualizado: Date.now(),
    };
    await gravarJSON('dados:' + p.slug, salvo);
    return json({ ok: true, salvo, calculo: calcular(p, salvo) });
  }

  if (req.method === 'POST' && acao === 'link') {
    const corpo = await req.json().catch(() => ({}));
    const dias = Number(corpo.dias) || 0;
    const token = tokenAleatorio();
    const link = {
      slug: p.slug,
      rotulo: String(corpo.rotulo || '').slice(0, 120) || 'Sem identificação',
      criado: Date.now(),
      expira: dias > 0 ? Date.now() + dias * 86400000 : null,
    };
    await gravarJSON('link:' + token, link);
    await redis('SADD', 'links:' + p.slug, token);
    return json({ ok: true, token, ...link });
  }

  return json({ erro: 'ação inválida' }, 400);
}

export const GET = tratar;
export const PUT = tratar;
export const POST = tratar;
export const DELETE = tratar;
