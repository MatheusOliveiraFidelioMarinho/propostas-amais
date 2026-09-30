/*
 * Armazenamento em Redis (Upstash) pela API REST, sem dependências.
 *
 * Na Vercel, a integração Upstash for Redis do Marketplace cria as variáveis
 * KV_REST_API_URL e KV_REST_API_TOKEN (ou UPSTASH_REDIS_REST_*). Sem elas,
 * o armazenamento fica em memória, o que serve só para rodar localmente.
 */

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export const persistente = Boolean(URL_ && TOKEN);

const memoria = globalThis.__memoria || (globalThis.__memoria = new Map());

function emMemoria([cmd, chave, ...args]) {
  switch (cmd) {
    case 'GET': return memoria.has(chave) ? memoria.get(chave) : null;
    case 'SET': memoria.set(chave, args[0]); return 'OK';
    case 'DEL': return [chave, ...args].reduce((n, k) => n + (memoria.delete(k) ? 1 : 0), 0);
    case 'INCR': { const v = Number(memoria.get(chave) || 0) + 1; memoria.set(chave, String(v)); return v; }
    case 'SADD': { const s = memoria.get(chave) || new Set(); args.forEach((a) => s.add(a)); memoria.set(chave, s); return 1; }
    case 'SREM': { const s = memoria.get(chave); if (s) args.forEach((a) => s.delete(a)); return 1; }
    case 'SMEMBERS': return [...(memoria.get(chave) || [])];
    case 'MGET': return [chave, ...args].map((k) => (memoria.has(k) ? memoria.get(k) : null));
    default: throw new Error('Comando não suportado em memória: ' + cmd);
  }
}

export async function redis(...comando) {
  if (!persistente) return emMemoria(comando);
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(comando),
    cache: 'no-store',
  });
  const j = await r.json();
  if (j.error) throw new Error('Redis: ' + j.error);
  return j.result;
}

export async function lerJSON(chave) {
  const v = await redis('GET', chave);
  if (!v) return null;
  try { return JSON.parse(v); } catch { return null; }
}

export function gravarJSON(chave, valor) {
  return redis('SET', chave, JSON.stringify(valor));
}
