/*
 * Junta os padrões do cadastro com os dados salvos no painel e calcula preços
 * e totais. `publico()` gera o que o cliente pode ver: custos e margens nunca
 * saem daqui.
 */

import { proposta } from './registro.js';
import { lerJSON } from './store.js';

const num = (v) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));
const r2 = (v) => Math.round(v * 100) / 100;

export async function carregar(slug) {
  const p = proposta(slug);
  if (!p) return null;
  const salvo = (await lerJSON('dados:' + slug)) || {};
  return { p, salvo };
}

/*
 * Itens de cada lista. Depois do primeiro salvamento, a lista inteira (textos
 * e números) vem do painel; antes disso, vem do modelo em registro.js.
 * `salvo.itens` é o formato antigo (só números por item) e ainda é lido.
 */
export function listasBase(p, salvo = {}) {
  const out = {};
  for (const [nome, itens] of Object.entries(p.modelo?.listas || {})) {
    out[nome] = Array.isArray(salvo.listas?.[nome])
      ? salvo.listas[nome]
      : itens.map((d) => ({ ...d, ...(salvo.itens?.[`${nome}.${d.id}`] || {}) }));
  }
  return out;
}

export function calcular(p, salvo = {}) {
  const m = p.modelo;
  const campos = {};
  if (m) {
    for (const c of m.campos) {
      const s = salvo.campos?.[c.id];
      campos[c.id] = s !== undefined ? s : (p.padroes?.[c.id] ?? c.padrao);
    }
  }
  const margemPadrao = num(campos.margem_padrao);

  const listas = {};
  const totais = {};
  for (const [nome, itens] of Object.entries(listasBase(p, salvo))) {
    let soma = 0, pendentes = 0;
    listas[nome] = itens.map((d) => {
      const qtd = num(d.qtd) ?? 1;
      const custo = num(d.custo);
      const margem = num(d.margem);
      const margemUsada = margem ?? margemPadrao;
      const manual = num(d.preco);
      const sugerido = custo !== null && margemUsada !== null ? r2(custo * (1 + margemUsada / 100)) : null;
      const preco = manual ?? sugerido;
      const total = preco !== null ? r2(preco * qtd) : null;
      if (total === null) pendentes++; else soma += total;
      return { ...d, qtd, custo, margem, margemUsada, manual, sugerido, preco, total };
    });
    totais[nome] = { valor: r2(soma), pendentes, completo: pendentes === 0 };
  }

  let geral = null;
  if (totais.materiais && totais.servicos) {
    geral = {
      valor: r2(totais.materiais.valor + totais.servicos.valor),
      completo: totais.materiais.completo && totais.servicos.completo,
    };
    const custo = [...listas.materiais, ...listas.servicos]
      .reduce((a, i) => a + (i.custo !== null ? i.custo * i.qtd : 0), 0);
    geral.custo = r2(custo);
  }

  return { campos, listas, totais, geral, status: salvo.status || 'Rascunho', atualizado: salvo.atualizado || null };
}

// Visão do cliente: sem custo, margem e referências internas.
export function publico(p, c) {
  const exibir = Boolean(c.campos.exibir_precos);
  const listas = {};
  for (const [nome, itens] of Object.entries(c.listas)) {
    listas[nome] = itens.map((i) => ({
      grupo: i.grupo || null, qtd: i.qtd, item: i.item, spec: i.spec,
      ...(exibir ? { preco: i.preco, total: i.total } : {}),
    }));
  }
  const valor = (t) => (t && t.completo ? { valor: t.valor, extenso: extenso(t.valor) } : null);
  const { margem_padrao, exibir_precos, ...campos } = c.campos;
  return {
    titulo: `${p.titulo} · ${p.cliente} ${c.campos.local || p.unidade}`,
    campos,
    exibirPrecos: exibir,
    listas,
    totais: {
      servicos: valor(c.totais.servicos),
      materiais: valor(c.totais.materiais),
      geral: valor(c.geral),
    },
  };
}

/* ---------- valor por extenso ---------- */

const UNI = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez',
  'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const DEZ = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const CEM = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos',
  'setecentos', 'oitocentos', 'novecentos'];

function ate999(n) {
  if (n === 0) return '';
  if (n === 100) return 'cem';
  const c = Math.floor(n / 100), r = n % 100;
  const partes = [];
  if (c) partes.push(CEM[c]);
  if (r < 20) { if (r) partes.push(UNI[r]); }
  else {
    const d = Math.floor(r / 10), u = r % 10;
    partes.push(u ? `${DEZ[d]} e ${UNI[u]}` : DEZ[d]);
  }
  return partes.join(' e ');
}

function inteiro(n) {
  if (n === 0) return 'zero';
  const classes = [['', ''], ['mil', 'mil'], ['milhão', 'milhões'], ['bilhão', 'bilhões']];
  const grupos = [];
  for (let i = 0; n > 0; i++, n = Math.floor(n / 1000)) grupos.push([n % 1000, i]);
  const partes = grupos.filter(([g]) => g).reverse().map(([g, i]) => {
    if (i === 0) return ate999(g);
    if (i === 1) return g === 1 ? 'mil' : `${ate999(g)} mil`;
    return `${ate999(g)} ${g === 1 ? classes[i][0] : classes[i][1]}`;
  });
  // "e" antes do último grupo quando ele é menor que 100 ou centena redonda
  const ultimo = grupos[0][0];
  if (partes.length > 1 && ultimo && (ultimo < 100 || ultimo % 100 === 0)) {
    return partes.slice(0, -1).join(', ') + ' e ' + partes[partes.length - 1];
  }
  return partes.join(', ');
}

export function extenso(valor) {
  const total = Math.round(valor * 100);
  const reais = Math.floor(total / 100), cent = total % 100;
  const partes = [];
  if (reais) {
    const milhoesRedondos = reais >= 1e6 && reais % 1e6 === 0;
    partes.push(`${inteiro(reais)}${milhoesRedondos ? ' de' : ''} ${reais === 1 ? 'real' : 'reais'}`);
  }
  if (cent) partes.push(`${inteiro(cent)} ${cent === 1 ? 'centavo' : 'centavos'}`);
  return partes.length ? partes.join(' e ') : 'zero reais';
}
