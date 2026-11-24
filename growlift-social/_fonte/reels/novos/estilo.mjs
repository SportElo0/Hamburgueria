// Shared look for the story Reels (estilo história, 01/11): dark dotted background, pills, chips, cards, the legal
// notice at the top (legible, inside the safe area) and a phone frame. Reels 1 and 5 carry their own copy of this CSS.
import { svgIcon, ICON } from './base.mjs';

export const RED = '#ff6b5b';
export const GREEN = '#22c55e';
export const BLUE = '#0865fe';

export const CSS = `
body{background:#06080d;color:#f3f5f9}
.dots{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.08) 1.6px,transparent 1.6px);background-size:44px 44px}
.glowB{position:absolute;width:1300px;height:1300px;border-radius:50%;background:radial-gradient(closest-side,rgba(8,101,254,.28),transparent 70%)}
.glowR{position:absolute;width:1100px;height:1100px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,107,91,.20),transparent 70%)}
.glowY{position:absolute;width:1000px;height:1000px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,201,77,.20),transparent 70%)}
.pill{position:absolute;left:50%;transform:translateX(-50%);display:inline-flex;align-items:center;gap:12px;padding:14px 28px;border-radius:999px;background:#0f1520;border:1px solid rgba(255,255,255,.12);font-size:28px;font-weight:700;white-space:nowrap}
.pill i{width:12px;height:12px;border-radius:50%;background:${BLUE};display:inline-block}
.chip{position:absolute;padding:14px 26px;border-radius:999px;font-size:32px;font-weight:800;background:#0f1520;border:1px solid rgba(255,255,255,.14);white-space:nowrap}
.card{position:absolute;background:#0f1520;border:1px solid rgba(255,255,255,.10);border-radius:36px}
.bubble{position:absolute;background:#f3f5f9;color:#121826;font-weight:800;font-size:34px;padding:20px 30px;border-radius:28px;white-space:nowrap}
.bubble:after{content:"";position:absolute;left:40px;bottom:-18px;border:12px solid transparent;border-top:18px solid #f3f5f9}
.hook{position:absolute;left:60px;right:60px;top:385px;text-align:center;font-weight:900;letter-spacing:-.04em;line-height:1.02;font-size:88px}
.big{position:absolute;left:60px;right:60px;text-align:center;font-weight:900;letter-spacing:-.04em;line-height:1.04}
.disc{position:absolute;left:70px;right:70px;top:250px;text-align:center;font-size:30px;font-weight:700;color:#c6cede;z-index:45;line-height:1.3}
.tag{position:absolute;padding:10px 20px;border-radius:999px;background:rgba(6,8,13,.85);border:1px solid rgba(255,255,255,.18);font-size:24px;font-weight:700;color:#e6eaf2;white-space:nowrap}
.lbl{position:absolute;font-size:40px;font-weight:900;letter-spacing:.06em}
.phone{position:absolute;border-radius:60px;background:#1a2130;padding:14px;box-shadow:0 60px 120px -40px rgba(8,101,254,.7),0 0 0 2px rgba(255,255,255,.08)}
.screen{position:relative;border-radius:48px;overflow:hidden;background:#f4f6fa;color:#121826}
.search{margin:56px 22px 0;height:62px;border-radius:999px;background:#fff;border:1px solid #dce2ec;display:flex;align-items:center;gap:12px;padding:0 20px;font-size:23px;font-weight:600;color:#4a5568}
`;

export const BG = `<div class="dots"></div>
<div class="glowB" style="left:-560px;top:420px"></div>
<div class="glowR" style="right:-520px;top:240px"></div>`;

/** A phone with a search box (ids: q, caret) and free inner HTML. */
export const phone = (id, { left, top, w = 420, h = 700, inner = '', search = true }) => `
<div id="${id}" class="phone" style="left:${left}px;top:${top}px;width:${w}px;height:${h}px">
  <div class="screen" style="width:${w - 28}px;height:${h - 28}px">
    ${search ? `<div class="search">${svgIcon(ICON.search, 26, '#6a7385')}<span id="q"></span><span id="caret" style="width:2px;height:26px;background:${BLUE};display:inline-block"></span></div>` : ''}
    ${inner}
  </div>
</div>`;

/** Typing animation for the search box. */
export const TYPE = `function typeQ(t,a,dur,query){const n=Math.floor(clamp((t-a)/dur)*query.length);$('q').textContent=query.slice(0,n);$('caret').style.opacity=(Math.floor(t*3)%2||n<query.length)?1:0;}`;
