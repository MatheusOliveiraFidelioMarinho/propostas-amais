/*
 * Sessão da equipe A+: cookie HttpOnly assinado com HMAC-SHA256.
 * Usado pelo middleware (Edge) e pelas funções da API (Node), ambos com WebCrypto.
 *
 * Variáveis de ambiente na Vercel:
 *   SITE_PASSWORD  senha de acesso da equipe
 *   AUTH_SECRET    string aleatória longa, só para assinar o cookie
 */

const SENHA = process.env.SITE_PASSWORD || 'amais2170';
const SEGREDO = process.env.AUTH_SECRET || 'a+com/propostas/' + SENHA;

export const COOKIE = 'amais_auth';
export const VALIDADE = 60 * 60 * 24 * 7; // 7 dias

const enc = new TextEncoder();
let chave;

function getChave() {
  if (!chave) {
    chave = crypto.subtle.importKey(
      'raw', enc.encode(SEGREDO), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
  }
  return chave;
}

async function assinar(texto) {
  const sig = await crypto.subtle.sign('HMAC', await getChave(), enc.encode(texto));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function igual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function senhaConfere(recebida) {
  return igual(await assinar('pw:' + recebida), await assinar('pw:' + SENHA));
}

export async function novoToken() {
  const exp = Date.now() + VALIDADE * 1000;
  return exp + '.' + await assinar(String(exp));
}

export async function tokenValido(token) {
  if (!token) return false;
  const i = token.lastIndexOf('.');
  if (i < 1) return false;
  const exp = token.slice(0, i), sig = token.slice(i + 1);
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  return igual(sig, await assinar(exp));
}

export function lerCookie(req, nome) {
  const bruto = req.headers.get('cookie');
  if (!bruto) return null;
  for (const parte of bruto.split(';')) {
    const [k, ...v] = parte.trim().split('=');
    if (k === nome) return v.join('=');
  }
  return null;
}

export async function logado(req) {
  return tokenValido(lerCookie(req, COOKIE));
}

/*
 * Senha opcional de um link de cliente. O link guarda só o hash; o cookie do
 * cliente é um passe derivado desse hash, então trocar a senha derruba os
 * acessos já liberados.
 */
export function hashSenhaLink(token, senha) {
  return assinar(`lk:${token}:${senha}`);
}

export function passeLink(token, hash) {
  return assinar(`lkp:${token}:${hash}`);
}

export function cookieLink(token) {
  return 'amais_l_' + token.slice(0, 12);
}

// Token aleatório para links de compartilhamento (base64url, 24 bytes).
export function tokenAleatorio() {
  const b = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
