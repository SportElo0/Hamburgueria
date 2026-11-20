// Elenco da série "Casa Cheia" (Reels 17 em diante): a Panela da Rosa, um restaurante de bairro inventado.
// Personagens desenhados em SVG pela Growlift (ninguém real, nenhuma marca real). Ver 05-reels/casa-cheia.md.
// Cada boneco tem bocas trocáveis por id: `${id}-happy`, `${id}-sad`, `${id}-o` (falando/surpresa) e olhos `${id}-eyes`.

const HAIR = {
  coque: (c) => `<circle cx="100" cy="30" r="24" fill="${c}"/><path d="M46 92c0-38 22-60 54-60s54 22 54 60c-8-14-20-26-34-32-14 8-46 14-74 32z" fill="${c}"/>`,
  longoFundo: (c) => `<path d="M38 96c-6-50 22-78 62-78s70 28 62 78c6 40 14 70 4 96H34c-10-26-2-56 4-96z" fill="${c}"/>`,
  longo: (c) => `<path d="M44 96c0-40 24-64 56-64s56 24 56 64c-6-18-22-34-40-38-10 12-40 22-72 38z" fill="${c}"/><circle cx="52" cy="70" r="14" fill="${c}"/><circle cx="148" cy="70" r="14" fill="${c}"/>`,
  curto: (c) => `<path d="M48 88c0-36 22-56 52-56s52 20 52 56c-6-10-14-20-26-24-12 8-46 14-78 24z" fill="${c}"/>`,
  branco: (c) => `<path d="M46 92c-2-38 22-60 54-60s58 22 54 60c-4-10-8-16-14-20 2-10-6-14-14-12-8-10-22-8-30-2-10-6-24-2-26 8-12 4-20 14-24 26z" fill="${c}"/><circle cx="58" cy="60" r="12" fill="${c}"/><circle cx="142" cy="60" r="12" fill="${c}"/>`,
};

/**
 * Um personagem do peito para cima.
 * cfg: { skin, hair, hairStyle: 'coque'|'longo'|'curto'|'branco'|'chef', shirt, apron, glasses, mustache, earrings, bowtie, size }
 */
export function pessoa(id, cfg) {
  const { skin = '#e0a87e', hair = '#2b2118', hairStyle = 'curto', shirt = '#4d8dff', apron = '', glasses = false, mustache = false, earrings = '', bowtie = '', size = 300 } = cfg;
  const back = hairStyle === 'longo' ? HAIR.longoFundo(hair) : '';
  const front = hairStyle === 'chef' ? HAIR.curto(hair) : HAIR[hairStyle](hair);
  const hat =
    hairStyle === 'chef'
      ? `<path d="M56 64c-14-4-18-26-2-32 4-20 30-24 40-10 10-16 38-12 42 6 18 0 22 26 6 34v14H56z" fill="#ffffff" stroke="#dce2ec" stroke-width="3"/><rect x="54" y="62" width="92" height="18" rx="6" fill="#ffffff" stroke="#dce2ec" stroke-width="3"/>`
      : '';
  const apronSvg = apron
    ? `<path d="M64 176h72l10 84H54z" fill="${apron}"/><path d="M70 176l-14-26M130 176l14-26" stroke="${apron}" stroke-width="7" stroke-linecap="round"/><rect x="86" y="214" width="28" height="18" rx="4" fill="rgba(0,0,0,.12)"/>`
    : '';
  const glassesSvg = glasses
    ? `<g fill="rgba(255,255,255,.18)" stroke="#1a1410" stroke-width="4"><circle cx="78" cy="104" r="15"/><circle cx="122" cy="104" r="15"/></g><path d="M93 104h14" stroke="#1a1410" stroke-width="4"/>`
    : '';
  const mustacheSvg = mustache ? `<path d="M74 124c8-8 18-8 26-2 8-6 18-6 26 2-8 6-18 6-26 2-8 4-18 4-26-2z" fill="${hair}"/>` : '';
  const earSvg = earrings ? `<circle cx="46" cy="118" r="5" fill="${earrings}"/><circle cx="154" cy="118" r="5" fill="${earrings}"/>` : '';
  const bowSvg = bowtie ? `<path d="M100 162l-18-10v20zM100 162l18-10v20z" fill="${bowtie}"/><circle cx="100" cy="162" r="5" fill="${bowtie}"/>` : '';
  return `<svg id="${id}" class="abs" width="${size}" height="${size * 1.3}" viewBox="0 0 200 260" style="overflow:visible">
  ${back}
  <path d="M18 260c4-62 38-96 82-96s78 34 82 96z" fill="${shirt}"/>
  ${apronSvg}
  <path d="M84 140h32v24c0 9-7 14-16 14s-16-5-16-14z" fill="${skin}"/>
  ${bowSvg}
  <circle cx="44" cy="104" r="10" fill="${skin}"/><circle cx="156" cy="104" r="10" fill="${skin}"/>
  ${earSvg}
  <ellipse cx="100" cy="98" rx="54" ry="58" fill="${skin}"/>
  ${front}
  <g id="${id}-eyes" style="transform-origin:100px 104px"><ellipse cx="78" cy="104" rx="6" ry="7.5" fill="#1a1410"/><ellipse cx="122" cy="104" rx="6" ry="7.5" fill="#1a1410"/><circle cx="80" cy="101" r="2" fill="#fff"/><circle cx="124" cy="101" r="2" fill="#fff"/></g>
  ${glassesSvg}
  <ellipse cx="64" cy="124" rx="9" ry="5" fill="#f08a7e" opacity=".5"/><ellipse cx="136" cy="124" rx="9" ry="5" fill="#f08a7e" opacity=".5"/>
  ${mustacheSvg}
  <path id="${id}-happy" d="M82 132c8 12 28 12 36 0" stroke="#1a1410" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path id="${id}-sad" d="M84 140c8-9 24-9 32 0" stroke="#1a1410" stroke-width="5" fill="none" stroke-linecap="round" opacity="0"/>
  <ellipse id="${id}-o" cx="100" cy="136" rx="9" ry="11" fill="#5a1f1a" opacity="0"/>
  <path id="${id}-brow" d="M66 86l20 5M134 86l-20 5" stroke="#1a1410" stroke-width="4" stroke-linecap="round" opacity="0"/>
  ${hat}
</svg>`;
}

/** O elenco fixo. */
export const ELENCO = {
  rosa: { skin: '#d79a72', hair: '#3a2418', hairStyle: 'coque', shirt: '#f3f5f9', apron: '#e8483b', earrings: '#ffc94d' },
  mel: { skin: '#b97a52', hair: '#1f140e', hairStyle: 'longo', shirt: '#7c5cff', glasses: true },
  beto: { skin: '#8d5a3b', hair: '#140e0a', hairStyle: 'curto', shirt: '#121826', bowtie: '#e8483b' },
  juca: { skin: '#e2b08a', hair: '#9aa3b5', hairStyle: 'chef', shirt: '#ffffff', mustache: true },
  cida: { skin: '#f1c39c', hair: '#e6e9ef', hairStyle: 'branco', shirt: '#e86a9a', glasses: true, earrings: '#ffffff' },
};

/** Liga a boca certa: 'happy' | 'sad' | 'o'. Use no script do Reel: mood('pr','sad'). */
export const MOOD = `function mood(id,m){['happy','sad','o'].forEach(k=>{const e=document.getElementById(id+'-'+k);if(e)e.style.opacity=k===m?1:0;});}
function talk(id,t,a,b){if(t>=a&&t<b){const o=Math.floor(t*7)%2;mood(id,o?'o':'happy');}}
function blink(id,t){const e=document.getElementById(id+'-eyes');if(e)e.style.transform=(t%3.7)<.12?'scaleY(.1)':'scaleY(1)';}`;

/** Prato com rosto (para a engenharia de cardápio). kind: picanha | parmegiana | risoto | sopa. */
export function prato(id, kind, size = 300) {
  const food = {
    picanha: '<path d="M54 118c4-26 28-40 50-38 26 2 44 16 44 34 0 10-10 16-24 16H72c-12 0-20-4-18-12z" fill="#b5523b"/><path d="M60 110c18-10 60-14 86-2" stroke="#f3e2c7" stroke-width="10" stroke-linecap="round" fill="none"/>',
    parmegiana: '<path d="M48 120c0-22 24-36 54-36s54 14 54 36c0 10-24 16-54 16s-54-6-54-16z" fill="#d9822b"/><path d="M58 112c10-12 30-18 44-18s36 6 46 18c-12 8-78 8-90 0z" fill="#e8483b"/><circle cx="84" cy="102" r="6" fill="#ffe08a"/><circle cx="116" cy="100" r="7" fill="#ffe08a"/><circle cx="100" cy="112" r="5" fill="#ffe08a"/>',
    risoto: '<ellipse cx="100" cy="116" rx="50" ry="22" fill="#f5e6b8"/><g fill="#fff6dc"><circle cx="80" cy="110" r="5"/><circle cx="96" cy="104" r="5"/><circle cx="114" cy="108" r="5"/><circle cx="126" cy="116" r="5"/><circle cx="88" cy="120" r="5"/></g><circle cx="104" cy="114" r="6" fill="#5ac46a"/>',
    sopa: '<path d="M46 104h108c0 30-24 46-54 46s-54-16-54-46z" fill="#e8d3a8"/><ellipse cx="100" cy="104" rx="54" ry="12" fill="#d7a55a"/>',
  }[kind];
  const extra = {
    picanha: '<g id="' + id + '-glasses"><rect x="62" y="132" width="32" height="18" rx="7" fill="#121826"/><rect x="106" y="132" width="32" height="18" rx="7" fill="#121826"/><path d="M94 138h12" stroke="#121826" stroke-width="5"/></g>',
    parmegiana: '<path d="M70 132c-2 8 2 14 6 14" stroke="#4d8dff" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M150 124c4 10 0 18-4 20" stroke="#4d8dff" stroke-width="6" fill="none" stroke-linecap="round"/>',
    risoto: '',
    sopa: '<path d="M84 96c-6-22 2-40 16-50 4 18 2 34-6 50zM100 94c2-24 14-38 30-44-2 20-10 34-24 46zM96 96c-14-14-30-18-44-14 10 14 26 18 42 18z" fill="#4dbb5c"/>',
  }[kind];
  return `<svg id="${id}" class="abs" width="${size}" height="${size}" viewBox="0 0 200 200" style="overflow:visible">
  <ellipse cx="100" cy="150" rx="92" ry="34" fill="#ffffff"/><ellipse cx="100" cy="146" rx="70" ry="22" fill="#eef1f6"/>
  ${food}
  <g><ellipse cx="80" cy="142" rx="6" ry="7" fill="#1a1410"/><ellipse cx="120" cy="142" rx="6" ry="7" fill="#1a1410"/></g>
  <path id="${id}-happy" d="M88 158c6 8 18 8 24 0" stroke="#1a1410" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path id="${id}-sad" d="M88 164c6-7 18-7 24 0" stroke="#1a1410" stroke-width="5" fill="none" stroke-linecap="round" opacity="0"/>
  <ellipse id="${id}-o" cx="100" cy="160" rx="7" ry="8" fill="#5a1f1a" opacity="0"/>
  ${extra}
</svg>`;
}

/** Selo da série no topo: "CASA CHEIA · EP. N". */
export const selo = (ep, tema) => `<div class="pill" style="top:250px;z-index:44"><i></i>CASA CHEIA · EP. ${ep}<span style="color:#8790a6;font-weight:600">· ${tema}</span></div>`;

/** Chip com o nome do personagem. */
export const nome = (id, txt, left, top, cor = '#0f1520') => `<div id="${id}" class="chip" style="left:${left}px;top:${top}px;background:${cor}">${txt}</div>`;
