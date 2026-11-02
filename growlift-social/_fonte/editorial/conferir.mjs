// Conferência automática dos carrosséis editoriais.
// Duas partes: (1) regras de conteúdo e de ritmo, olhando o roteiro (JSON); (2) regras de tela, rodando dentro da
// página renderizada (texto cortado, fora da área segura, sobreposto, pequeno demais, contraste, alinhamento).
// Cada achado é { nivel: 'erro' | 'aviso', slide, regra, msg }. Erro trava o render; aviso aparece no relatório.
import crypto from 'node:crypto';
import { palavras } from './nucleo.mjs';
import { VISUAIS } from './componentes.mjs';

const PROIBIDAS = [
  /\bgarantid[oa]s?\b/i,
  /\bgarantimos\b/i,
  /\bl[ií]der\b/i,
  /\bo melhor\b/i,
  /\bmelhor d[oa]s?\b/i,
  /\bn[ºo°]\s?1\b/i,
  /\bnúmero 1\b/i,
  /mensagem autom[aá]tica/i,
  /\brob[ôo]\b/i,
  /\bsorteio\b/i,
  /\bfature?\b.*\bmais\b/i,
  /\bmais clientes\b/i,
  /\bprimeira página\b/i,
  /\btopo do google\b/i,
];

// Número com cara de estatística ou preço: precisa de fonte no slide.
const ESTATISTICA = /(\d+[.,]?\d*\s?%|R\$\s?\d|\d+\s?(mil|milhões|bilhões)\b|\d+\s?vezes mais|\d+x mais)/i;

/** Todos os textos visíveis de um bloco (recursivo), para as regras de conteúdo. */
export function textos(b) {
  const out = [];
  const add = (v) => {
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) v.forEach(add);
    else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => !['tipo', 'icone', 'tom', 'arranjo', 'marca', 'lado', 'fato', 'marcador', 'direcao', 'alinhar', 'justificar', 'alinharItens'].includes(k) && add(x));
  };
  add(b);
  return out;
}

const visuaisDe = (blocos) => blocos.flatMap((b) => (b.tipo === 'grupo' ? visuaisDe(b.blocos) : VISUAIS.has(b.tipo) ? [b.tipo === 'celular' ? `celular:${b.tela.tipo}` : b.tipo] : []));
const tiposDe = (blocos) => blocos.flatMap((b) => (b.tipo === 'grupo' ? [`[${b.arranjo ?? 'pilha'}`, ...tiposDe(b.blocos), ']'] : [b.tipo]));

/** Impressão digital do roteiro (para travar o que já foi aprovado). */
export const hashRoteiro = (r) => crypto.createHash('sha256').update(JSON.stringify({ slides: r.slides, legenda: r.legenda, alt: r.alt })).digest('hex').slice(0, 16);

export function conferirRoteiro(r, { fatos, preferencias }) {
  const achados = [];
  const add = (nivel, slide, regra, msg) => achados.push({ nivel, slide, regra, msg });
  const ids = new Set(fatos.fatos.map((f) => f.id));
  const total = r.slides.length;

  if (r.status === 'aprovado') {
    if (!r.aprovado?.hash) add('erro', 0, 'trava', 'Roteiro marcado como aprovado sem a impressão digital (rode: node aprovar.mjs <slug>).');
    else if (r.aprovado.hash !== hashRoteiro(r)) add('erro', 0, 'trava', 'Roteiro aprovado foi alterado depois da aprovação. Volte o texto ou peça nova aprovação.');
  }
  if (total < 5 || total > 10) add('aviso', 0, 'tamanho', `${total} slides: o ideal é de 6 a 10.`);
  if (!r.legenda) add('erro', 0, 'legenda', 'Falta a legenda.');
  if (!r.alt) add('erro', 0, 'alt', 'Falta o texto alternativo da capa.');
  const tags = (r.legenda ?? '').match(/#[\p{L}\p{N}_]+/gu) ?? [];
  if (tags.length > 5) add('erro', 0, 'hashtags', `${tags.length} hashtags: o Instagram aceita no máximo 5.`);
  if (r.palavra && !(r.legenda ?? '').includes(r.palavra)) add('aviso', 0, 'legenda', `A legenda não cita a palavra do direct (${r.palavra}).`);
  for (const re of PROIBIDAS) if (re.test(r.legenda ?? '')) add('erro', 0, 'proibida', `Legenda com expressão proibida: ${re}`);

  const assinaturas = [];
  r.slides.forEach((s, i) => {
    const n = i + 1;
    const txt = s.blocos.flatMap(textos);
    const visiveis = txt.join(' ');
    const qtd = palavras(visiveis);
    if (!s.funcao) add('erro', n, 'funcao', 'Slide sem função narrativa (campo "funcao").');
    if (qtd < 3) add('erro', n, 'vazio', 'Slide sem texto útil (slide só de marca não vale).');
    if (qtd > 60) add('erro', n, 'palavras', `${qtd} palavras: passa de 60, divida em dois slides.`);
    else if (qtd > 45) add('aviso', n, 'palavras', `${qtd} palavras: acima de 45 fica pesado no celular.`);
    for (const re of PROIBIDAS) if (re.test(visiveis)) add('erro', n, 'proibida', `Expressão proibida: ${re}`);
    if (ESTATISTICA.test(visiveis) && !s.fonte) add('erro', n, 'numero-sem-fonte', `Número com cara de estatística ou preço sem fonte: "${visiveis.match(ESTATISTICA)[0]}".`);
    if (/growlift/i.test(visiveis) && n !== total) add('aviso', n, 'marca', 'A Growlift aparece no meio do carrossel: deixe a marca para o último slide.');
    const ctas = s.blocos.filter((b) => b.tipo === 'cta');
    for (const c of ctas) {
      if (n !== total) add('aviso', n, 'cta', 'Pedido (cta) fora do último slide.');
      if (!c.fato || !ids.has(c.fato)) add('erro', n, 'fato', `O pedido final precisa apontar para um fato real de fatos.json (veio: ${c.fato ?? 'nada'}).`);
    }
    const vis = visuaisDe(s.blocos);
    const assinatura = `${s.arranjo ?? 'pilha'}:${vis.join('+') || 'só-texto'}`;
    assinaturas.push(assinatura);
    if (!vis.length) add('aviso', n, 'so-texto', 'Slide só com texto: use um diagrama, objeto, tela ou comparação.');
    if (i > 0 && assinatura === assinaturas[i - 1]) add('erro', n, 'repeticao', `Mesma composição do slide anterior (${assinatura}).`);
    if (i === 0) {
      if (!vis.length) add('erro', 1, 'capa', 'A capa precisa de um elemento visual além do título.');
      const tit = s.blocos.find((b) => b.tipo === 'titulo');
      if (!tit) add('erro', 1, 'capa', 'A capa precisa de um título.');
      else {
        const pc = palavras(tit.texto);
        if (pc > 12) add('aviso', 1, 'capa', `Título da capa com ${pc} palavras: até 12 lê melhor.`);
        if (/\b(dicas?|tudo sobre|guia completo|você sabia)\b/i.test(tit.texto)) add('aviso', 1, 'capa', 'Gancho genérico ("dicas", "tudo sobre"...): seja específico.');
      }
    }
  });
  // Ritmo do carrossel inteiro.
  const cont = assinaturas.reduce((m, a) => m.set(a, (m.get(a) ?? 0) + 1), new Map());
  for (const [a, q] of cont) if (q > 2) add('aviso', 0, 'repeticao', `Composição "${a}" usada ${q} vezes.`);
  // Ritmo: a mesma estrutura de primeiro nível (arranjo + ordem dos blocos) três vezes seguidas cansa.
  const arr = r.slides.map((s) => `${s.arranjo ?? 'pilha'}(${s.blocos.map((b) => b.tipo).join(',')})`);
  for (let i = 2; i < arr.length; i++) if (arr[i] === arr[i - 1] && arr[i] === arr[i - 2]) add('aviso', i + 1, 'ritmo', `Três slides seguidos com a mesma estrutura ${arr[i]} (${i - 1} a ${i + 1}).`);
  const tipos = new Set(r.slides.flatMap((s) => visuaisDe(s.blocos)));
  if (tipos.size < 4) add('aviso', 0, 'variedade', `Só ${tipos.size} tipos de elemento visual no carrossel: varie mais.`);

  // Preferências registradas pelo usuário (só valem para roteiros ainda não aprovados).
  if (r.status !== 'aprovado') {
    for (const p of preferencias.regras ?? []) {
      const v = p.verificar;
      if (!v) continue;
      const capa = r.slides[0]?.blocos.find((b) => b.tipo === 'titulo')?.texto ?? '';
      if (v.tipo === 'palavra-evitar') {
        const re = new RegExp(`\\b${v.valor}\\b`, 'i');
        r.slides.forEach((s, i) => re.test(s.blocos.flatMap(textos).join(' ')) && add('aviso', i + 1, 'preferencia', `Preferência ${p.id}: evitar "${v.valor}" (${p.nota}).`));
      }
      if (v.tipo === 'max-palavras-capa' && palavras(capa) > v.valor) add('aviso', 1, 'preferencia', `Preferência ${p.id}: capa com até ${v.valor} palavras (${p.nota}).`);
      if (v.tipo === 'componente-evitar') r.slides.forEach((s, i) => tiposDe(s.blocos).includes(v.valor) && add('aviso', i + 1, 'preferencia', `Preferência ${p.id}: evitar o componente "${v.valor}" (${p.nota}).`));
      if (v.tipo === 'capa-com' && !tiposDe(r.slides[0].blocos).includes(v.valor)) add('aviso', 1, 'preferencia', `Preferência ${p.id}: capa com "${v.valor}" (${p.nota}).`);
    }
  }
  return achados;
}

/**
 * Roda dentro da página (page.evaluate). Devolve a lista de achados de tela.
 * Limites: área útil (#area); texto mínimo 26 px fora das telas de celular (20 px dentro); contraste 4,5:1
 * (3:1 para texto grande); textos não podem se sobrepor nem ser cortados por quem os contém.
 */
export function conferirTela() {
  const out = [];
  const add = (nivel, regra, msg) => out.push({ nivel, regra, msg });
  const area = document.getElementById('area');
  const A = area.getBoundingClientRect();
  if (area.scrollHeight > area.clientHeight + 1) add('erro', 'nao-cabe', `O conteúdo passa da área útil em ${area.scrollHeight - area.clientHeight}px.`);

  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r, g, b, a };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const mix = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  const fundoDe = (el) => {
    const camadas = [];
    for (let e = el; e; e = e.parentElement) {
      const c = parse(getComputedStyle(e).backgroundColor);
      if (c && c.a > 0) {
        camadas.push(c);
        if (c.a >= 0.99) break;
      }
    }
    let base = parse(getComputedStyle(document.body).backgroundColor) ?? { r: 6, g: 8, b: 13, a: 1 };
    for (let i = camadas.length - 1; i >= 0; i--) base = mix(camadas[i], base);
    return base;
  };
  const opac = (el) => {
    let o = 1;
    for (let e = el; e; e = e.parentElement) o *= Number(getComputedStyle(e).opacity);
    return o;
  };
  const nome = (el) => (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);

  const txt = [...area.querySelectorAll('[data-txt]')].filter((el) => el.textContent.trim());
  const rects = [];
  for (const el of txt) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const tam = parseFloat(cs.fontSize);
    const naTela = !!el.closest('[data-tela]');
    const o = opac(el);
    if (o < 0.6) continue; // texto apagado de propósito (item fora de foco)
    // Área segura.
    if (r.left < A.left - 30 || r.right > A.right + 30 || r.top < A.top - 12 || r.bottom > A.bottom + 12) add('erro', 'fora-da-area', `"${nome(el)}" sai da área segura.`);
    // Cortado por quem o contém (overflow hidden).
    for (let p = el.parentElement; p && p !== area; p = p.parentElement) {
      const pc = getComputedStyle(p);
      if (pc.overflow !== 'visible' || pc.overflowY !== 'visible') {
        const pr = p.getBoundingClientRect();
        if (r.bottom > pr.bottom + 1 || r.right > pr.right + 1 || r.top < pr.top - 1) add('erro', 'cortado', `"${nome(el)}" está cortado pela caixa que o contém.`);
        break;
      }
    }
    if (el.scrollWidth > el.clientWidth + 2 && cs.overflow !== 'visible') add('erro', 'cortado', `"${nome(el)}" não cabe na largura.`);
    // Tamanho mínimo.
    const min = naTela ? 20 : 26;
    if (tam < min) add('erro', 'letra-pequena', `"${nome(el)}" com ${tam}px (mínimo ${min}px${naTela ? ' na tela do celular' : ''}).`);
    // Contraste.
    const cor = parse(cs.color);
    if (cor && !cs.webkitTextFillColor?.includes('rgba(0, 0, 0, 0)')) {
      const bg = fundoDe(el);
      const fg = cor.a < 1 ? mix(cor, bg) : cor;
      const L1 = lum(fg), L2 = lum(bg);
      const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      const grande = tam >= 40 || (tam >= 30 && Number(cs.fontWeight) >= 700);
      const minimo = grande ? 3 : 4.5;
      if (ratio < minimo) add('erro', 'contraste', `"${nome(el)}" com contraste ${ratio.toFixed(2)}:1 (mínimo ${minimo}:1).`);
    }
    rects.push({ el, r });
  }
  // Sobreposição entre textos (que não estão um dentro do outro).
  for (let i = 0; i < rects.length; i++)
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i], b = rects[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      // Dentro do mesmo objeto inclinado (cardápio, celular, comanda) o fluxo do texto já impede encostar;
      // a caixa de um texto inclinado é maior que o texto e daria falso alarme.
      const girado = (el) => { for (let e = el.parentElement; e && e !== area; e = e.parentElement) if (getComputedStyle(e).transform !== 'none') return e; return null; };
      const ga = girado(a.el);
      if (ga && ga === girado(b.el)) continue;
      const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
      const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
      if (w > 6 && h > 6) add('erro', 'sobreposto', `"${nome(a.el)}" encosta em "${nome(b.el)}".`);
    }
  // Alinhamento: blocos de texto do primeiro nível começam na margem.
  const raiz = area.firstElementChild;
  if (raiz && !raiz.classList.contains('centro') && !raiz.classList.contains('lado')) {
    for (const b of raiz.children) {
      if (!['titulo', 'texto', 'rotulo', 'selo'].includes(b.dataset.bloco)) continue;
      const alvo = b.querySelector('[data-txt]') ?? b;
      const r = alvo.getBoundingClientRect();
      if (getComputedStyle(alvo).textAlign !== 'center' && Math.abs(r.left - A.left) > 3) add('aviso', 'alinhamento', `"${nome(alvo)}" não começa na margem (${Math.round(r.left - A.left)}px).`);
    }
  }
  // Faixa vazia: projeta tudo o que se vê (texto, cartões, telas) no eixo vertical e mede o maior buraco.
  const vis = [...area.querySelectorAll('*')].filter((e) => {
    const cs = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || Number(cs.opacity) === 0) return false;
    const temFundo = (parse(cs.backgroundColor)?.a ?? 0) > 0.03 || cs.backgroundImage !== 'none' || parseFloat(cs.borderTopWidth) > 0;
    const temTexto = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    return temFundo || temTexto || e.tagName === 'svg';
  }).map((e) => e.getBoundingClientRect()).filter((r) => r.bottom > A.top && r.top < A.bottom).sort((a, b) => a.top - b.top);
  let fim = A.top, maior = 0;
  for (const r of vis) {
    if (r.top > fim) maior = Math.max(maior, r.top - fim);
    fim = Math.max(fim, r.bottom);
  }
  maior = Math.max(maior, A.bottom - fim);
  if (maior > 200) add('aviso', 'faixa-vazia', `Faixa vazia de ${Math.round(maior)}px na área útil (máximo 200px).`);
  return out;
}

/** dHash de 64 bits de uma imagem (para achar slides quase iguais). */
export async function dhash(sharp, file) {
  const px = await sharp(file).grayscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer();
  let bits = '';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += px[y * 9 + x] > px[y * 9 + x + 1] ? '1' : '0';
  return bits;
}
export const distancia = (a, b) => [...a].reduce((s, c, i) => s + (c !== b[i] ? 1 : 0), 0);
