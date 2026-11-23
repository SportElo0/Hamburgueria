// Reel 34: a página de caderno de exemplo (o "caixa no caderno" de uma lanchonete fictícia). A mesma página vira a
// foto que o Claude lê no Reel e a base da planilha de presente (PLANILHA). Valores fictícios, escritos à mão (Caveat).
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const font = (w) => pathToFileURL(path.join(HERE, 'img34', `caveat-latin-${w}-normal.woff2`)).href;

// [dia, descrição como está no caderno, valor (+ entrada, − saída)]
export const LINHAS = [
  ['01/11', 'vendas do dia', 1240],
  ['01/11', 'pão e frios', -310],
  ['02/11', 'vendas', 980],
  ['03/11', 'gás', -125],
  ['04/11', 'vendas', 1105],
  ['05/11', 'conta de luz', -268],
  ['06/11', 'vendas', 1370],
  ['07/11', 'vale do Zé', -400],
  ['08/11', 'vendas', 1520],
  ['08/11', 'embalagens', -190],
  ['09/11', 'vendas', 860],
  ['10/11', 'aluguel', -1800],
];

const brl = (n) => n.toLocaleString('pt-BR');

export const FONT_CSS = `
@font-face{font-family:Caveat;font-weight:600;src:url(${font(600)}) format('woff2')}
@font-face{font-family:Caveat;font-weight:700;src:url(${font(700)}) format('woff2')}`;

/** A página: papel pautado, margem vermelha, título e as linhas à mão. Cada linha tem id `nl0`…`nl11`. */
export function pagina({ w = 860, linhaH = 74 } = {}) {
  const linhas = LINHAS.map(
    ([d, t, v], i) => `<div id="nl${i}" class="nl" style="top:${190 + i * linhaH}px">
      <span class="nd">${d}</span><span class="nt">${t}</span><span class="nv" style="color:${v < 0 ? '#b3261e' : '#1d3a8a'}">${v < 0 ? '−' : '+'} ${brl(Math.abs(v))}</span></div>`,
  ).join('');
  return `<div class="caderno" style="width:${w}px;height:${190 + LINHAS.length * linhaH + 120}px">
    <div class="pauta" style="background-size:100% ${linhaH}px;background-position:0 ${190 + linhaH - 8}px"></div>
    <div class="margem"></div>
    <div class="ct">Caixa · Novembro</div>
    ${linhas}
    <div class="risco" style="top:${190 + 3 * linhaH + 6}px"></div>
    <div class="ex">exemplo</div>
  </div>`;
}

export const PAGINA_CSS = `
.caderno{position:relative;background:#fbf8ef;border-radius:10px;box-shadow:0 50px 90px -30px rgba(0,0,0,.55),0 0 0 1px rgba(0,0,0,.06);overflow:hidden;font-family:Caveat,cursive}
.caderno .pauta{position:absolute;inset:0;background-image:linear-gradient(transparent calc(100% - 2px),#bcd0ea calc(100% - 2px))}
.caderno .margem{position:absolute;left:118px;top:0;bottom:0;width:3px;background:#e89a9a}
.caderno .ct{position:absolute;left:150px;top:70px;font-size:76px;font-weight:700;color:#1d3a8a;transform:rotate(-1.5deg);text-decoration:underline;text-decoration-thickness:3px;text-underline-offset:10px}
.caderno .nl{position:absolute;left:30px;right:40px;display:flex;align-items:flex-end;height:74px;font-size:54px;font-weight:600;color:#1d3a8a;line-height:1}
.caderno .nd{width:118px;font-size:44px;color:#2c4a9e;padding-bottom:6px}
.caderno .nt{flex:1;padding-left:24px;padding-bottom:4px}
.caderno .nv{padding-bottom:4px;font-weight:700}
.caderno .risco{position:absolute;left:150px;width:120px;height:4px;background:#1d3a8a;transform:rotate(-8deg);opacity:.0}
.caderno .ex{position:absolute;right:26px;bottom:18px;font-family:Inter,sans-serif;font-size:22px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#a69e88}
`;

/** Página sozinha, como "foto" (para conferir a leitura e para a capa). */
export function foto() {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>${FONT_CSS}
*{box-sizing:border-box;margin:0;padding:0}html,body{width:1080px;height:1350px;overflow:hidden}
body{background:radial-gradient(80% 60% at 50% 40%,#8a6a4c,#4a3524);display:grid;place-items:center}
${PAGINA_CSS}.caderno{transform:rotate(-3deg)}</style></head><body>${pagina()}</body></html>`;
}
