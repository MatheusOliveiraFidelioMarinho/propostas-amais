/*
 * Dados da proposta para a página (visão do cliente, sem custos).
 * Só é alcançada pelo middleware: com login da equipe ou por um link de
 * cliente válido, que reescreve <link>/dados.json para cá.
 * Com previa=1 (só na visão da equipe, /p/), os totais parciais também saem.
 */

import { proposta } from '../lib/registro.js';
import { carregar, calcular, publico } from '../lib/calc.js';
import { logado } from '../lib/auth.js';

export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const slug = q.get('slug');
  const p = proposta(slug);
  if (!p || !p.modelo) return Response.json({ erro: 'proposta sem dados' }, { status: 404 });
  const { salvo } = await carregar(slug);
  const previa = q.get('previa') === '1' && (await logado(req));
  return Response.json(publico(p, calcular(p, salvo), { previa }), {
    headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });
}
