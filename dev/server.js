/*
 * Servidor local que imita a Vercel: roda o middleware, as funções de api/
 * e serve os arquivos estáticos. Uso: npm run dev  (http://localhost:3000)
 * Sem as variáveis do Redis, os dados ficam em memória.
 */

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORTA = Number(process.env.PORT || 3000);
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.css': 'text/css' };

const { default: middleware } = await import(pathToFileURL(path.join(RAIZ, 'middleware.js')));
const { COOKIE, novoToken } = await import(pathToFileURL(path.join(RAIZ, 'lib', 'auth.js')));

async function estatico(caminho) {
  let arq = path.join(RAIZ, decodeURIComponent(caminho));
  if (!arq.startsWith(RAIZ) || /\/(lib|dev|api|node_modules)\//.test(arq.slice(RAIZ.length) + '/')) return null;
  try {
    if ((await stat(arq)).isDirectory()) arq = path.join(arq, 'index.html');
    return new Response(await readFile(arq), { headers: { 'Content-Type': TIPOS[path.extname(arq)] || 'application/octet-stream' } });
  } catch { return null; }
}

async function destino(req, url) {
  if (url.pathname.startsWith('/api/')) {
    const nome = url.pathname.slice(5).replace(/\/$/, '');
    try {
      const mod = await import(pathToFileURL(path.join(RAIZ, 'api', nome + '.js')));
      const h = mod[req.method];
      if (!h) return new Response('método não permitido', { status: 405 });
      return await h(new Request(url, req));
    } catch (e) {
      if (e.code === 'ERR_MODULE_NOT_FOUND') return new Response('não encontrado', { status: 404 });
      throw e;
    }
  }
  if (url.pathname === '/admin' || url.pathname === '/admin/') return Response.redirect(new URL('/', url), 307);
  return (await estatico(url.pathname)) || new Response('não encontrado', { status: 404 });
}

http.createServer(async (nreq, nres) => {
  try {
    const url = new URL(nreq.url, `http://localhost:${PORTA}`);
    const corpo = ['GET', 'HEAD'].includes(nreq.method) ? undefined : await new Promise((ok) => {
      const partes = []; nreq.on('data', (c) => partes.push(c)); nreq.on('end', () => ok(Buffer.concat(partes)));
    });
    const cab = { ...nreq.headers };
    // DEV_LOGADO=1 entra direto como equipe (só para testes locais)
    if (process.env.DEV_LOGADO === '1') cab.cookie = `${COOKIE}=${await novoToken()}`;
    const req = new Request(url, { method: nreq.method, headers: cab, body: corpo });
    let res = await middleware(req, { waitUntil: () => {} });
    const rw = res.headers.get('x-middleware-rewrite');
    if (rw) res = await destino(req, new URL(rw));
    else if (res.headers.get('x-middleware-next')) res = await destino(req, url);
    const h = {};
    res.headers.forEach((v, k) => { if (k === 'set-cookie') h[k] = v.replace('; Secure', ''); else h[k] = v; });
    nres.writeHead(res.status, h);
    nres.end(Buffer.from(await res.arrayBuffer()));
  } catch (e) {
    console.error(e);
    nres.writeHead(500); nres.end('erro: ' + e.message);
  }
}).listen(PORTA, () => console.log(`Propostas A+ em http://localhost:${PORTA}`));
