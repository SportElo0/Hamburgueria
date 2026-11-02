// Núcleo do gerador editorial de carrosséis da Growlift (fase 1, 02/11/2026).
// Um slide não é um "modelo": é um ARRANJO (como os blocos se distribuem) com uma lista de BLOCOS (componentes).
// Arranjos podem conter grupos com outro arranjo dentro, então as composições se combinam livremente,
// sempre na mesma grade (margem 88 px, área útil 904 × 1060) e na mesma escala de texto.
import { page, TOKENS, MARK } from '../pecas.mjs';
import { COMPONENTES } from './componentes.mjs';

export const W = 1080;
export const H = 1350;
export const M = 88; // margem lateral
export const AREA = { top: 150, bottom: 140 }; // área útil: 150 → 1210

export const COR = {
  ...TOKENS,
  red: '#ff6b5b',
  green: '#22c55e',
  amber: '#ffc94d',
  paper: '#f4f6fa',
  ink: '#121826',
  inkSoft: '#4a5568',
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Texto rico mínimo: **destaque** vira azul, ~~riscado~~ vira riscado, quebra de linha vira <br>. */
export function rico(s = '') {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<span class="b">$1</span>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    .replace(/\n/g, '<br>');
}

/** Palavras visíveis de um texto rico (para o limite de palavras por slide). */
export const palavras = (s = '') => String(s).replace(/[*~]/g, '').split(/\s+/).filter(Boolean).length;

export const CSS = `
body{background:${COR.bg}}
body.claro{background:#eef1f6;color:${COR.ink}}
.glow{position:absolute;border-radius:50%;pointer-events:none;background:radial-gradient(closest-side,rgba(8,101,254,.42),rgba(8,101,254,0) 70%)}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:72px 72px;-webkit-mask-image:radial-gradient(ellipse 85% 75% at 40% 30%,#000,transparent 78%)}
body.claro .grid{background-image:linear-gradient(rgba(18,24,38,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(18,24,38,.05) 1px,transparent 1px)}
.b{color:${COR.blueBright}}
body.claro .b{color:${COR.blue}}
s{text-decoration-thickness:4px;text-decoration-color:${COR.red}}
#area{position:absolute;left:${M}px;right:${M}px;top:${AREA.top}px;bottom:${AREA.bottom}px;display:flex;flex-direction:column}
.arr{display:flex;min-height:0;min-width:0}
.arr.pilha{flex-direction:column}
.arr.lado{flex-direction:row;align-items:center}
.arr.palco{flex-direction:column;justify-content:flex-end}
.arr.centro{flex-direction:column;align-items:center;justify-content:center;text-align:center}
.arr > *{min-width:0}
.fill{flex:1 1 0;min-height:0;display:flex;flex-direction:column;justify-content:center}
.t-capa{font-size:112px;font-weight:850;letter-spacing:-.045em;line-height:.98}
.t-g{font-size:84px;font-weight:820;letter-spacing:-.04em;line-height:1}
.t-m{font-size:64px;font-weight:800;letter-spacing:-.035em;line-height:1.04}
.t-p{font-size:52px;font-weight:780;letter-spacing:-.03em;line-height:1.08}
.x-g{font-size:42px;line-height:1.34;font-weight:450;color:#dfe5f0}
.x-m{font-size:36px;line-height:1.36;font-weight:450;color:#dfe5f0}
.x-p{font-size:30px;line-height:1.38;font-weight:500;color:${COR.soft}}
body.claro .x-g,body.claro .x-m{color:#2b3446}
body.claro .x-p{color:${COR.inkSoft}}
.rot{font-size:28px;font-weight:750;letter-spacing:.14em;text-transform:uppercase;color:${COR.eyebrow}}
body.claro .rot{color:#0652d1}
.selo{display:inline-flex;align-self:flex-start;align-items:center;gap:10px;font-size:26px;font-weight:650;letter-spacing:.04em;color:${COR.muted};border:1.5px dashed rgba(255,255,255,.28);border-radius:999px;padding:8px 20px}
body.claro .selo{color:#5a6477;border-color:rgba(18,24,38,.28)}
.card{background:${COR.surface};border:1.5px solid rgba(255,255,255,.1);border-radius:30px}
body.claro .card{background:#fff;border-color:#dce2ec;box-shadow:0 24px 50px -30px rgba(18,24,38,.35)}
.papel{background:${COR.paper};color:${COR.ink};border-radius:26px;box-shadow:0 40px 80px -40px rgba(0,0,0,.9)}
`;

/** Renderiza uma lista de blocos dentro de um arranjo. */
export function arranjo(tipo, blocos, opts = {}) {
  const { gap = 40, cols, alinhar } = opts;
  const style = [`gap:${gap}px`];
  if (opts.centrar && tipo === 'pilha') style.push('justify-content:center');
  if (alinhar) style.push(`align-items:${alinhar}`);
  const filhos = blocos.map((b, i) => {
    // Bloco que ocupa o espaço livre (flex) se estica: o componente distribui o conteúdo na altura toda.
    const html = bloco(b.flex ? { ...b, esticar: b.esticar ?? true } : b);
    const box = [];
    if (tipo === 'lado' && cols) box.push(`flex:${cols[i] ?? 1} 1 0`);
    else if (tipo === 'lado') box.push('flex:1 1 0');
    if (b.flex) box.push(`flex:${b.flex} 1 0;min-height:0;display:flex;flex-direction:column;justify-content:${b.justificar ?? 'center'}`);
    if (tipo === 'lado') box.push('display:flex;flex-direction:column;justify-content:center;align-self:stretch');
    if (b.alinhar) box.push(`align-self:${b.alinhar}`);
    if (b.mt) box.push(`margin-top:${b.mt}px`);
    if (b.largura) box.push(`width:${b.largura}px;max-width:100%`);
    return `<div data-bloco="${b.tipo}" style="${box.join(';')}">${html}</div>`;
  });
  return `<div class="arr ${tipo}" style="${style.join(';')}${opts.flex ? ';flex:1 1 0' : ''}">${filhos.join('')}</div>`;
}

export function bloco(b) {
  if (b.tipo === 'grupo') return arranjo(b.arranjo ?? 'pilha', b.blocos, { gap: b.gap, cols: b.cols, alinhar: b.alinharItens, flex: true, centrar: true });
  const fn = COMPONENTES[b.tipo];
  if (!fn) throw new Error(`Componente desconhecido: ${b.tipo}`);
  return fn(b, { rico, COR, MARK });
}

const brilho = {
  tl: 'left:-500px;top:-560px',
  tr: 'right:-500px;top:-560px',
  br: 'right:-540px;bottom:-600px',
  bl: 'left:-540px;bottom:-600px',
};

/**
 * Moldura editorial: a marca só aparece na capa (pequena, no topo) e no último slide (rodapé).
 * Nos slides do meio fica só o nome da série e uma barra fina de progresso.
 */
export function moldura({ inner, n, total, serie, claro = false, glow = 'tl', marca = false }) {
  const pos = brilho[glow] ?? brilho.tl;
  const barra = `<div style="position:absolute;left:${M}px;right:${M}px;bottom:66px;display:flex;align-items:center;gap:22px">
      <div style="flex:1;height:6px;border-radius:3px;background:${claro ? 'rgba(18,24,38,.12)' : 'rgba(255,255,255,.14)'}"><div style="height:100%;width:${(n / total) * 100}%;border-radius:3px;background:${COR.blue}"></div></div>
      <span style="font-size:26px;font-weight:700;color:${claro ? '#5a6477' : COR.muted}">${n}/${total}</span></div>`;
  const topo = `<div style="position:absolute;left:${M}px;right:${M}px;top:72px;display:flex;justify-content:space-between;align-items:center">
      <span class="rot" style="font-size:26px">${esc(serie)}</span>
      ${marca ? `<span style="display:flex;align-items:center;gap:12px;font-size:26px;font-weight:700;color:${COR.soft}"><span style="display:inline-block;height:26px">${MARK.replace('<svg ', '<svg height="26" ')}</span>@growlift.ai</span>` : ''}</div>`;
  const fundo = claro
    ? `<div class="grid"></div>`
    : `<div class="glow" style="width:1250px;height:1250px;${pos};opacity:.55"></div><div class="grid"></div>`;
  return page(W, H, `${fundo}${topo}<div id="area">${inner}</div>${barra}`, CSS).replace('<body>', `<body class="${claro ? 'claro' : ''}">`);
}

/** HTML completo de um slide do roteiro. */
export function renderSlide(slide, { n, total, serie }) {
  const inner = arranjo(slide.arranjo ?? 'pilha', slide.blocos, { gap: slide.gap ?? 40, cols: slide.cols, alinhar: slide.alinharItens, flex: true });
  return moldura({ inner, n, total, serie, claro: slide.tom === 'claro', glow: slide.brilho, marca: n === 1 || n === total });
}
