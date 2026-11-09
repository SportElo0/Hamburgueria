// Carrosséis v2 (a partir de 03/11/2026): gancho que cutuca → por que importa → 3 sinais → o que fazer → convite para o
// diagnóstico grátis (link da bio). Fundos variando (claro, azul, escuro) e cenas com os bonequinhos dos Reels; quando o
// mascote da Growlift existir, ele entra como guia no lugar do `guia()`. Nada de cliente, número ou resultado inventado.
//   node growlift-social/_fonte/carrosseis-v2.mjs          → todos
//   node growlift-social/_fonte/carrosseis-v2.mjs 13 15    → só esses (prefixo da pasta)
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { page, TOKENS, MARK } from './pecas.mjs';
import { person, store, food, svgIcon, ICON } from './reels/novos/base.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.GROWLIFT_SOCIAL || path.resolve(HERE, '..');
const OUT = '09-carrosseis';
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const BLUE = TOKENS.blue;
const RED = '#ff5a4e';
const GREEN = '#1fb85a';
const AMBER = '#ffc94d';
const INK = '#0b1220';

// ---------------------------------------------------------------------------------------------
// Temas: o fundo muda de slide para slide; marca, fonte e azul ficam.
const TEMAS = {
  claro: { bg: '#f3f6fc', fg: INK, soft: '#3b4659', mute: '#6b7588', hl: BLUE, chip: '#e2eaff', chipFg: BLUE, line: 'rgba(11,18,32,.10)', mark: BLUE, dots: 'rgba(11,18,32,.18)' },
  azul: { bg: BLUE, fg: '#ffffff', soft: '#e3ecff', mute: '#c3d6ff', hl: AMBER, chip: 'rgba(255,255,255,.16)', chipFg: '#ffffff', line: 'rgba(255,255,255,.22)', mark: '#ffffff', dots: 'rgba(255,255,255,.35)' },
  escuro: { bg: TOKENS.bg, fg: '#ffffff', soft: '#d5dceb', mute: TOKENS.muted, hl: TOKENS.blueBright, chip: 'rgba(8,101,254,.22)', chipFg: '#cfe0ff', line: 'rgba(255,255,255,.12)', mark: BLUE, dots: 'rgba(255,255,255,.22)' },
};

const CSS = (t) => `
body{background:${t.bg};color:${t.fg}}
.abs{position:absolute;left:0;top:0}
.h{font-weight:900;letter-spacing:-.045em;line-height:.98;color:${t.fg}}
.h em{font-style:normal;color:${t.hl}}
.p{font-size:40px;line-height:1.35;color:${t.soft};font-weight:500}
.p b{color:${t.fg}}
.chip{display:inline-flex;align-items:center;gap:12px;height:58px;padding:0 26px;border-radius:999px;font-size:26px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;background:${t.chip};color:${t.chipFg}}
.card{background:#fff;color:${INK};border-radius:30px;box-shadow:0 40px 80px -40px rgba(8,30,80,.45),0 0 0 1.5px rgba(11,18,32,.06)}
.phone{position:absolute;background:#121826;border-radius:58px;padding:14px;box-shadow:0 50px 100px -40px rgba(4,20,60,.7)}
.screen{background:#fff;border-radius:46px;height:100%;overflow:hidden;color:${INK};position:relative}
.bubble{position:absolute;background:#fff;color:${INK};border-radius:30px;padding:20px 26px;font-size:30px;font-weight:700;line-height:1.25;box-shadow:0 24px 50px -24px rgba(4,20,60,.55)}
.msg{display:inline-block;max-width:78%;padding:14px 20px;border-radius:24px;font-size:25px;line-height:1.3;font-weight:600}
.in{background:#eef1f6;color:${INK};border-bottom-left-radius:8px}
.out{background:#d9fdd3;color:${INK};border-bottom-right-radius:8px;margin-left:auto}
.x{display:inline-grid;place-items:center;width:44px;height:44px;border-radius:50%;background:${RED};color:#fff;font-weight:900;font-size:28px}
.ok{display:inline-grid;place-items:center;width:44px;height:44px;border-radius:50%;background:${GREEN};color:#fff;font-weight:900;font-size:26px}
`;

function slide(inner, { n, total, tema }) {
  const t = TEMAS[tema];
  const bar = Array.from({ length: total }, (_, i) => `<i style="display:block;height:8px;border-radius:4px;width:${i + 1 === n ? 46 : 14}px;background:${i + 1 === n ? t.hl : t.dots}"></i>`).join('');
  const mark = MARK.replaceAll('#0865FE', t.mark).replace('<svg ', '<svg height="30" ');
  const deco =
    tema === 'claro'
      ? `<div style="position:absolute;right:-260px;top:-260px;width:720px;height:720px;border-radius:50%;background:radial-gradient(closest-side,rgba(8,101,254,.13),rgba(8,101,254,0))"></div>`
      : tema === 'azul'
        ? `<div style="position:absolute;inset:0;background:radial-gradient(900px 700px at 85% 0%,rgba(255,255,255,.18),transparent 60%)"></div>`
        : `<div style="position:absolute;left:-420px;top:-480px;width:1200px;height:1200px;border-radius:50%;background:radial-gradient(closest-side,rgba(8,101,254,.42),rgba(8,101,254,0) 70%)"></div>`;
  return page(
    1080,
    1350,
    `${deco}
    <div style="position:absolute;left:84px;right:84px;top:70px;display:flex;justify-content:space-between;align-items:center">
      <div style="display:flex;align-items:center;gap:14px;font-size:27px;font-weight:800;letter-spacing:.14em;color:${t.fg}">${mark}GROWLIFT</div>
      <span style="font-size:26px;font-weight:700;color:${t.mute}">@growlift.ai</span></div>
    <div style="position:absolute;left:84px;right:84px;top:160px;bottom:140px">${inner}</div>
    <div style="position:absolute;left:84px;right:84px;bottom:62px;display:flex;justify-content:space-between;align-items:center">
      <div style="display:flex;gap:8px">${bar}</div>
      <span style="font-size:26px;font-weight:800;color:${t.mute}">${n < total ? 'Arrasta →' : `${n}/${total}`}</span></div>`,
    CSS(t),
  );
}

// ---------------------------------------------------------------------------------------------
// Peças de cena

/** Um bonequinho dos Reels numa posição, com cara: feliz | triste | bravo. */
function boneco(id, { x, y, size = 260, shirt = BLUE, hair, skin, cara = 'feliz', flip = false }) {
  const face =
    cara === 'feliz' ? '' : `<style>#${id}-happy{opacity:0}#${id}-sad{opacity:1}${cara === 'bravo' ? `#${id}-brow{opacity:1}` : ''}</style>`;
  return `${face}<div style="position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size * 1.1}px;${flip ? 'transform:scaleX(-1)' : ''}">${person(id, shirt, { size, ...(hair ? { hair } : {}), ...(skin ? { skin } : {}) })}</div>`;
}

const balao = (txt, { x, y, w = 'auto', rot = 0, cor = '#fff', fg = INK, size = 30 }) =>
  `<div class="bubble" style="left:${x}px;top:${y}px;width:${w === 'auto' ? 'auto' : w + 'px'};transform:rotate(${rot}deg);background:${cor};color:${fg};font-size:${size}px">${txt}</div>`;

const celular = (inner, { x, y, w = 400, h = 760, rot = 0 }) =>
  `<div class="phone" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;transform:rotate(${rot}deg)"><div class="screen">${inner}</div></div>`;

const busca = (q) =>
  `<div style="margin:56px 22px 18px;height:62px;border-radius:999px;background:#eef1f6;display:flex;align-items:center;gap:12px;padding:0 22px;font-size:24px;color:#4b5568">${svgIcon(ICON.search, 26, '#6b7588', 2.4)}${q}</div>`;

const resultado = ({ nome, nota, linha, cor = '#e8eefc', alerta = '' }) =>
  `<div style="margin:0 22px 14px;padding:18px 20px;border-radius:22px;border:1.5px solid #e6eaf2;display:flex;gap:16px;align-items:center">
     <div style="flex:none;width:76px;height:76px;border-radius:16px;background:${cor}"></div>
     <div style="flex:1;min-width:0"><div style="font-size:25px;font-weight:800">${nome}</div>
     <div style="font-size:21px;color:#6b7588;margin-top:4px">${nota ? `<b style="color:#b07a00">★ ${nota}</b> · ` : ''}${linha}</div>
     ${alerta ? `<div style="font-size:20px;font-weight:800;color:${RED};margin-top:4px">${alerta}</div>` : ''}</div></div>`;

const conversa = (msgs, { topo = 'Cliente' } = {}) =>
  `<div style="height:110px;background:#075e54;color:#fff;display:flex;align-items:flex-end;padding:0 26px 18px;font-size:26px;font-weight:800">${topo}</div>
   <div style="padding:22px 18px;display:grid;gap:12px;align-content:start;background:#efe7dd;height:100%">${msgs
     .map(([lado, txt, hora = '']) => `<div class="msg ${lado}">${txt}${hora ? `<span style="display:block;text-align:right;font-size:18px;color:#6b7588;margin-top:4px">${hora}</span>` : ''}</div>`)
     .join('')}</div>`;

const cardapioPdf = () =>
  `<div style="padding:56px 22px 0;font-size:22px;color:#6b7588;font-weight:700;display:flex;justify-content:space-between"><span>cardapio_final_v3.pdf</span><span>1/6</span></div>
   <div style="margin:16px 22px;border-radius:14px;background:#faf6ee;height:520px;padding:22px;filter:blur(2.2px)">
     ${Array.from({ length: 11 }, (_, i) => `<div style="display:flex;justify-content:space-between;margin:12px 0"><i style="display:block;height:12px;width:${40 + ((i * 37) % 45)}%;background:#c9b99a;border-radius:6px"></i><i style="display:block;height:12px;width:14%;background:#c9b99a;border-radius:6px"></i></div>`).join('')}
   </div>
   <div style="margin:0 22px;font-size:22px;color:#6b7588;text-align:center">pinça para dar zoom…</div>`;

const perfilInsta = ({ nome, bio, link = '', erroLink = false }) =>
  `<div style="padding:60px 24px 0;display:flex;align-items:center;gap:20px">
     <div style="width:110px;height:110px;border-radius:50%;background:conic-gradient(#f9ce34,#ee2a7b,#6228d7,#f9ce34);padding:5px"><div style="width:100%;height:100%;border-radius:50%;background:#ffe2c4;display:grid;place-items:center">${food('burger', 64)}</div></div>
     <div style="display:flex;gap:22px;font-size:20px;text-align:center"><div><b style="font-size:26px;display:block">212</b>posts</div><div><b style="font-size:26px;display:block">3 mil</b>seguidores</div></div></div>
   <div style="padding:16px 24px 0;font-size:24px;line-height:1.35"><b>${nome}</b><br>${bio}${link ? `<br><span style="color:${erroLink ? RED : '#00376b'};font-weight:700">${link}</span>` : ''}</div>
   <div style="margin:18px 6px 0;display:grid;grid-template-columns:repeat(3,1fr);gap:4px">${['burger', 'fries', 'drink', 'salad', 'burger', 'fries'].map((f) => `<div style="aspect-ratio:1;display:grid;place-items:center;background:#fff4e6">${food(f, 104)}</div>`).join('')}</div>`;

const lista = (itens, t) =>
  `<div style="display:grid;gap:26px">${itens
    .map(
      (it, i) => `<div style="display:flex;gap:26px;align-items:flex-start">
        <span style="flex:none;width:72px;height:72px;border-radius:22px;background:${t === 'azul' ? '#fff' : BLUE};color:${t === 'azul' ? BLUE : '#fff'};display:grid;place-items:center;font-size:36px;font-weight:900">${i + 1}</span>
        <p class="p" style="font-size:38px;padding-top:6px"><b>${it[0]}</b>${it[1] ? ` ${it[1]}` : ''}</p></div>`,
    )
    .join('')}</div>`;

// ---------------------------------------------------------------------------------------------
// Modelos de slide

const capa = ({ gancho, sub, cena, tamanho = 104 }) =>
  `<div style="position:absolute;left:0;right:0;top:20px"><h1 class="h" style="font-size:${tamanho}px">${gancho}</h1><p class="p" style="margin-top:26px;max-width:880px">${sub}</p></div>
   <div style="position:absolute;left:-84px;right:-84px;bottom:0;height:640px">${cena}</div>`;

const porque = ({ frase, apoio, cena = '', tamanho = 92 }) =>
  `<div style="position:absolute;left:0;right:0;top:70px"><h2 class="h" style="font-size:${tamanho}px">${frase}</h2><p class="p" style="margin-top:34px;max-width:860px">${apoio}</p></div>
   <div style="position:absolute;left:-84px;right:-84px;bottom:0;height:520px">${cena}</div>`;

const sinal = ({ n, titulo, texto, cena }) =>
  `<span class="chip">Sinal ${n} de 3</span>
   <h2 class="h" style="font-size:76px;margin-top:30px">${titulo}</h2>
   <p class="p" style="margin-top:24px;font-size:36px;max-width:900px">${texto}</p>
   <div style="position:absolute;left:-84px;right:-84px;bottom:0;height:560px">${cena}</div>`;

const resumo = ({ titulo, itens, tema }) =>
  `<span class="chip">Salva pra fazer depois</span>
   <h2 class="h" style="font-size:84px;margin-top:30px">${titulo}</h2>
   <div style="margin-top:56px">${lista(itens, tema)}</div>`;

const convite = ({ titulo = 'Quer um teste <em>mais profundo?</em>', texto }) =>
  `<h2 class="h" style="font-size:96px;margin-top:10px">${titulo}</h2>
   <p class="p" style="margin-top:30px;max-width:900px">${texto}</p>
   <div style="margin-top:44px;display:flex;align-items:center;gap:22px">
     <span style="display:inline-flex;align-items:center;gap:16px;height:96px;padding:0 40px;border-radius:999px;background:#fff;color:${BLUE};font-size:38px;font-weight:900;box-shadow:0 30px 60px -24px rgba(0,0,0,.45)">${svgIcon('<path d="M12 19V5M5 12l7-7 7 7"/>', 40, BLUE, 3)}Link da bio</span>
     <span style="font-size:32px;font-weight:800;color:#fff">Diagnóstico grátis</span></div>
   <div style="margin-top:26px;display:flex;gap:14px;flex-wrap:wrap">${['Em até 2 dias úteis', 'No seu WhatsApp', 'Sem compromisso'].map((x) => `<span class="chip">${x}</span>`).join('')}</div>
   <div style="position:absolute;right:-30px;bottom:-30px;height:420px;width:520px">${boneco('gc', { x: 220, y: 40, size: 300, shirt: '#ffffff', cara: 'feliz' })}${balao('A gente te manda o que ajustar 👋', { x: -170, y: 84, rot: -4, size: 28 })}</div>`;

// ---------------------------------------------------------------------------------------------
// Os carrosséis

// Carrossel 20 (clínicas): passo a passo e fecho com "Comenta CLÍNICA" em vez do diagnóstico.
const passo = ({ n, titulo, texto, cena }) =>
  `<span class="chip">Ela pode · passo ${n} de 3</span>
   <h2 class="h" style="font-size:76px;margin-top:30px">${titulo}</h2>
   <p class="p" style="margin-top:24px;font-size:36px;max-width:900px">${texto}</p>
   <div style="position:absolute;left:-84px;right:-84px;bottom:0;height:560px">${cena}</div>`;
const audioMsg = (dur, cor = '#4b5568') =>
  `<span style="display:inline-flex;align-items:center;gap:10px"><span style="width:38px;height:38px;border-radius:50%;background:${BLUE};color:#fff;display:inline-grid;place-items:center;font-size:16px">▶</span><span style="display:inline-flex;gap:3px;align-items:center">${[10, 20, 14, 26, 16, 22, 12, 24, 14, 8].map((h) => `<i style="display:block;width:4px;height:${h}px;border-radius:2px;background:${cor}"></i>`).join('')}</span><span style="font-size:18px;color:#6b7588">${dur}</span></span>`;
const agendaCard = () => {
  const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'], horas = ['8h', '9h', '10h', '14h'];
  const ocup = new Set(['0-0', '0-2', '1-1', '1-3', '2-0', '2-1', '2-3', '3-2', '4-0', '4-1', '4-3', '3-3']);
  return `<div class="card" style="position:absolute;left:110px;top:30px;width:620px;padding:30px 32px">
    <div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:30px;font-weight:900">Agenda da clínica</span><span style="font-size:22px;font-weight:700;color:#6b7588">exemplo</span></div>
    <div style="display:grid;grid-template-columns:62px repeat(5,1fr);gap:8px;margin-top:20px">
      <span></span>${dias.map((d) => `<span style="text-align:center;font-size:22px;font-weight:800;color:${d === 'Qui' ? BLUE : '#6b7588'}">${d}</span>`).join('')}
      ${horas.map((h, r) => `<span style="font-size:21px;font-weight:700;color:#6b7588;align-self:center">${h}</span>${dias.map((_, c) => (`${c}-${r}` === '3-1' ? `<span style="height:52px;border-radius:12px;background:${BLUE};color:#fff;font-size:19px;font-weight:800;display:grid;place-items:center">Bia ✓</span>` : `<span style="height:52px;border-radius:12px;${ocup.has(`${c}-${r}`) ? 'background:#e6eaf2' : 'border:2px dashed #d5dceb'}"></span>`)).join('')}`).join('')}
    </div>
    <div style="margin-top:20px;display:flex;align-items:center;gap:12px;font-size:26px;font-weight:800;color:${GREEN}"><span class="ok" style="width:38px;height:38px;font-size:22px">✓</span>Marcado: quinta, 9h</div></div>`;
};

const LEGENDA_FIM =
  'Quer um diagnóstico do seu negócio? Toca no link da bio: em até 2 dias úteis você recebe no WhatsApp o que ajustar e uma prévia do seu site. Grátis e sem compromisso.\n\n(Nomes, notas e telas dos slides são exemplos ilustrativos.)';

const CARROSSEIS = [
  {
    slug: '13-bom-mas-nao-vende',
    titulo: 'Seu restaurante é bom, mas não vende?',
    temas: ['claro', 'escuro', 'claro', 'azul', 'claro', 'escuro', 'azul'],
    slides: [
      () =>
        capa({
          gancho: 'Seu restaurante é bom… <em>mas não vende?</em>',
          sub: '3 sinais de que o problema não está na cozinha.',
          cena: `<div style="position:absolute;left:330px;top:120px">${store('lj', 'LANCHES', BLUE, { w: 470 })}</div>
            ${boneco('d1', { x: 120, y: 250, size: 300, shirt: RED, cara: 'triste' })}
            ${balao('Comida boa, salão vazio… 🤔', { x: 60, y: 470, rot: -3 })}
            <div style="position:absolute;right:110px;top:300px;transform:rotate(8deg)">${food('burger', 150)}</div>`,
        }),
      () =>
        porque({
          frase: 'Antes de provar, o cliente <em>procura.</em>',
          apoio: 'Ele decide pelo celular, em poucos segundos. Se não te acha, ou não entende como pedir, pode nem chegar até a comida.',
          cena: `${celular(busca('lanche perto de mim') + resultado({ nome: 'Lanchonete da esquina', nota: '4,7', linha: 'Aberto · Cardápio', cor: '#ffe2c4' }) + resultado({ nome: 'Burger do bairro', nota: '4,6', linha: 'Aberto · Pedir online', cor: '#dcfce7' }), { x: 300, y: 40, w: 440, h: 460 })}
            ${boneco('c1', { x: 740, y: 230, size: 260, shirt: AMBER })}`,
        }),
      () =>
        sinal({
          n: 1,
          titulo: 'Quem procura no Google <em>não te encontra.</em>',
          texto: 'Ou encontra com horário e telefone velhos. Aí o cliente vai no vizinho, e você pode nem ficar sabendo.',
          cena: `${celular(busca('restaurante perto de mim') + resultado({ nome: 'Restaurante do lado', nota: '4,6', linha: 'Aberto agora', cor: '#dcfce7' }) + resultado({ nome: 'Seu restaurante', nota: '', linha: 'Horário não informado', cor: '#eef1f6', alerta: 'Fechado (horário antigo)' }), { x: 120, y: 10, w: 470, h: 530, rot: -3 })}
            ${boneco('c2', { x: 660, y: 200, size: 290, shirt: '#7c5cff', cara: 'triste' })}
            ${balao('Fechado? 🙁', { x: 640, y: 90, rot: 4 })}`,
        }),
      () =>
        sinal({
          n: 2,
          titulo: 'O cardápio só existe em <em>foto ou PDF.</em>',
          texto: 'No celular, ninguém quer dar zoom pra achar o preço. Ele desiste, ou manda mensagem perguntando.',
          cena: `${celular(cardapioPdf(), { x: 150, y: 20, w: 430, h: 520, rot: 3 })}
            ${boneco('c3', { x: 640, y: 210, size: 280, shirt: AMBER, cara: 'bravo' })}
            ${balao('Quanto é o X-salada? 🔍', { x: 560, y: 90, rot: -4 })}`,
        }),
      () =>
        sinal({
          n: 3,
          titulo: 'Pra pedir, só mandando <em>mensagem e esperando.</em>',
          texto: 'Se o pedido depende de alguém responder, no horário de pico ele espera… ou pede em outro lugar.',
          cena: `${celular(conversa([['in', 'Boa noite! Tá aberto?', '20:02'], ['in', 'Tem cardápio?', '20:05'], ['in', 'Oi??', '20:19']], { topo: 'Cliente · visto por último 20:19' }), { x: 120, y: 20, w: 470, h: 520, rot: -2 })}
            ${boneco('c4', { x: 650, y: 210, size: 280, shirt: '#22a06b', cara: 'bravo' })}
            ${balao('Vou pedir em outro 😤', { x: 600, y: 90, rot: 3 })}`,
        }),
      ({ tema }) =>
        resumo({
          tema,
          titulo: 'Marcou algum? <em>Comece por aqui:</em>',
          itens: [
            ['Perfil no Google completo:', 'horário certo, telefone, fotos e o link do cardápio.'],
            ['Cardápio em texto,', 'que abre rápido no celular, com foto e preço.'],
            ['Um jeito de pedir', 'sem depender de alguém responder na hora.'],
          ],
        }),
      () =>
        convite({
          texto: 'A gente olha como o seu negócio aparece no <b>Google</b>, no <b>Instagram</b> e no <b>site</b>, e te manda o diagnóstico com uma prévia do seu site novo.',
        }),
    ],
    legenda: `Seu restaurante é bom… mas não vende? Pode não ser a cozinha. 👇

3 sinais pra conferir hoje:
1. Quem procura no Google não te encontra (ou acha horário errado).
2. O cardápio só existe em foto ou PDF.
3. Pra pedir, só mandando mensagem e esperando.

Marcou algum? Salva o post e começa pelo resumo do slide 6.

${LEGENDA_FIM}

#restaurante #hamburgueria #marketingpararestaurantes #delivery #growlift`,
    alt: 'Carrossel ilustrado com bonequinhos: um dono de restaurante preocupado com o salão vazio e três sinais de que o problema está no caminho até o cliente: não aparecer no Google, cardápio só em PDF e pedido só por mensagem. No fim, convite para o diagnóstico grátis pelo link da bio.',
  },
  {
    slug: '14-perfil-sem-pedido',
    titulo: 'Entraram no seu Instagram e saíram sem pedir?',
    temas: ['azul', 'claro', 'claro', 'escuro', 'claro', 'claro', 'azul'],
    slides: [
      () =>
        capa({
          gancho: 'Entraram no seu Instagram… <em>e saíram sem pedir?</em>',
          sub: '3 sinais de que o seu perfil espanta quem já estava com fome.',
          tamanho: 98,
          cena: `${celular(perfilInsta({ nome: 'Lanche da Casa', bio: 'Amor em forma de lanche 🍔❤️' }), { x: 330, y: 40, w: 430, h: 580, rot: -3 })}
            ${boneco('d2', { x: 70, y: 260, size: 280, shirt: AMBER, cara: 'triste' })}
            ${balao('Tá, mas como eu peço?', { x: 40, y: 150, rot: -4 })}`,
        }),
      () =>
        porque({
          frase: 'O perfil é a <em>vitrine.</em>',
          apoio: 'Quem chega com fome decide em segundos se fica ou volta pra busca. Se precisar perguntar o básico, a fome vai pra outro lugar.',
          cena: `${boneco('c5', { x: 160, y: 120, size: 300, shirt: '#7c5cff' })}${balao('Hmm, que lanche bonito 😋', { x: 120, y: 30, rot: -3 })}
            <div style="position:absolute;left:560px;top:140px;display:flex;gap:18px">${food('burger', 150)}${food('fries', 150)}</div>
            <div style="position:absolute;left:560px;top:320px;font-size:30px;font-weight:800;color:${RED}">E agora: onde, quanto e como? 🤷</div>`,
        }),
      () =>
        sinal({
          n: 1,
          titulo: 'A bio <em>não diz como pedir.</em>',
          texto: 'Sem o que você vende, o bairro, o horário e um "peça aqui", ele precisa adivinhar. E não adivinha.',
          cena: `${celular(perfilInsta({ nome: 'Lanche da Casa', bio: 'Amor em forma de lanche 🍔❤️<br>Desde 2019 ✨' }), { x: 140, y: 0, w: 450, h: 540, rot: 2 })}
            <div style="position:absolute;left:640px;top:120px;display:grid;gap:14px">${['Onde fica?', 'Abre hoje?', 'Entrega?', 'Como peço?'].map((q) => `<span class="card" style="padding:14px 22px;font-size:28px;font-weight:800">❓ ${q}</span>`).join('')}</div>`,
        }),
      () =>
        sinal({
          n: 2,
          titulo: 'As fotos não mostram <em>o que tem e quanto custa.</em>',
          texto: 'Foto bonita dá fome. Mas sem cardápio e preço à vista, ele sai pra procurar onde está escrito.',
          cena: `<div style="position:absolute;left:130px;top:40px;display:grid;grid-template-columns:repeat(3,170px);gap:10px">${['burger', 'fries', 'drink', 'salad', 'burger', 'fries'].map((f) => `<div style="aspect-ratio:1;display:grid;place-items:center;background:#fff4e6;border-radius:16px">${food(f, 150)}</div>`).join('')}</div>
            ${boneco('c6', { x: 700, y: 210, size: 270, shirt: AMBER, cara: 'bravo' })}
            ${balao('Quanto custa? 💸', { x: 690, y: 100, rot: 4 })}`,
        }),
      () =>
        sinal({
          n: 3,
          titulo: 'O link da bio <em>não leva ao pedido.</em>',
          texto: 'Link quebrado, página lenta ou uma lista de botões: cada passo a mais faz gente desistir no caminho.',
          cena: `${celular(`<div style="padding:120px 30px;text-align:center"><div style="font-size:120px">🔗</div><div style="font-size:34px;font-weight:900;margin-top:20px">Página não encontrada</div><div style="font-size:24px;color:#6b7588;margin-top:12px">Erro 404</div></div>`, { x: 160, y: 20, w: 420, h: 520, rot: -3 })}
            ${boneco('c7', { x: 650, y: 210, size: 280, shirt: '#22a06b', cara: 'triste' })}
            ${balao('Deixa pra lá…', { x: 640, y: 100, rot: 3 })}`,
        }),
      ({ tema }) =>
        resumo({
          tema,
          titulo: 'Arruma em <em>3 passos:</em>',
          itens: [
            ['Bio:', 'o que você vende, o bairro, o horário e "peça aqui".'],
            ['Destaques', 'com cardápio, preços, endereço e área de entrega.'],
            ['Um link só,', 'que abre rápido e leva direto pro cardápio e pro pedido.'],
          ],
        }),
      () => convite({ texto: 'A gente confere o seu <b>Instagram</b>, o <b>Google</b> e o <b>site</b> do jeito que o cliente vê, e te manda o que ajustar com uma prévia do seu site.' }),
    ],
    legenda: `Entraram no seu Instagram… e saíram sem pedir? 👀

3 sinais de que o perfil espanta quem já estava com fome:
1. A bio não diz como pedir.
2. As fotos não mostram o que tem e quanto custa.
3. O link da bio não leva ao pedido.

O resumo pra arrumar está no slide 6. Salva e confere o seu hoje.

${LEGENDA_FIM}

#restaurante #instagramparanegocios #marketingpararestaurantes #delivery #growlift`,
    alt: 'Carrossel ilustrado: um perfil de lanchonete no Instagram com bio vaga, fotos sem preço e link quebrado, e bonequinhos confusos. Resumo com três ajustes e convite para o diagnóstico grátis pelo link da bio.',
  },
  {
    slug: '15-so-aplicativo',
    titulo: 'Seu delivery depende só de aplicativo?',
    temas: ['escuro', 'claro', 'azul', 'claro', 'escuro', 'claro', 'azul'],
    slides: [
      () =>
        capa({
          gancho: 'Seu delivery depende <em>só de aplicativo?</em>',
          sub: '3 sinais de que é hora de ter um canal seu, junto com o app.',
          tamanho: 100,
          cena: `<div style="position:absolute;left:110px;top:150px">${store('lj2', 'DELIVERY', BLUE, { w: 430 })}</div>
            ${celular(`<div style="padding:56px 22px 0;font-size:24px;font-weight:900">Pedidos</div>${['Seu Restaurante', 'Outro lugar', 'Mais um lugar'].map((n, i) => `<div style="margin:14px 18px 0;padding:16px;border-radius:18px;border:1.5px solid #e6eaf2;display:flex;gap:14px;align-items:center"><div style="width:62px;height:62px;border-radius:14px;background:${['#ffe8cc', '#dbeafe', '#dcfce7'][i]}"></div><div style="flex:1"><div style="font-size:22px;font-weight:800">${n}</div><div style="font-size:18px;color:#6b7588;margin-top:4px">${['30–40 min', '25–35 min', '40–50 min'][i]}</div></div></div>`).join('')}<div style="margin:18px 18px 0;padding:14px;border-radius:14px;background:#fff4e6;font-size:19px;font-weight:800;color:#b45309;text-align:center">pedido pelo app de delivery</div>`, { x: 600, y: 40, w: 360, h: 580, rot: 4 })}
            <svg style="position:absolute;left:500px;top:330px" width="120" height="60"><path d="M10 30h90M80 12l22 18-22 18" stroke="${AMBER}" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
            ${boneco('d3', { x: 20, y: 330, size: 240, shirt: RED, cara: 'triste' })}`,
        }),
      () =>
        porque({
          frase: 'O app ajuda a ser achado. <em>Mas o cliente é de quem?</em>',
          tamanho: 80,
          apoio: 'Quem já gosta da sua comida pode pedir direto com você. Os dois canais juntos, e não um só.',
          cena: `${boneco('c8', { x: 90, y: 150, size: 320, shirt: '#7c5cff' })}${balao('Adoro esse lanche! 😋', { x: 40, y: 50, rot: -3, size: 32 })}
            ${[['Primeira vez', 'pelo app', '#fff4e6', '#b45309', 60], ['Da segunda em diante', 'direto no seu link', '#e2eaff', BLUE, 250]]
              .map(([a, b, bg, fg, y]) => `<div class="card" style="position:absolute;left:470px;top:${y}px;width:500px;padding:28px 32px;display:flex;gap:22px;align-items:center"><div style="flex:none;width:70px;height:70px;border-radius:20px;background:${bg};display:grid;place-items:center">${svgIcon(ICON.bag, 40, fg, 2.4)}</div><div><div style="font-size:24px;font-weight:800;color:#6b7588">${a}</div><div style="font-size:36px;font-weight:900;color:${fg};margin-top:4px">${b}</div></div></div>`)
              .join('')}`,
        }),
      () =>
        sinal({
          n: 1,
          titulo: 'Você não tem como <em>falar com quem já pediu.</em>',
          texto: 'Em geral, o pedido chega, mas o contato fica no aplicativo. Pra avisar de uma novidade, você depende dele.',
          cena: `<div class="card" style="position:absolute;left:110px;top:30px;width:600px;padding:34px 38px;transform:rotate(-2deg)"><div style="font-size:34px;font-weight:900">Pedido #2481 <span class="ok">✓</span></div><div style="font-size:30px;color:#6b7588;margin-top:18px">Cliente: <b style="letter-spacing:.24em;color:#121826">•••••••</b></div><div style="font-size:30px;color:#6b7588;margin-top:10px">Contato: <b style="color:#121826">só pelo aplicativo</b></div></div>
            ${boneco('c9', { x: 680, y: 200, size: 300, shirt: AMBER, cara: 'triste' })}
            ${balao('E pra chamar de novo? 🤔', { x: 260, y: 330, rot: -3, size: 34 })}`,
        }),
      () =>
        sinal({
          n: 2,
          titulo: 'O cliente fiel <em>costuma pedir pelo app.</em>',
          texto: 'Quem já é da casa poderia pedir no seu cardápio. Pelo app, em geral há comissão em cada pedido, até no da décima vez.',
          cena: `<div style="position:absolute;left:110px;top:20px;display:grid;gap:14px">${['1º pedido', '2º pedido', '3º pedido', '10º pedido'].map((p, i) => `<div class="card" style="padding:22px 30px;font-size:34px;font-weight:900;display:flex;gap:30px;justify-content:space-between;align-items:center;width:${520 + i * 24}px;transform:rotate(${i % 2 ? 1 : -1}deg)"><span>${p}</span><span style="font-size:28px;color:${RED};background:#ffe9e7;padding:6px 18px;border-radius:999px">− comissão</span></div>`).join('')}</div>
            ${boneco('c10', { x: 720, y: 230, size: 270, shirt: '#22a06b', cara: 'bravo' })}`,
        }),
      () =>
        sinal({
          n: 3,
          titulo: 'Se o app muda a regra, <em>seu movimento muda junto.</em>',
          texto: 'Os apps podem mudar taxa, destaque na lista e área de entrega, e quem decide não é você. Ter um canal seu deixa você menos exposto.',
          cena: `<div class="card" style="position:absolute;left:110px;top:40px;width:640px;padding:36px 40px;transform:rotate(-2deg)"><div style="display:inline-block;font-size:24px;font-weight:900;letter-spacing:.12em;color:#fff;background:${BLUE};padding:6px 16px;border-radius:999px">AVISO</div><div style="font-size:40px;font-weight:900;margin-top:16px;line-height:1.15">Atualizamos as regras da plataforma</div><div style="display:flex;gap:10px;margin-top:18px;flex-wrap:wrap">${['Taxas', 'Ordem da lista', 'Área de entrega'].map((x) => `<span style="font-size:24px;font-weight:800;color:#3b4659;background:#eef1f6;padding:8px 16px;border-radius:999px">${x}</span>`).join('')}</div></div>
            ${boneco('c11', { x: 720, y: 230, size: 280, shirt: RED, cara: 'triste' })}`,
        }),
      ({ tema }) =>
        resumo({
          tema,
          titulo: 'App + canal seu: <em>como começar</em>',
          itens: [
            ['Continue no app', 'pra ser achado por quem ainda não te conhece.'],
            ['Tenha um cardápio com pedido,', 'no seu link, com o seu nome.'],
            ['Divulgue esse link', 'no Instagram, no Google e no balcão.'],
          ],
        }),
      () => convite({ texto: 'A gente olha como o seu negócio aparece fora do app (<b>Google</b>, <b>Instagram</b> e <b>site</b>) e te manda o diagnóstico com uma prévia do seu site com cardápio.' }),
    ],
    legenda: `Seu delivery depende só de aplicativo? O app ajuda a ser achado. Mas o cliente fiel pode pedir direto com você. 👇

3 sinais de que é hora de ter um canal seu, junto com o app:
1. Você não tem como falar com quem já pediu.
2. O cliente fiel costuma pedir pelo app, com comissão em cada pedido.
3. Se o app muda a regra, o seu movimento muda junto.

${LEGENDA_FIM}

#delivery #restaurante #cardapiodigital #marketingpararestaurantes #growlift`,
    alt: 'Carrossel ilustrado sobre depender só de aplicativo de delivery: pedido sem contato do cliente, comissão em todo pedido e mudança de regras. Resumo para ter um canal próprio junto com o app e convite para o diagnóstico grátis pelo link da bio.',
  },
  {
    slug: '16-sexta-a-noite',
    titulo: 'Sexta à noite: quantos pedidos ficaram sem resposta?',
    temas: ['escuro', 'azul', 'claro', 'claro', 'escuro', 'claro', 'azul'],
    slides: [
      () =>
        capa({
          gancho: 'Sexta à noite: quantos pedidos <em>ficaram sem resposta?</em>',
          sub: '3 sinais de que o seu WhatsApp não aguenta o pico.',
          tamanho: 84,
          cena: `${celular(conversa([['in', 'Tá aberto?'], ['in', 'Tem cardápio?'], ['in', 'Entrega no Centro?'], ['in', 'Oi??'], ['in', 'Vou pedir em outro']], { topo: '5 mensagens não lidas' }), { x: 380, y: 20, w: 420, h: 600, rot: 3 })}
            ${boneco('d4', { x: 60, y: 260, size: 290, shirt: RED, cara: 'bravo' })}
            ${balao('🔥 Chapa cheia!', { x: 50, y: 160, rot: -4 })}`,
        }),
      () =>
        porque({
          frase: 'No pico, quem demora a responder <em>perde o pedido.</em>',
          apoio: 'Ninguém com fome espera muito. Se a resposta não vem, o próximo da lista responde.',
          cena: `<div style="position:absolute;left:180px;top:60px;width:260px;height:260px;border-radius:50%;background:#fff;display:grid;place-items:center;box-shadow:0 30px 60px -20px rgba(0,0,0,.5)">${svgIcon(ICON.clock, 180, BLUE, 2)}</div>
            ${boneco('c12', { x: 560, y: 100, size: 290, shirt: AMBER, cara: 'bravo' })}${balao('Demorou… 😩', { x: 520, y: 10, rot: 3 })}`,
        }),
      () =>
        sinal({
          n: 1,
          titulo: 'As mesmas perguntas, <em>toda hora.</em>',
          texto: '"Tá aberto?", "Tem cardápio?", "Entrega aqui?". Cada resposta digitada é um pedido parado.',
          cena: `${celular(conversa([['in', 'Tá aberto?'], ['out', 'Sim! 18h às 23h'], ['in', 'Tá aberto?'], ['out', 'Sim! 18h às 23h'], ['in', 'Tá aberto??']], { topo: 'WhatsApp' }), { x: 150, y: 10, w: 440, h: 530, rot: -2 })}
            ${boneco('c13', { x: 650, y: 220, size: 280, shirt: BLUE, cara: 'triste' })}${balao('De novo? 😵', { x: 660, y: 110, rot: 4 })}`,
        }),
      () =>
        sinal({
          n: 2,
          titulo: 'Pedido <em>anotado errado.</em>',
          texto: 'Áudio, print, endereço pela metade… e o lanche sai sem o que o cliente pediu.',
          cena: `<div class="card" style="position:absolute;left:140px;top:30px;width:520px;padding:30px 34px;transform:rotate(-2deg);font-family:ui-monospace,Menlo,monospace">
              <div style="font-size:30px;font-weight:900">Pedido mesa? delivery?</div>
              <div style="font-size:28px;margin-top:14px">1 x-bacon <s style="color:${RED}">sem cebola</s> com?</div>
              <div style="font-size:28px;margin-top:8px">Rua das… nº ??</div>
              <div style="font-size:28px;margin-top:8px">🎤 áudio 0:47</div></div>
            ${boneco('c14', { x: 690, y: 220, size: 270, shirt: '#22a06b', cara: 'bravo' })}${balao('Eu pedi SEM cebola!', { x: 720, y: 120, rot: 3 })}`,
        }),
      () =>
        sinal({
          n: 3,
          titulo: 'A resposta chega <em>quando já é tarde.</em>',
          texto: 'O cliente perguntou às 20h. A resposta saiu às 21h. Ele já tinha jantado.',
          cena: `${celular(conversa([['in', 'Ainda dá tempo de pedir?', '20:02'], ['out', 'Oi! Dá sim 😊', '21:04'], ['in', 'Já jantei, valeu', '21:05']], { topo: 'Cliente' }), { x: 150, y: 20, w: 440, h: 520, rot: 2 })}
            ${boneco('c15', { x: 660, y: 220, size: 280, shirt: AMBER, cara: 'triste' })}`,
        }),
      ({ tema }) =>
        resumo({
          tema,
          titulo: 'Pra sexta que vem: <em>3 ajustes</em>',
          itens: [
            ['Respostas rápidas', 'prontas pras perguntas de sempre (horário, cardápio, entrega).'],
            ['Cardápio online com pedido:', 'o cliente monta e você só confirma.'],
            ['Mensagem de ausência', 'com o link do cardápio, pra ninguém ficar sem resposta.'],
          ],
        }),
      () => convite({ texto: 'A gente olha o caminho do seu cliente até o pedido (<b>Google</b>, <b>Instagram</b>, <b>WhatsApp</b> e <b>site</b>) e te manda o diagnóstico com uma prévia do seu site com cardápio.' }),
    ],
    legenda: `Sexta à noite: quantos pedidos ficaram sem resposta? 📲🔥 Pode estar acontecendo com você.

3 sinais de que o WhatsApp não aguenta o pico:
1. As mesmas perguntas, toda hora.
2. Pedido anotado errado.
3. A resposta chega quando já é tarde.

No slide 6 tem os 3 ajustes pra sexta que vem. Salva!

${LEGENDA_FIM}

#delivery #restaurante #whatsappbusiness #hamburgueria #growlift`,
    alt: 'Carrossel ilustrado sobre o WhatsApp no pico de sexta à noite: mensagens repetidas, pedido anotado errado e resposta atrasada, com bonequinhos irritados. Resumo com três ajustes e convite para o diagnóstico grátis pelo link da bio.',
  },
  {
    slug: '17-indicacao',
    titulo: 'Seu cliente indica você, e o amigo não te acha?',
    temas: ['claro', 'escuro', 'claro', 'azul', 'claro', 'escuro', 'azul'],
    slides: [
      () =>
        capa({
          gancho: 'Seu cliente indica você… <em>e o amigo não te acha?</em>',
          sub: 'Barbearia, salão, clínica, loja: 3 sinais pra quem vive de indicação.',
          tamanho: 96,
          cena: `${boneco('d5', { x: 120, y: 230, size: 280, shirt: BLUE })}${balao('Vai na barbearia do Zé, é ótima!', { x: 60, y: 120, rot: -3, size: 27 })}
            ${boneco('d6', { x: 470, y: 250, size: 270, shirt: AMBER, cara: 'triste', flip: true })}
            ${celular(busca('barbearia do zé') + `<div style="padding:40px 26px;text-align:center;font-size:26px;color:#6b7588;font-weight:700">Nenhum resultado<br>para "barbearia do zé"</div>`, { x: 760, y: 120, w: 280, h: 480, rot: 5 })}`,
        }),
      () =>
        porque({
          frase: 'Indicação é ótima. <em>Mas todo mundo confere antes.</em>',
          apoio: 'O amigo procura o nome, olha fotos, preço e horário. Se não acha nada, a indicação se perde no caminho.',
          cena: `<div style="position:absolute;left:330px;top:60px">${store('bb', 'BARBEARIA', RED, { w: 420 })}</div>${boneco('c16', { x: 760, y: 170, size: 260, shirt: '#7c5cff' })}`,
        }),
      () =>
        sinal({
          n: 1,
          titulo: 'Procuram seu nome e <em>aparece outro lugar.</em>',
          texto: 'Sem perfil no Google com o nome certo, endereço e fotos, a busca mostra quem está ali do lado.',
          cena: `${celular(busca('barbearia do zé') + resultado({ nome: 'Barbearia Central', nota: '4,8', linha: 'Aberto · 300 m', cor: '#e8eefc' }) + resultado({ nome: 'Studio Corte', nota: '4,7', linha: 'Aberto · 500 m', cor: '#ffe2c4' }), { x: 140, y: 10, w: 460, h: 530, rot: -2 })}
            ${boneco('c17', { x: 660, y: 220, size: 280, shirt: AMBER, cara: 'triste' })}${balao('Deve ser essa… 🤷', { x: 640, y: 110, rot: 3 })}`,
        }),
      () =>
        sinal({
          n: 2,
          titulo: 'Não dá pra ver <em>serviços e preços</em> sem perguntar.',
          texto: 'Muita gente tem vergonha de perguntar preço. Não pergunta… e só não vai.',
          cena: `<div class="card" style="position:absolute;left:140px;top:30px;width:500px;padding:30px 34px">${['Corte', 'Barba', 'Corte + barba', 'Sobrancelha'].map((s) => `<div style="display:flex;justify-content:space-between;font-size:30px;font-weight:800;margin:12px 0"><span>${s}</span><span style="color:#b6bfcf">R$ ??</span></div>`).join('')}</div>
            ${boneco('c18', { x: 680, y: 220, size: 270, shirt: '#22a06b', cara: 'bravo' })}${balao('Quanto será? 💸', { x: 680, y: 110, rot: 4 })}`,
        }),
      () =>
        sinal({
          n: 3,
          titulo: 'Pra marcar horário, <em>só ligando.</em>',
          texto: 'Muita gente prefere não ligar. Um link pra agendar ou chamar no WhatsApp ajuda.',
          cena: `<div style="position:absolute;left:170px;top:60px;width:300px;height:300px;border-radius:60px;background:#fff;display:grid;place-items:center;font-size:150px;box-shadow:0 30px 60px -24px rgba(0,0,0,.4)">📞</div>
            ${boneco('c19', { x: 600, y: 200, size: 290, shirt: RED, cara: 'triste' })}${balao('Odeio ligar… depois eu vejo', { x: 520, y: 90, rot: -3, size: 27 })}`,
        }),
      ({ tema }) =>
        resumo({
          tema,
          titulo: 'Pra indicação <em>virar cliente:</em>',
          itens: [
            ['Perfil no Google', 'com o nome certo, endereço, horário e fotos.'],
            ['Serviços e preços', 'num lugar fácil de achar (site ou destaques).'],
            ['Agendar sem ligar:', 'link de agenda ou botão de WhatsApp.'],
          ],
        }),
      () => convite({ texto: 'A gente procura o seu negócio do jeito que o cliente procura (<b>Google</b>, <b>Instagram</b> e <b>site</b>) e te manda o diagnóstico com uma prévia do seu site.' }),
    ],
    legenda: `Seu cliente indica você… e o amigo não te acha? 🔎

Pra barbearia, salão, clínica, loja: 3 sinais pra quem vive de indicação:
1. Procuram seu nome e aparece outro lugar.
2. Não dá pra ver serviços e preços sem perguntar.
3. Pra marcar horário, só ligando.

${LEGENDA_FIM}

#negociolocal #barbearia #salaodebeleza #marketingdigital #growlift`,
    alt: 'Carrossel ilustrado: um cliente indica a barbearia para um amigo, que não encontra o nome na busca. Três sinais (outro lugar aparece na busca, preços escondidos, agendamento só por ligação), resumo e convite para o diagnóstico grátis pelo link da bio.',
  },
  {
    slug: '18-posta-todo-dia',
    titulo: 'Você posta todo dia e o movimento não muda?',
    temas: ['azul', 'claro', 'claro', 'escuro', 'claro', 'claro', 'azul'],
    slides: [
      () =>
        capa({
          gancho: 'Você posta todo dia… <em>e o movimento não muda?</em>',
          sub: '3 sinais de que o seu post para no "curtir".',
          tamanho: 86,
          cena: `<div style="position:absolute;left:150px;top:80px;display:grid;grid-template-columns:repeat(3,150px);gap:10px;transform:rotate(-3deg)">${['burger', 'fries', 'drink', 'salad', 'burger', 'fries'].map((f) => `<div style="aspect-ratio:1;display:grid;place-items:center;background:#fff4e6;border-radius:14px;position:relative">${food(f, 130)}<span style="position:absolute;right:8px;bottom:6px;font-size:22px">❤️</span></div>`).join('')}</div>
            ${boneco('d7', { x: 680, y: 240, size: 280, shirt: RED, cara: 'triste' })}${balao('Muita curtida, pouco pedido…', { x: 560, y: 130, rot: 3, size: 27 })}`,
        }),
      () =>
        porque({
          frase: 'Curtida não é pedido. <em>O post precisa mostrar o próximo passo.</em>',
          tamanho: 76,
          apoio: 'Quem gostou precisa saber, na hora, onde fica, se entrega e como pede.',
          cena: `${boneco('c20', { x: 250, y: 120, size: 290, shirt: AMBER })}${balao('❤️ Curti!', { x: 230, y: 30, rot: -4 })}<div style="position:absolute;left:600px;top:200px;font-size:34px;font-weight:900;color:${RED}">…e seguiu rolando 👇</div>`,
        }),
      () =>
        sinal({
          n: 1,
          titulo: 'O post <em>não diz o que fazer.</em>',
          texto: 'Foto linda, legenda "bom dia". Sem "peça pelo link da bio" ou "chama no WhatsApp", ele curte e segue.',
          cena: `<div class="card" style="position:absolute;left:150px;top:20px;width:470px;overflow:hidden"><div style="height:330px;display:grid;place-items:center;background:#fff4e6">${food('burger', 260)}</div><div style="padding:18px 24px;font-size:28px"><b>seunegocio</b> Bom dia ☀️</div></div>
            ${boneco('c21', { x: 680, y: 220, size: 270, shirt: '#7c5cff', cara: 'triste' })}${balao('Lindo. E aí?', { x: 690, y: 110, rot: 4 })}`,
        }),
      () =>
        sinal({
          n: 2,
          titulo: 'Quem vê não sabe <em>onde fica nem quando abre.</em>',
          texto: 'Bairro, horário e se entrega: se não está no post nem na bio, vira pergunta. Ou vira desistência.',
          cena: `<div style="position:absolute;left:150px;top:40px;display:grid;gap:16px">${[[ICON.pin, 'Onde fica?'], [ICON.clock, 'Abre hoje?'], [ICON.bike, 'Entrega no meu bairro?']].map(([ic, q]) => `<span class="card" style="display:flex;align-items:center;gap:16px;padding:18px 26px;font-size:32px;font-weight:800">${svgIcon(ic, 40, BLUE, 2.2)}${q}</span>`).join('')}</div>
            ${boneco('c22', { x: 680, y: 220, size: 270, shirt: AMBER, cara: 'bravo' })}`,
        }),
      () =>
        sinal({
          n: 3,
          titulo: 'O caminho até o pedido <em>tem passos demais.</em>',
          texto: 'Post → bio → link → outro link → mensagem → espera. A cada passo, mais gente fica pelo caminho.',
          cena: `<div style="position:absolute;left:110px;top:60px;display:flex;flex-wrap:wrap;gap:12px;width:620px">${['Post', 'Bio', 'Link', 'Outro link', 'Mensagem', 'Espera…'].map((s, i) => `<span class="card" style="padding:14px 22px;font-size:28px;font-weight:800;opacity:${1 - i * 0.12}">${s}${i < 5 ? ' →' : ''}</span>`).join('')}</div>
            ${boneco('c23', { x: 700, y: 220, size: 260, shirt: '#22a06b', cara: 'triste' })}${balao('Cansei 😮‍💨', { x: 710, y: 110, rot: 4 })}`,
        }),
      ({ tema }) =>
        resumo({
          tema,
          titulo: 'Do curtir ao pedido: <em>3 ajustes</em>',
          itens: [
            ['Todo post com um pedido claro:', '"peça pelo link da bio", "chama no WhatsApp".'],
            ['Bairro, horário e entrega', 'na bio e nos destaques.'],
            ['Do post ao pedido', 'com o mínimo de toques possível.'],
          ],
        }),
      () => convite({ texto: 'A gente olha o caminho do seu cliente, do <b>post</b> até o <b>pedido</b> (Instagram, Google e site), e te manda o diagnóstico com uma prévia do seu site.' }),
    ],
    legenda: `Você posta todo dia… e o movimento não muda? ❤️➡️🛒

3 sinais de que o post para no "curtir":
1. O post não diz o que fazer.
2. Quem vê não sabe onde fica nem quando abre.
3. O caminho até o pedido tem passos demais.

Os 3 ajustes estão no slide 6. Salva pra fazer essa semana.

${LEGENDA_FIM}

#restaurante #instagramparanegocios #marketingpararestaurantes #delivery #growlift`,
    alt: 'Carrossel ilustrado: posts de comida com muitas curtidas e poucos pedidos, e três sinais (post sem chamada, sem endereço e horário, caminho longo até o pedido). Resumo com três ajustes e convite para o diagnóstico grátis pelo link da bio.',
  },
  {
    slug: '19-feriado-dia-20',
    titulo: 'Dia 20 é feriado. O Google sabe disso?',
    temas: ['escuro', 'azul', 'claro', 'claro', 'escuro', 'claro', 'azul'],
    slides: [
      () =>
        capa({
          gancho: 'Dia 20 é feriado. <em>O Google sabe disso?</em>',
          sub: '3 sinais de que o seu horário pode enganar alguém na sexta, 20/11.',
          tamanho: 92,
          cena: `${celular(`${busca('hamburgueria aberta agora')}${resultado({ nome: 'Seu Restaurante', nota: '4,6', linha: 'Aberto · Fecha às 23h', cor: '#ffe8cc' })}${resultado({ nome: 'Outro lugar', nota: '4,4', linha: 'Fechado hoje', cor: '#dbeafe' })}`, { x: 400, y: 30, w: 420, h: 600, rot: 3 })}
            ${boneco('f1', { x: 70, y: 270, size: 290, shirt: RED, cara: 'bravo' })}
            ${balao('Dizia aberto! 😤', { x: 60, y: 170, rot: -4 })}`,
        }),
      () =>
        porque({
          frase: 'Quem está com fome <em>confia no Google.</em>',
          apoio: 'Se ele diz aberto e a porta está fechada, o cliente perde a viagem. Se diz fechado e você abriu, ele nem aparece.',
          cena: `<div class="card" style="position:absolute;left:170px;top:50px;width:330px;padding:0;overflow:hidden;text-align:center;transform:rotate(-3deg)">
              <div style="background:${RED};color:#fff;font-size:34px;font-weight:900;letter-spacing:.12em;padding:16px 0">NOVEMBRO</div>
              <div style="font-size:170px;font-weight:900;line-height:1;padding:20px 0 4px">20</div>
              <div style="font-size:30px;font-weight:800;color:#3b4659;padding-bottom:26px">sexta · feriado</div></div>
            ${boneco('f2', { x: 590, y: 110, size: 290, shirt: AMBER, cara: 'triste' })}${balao('Abre ou não abre? 🤔', { x: 540, y: 20, rot: 3 })}`,
        }),
      () =>
        sinal({
          n: 1,
          titulo: 'O horário de feriado <em>nunca foi preenchido.</em>',
          texto: 'O Perfil no Google tem um campo só pra isso: <b>Horário especial</b>. Sem ele, vale o horário de sempre.',
          cena: `<div class="card" style="position:absolute;left:150px;top:30px;width:560px;padding:34px 36px">
              <div style="font-size:32px;font-weight:900">Horário especial</div>
              <div style="font-size:24px;color:#6b7588;margin-top:6px">Feriados e datas diferentes</div>
              <div style="margin-top:26px;border:3px dashed #c9d2e3;border-radius:22px;padding:30px;text-align:center;font-size:28px;font-weight:800;color:#6b7588">Nenhuma data adicionada</div>
              <div style="margin-top:22px;display:inline-flex;align-items:center;gap:10px;padding:14px 22px;border-radius:999px;background:#e2eaff;color:${BLUE};font-size:26px;font-weight:800">+ Adicionar data</div></div>
            ${boneco('f3', { x: 700, y: 230, size: 270, shirt: BLUE, cara: 'triste' })}`,
        }),
      () =>
        sinal({
          n: 2,
          titulo: 'Cada lugar diz <em>um horário.</em>',
          texto: 'Google, Instagram, WhatsApp e site: quando um muda e o outro não, o cliente não sabe em quem acreditar.',
          cena: `${[['Google', 'Aberto · 18h às 23h', 60, -3], ['Bio do Instagram', 'Abrimos às 19h', 380, 2], ['WhatsApp', 'Fechado hoje 😴', 700, -2]]
            .map(([onde, txt, x, r]) => `<div class="card" style="position:absolute;left:${x}px;top:${x === 380 ? 140 : 60}px;width:300px;padding:26px 26px;transform:rotate(${r}deg)">
              <div style="font-size:22px;font-weight:800;color:#6b7588;letter-spacing:.06em;text-transform:uppercase">${onde}</div>
              <div style="font-size:30px;font-weight:900;margin-top:10px;line-height:1.2">${txt}</div>
              <div style="margin-top:14px"><span class="x">✕</span></div></div>`)
            .join('')}
            ${boneco('f4', { x: 400, y: 330, size: 230, shirt: '#22a06b', cara: 'triste' })}`,
        }),
      () =>
        sinal({
          n: 3,
          titulo: 'Vai fechar e <em>ninguém avisou.</em>',
          texto: 'Sem story, sem aviso no WhatsApp, sem nada no perfil. O cliente descobre na porta.',
          cena: `<div style="position:absolute;left:150px;top:30px;width:420px;height:480px;border-radius:24px 24px 0 0;background:#3a2a1f;box-shadow:inset 0 0 0 14px #2a1d15">
              <div style="position:absolute;left:50%;top:120px;transform:translateX(-50%) rotate(-4deg);background:#fff;color:${RED};font-size:52px;font-weight:900;letter-spacing:.08em;padding:18px 34px;border-radius:14px;box-shadow:0 20px 40px -16px rgba(0,0,0,.6)">FECHADO</div></div>
            ${boneco('f5', { x: 640, y: 210, size: 290, shirt: AMBER, cara: 'bravo' })}${balao('Podia ter avisado…', { x: 610, y: 110, rot: 3 })}`,
        }),
      ({ tema }) =>
        resumo({
          tema,
          titulo: 'Antes do dia 20: <em>3 ajustes</em>',
          itens: [
            ['No Google, em Horário especial:', 'marque o dia 20 com o horário do feriado (ou fechado).'],
            ['O mesmo horário em tudo:', 'bio do Instagram, mensagem do WhatsApp e site.'],
            ['Avise na véspera:', 'um story e a mensagem de ausência com o horário do dia.'],
          ],
        }),
      () => convite({ texto: 'A gente confere seu <b>Google</b>, <b>Instagram</b>, <b>WhatsApp</b> e <b>site</b> e te manda o que ajustar, com uma prévia do seu site.' }),
    ],
    legenda: `Dia 20 (sexta) é feriado. O Google sabe disso? 📅

3 sinais de que o seu horário pode enganar alguém no feriado:
1. O horário de feriado nunca foi preenchido.
2. Cada lugar diz um horário.
3. Vai fechar e ninguém avisou.

No Perfil da Empresa no Google existe o campo "Horário especial", feito para feriados. No slide 6 estão os 3 ajustes pra fazer antes do dia 20. Salva!

${LEGENDA_FIM}

#restaurante #googlemeunegocio #feriado #hamburgueria #growlift`,
    alt: 'Carrossel ilustrado sobre o horário de feriado do dia 20 de novembro: celular com busca mostrando "aberto", calendário do dia 20, o campo Horário especial do Google vazio, horários diferentes no Google, Instagram e WhatsApp, e uma porta fechada. Resumo com três ajustes e convite para o diagnóstico grátis pelo link da bio.',
  },
  {
    slug: '20-atendente-ia-clinica',
    titulo: 'Atendente de IA com voz, 24 horas, para clínica odontológica',
    temas: ['escuro', 'claro', 'azul', 'claro', 'escuro', 'claro', 'azul'],
    slides: [
      () =>
        capa({
          gancho: 'Sua clínica fecha às 18h. <em>A dor de dente, não.</em>',
          sub: 'Como uma atendente de IA, com voz, pode cuidar do WhatsApp da clínica 24 horas.',
          tamanho: 96,
          cena: `${celular(conversa([['out', audioMsg('0:12'), '23:12'], ['out', 'Tem horário essa semana? 😣', '23:12']], { topo: 'Clínica perto de casa' }), { x: 420, y: 40, w: 420, h: 600, rot: 3 })}
            <span style="position:absolute;right:250px;bottom:-6px;font-size:22px;font-weight:800;letter-spacing:.04em;padding:8px 16px;border-radius:999px;background:rgba(11,18,32,.75);color:#fff">Exemplo ilustrativo</span>
            ${boneco('k1', { x: 80, y: 280, size: 290, shirt: '#e85d75', cara: 'triste' })}
            ${balao('Ninguém responde… 🦷', { x: 60, y: 170, rot: -4 })}`,
        }),
      () =>
        porque({
          frase: 'Quem tem dor <em>não espera a manhã.</em>',
          apoio: 'A mensagem chega à noite, no fim de semana, na hora do almoço. Se ninguém responde, ela procura a próxima clínica da lista.',
          cena: `${celular(busca('dentista perto de mim') + resultado({ nome: 'Clínica A', nota: '', linha: 'Fechado · abre às 8h', cor: '#e8eefc' }) + resultado({ nome: 'Clínica B', nota: '', linha: 'Respondeu agora', cor: '#dcfce7' }), { x: 300, y: 40, w: 440, h: 460 })}
            ${boneco('k2', { x: 740, y: 230, size: 260, shirt: '#e85d75' })}`,
        }),
      () =>
        passo({
          n: 1,
          titulo: 'Ouve o áudio e <em>responde com voz.</em>',
          texto: 'A paciente manda áudio. A atendente entende e responde em áudio ou texto, com o nome e o jeito da sua clínica.',
          cena: `${celular(conversa([['out', audioMsg('0:12'), '23:12'], ['in', audioMsg('0:09', '#2b3a55'), '23:12'], ['in', 'Oi! Sinto muito pela dor. Tenho quinta às 9h, posso marcar?', '23:12']], { topo: 'Clínica · atendente' }), { x: 140, y: 10, w: 480, h: 540, rot: -2 })}
            <span style="position:absolute;left:110px;bottom:24px;font-size:22px;font-weight:800;letter-spacing:.04em;padding:8px 16px;border-radius:999px;background:rgba(11,18,32,.75);color:#fff">Exemplo ilustrativo</span>
            ${boneco('k3', { x: 680, y: 220, size: 270, shirt: '#e85d75', cara: 'feliz' })}`,
        }),
      () =>
        passo({
          n: 2,
          titulo: 'Olha a agenda e <em>marca o horário.</em>',
          texto: 'Mostra os horários livres, a paciente escolhe e já fica marcado na agenda da clínica.',
          cena: `${agendaCard()}${boneco('k4', { x: 760, y: 250, size: 250, shirt: BLUE, cara: 'feliz' })}`,
        }),
      () =>
        passo({
          n: 3,
          titulo: 'Lembra um dia antes, <em>pra ela não esquecer.</em>',
          texto: 'Mensagem de confirmação só pra quem marcou. Se precisar remarcar, ela resolve ali mesmo.',
          cena: `${celular(conversa([['in', 'Oi, Bia! Lembrete: amanhã, quinta, às 9h, você tem consulta. Confirma?', 'qua 18:00'], ['out', 'Confirmo! 🙌', 'qua 18:02']], { topo: 'Clínica · atendente' }), { x: 140, y: 10, w: 480, h: 540, rot: 2 })}
            <span style="position:absolute;left:110px;bottom:24px;font-size:22px;font-weight:800;letter-spacing:.04em;padding:8px 16px;border-radius:999px;background:rgba(11,18,32,.75);color:#fff">Exemplo ilustrativo</span>
            ${boneco('k5', { x: 680, y: 220, size: 270, shirt: '#e85d75', cara: 'feliz' })}`,
        }),
      ({ tema }) =>
        `<span class="chip">Com limites claros</span>
         <h2 class="h" style="font-size:84px;margin-top:30px">O que ela pode fazer <em>(e o que não faz)</em></h2>
         <div style="margin-top:56px">${lista(
           [
             ['Responde só com o que é da sua clínica:', 'horários, serviços, convênios e endereço.'],
             ['Chama alguém da equipe', 'quando não sabe a resposta ou quando parece urgência. Não dá diagnóstico.'],
             ['Roda no WhatsApp oficial da clínica,', 'com cuidado com os dados das pacientes (LGPD).'],
           ],
           tema,
         )}</div>`,
      () =>
        `<h2 class="h" style="font-size:96px;margin-top:10px">Quer ver como fica <em>na sua clínica?</em></h2>
         <p class="p" style="margin-top:30px;max-width:900px">A gente monta a atendente com as informações da sua clínica: horários, serviços e o jeito de falar de vocês.</p>
         <div style="margin-top:50px;display:flex;align-items:center;gap:22px">
           <span style="font-size:44px;font-weight:900;color:#fff">Comenta</span>
           <span style="display:inline-flex;align-items:center;height:110px;padding:0 46px;border-radius:999px;background:#fff;color:${BLUE};font-size:60px;font-weight:900;box-shadow:0 30px 60px -24px rgba(0,0,0,.45)">CLÍNICA</span></div>
         <p class="p" style="margin-top:26px;font-size:32px">que a gente te explica no direct.</p>
         <div style="position:absolute;right:-30px;bottom:-30px;height:420px;width:520px">${boneco('kc', { x: 220, y: 40, size: 300, shirt: '#ffffff', cara: 'feliz' })}${balao('Oi! Me conta da sua clínica 👋', { x: -200, y: 84, rot: -4, size: 28 })}</div>`,
    ],
    legenda: `Sua clínica fecha às 18h. A dor de dente, não. 🦷

Quem tem dor manda mensagem à noite, no fim de semana, na hora do almoço. Se ninguém responde, procura a próxima clínica da lista.

Uma atendente de inteligência artificial no WhatsApp da clínica pode:
1. Ouvir o áudio da paciente e responder com voz ou texto, a qualquer hora.
2. Olhar a agenda e marcar o horário.
3. Mandar o lembrete um dia antes, pra paciente confirmar.

Ela responde só com as informações da sua clínica, não dá diagnóstico e chama alguém da equipe quando precisa.

Quer ver como fica na sua clínica? Comenta CLÍNICA que a gente te explica no direct.

(Nomes, conversas e agenda dos slides são exemplos ilustrativos.)

#clinicaodontologica #dentista #consultorioodontologico #atendimento #inteligenciaartificial`,
    alt: 'Carrossel ilustrado para donos de clínica odontológica: uma paciente com dor de dente manda áudio à noite e ninguém responde; depois, três passos de uma atendente de IA no WhatsApp da clínica (ouve o áudio e responde com voz, marca na agenda, lembra um dia antes), os limites dela e o convite "Comenta CLÍNICA".',
  },
];

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(CARROSSEIS.map((c) => ({ slug: c.slug, titulo: c.titulo, legenda: c.legenda, alt: c.alt, count: c.slides.length }))));
  process.exit(0);
}
const ONLY = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const SCALE = Number(process.env.ESCALA || 2);
const browser = await chromium.launch({ executablePath: CHROME });
const pg = await (await browser.newContext({ deviceScaleFactor: SCALE })).newPage();
pg.on('pageerror', (e) => console.error('erro na página:', e.message));
let count = 0;
for (const c of CARROSSEIS) {
  if (ONLY.length && !ONLY.some((o) => c.slug.startsWith(o))) continue;
  const total = c.slides.length;
  for (let i = 0; i < total; i++) {
    const tema = c.temas[i];
    const html = slide(c.slides[i]({ tema }), { n: i + 1, total, tema });
    const file = `${OUT}/${c.slug}/${String(i + 1).padStart(2, '0')}.png`;
    const htmlPath = path.join(HERE, 'html', file.replace(/\.png$/, '.html'));
    await fs.mkdir(path.dirname(htmlPath), { recursive: true });
    await fs.writeFile(htmlPath, html);
    await pg.setViewportSize({ width: 1080, height: 1350 });
    await pg.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });
    await pg.evaluate(() => document.fonts.ready);
    // Quality check: nothing may spill out of the slide.
    const over = await pg.evaluate(() => [...document.querySelectorAll('h1,h2,p')].filter((el) => el.getBoundingClientRect().right > 1080 || el.getBoundingClientRect().bottom > 1350).length);
    if (over) console.warn(`${file}: ${over} texto(s) saindo da arte`);
    const out = path.join(ROOT, file);
    await fs.mkdir(path.dirname(out), { recursive: true });
    await pg.screenshot({ path: out });
    count++;
  }
}
await browser.close();
console.log(`${count} slides gerados`);
