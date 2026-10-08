/*
 * Script de proteção incluído por toda proposta (<script src="protecao.js">).
 * O middleware decide o que entregar: no link de cliente (/s/) vem o script
 * abaixo; na visão da equipe (/p/) vem vazio, e o botão de PDF funciona.
 *
 * No link de cliente: sem botão de PDF, impressão e "salvar como PDF" saem em
 * branco, e atalhos de imprimir/salvar, cópia e menu de contexto ficam desligados.
 *
 * Captura e gravação de tela não podem ser impedidas por uma página web. O que
 * dá para fazer é atrapalhar: uma cortina cobre o conteúdo quando a janela
 * perde o foco e quando os atalhos de captura do sistema são pressionados
 * (Cmd+Shift no macOS, Win+Shift e PrintScreen no Windows). Câmera de celular,
 * gravador já em execução e captura por botão em celular passam.
 */

function protecaoCliente() {
  window.print = function () {};

  var css = [
    '#bPdf,[data-pdf]{display:none!important}',
    'html{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}',
    'img{-webkit-user-drag:none;pointer-events:none}',
    '#amais-cortina{position:fixed;inset:0;z-index:2147483600;display:none;align-items:center;justify-content:center;text-align:center;padding:24px;background:#050d09;color:#a3b8ad;font:600 17px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;line-height:1.6;cursor:pointer}',
    '#amais-cortina b{display:block;color:#b0e000;font-size:13px;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px}',
    'html.amais-oculto #amais-cortina{display:flex}',
    'html.amais-oculto body>*:not(#amais-cortina){visibility:hidden!important}',
    '@media print{html,body{background:#fff!important;height:auto!important}body>*{display:none!important}',
    'body::before{content:"Impressão e PDF não estão disponíveis neste link. Solicite o documento ao seu contato na A+.com.";display:block;padding:80px 60px;font:600 18px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#111}}',
  ].join('');
  var estilo = document.createElement('style');
  estilo.textContent = css;
  document.head.appendChild(estilo);

  /* cortina: cobre o conteúdo enquanto houver risco de captura */
  var raiz = document.documentElement, presoAte = 0;
  function cortina() {
    if (document.getElementById('amais-cortina') || !document.body) return;
    var c = document.createElement('div');
    c.id = 'amais-cortina';
    c.innerHTML = '<div><b>Conteúdo protegido</b>Clique aqui para continuar a visualização.</div>';
    document.body.appendChild(c);
  }
  function ocultar(ms) { cortina(); raiz.classList.add('amais-oculto'); presoAte = Math.max(presoAte, Date.now() + (ms || 0)); }
  function mostrar() { if (Date.now() >= presoAte && document.hasFocus() && !document.hidden) raiz.classList.remove('amais-oculto'); }
  if (document.body) cortina(); else document.addEventListener('DOMContentLoaded', cortina);
  addEventListener('blur', function () { ocultar(0); });
  addEventListener('focus', function () { setTimeout(mostrar, 150); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) ocultar(0); else setTimeout(mostrar, 150); });
  if (!document.hasFocus()) ocultar(0);
  // atalhos de captura: Cmd+Shift (macOS), Win+Shift e PrintScreen (Windows).
  // Fica coberto até o próximo clique, porque durante a seleção da área o
  // sistema não entrega eventos à página.
  addEventListener('keydown', function (e) {
    if (e.key === 'PrintScreen' || (e.metaKey && e.shiftKey) || (e.key === 'Meta' && e.shiftKey) || (e.key === 'Shift' && e.metaKey)) ocultar(900);
  }, true);
  addEventListener('keyup', function (e) {
    if (e.key === 'PrintScreen') { ocultar(900); try { navigator.clipboard.writeText(' '); } catch (x) {} }
  }, true);
  addEventListener('pointerdown', function () { setTimeout(mostrar, 0); }, true);

  var parar = function (e) { e.preventDefault(); e.stopPropagation(); };
  ['contextmenu', 'dragstart', 'copy', 'cut', 'beforeprint'].forEach(function (ev) {
    addEventListener(ev, ev === 'beforeprint' ? function () {} : parar, true);
  });
  addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase();
    if ((e.ctrlKey || e.metaKey) && (k === 'p' || k === 's' || k === 'u')) parar(e);
  }, true);
}

export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const cab = { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };
  if (q.get('equipe') === '1') return new Response('/* visão da equipe: sem restrições */\n', { headers: cab });
  return new Response(`(${protecaoCliente.toString()})();\n`, { headers: cab });
}
