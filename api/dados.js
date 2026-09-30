/*
 * Dados da proposta para a página (visão do cliente, sem custos).
 * Só é alcançada pelo middleware: com login da equipe ou por um link de
 * cliente válido, que reescreve <link>/dados.json para cá.
 */

import { proposta } from '../lib/registro.js';
import { carregar, calcular, publico } from '../lib/calc.js';

export async function GET(req) {
  const slug = new URL(req.url).searchParams.get('slug');
  const p = proposta(slug);
  if (!p || !p.modelo) return Response.json({ erro: 'proposta sem dados' }, { status: 404 });
  const { salvo } = await carregar(slug);
  return Response.json(publico(p, calcular(p, salvo)), {
    headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });
}
