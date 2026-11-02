// Componentes visuais do gerador editorial. Cada um recebe as props do roteiro (JSON) e devolve HTML.
// Regras: texto mínimo de 26 px, cores só da identidade (fundo escuro, azul, branco; vermelho e verde só
// para antes/depois e erro/acerto), tudo desenhado em código (nada copiado de app real).
import { icon } from '../pecas.mjs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const svgX = (c, s = 26) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
const svgCheck = (c, s = 28) => icon('check', { size: s, color: c, width: 3.2 });
const seta = (c, dir = 'baixo', s = 44) => {
  const rot = { baixo: 90, direita: 0, cima: -90, esquerda: 180 }[dir] ?? 90;
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="transform:rotate(${rot}deg)" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg>`;
};

// Ícones extras desenhados aqui (linha 24×24, mesmo traço dos ícones da marca).
const EXTRA = {
  toque: '<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10"/><path d="M12 9.5a1.5 1.5 0 0 1 3 0V11"/><path d="M15 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.5a6 6 0 0 1-4.9-2.6L4 14.6a1.5 1.5 0 0 1 2.3-1.9L9 15"/>',
  lupa: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8"/><path d="M8 10.5h5M10.5 8v5"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  perfil: '<circle cx="12" cy="8.5" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  arquivo: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
  relogio: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  saco: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  panela: '<path d="M4 11h16v3a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z"/><path d="M2 11h20M9 7c0-1 1-1 1-2M14 7c0-1 1-1 1-2"/>',
  anotar: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  falar: '<path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.5-4.7A8.5 8.5 0 1 1 20.5 11.5z"/>',
  moto: '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M9 17h6l-3-7h-3M15 10h3l2 4"/>',
  impressora: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  alerta: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
};
const ic = (name, size, color, width = 1.9) =>
  EXTRA[name]
    ? `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${EXTRA[name]}</svg>`
    : icon(name, { size, color, width });

// ---------------------------------------------------------------------------------------------
// Texto

const titulo = (b, { rico }) => `<h2 data-txt class="t-${b.tam ?? 'g'}" style="${b.centro ? 'text-align:center;' : ''}${b.cor ? `color:${b.cor};` : ''}">${rico(b.texto)}</h2>`;
const texto = (b, { rico }) => `<p data-txt class="x-${b.tam ?? 'g'}" style="${b.centro ? 'text-align:center;' : ''}${b.maxw ? `max-width:${b.maxw}px;` : ''}">${rico(b.texto)}</p>`;
const rotulo = (b, { rico }) => `<div data-txt class="rot" style="${b.cor ? `color:${b.cor}` : ''}">${rico(b.texto)}</div>`;
const selo = (b) => `<span data-txt class="selo">${esc(b.texto ?? 'Exemplo')}</span>`;

/** Número grande + rótulo, para contagens que são do próprio exemplo (nunca estatística sem fonte). */
const contador = (b, { COR }) =>
  `<div style="display:flex;align-items:center;gap:22px">
    <div style="width:118px;height:118px;border-radius:32px;background:${COR.blue};display:grid;place-items:center;box-shadow:0 0 0 10px rgba(8,101,254,.18),0 30px 60px -20px rgba(8,101,254,1)">${ic(b.icone ?? 'toque', 64, '#fff', 2)}</div>
    <div><div data-txt style="font-size:84px;font-weight:900;letter-spacing:-.04em;line-height:.9">${esc(b.n)}</div><div data-txt class="x-p" style="margin-top:8px">${esc(b.rotulo)}</div></div>
  </div>`;

// ---------------------------------------------------------------------------------------------
// Diagramas

/** Fluxo de passos com setas. direcao: v (vertical), h (horizontal), zigue (2 colunas em zigue-zague). */
function fluxo(b, { COR }) {
  const dir = b.direcao ?? 'v';
  const passos = b.passos.map((p, i) => {
    const alerta = p.alerta;
    const ok = p.ok;
    const cor = alerta ? COR.red : ok ? COR.green : COR.blueBright;
    const tamanho = dir === 'h' ? `flex:1;flex-direction:column;justify-content:center;text-align:center;padding:30px 10px;gap:22px` : `padding:${b.esticar ? '0 28px;flex:1' : '22px 28px'};gap:22px`;
    return `<div class="card" style="display:flex;align-items:center;${tamanho};${alerta ? `border-color:rgba(255,107,91,.6);background:rgba(255,107,91,.08)` : ok ? `border-color:rgba(34,197,94,.55);background:rgba(34,197,94,.08)` : ''}">
      <span style="flex:none;width:${dir === 'h' ? 92 : 64}px;height:${dir === 'h' ? 92 : 64}px;border-radius:${dir === 'h' ? 26 : 18}px;display:grid;place-items:center;background:${alerta ? 'rgba(255,107,91,.16)' : ok ? 'rgba(34,197,94,.16)' : 'rgba(8,101,254,.18)'}">${ic(p.icone ?? 'check', dir === 'h' ? 52 : 38, cor)}</span>
      <span data-txt style="font-size:${b.tamTexto ?? 34}px;font-weight:700;line-height:1.2">${esc(p.t)}</span>
      ${p.nota ? `<span data-txt style="margin-left:auto;font-size:26px;font-weight:700;color:${cor};white-space:nowrap">${esc(p.nota)}</span>` : ''}
    </div>`;
  });
  const sep = (i) => {
    const corSeta = b.passos[i + 1]?.alerta ? COR.red : 'rgba(141,184,255,.7)';
    return dir === 'h'
      ? `<div style="flex:none;display:grid;place-items:center">${seta(corSeta, 'direita', 36)}</div>`
      : `<div style="display:flex;justify-content:${dir === 'v' ? 'flex-start' : 'center'};padding-left:${dir === 'v' ? 40 : 0}px;height:${b.compacto ? 22 : 34}px;align-items:center">${seta(corSeta, 'baixo', b.compacto ? 26 : 34)}</div>`;
  };
  const corpo = passos.flatMap((p, i) => (i < passos.length - 1 ? [p, sep(i)] : [p])).join('');
  return `<div style="display:flex;flex-direction:${dir === 'h' ? 'row' : 'column'};${dir === 'h' ? `align-items:stretch;gap:8px;${b.esticar ? 'height:400px' : ''}` : b.esticar ? 'flex:1' : ''}">${corpo}</div>
    ${b.legenda ? `<div data-txt class="x-p" style="margin-top:22px">${esc(b.legenda)}</div>` : ''}`;
}

/** Linha do tempo com pontos; o ativo fica destacado. */
function linhaTempo(b, { COR }) {
  const n = b.pontos.length;
  return `<div style="position:relative;padding:10px 0;${b.esticar ? 'flex:1;display:flex;flex-direction:column;justify-content:space-evenly' : ''}">
    <div style="position:absolute;left:38px;top:40px;bottom:40px;width:4px;border-radius:2px;background:rgba(141,184,255,.25)"></div>
    ${b.pontos
      .map((p, i) => {
        const ativo = (b.ativo ?? []).includes(i);
        return `<div style="position:relative;display:flex;align-items:center;gap:30px;padding:${n > 4 ? 14 : 22}px 0">
        <span style="flex:none;width:80px;height:80px;border-radius:50%;display:grid;place-items:center;background:${ativo ? COR.blue : COR.surface};border:3px solid ${ativo ? COR.blue : 'rgba(141,184,255,.45)'};${ativo ? 'box-shadow:0 0 0 10px rgba(8,101,254,.2)' : ''}">${ic(p.icone ?? 'check', 40, ativo ? '#fff' : COR.blueSoft)}</span>
        <span data-txt style="font-size:40px;font-weight:${ativo ? 800 : 650};color:${ativo ? '#fff' : COR.soft}">${esc(p.t)}</span>
        ${p.nota ? `<span data-txt style="margin-left:auto;font-size:28px;font-weight:700;color:${COR.blueSoft}">${esc(p.nota)}</span>` : ''}
      </div>`;
      })
      .join('')}
  </div>`;
}

/** Duas colunas comparadas (ex.: caminho longo × curto, cliente novo × antigo). */
function colunas(b, { COR }) {
  const col = (c, lado) => {
    const cor = c.tom === 'ruim' ? COR.red : c.tom === 'bom' ? COR.green : COR.blueBright;
    return `<div class="card" style="flex:1;padding:36px 30px;display:flex;flex-direction:column;gap:${b.esticar ? 30 : 18}px;border-color:${c.tom === 'ruim' ? 'rgba(255,107,91,.5)' : c.tom === 'bom' ? 'rgba(34,197,94,.5)' : 'rgba(255,255,255,.1)'}">
      <div data-txt class="rot" style="color:${cor}">${esc(c.titulo)}</div>
      ${c.destaque ? `<div data-txt style="font-size:60px;font-weight:900;letter-spacing:-.03em;line-height:1">${esc(c.destaque)}</div>` : ''}
      ${(c.itens ?? [])
        .map(
          (t, i) => `<div style="display:flex;gap:14px;align-items:flex-start">
        <span style="flex:none;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:${c.tom === 'ruim' ? 'rgba(255,107,91,.16)' : 'rgba(34,197,94,.16)'};font-size:24px;font-weight:800;color:${cor}">${c.numerar ? i + 1 : c.tom === 'ruim' ? svgX(cor, 22) : svgCheck(cor, 24)}</span>
        <span data-txt style="font-size:${b.esticar ? 36 : 32}px;font-weight:680;line-height:1.25">${esc(t)}</span></div>`,
        )
        .join('')}
      ${c.rodape ? `<div data-txt class="x-p" style="margin-top:auto;padding-top:8px">${esc(c.rodape)}</div>` : ''}
    </div>`;
  };
  return `<div style="display:flex;gap:24px;align-items:stretch">${col(b.a, 'a')}${col(b.b, 'b')}</div>`;
}

/** Lista curta com marcador (x, check, num, ponto). */
function lista(b, { COR, rico }) {
  const m = b.marcador ?? 'check';
  const cor = m === 'x' ? COR.red : m === 'check' ? COR.green : COR.blueBright;
  return `<div style="display:flex;flex-direction:column;gap:${b.gap ?? 22}px;${b.esticar ? 'flex:1;justify-content:space-evenly' : ''}">${b.itens
    .map((t, i) => {
      const mk =
        m === 'num'
          ? `<span style="font-size:40px;font-weight:900;color:${COR.blueBright};width:56px">${String(i + 1).padStart(2, '0')}</span>`
          : m === 'ponto'
            ? `<span style="width:16px;height:16px;border-radius:50%;background:${COR.blueBright};margin:16px 20px 0 8px"></span>`
            : `<span style="flex:none;width:56px;height:56px;border-radius:16px;display:grid;place-items:center;background:${m === 'x' ? 'rgba(255,107,91,.16)' : 'rgba(34,197,94,.16)'}">${m === 'x' ? svgX(cor, 30) : svgCheck(cor, 32)}</span>`;
      const [tt, sub] = Array.isArray(t) ? t : [t, ''];
      return `<div style="display:flex;gap:24px;align-items:${sub ? 'flex-start' : 'center'}">${mk}<div><div data-txt style="font-size:${b.tamTexto ?? 40}px;font-weight:720;line-height:1.22">${rico(tt)}</div>${sub ? `<div data-txt class="x-p" style="margin-top:6px">${rico(sub)}</div>` : ''}</div></div>`;
    })
    .join('')}</div>`;
}

// ---------------------------------------------------------------------------------------------
// Objetos do mundo real (desenhados, em papel claro para quebrar o ritmo escuro)

/** Cardápio em papel. Itens: {nome, desc?, marca?: '?' | 'ok' | 'x', apagado?}. Sem preço inventado. */
function cardapio(b, { COR }) {
  return `<div class="papel" style="padding:34px 38px;${b.inclinar ? `transform:rotate(${b.inclinar}deg)` : ''}">
    ${b.titulo ? `<div data-txt style="font-size:28px;font-weight:850;letter-spacing:.18em;text-transform:uppercase;color:#5a6477;padding-bottom:14px;border-bottom:2px dashed #cfd6e2">${esc(b.titulo)}</div>` : ''}
    ${b.itens
      .map((it, i) => {
        const cor = it.marca === 'x' ? COR.red : it.marca === 'ok' ? COR.green : COR.blue;
        return `<div style="position:relative;display:flex;gap:18px;align-items:flex-start;padding:22px 0;${i ? 'border-top:1.5px solid #e1e6ee' : ''};${it.apagado ? 'opacity:.38' : ''}">
          <div style="flex:1">
            <div data-txt style="font-size:${b.tamNome ?? 40}px;font-weight:850;letter-spacing:-.02em;color:${COR.ink}">${esc(it.nome)}</div>
            ${it.desc ? `<div data-txt style="font-size:${b.tamDesc ?? 30}px;line-height:1.38;color:#3d4659;margin-top:8px">${esc(it.desc)}</div>` : ''}
          </div>
          ${it.marca ? `<span style="flex:none;width:62px;height:62px;border-radius:50%;display:grid;place-items:center;background:${cor};color:#fff;font-size:40px;font-weight:900;box-shadow:0 14px 30px -12px ${cor}">${it.marca === '?' ? '?' : it.marca === 'x' ? svgX('#fff', 28) : svgCheck('#fff', 30)}</span>` : ''}
        </div>`;
      })
      .join('')}
    ${b.rodape ? `<div data-txt style="font-size:26px;font-weight:650;color:#5a6477;margin-top:8px">${esc(b.rodape)}</div>` : ''}
  </div>`;
}

/** Antes × depois de um texto (linha por linha). */
function antesDepois(b, { COR }) {
  const lado = (rot, conteudo, tom) => {
    const cor = tom === 'ruim' ? COR.red : COR.green;
    return `<div style="display:flex;flex-direction:column;gap:14px">
      <div data-txt class="rot" style="display:flex;align-items:center;gap:12px;color:${cor}"><span style="width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:${tom === 'ruim' ? 'rgba(255,107,91,.16)' : 'rgba(34,197,94,.16)'}">${tom === 'ruim' ? svgX(cor, 24) : svgCheck(cor, 26)}</span>${esc(rot)}</div>
      <div class="papel" style="padding:34px 38px;border-left:10px solid ${cor}">
        <div data-txt style="font-size:46px;font-weight:850;color:${COR.ink};letter-spacing:-.02em">${esc(conteudo.nome)}</div>
        ${conteudo.desc ? `<div data-txt style="font-size:36px;line-height:1.38;color:#3d4659;margin-top:8px">${esc(conteudo.desc)}</div>` : ''}
      </div></div>`;
  };
  return `<div style="display:flex;flex-direction:column;gap:30px">${lado(b.antes.rotulo ?? 'Antes', b.antes, 'ruim')}${lado(b.depois.rotulo ?? 'Depois', b.depois, 'bom')}</div>`;
}

/** Item de cardápio com as partes numeradas e explicadas (anatomia). */
function anatomia(b, { COR }) {
  const partes = b.partes;
  const tons = ['rgba(8,101,254,.14)', 'rgba(8,101,254,.24)', 'rgba(8,101,254,.14)', 'rgba(8,101,254,.24)'];
  const span = (txt, i) =>
    `<span style="background:${tons[i % 4]};box-decoration-break:clone;-webkit-box-decoration-break:clone;border-radius:8px;padding:2px 6px">${esc(txt)}<b style="display:inline-grid;place-items:center;vertical-align:super;width:34px;height:34px;margin-left:4px;border-radius:50%;background:${COR.blue};color:#fff;font-size:22px;line-height:1">${i + 1}</b></span>`;
  return `<div class="papel" style="padding:34px 38px">
      <div data-txt style="font-size:40px;line-height:1.7;color:${COR.ink};font-weight:600">${partes.map((p, i) => `${span(p.trecho, i)}${esc(p.depois ?? '')}`).join(' ')}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px 28px;margin-top:40px">
      ${partes
        .map(
          (p, i) => `<div style="display:flex;gap:16px;align-items:flex-start">
        <b style="flex:none;width:48px;height:48px;border-radius:50%;background:${COR.blue};color:#fff;font-size:28px;display:grid;place-items:center">${i + 1}</b>
        <div><div data-txt style="font-size:34px;font-weight:800;line-height:1.15">${esc(p.rotulo)}</div>${p.nota ? `<div data-txt class="x-p" style="margin-top:4px">${esc(p.nota)}</div>` : ''}</div></div>`,
        )
        .join('')}
    </div>`;
}

/** Modelo para copiar: texto com [colchetes] destacados. */
function modelo(b, { COR }) {
  const html = esc(b.texto).replace(/\[([^\]]+)\]/g, `<span style="background:rgba(8,101,254,.22);color:#cfe0ff;border-radius:8px;padding:0 6px;font-weight:700">[$1]</span>`);
  return `<div class="card" style="padding:36px 38px;border-color:rgba(77,141,255,.55);background:rgba(8,101,254,.1)">
    <div data-txt class="rot" style="display:flex;align-items:center;gap:14px">${ic('arquivo', 34, COR.eyebrow)}${esc(b.rotulo ?? 'Modelo: copie e adapte')}</div>
    <div data-txt style="font-size:${b.tam ?? 42}px;line-height:1.5;font-weight:600;margin-top:22px;color:#eef3ff">${html}</div>
  </div>`;
}

/** Ficha para preencher ou imprimir. linhas: rótulos; caixas: itens de marcar. */
function ficha(b, { COR }) {
  const claro = b.claro;
  return `<div style="${b.esticar ? 'flex:1;max-height:900px;display:flex;flex-direction:column;justify-content:space-evenly;' : ''}${claro ? `background:#fff;color:${COR.ink};border:2px solid #cfd6e2;box-shadow:0 30px 60px -30px rgba(18,24,38,.4)` : `background:${COR.surface};border:1.5px solid rgba(255,255,255,.12)`};border-radius:28px;padding:38px 40px">
    ${b.titulo ? `<div data-txt style="font-size:${b.esticar ? 54 : 44}px;font-weight:850;letter-spacing:-.02em">${esc(b.titulo)}</div>` : ''}
    ${(b.linhas ?? [])
      .map(
        (l) => `<div style="margin-top:30px"><div data-txt style="font-size:${b.esticar ? 36 : 30}px;font-weight:700;color:${claro ? '#4a5568' : COR.soft}">${esc(l)}</div><div style="height:58px;border-bottom:3px ${claro ? 'solid #b8c2d3' : 'dashed rgba(255,255,255,.3)'}"></div></div>`,
      )
      .join('')}
    ${(b.caixas ?? [])
      .map(
        (c) => `<div style="display:flex;align-items:center;gap:24px;margin-top:26px"><span style="flex:none;width:58px;height:58px;border-radius:12px;border:4px solid ${claro ? COR.ink : COR.blueBright}"></span><span data-txt style="font-size:${b.esticar ? 46 : 40}px;font-weight:750">${esc(c)}</span></div>`,
      )
      .join('')}
    ${b.rodape ? `<div data-txt style="font-size:28px;font-weight:600;color:${claro ? '#4a5568' : COR.muted};margin-top:30px">${esc(b.rodape)}</div>` : ''}
  </div>`;
}

/** Comanda de papel. legivel=false desenha a versão confusa (rabiscada); legivel=true, a versão com campos. */
function comanda(b, { COR }) {
  const dente = `<div style="height:22px;background:linear-gradient(-45deg,transparent 16px,#fbf7ee 0) 0 0/32px 32px repeat-x,linear-gradient(45deg,transparent 16px,#fbf7ee 0) 0 0/32px 32px repeat-x;transform:translateY(1px)"></div>`;
  const corpo = b.legivel
    ? `<div style="display:grid;grid-template-columns:auto 1fr;gap:16px 22px;align-items:baseline">${b.linhas
        .map(
          ([k, v]) => `<span data-txt style="font-size:26px;font-weight:850;letter-spacing:.12em;color:${k === 'SEM' ? '#b91c1c' : k === 'COM' ? '#15803d' : '#5a6477'}">${esc(k)}</span><span data-txt style="font-size:38px;font-weight:750;color:${COR.ink};font-family:ui-monospace,Menlo,monospace">${esc(v)}</span>`,
        )
        .join('')}</div>`
    : `<div style="font-family:'Segoe Script','Comic Sans MS',cursive;color:#3a3f4a">${b.linhas
        .map((l, i) => `<div data-txt style="font-size:${l.tam ?? 40}px;transform:rotate(${i % 2 ? -1.5 : 1.2}deg);margin:10px 0;${l.apagado ? 'opacity:.45;filter:blur(1.2px)' : ''}">${esc(l.t ?? l)}</div>`)
        .join('')}</div>`;
  return `<div style="width:${b.largura ?? 560}px;max-width:100%;${b.centro ? 'margin:0 auto;' : ''}${b.inclinar ? `transform:rotate(${b.inclinar}deg);` : ''}filter:drop-shadow(0 40px 50px rgba(0,0,0,.6))">
    <div style="background:#fbf7ee;border-radius:10px 10px 0 0;padding:30px 34px 26px">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px dashed #d8d0bd;padding-bottom:14px;margin-bottom:12px"><span data-txt style="font-size:28px;font-weight:900;letter-spacing:.14em;color:#5a5f6a">${esc(b.titulo ?? 'COMANDA')}</span>${b.numero ? `<span data-txt style="font-size:28px;font-weight:800;color:#5a5f6a">${esc(b.numero)}</span>` : ''}</div>
      ${corpo}
    </div>${dente.replace('translateY(1px)', 'rotate(180deg)')}
  </div>`;
}

// ---------------------------------------------------------------------------------------------
// Celular e telas (desenhadas, genéricas, sem marca de app real)

function celular(b, { COR }) {
  const w = b.largura ?? 420;
  const tela = TELAS[b.tela.tipo](b.tela, { COR });
  return `<div style="position:relative;width:${w}px;${b.centro ? 'margin:0 auto;' : ''}${b.direita ? 'margin-left:auto;' : ''}${b.inclinar ? `transform:rotate(${b.inclinar}deg);` : ''}">
    <div style="border-radius:64px;padding:14px;background:#1a2130;box-shadow:0 50px 100px -40px rgba(8,101,254,.7),0 0 0 2px rgba(255,255,255,.08)">
      <div data-tela style="border-radius:52px;overflow:hidden;background:#f4f6fa;color:${COR.ink};height:${b.altura ?? Math.round(w * 1.72)}px;position:relative">
        <div style="height:46px;display:flex;justify-content:center;align-items:flex-end"><span style="width:120px;height:26px;border-radius:14px;background:#1a2130"></span></div>
        ${tela}
      </div>
    </div>
    ${b.contador ? `<div style="position:absolute;${b.contador.lado === 'esq' ? 'left:-46px' : 'right:-46px'};top:${b.contador.topo ?? 120}px;display:flex;align-items:center;gap:12px;padding:16px 24px;border-radius:999px;background:${COR.blue};color:#fff;font-size:34px;font-weight:850;box-shadow:0 0 0 8px rgba(8,101,254,.2),0 24px 50px -16px rgba(8,101,254,1)">${ic('toque', 40, '#fff', 2.2)}<span data-txt>${esc(b.contador.t)}</span></div>` : ''}
    ${(b.notas ?? [])
      .map(
        (n) => `<div data-txt style="position:absolute;${n.lado === 'esq' ? `right:${w - 30}px` : `left:${w - 30}px`};top:${n.topo}px;width:${n.largura ?? 300}px;padding:16px 22px;border-radius:20px;background:${n.tom === 'ruim' ? COR.red : COR.surface};border:1.5px solid ${n.tom === 'ruim' ? COR.red : 'rgba(141,184,255,.5)'};color:#fff;font-size:30px;font-weight:750;line-height:1.25;box-shadow:0 20px 40px -20px rgba(0,0,0,.9)">${esc(n.t)}</div>`,
      )
      .join('')}
  </div>`;
}

const TELAS = {
  perfil: (t, { COR }) => `<div style="padding:20px 26px">
      <div style="display:flex;align-items:center;gap:20px"><div style="width:100px;height:100px;border-radius:50%;background:linear-gradient(135deg,#ffb36b,#e8564b);border:4px solid #fff;box-shadow:0 0 0 3px #e8564b"></div>
      <div><div data-txt style="font-size:30px;font-weight:850">${esc(t.nome)}</div><div data-txt style="font-size:24px;color:#5a6477;margin-top:4px">${esc(t.tipo ?? 'Lanchonete')}</div></div></div>
      <div data-txt style="font-size:24px;line-height:1.4;margin-top:18px;color:#2b3446">${esc(t.bio ?? '')}</div>
      <div data-txt style="font-size:24px;font-weight:800;color:${COR.blue};margin-top:8px;display:flex;align-items:center;gap:8px">${ic('link', 26, COR.blue, 2.2)}${esc(t.link ?? 'linktr.ee/…')}</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:22px">${['#f2b880', '#e88a6a', '#c9a27a', '#f0c9a0', '#d97b5c', '#e7b27c'].map((c) => `<div style="aspect-ratio:1;background:${c};border-radius:6px"></div>`).join('')}</div>
    </div>`,
  links: (t, { COR }) => `<div style="padding:24px 26px;text-align:center">
      <div style="width:84px;height:84px;margin:0 auto;border-radius:50%;background:linear-gradient(135deg,#ffb36b,#e8564b)"></div>
      <div data-txt style="font-size:28px;font-weight:850;margin-top:12px">${esc(t.nome)}</div>
      ${t.itens.map((x, i) => `<div data-txt style="margin-top:14px;padding:18px 10px;border-radius:16px;background:#fff;border:2px solid ${(t.destaque ?? -1) === i ? COR.blue : '#dce2ec'};font-size:24px;font-weight:750;color:#2b3446">${esc(x)}</div>`).join('')}
    </div>`,
  pdf: (t) => `<div style="padding:16px 18px">
      <div style="display:flex;align-items:center;gap:10px;font-size:22px;font-weight:700;color:#5a6477">${ic('arquivo', 28, '#5a6477')}<span data-txt>${esc(t.arquivo ?? 'cardapio_final_v3.pdf')}</span></div>
      <div style="margin-top:14px;background:#fff;border:1px solid #dce2ec;border-radius:10px;padding:16px;transform:scale(${t.zoom ? 1.0 : 1});height:${t.altura ?? 560}px;overflow:hidden">
        ${Array.from({ length: 14 }, (_, i) => `<div style="display:flex;justify-content:space-between;gap:10px;margin:8px 0"><span style="height:9px;width:${40 + ((i * 37) % 45)}%;background:#c9cfda;border-radius:4px"></span><span style="height:9px;width:12%;background:#dfe3ea;border-radius:4px"></span></div>`).join('')}
      </div>
      ${t.lupa ? `<div style="position:absolute;left:46%;top:43%;width:190px;height:190px;border-radius:50%;border:8px solid #2b3446;background:rgba(255,255,255,.55);display:grid;place-items:center;box-shadow:0 20px 40px -10px rgba(0,0,0,.5)"><span data-txt style="font-size:26px;font-weight:850;color:#2b3446;text-align:center;line-height:1.1">${esc(t.lupa)}</span></div>` : ''}
    </div>`,
  chat: (t, { COR }) => `<div style="height:84px;background:#0f6e5c;color:#fff;display:flex;align-items:center;gap:14px;padding:0 22px;margin-top:-46px;padding-top:30px;height:118px">
      <div style="width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,#ffb36b,#e8564b)"></div><div data-txt style="font-size:26px;font-weight:800">${esc(t.nome)}</div></div>
      <div style="padding:14px 16px;background:#ece5dd;height:100%">
      ${t.msgs
        .map((m) =>
          m.espera
            ? `<div style="text-align:center;margin:16px 0"><span data-txt style="display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:12px;background:#fff6d6;font-size:22px;font-weight:750;color:#7a5b00">${ic('relogio', 24, '#7a5b00', 2.2)}${esc(m.espera)}</span></div>`
            : `<div style="display:flex;justify-content:${m.de === 'cliente' ? 'flex-end' : 'flex-start'};margin:10px 0"><div data-txt style="max-width:84%;padding:14px 18px;border-radius:${m.de === 'cliente' ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};background:${m.de === 'cliente' ? '#d9fdd3' : '#fff'};font-size:${t.tam ?? 25}px;line-height:1.35;font-weight:550;color:#1d2433;white-space:pre-line">${esc(m.t)}</div></div>`,
        )
        .join('')}
      </div>`,
  cardapio: (t, { COR }) => `<div style="padding:18px 22px">
      <div data-txt style="font-size:28px;font-weight:900">${esc(t.nome)}</div>
      ${t.itens.map((x) => `<div style="margin-top:14px;padding:16px;border-radius:16px;background:#fff;border:1px solid #dce2ec;display:flex;gap:14px;align-items:center"><div style="width:76px;height:76px;border-radius:14px;background:linear-gradient(135deg,#f2b880,#d97b5c);flex:none"></div><div style="flex:1"><div data-txt style="font-size:24px;font-weight:850">${esc(x.nome)}</div><div data-txt style="font-size:20px;color:#5a6477;margin-top:4px;line-height:1.3">${esc(x.desc ?? '')}</div></div><span style="width:46px;height:46px;border-radius:50%;background:${COR.blue};color:#fff;display:grid;place-items:center;font-size:30px;font-weight:900;flex:none">+</span></div>`).join('')}
    </div>`,
};

// ---------------------------------------------------------------------------------------------
// Fechamento

/** Resumo numerado (para salvar). */
const resumo = (b, { COR }) =>
  `<div style="display:flex;flex-direction:column;gap:20px;${b.esticar ? 'flex:1;justify-content:center' : ''}">${b.itens
    .map(
      (t, i) => `<div style="display:flex;align-items:center;gap:26px;padding:22px 0;border-top:1.5px solid rgba(255,255,255,.1)">
      <span style="font-size:64px;font-weight:900;letter-spacing:-.04em;color:transparent;-webkit-text-stroke:2.5px ${COR.blueBright};width:96px">${String(i + 1).padStart(2, '0')}</span>
      <span data-txt style="font-size:42px;font-weight:760;line-height:1.2">${esc(t)}</span></div>`,
    )
    .join('')}</div>`;

/** Pedido final pequeno: uma linha com a palavra do direct. Nunca um slide só de marca. */
const cta = (b, { COR }) =>
  `<div class="card" style="display:flex;align-items:center;gap:26px;padding:28px 32px;border-color:rgba(77,141,255,.5)">
    <span style="flex:none;padding:12px 26px;border-radius:18px;background:${COR.blue};color:#fff;font-size:44px;font-weight:900;letter-spacing:-.01em;box-shadow:0 20px 40px -16px rgba(8,101,254,1)">${esc(b.palavra)}</span>
    <span data-txt style="font-size:32px;font-weight:650;line-height:1.3;color:#e3e9f5">${esc(b.texto)}</span>
  </div>`;

/** Tarefa para fazer hoje: ícone, rótulo e uma frase. */
const tarefa = (b, { COR }) =>
  `<div class="card" style="display:flex;align-items:center;gap:28px;padding:30px 34px;border-color:rgba(77,141,255,.45)">
    <span style="flex:none;width:96px;height:96px;border-radius:28px;background:${COR.blue};display:grid;place-items:center;box-shadow:0 24px 50px -18px rgba(8,101,254,1)">${ic(b.icone ?? 'anotar', 52, '#fff', 2)}</span>
    <div><div data-txt class="rot">${esc(b.rotulo ?? 'Tarefa de hoje')}</div><div data-txt style="font-size:40px;font-weight:780;line-height:1.2;margin-top:8px">${esc(b.texto)}</div></div>
  </div>`;

/** Selo de salvar. */
const salvar = (b) =>
  `<div style="display:inline-flex;align-items:center;gap:18px;padding:18px 28px;border-radius:999px;border:1.5px solid rgba(255,255,255,.18);background:rgba(255,255,255,.04)"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"><path d="M6 3.5h12v17l-6-4.2-6 4.2z"/></svg><span data-txt style="font-size:30px;font-weight:750">${esc(b.texto ?? 'Salve para fazer depois')}</span></div>`;

export const COMPONENTES = {
  titulo,
  texto,
  rotulo,
  selo,
  contador,
  fluxo,
  linhaTempo,
  colunas,
  lista,
  cardapio,
  antesDepois,
  anatomia,
  modelo,
  ficha,
  comanda,
  celular,
  resumo,
  cta,
  salvar,
  tarefa,
};

/** Tipos que contam como "visual" (diagrama, objeto, tela) para o equilíbrio texto × imagem. */
export const VISUAIS = new Set(['tarefa', 'lista', 'contador', 'fluxo', 'linhaTempo', 'colunas', 'cardapio', 'antesDepois', 'anatomia', 'modelo', 'ficha', 'comanda', 'celular', 'resumo']);
