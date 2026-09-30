/*
 * Portão do portal (Vercel Edge Middleware). Roda antes de qualquer arquivo.
 *
 *   /pub/*            público (logo da tela de login)
 *   /s/<token>/...    link de cliente: só a proposta daquele link, enquanto existir
 *   /p/<slug>/...     proposta vista pela equipe (exige login)
 *   todo o resto      portal, painel e API (exige login)
 *
 * /p/ e /s/ são reescritos para propostas/<pasta>/ e dados.json para
 * /api/dados, então o endereço mostrado ao cliente nunca muda.
 */

import { COOKIE, VALIDADE, logado, senhaConfere, novoToken } from './lib/auth.js';
import { proposta } from './lib/registro.js';
import { lerJSON, redis } from './lib/store.js';

export const config = { matcher: '/:path*' };

function seguir() {
  return new Response(null, { headers: { 'x-middleware-next': '1' } });
}

function reescrever(req, caminho) {
  return new Response(null, { headers: { 'x-middleware-rewrite': new URL(caminho, req.url).toString() } });
}

function redirecionar(destino, extra = {}) {
  return new Response(null, { status: 303, headers: { Location: destino, 'Cache-Control': 'no-store', ...extra } });
}

// Só aceita caminho interno; evita open redirect.
function destinoSeguro(valor) {
  if (!valor || valor[0] !== '/' || valor.startsWith('//')) return '/';
  return valor;
}

function escapar(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const ESTILO = `*{box-sizing:border-box;margin:0;padding:0}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
  background:#000 radial-gradient(760px 420px at 70% 18%,rgba(176,224,0,.10),transparent 64%);
  color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,sans-serif;-webkit-font-smoothing:antialiased;line-height:1.62}
::selection{background:#b0e000;color:#000}
.box{width:100%;max-width:400px}
img{display:block;height:34px;width:auto;margin-bottom:30px}
.eyebrow{display:inline-block;font-size:11px;font-weight:800;letter-spacing:1.7px;text-transform:uppercase;color:#b0e000;border-left:3px solid #b0e000;padding:2px 0 2px 12px;margin-bottom:18px}
h1{font-size:27px;line-height:1.15;letter-spacing:-.9px;font-weight:800;margin-bottom:10px}
p.sub{font-size:14px;color:#a9a9a9;margin-bottom:26px}
form{background:#0d0d0d;border:1px solid #232323;border-radius:12px;padding:24px}
label{display:block;font-size:11px;font-weight:800;letter-spacing:1.1px;text-transform:uppercase;color:#6f6f6f;margin-bottom:9px}
input{width:100%;padding:13px 14px;border-radius:8px;border:1px solid #333;background:#000;color:#fff;font-size:15px;font-family:inherit;outline:none;transition:.15s}
input:focus{border-color:#b0e000;box-shadow:0 0 0 3px rgba(176,224,0,.15)}
button{width:100%;margin-top:16px;padding:13px 14px;border:0;border-radius:8px;cursor:pointer;background:#b0e000;color:#000;font-size:14px;font-weight:800;font-family:inherit;letter-spacing:.3px}
button:hover{filter:brightness(1.12)}
.erro{margin-top:16px;font-size:13px;font-weight:650;color:#ff6b6b;border-left:3px solid #ff6b6b;padding-left:11px}
.rodape{margin-top:22px;font-size:12px;color:#6f6f6f;border-top:1px solid #232323;padding-top:14px}`;

function pagina(corpo, status) {
  return new Response(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Propostas | A+.com Engenharia e Tecnologia</title>
<style>${ESTILO}</style>
</head>
<body>
<div class="box">
  <img src="/pub/logo-amais.png" alt="A+.com Engenharia e Tecnologia">
  ${corpo}
  <div class="rodape">A+.com Engenharia e Tecnologia</div>
</div>
</body>
</html>`, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  });
}

function telaLogin({ destino = '/', erro = false, status = 401 } = {}) {
  return pagina(`<span class="eyebrow">Acesso restrito</span>
  <h1>Propostas A+</h1>
  <p class="sub">Portal de propostas da equipe A+.com. Informe a senha para continuar.</p>
  <form method="POST" action="/__auth" autocomplete="off">
    <input type="hidden" name="next" value="${escapar(destino)}">
    <label for="senha">Senha</label>
    <input id="senha" name="senha" type="password" autofocus required>
    <button type="submit">Entrar</button>
    ${erro ? '<div class="erro">Senha incorreta.</div>' : ''}
  </form>`, status);
}

function linkIndisponivel() {
  return pagina(`<span class="eyebrow">Link indisponível</span>
  <h1>Este link não está mais ativo</h1>
  <p class="sub">O endereço expirou ou foi removido. Solicite um novo link ao seu contato na A+.com.</p>`, 404);
}

// Resolve o restante do caminho de uma proposta para o arquivo real.
function servirProposta(req, p, resto, equipe = false) {
  if (resto.split('/').some((s) => s === '..' || s === '.')) return linkIndisponivel();
  if (resto === '' || resto === 'index.html') return reescrever(req, `/propostas/${p.pasta}/${p.pagina}`);
  if (resto === 'dados.json') return reescrever(req, `/api/dados?slug=${encodeURIComponent(p.slug)}${equipe ? '&previa=1' : ''}`);
  return reescrever(req, `/propostas/${p.pasta}/${resto}`);
}

export default async function middleware(req, ctx) {
  const url = new URL(req.url);
  const caminho = url.pathname;

  if (caminho.startsWith('/pub/') || caminho === '/favicon.ico') return seguir();

  /* ---------- login da equipe ---------- */

  if (caminho === '/__auth') {
    if (req.method !== 'POST') return telaLogin({ status: 200 });
    let form;
    try { form = await req.formData(); } catch { form = null; }
    const enviada = form ? String(form.get('senha') || '') : '';
    const destino = destinoSeguro(form ? String(form.get('next') || '/') : '/');
    if (await senhaConfere(enviada)) {
      return redirecionar(destino, {
        'Set-Cookie': `${COOKIE}=${await novoToken()}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${VALIDADE}`,
      });
    }
    return telaLogin({ destino, erro: true });
  }

  if (caminho === '/__sair') {
    return redirecionar('/', { 'Set-Cookie': `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` });
  }

  /* ---------- link de cliente ---------- */

  const s = caminho.match(/^\/s\/([A-Za-z0-9_-]{16,64})(\/.*)?$/);
  if (s) {
    const [, token, resto] = s;
    const link = await lerJSON('link:' + token);
    const p = link && proposta(link.slug);
    if (!p || (link.expira && link.expira < Date.now())) return linkIndisponivel();
    if (resto === undefined) return redirecionar(`/s/${token}/${url.search}`);
    const arquivo = resto.slice(1);
    if (arquivo === '' || arquivo === 'index.html') {
      const conta = redis('INCR', `link:${token}:v`).then(() => redis('SET', `link:${token}:u`, String(Date.now())));
      if (ctx?.waitUntil) ctx.waitUntil(conta.catch(() => {})); else await conta.catch(() => {});
    }
    return servirProposta(req, p, arquivo);
  }

  /* ---------- área da equipe ---------- */

  if (!(await logado(req))) {
    if (caminho.startsWith('/api/')) {
      return new Response(JSON.stringify({ erro: 'não autenticado' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }
    return telaLogin({ destino: caminho + url.search });
  }

  const pp = caminho.match(/^\/p\/([a-z0-9-]+)(\/.*)?$/);
  if (pp) {
    const p = proposta(pp[1]);
    if (!p) return new Response('Proposta não encontrada', { status: 404 });
    if (pp[2] === undefined) return redirecionar(`/p/${p.slug}/`);
    return servirProposta(req, p, pp[2].slice(1), true);
  }

  return seguir();
}
