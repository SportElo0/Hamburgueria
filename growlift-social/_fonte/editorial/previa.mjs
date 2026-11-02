// Prévia para aprovar: folhas de conferência (PNG), comparativo antigo × novo e uma página com todos os slides
// (rola no celular, com legenda, função de cada slide e o resultado da conferência).
//   node previa.mjs            → saida/folhas/*.png e saida/previa/index.html (+ img/*.webp)
// Rode depois do render.mjs. Nada daqui vai para o painel nem para o Instagram.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SAIDA = path.join(HERE, 'saida');
const ANTIGOS = path.resolve(HERE, '../../09-carrosseis');
const ler = async (f) => JSON.parse(await fs.readFile(f, 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const limpo = (s) => String(s).replace(/\*\*/g, '');

const rel = await ler(path.join(SAIDA, 'relatorio.json'));
const roteiros = await Promise.all(rel.carrosseis.map((c) => ler(path.join(HERE, 'roteiros', `${c.slug}.json`))));
const pngs = (slug) => roteiros.find((r) => r.slug === slug).slides.map((_, i) => path.join(SAIDA, slug, `${String(i + 1).padStart(2, '0')}.png`));

// --- Folhas de conferência ---------------------------------------------------------------------------
await fs.mkdir(path.join(SAIDA, 'folhas'), { recursive: true });
async function folha(out, files, cols = 5, tw = 360, rotulos = null) {
  const th = Math.round((tw * 1350) / 1080);
  const gap = 18, topo = rotulos ? 54 : 0;
  const rows = Math.ceil(files.length / cols);
  const thumbs = await Promise.all(files.map((f) => sharp(f).resize(tw, th).toBuffer()));
  const comp = thumbs.map((b, i) => ({ input: b, left: gap + (i % cols) * (tw + gap), top: topo + gap + Math.floor(i / cols) * (th + gap + topo) }));
  if (rotulos) {
    rotulos.forEach((t, r) => {
      const svg = Buffer.from(`<svg width="${cols * (tw + gap)}" height="${topo}"><text x="${gap}" y="${topo - 14}" font-family="Inter, DejaVu Sans, sans-serif" font-size="26" font-weight="700" fill="#e8eefa">${esc(t)}</text></svg>`);
      comp.push({ input: svg, left: 0, top: r * (th + gap + topo) });
    });
  }
  await sharp({ create: { width: cols * tw + (cols + 1) * gap, height: rows * (th + gap + topo) + gap, channels: 3, background: '#1b1f27' } }).composite(comp).png().toFile(out);
  return out;
}
for (const r of roteiros) await folha(path.join(SAIDA, 'folhas', `${r.slug}.png`), pngs(r.slug));

// Comparativo: os 5 primeiros slides de um carrossel antigo × os 5 primeiros de cada novo.
const antigo = (slug) => Array.from({ length: 5 }, (_, i) => path.join(ANTIGOS, slug, `${String(i + 1).padStart(2, '0')}.png`));
const comparativo = [
  ['Gerador antigo · "O que ele confere antes de ir" (slides 1 a 5)', antigo('01-antes-de-ir')],
  ['Gerador antigo · "7 perguntas antes de contratar" (slides 1 a 5)', antigo('07-antes-de-contratar')],
  ...roteiros.map((r) => [`Gerador novo · ${limpo(r.slides[0].blocos.find((b) => b.tipo === "titulo")?.texto ?? r.slug)} (slides 1 a 5)`, pngs(r.slug).slice(0, 5)]),
];
await folha(path.join(SAIDA, 'folhas', 'comparativo.png'), comparativo.flatMap(([, f]) => f), 5, 300, comparativo.map(([t]) => t));

// --- Página de prévia ----------------------------------------------------------------------------------
const PV = path.join(SAIDA, 'previa');
await fs.rm(PV, { recursive: true, force: true });
await fs.mkdir(path.join(PV, 'img'), { recursive: true });
const webp = async (src, nome, w = 1080) => {
  await sharp(src).resize(w).webp({ quality: 82 }).toFile(path.join(PV, 'img', nome));
  return `img/${nome}`;
};

const blocosCarrossel = [];
for (const r of roteiros) {
  const c = rel.carrosseis.find((x) => x.slug === r.slug);
  const imgs = [];
  for (const [i, f] of pngs(r.slug).entries()) imgs.push(await webp(f, `${r.slug}-${String(i + 1).padStart(2, '0')}.webp`));
  const capa = limpo(r.slides[0].blocos.find((b) => b.tipo === 'titulo')?.texto ?? '');
  const achados = c.achados.filter((a) => a.nivel === 'aviso');
  blocosCarrossel.push(`
  <section class="car" id="${esc(r.slug)}">
    <header class="car-h">
      <p class="eyebrow">${esc(r.serie)} · ${r.slides.length} slides · comenta ${esc(r.palavra)}</p>
      <h2>${esc(capa)}</h2>
      <p class="estado"><span class="pill ${r.status === 'aprovado' ? 'ok' : ''}">${r.status === 'aprovado' ? 'Aprovado' : 'Rascunho, para aprovar'}</span>
      <span class="pill ${c.erros ? 'bad' : 'ok'}">${c.erros ? `${c.erros} erro(s) na conferência` : 'Conferência: 0 erros'}</span>
      ${achados.length ? `<span class="pill warn">${achados.length} aviso(s)</span>` : ''}</p>
    </header>
    <div class="trilho" tabindex="0" aria-label="Slides de ${esc(capa)}">
      ${imgs.map((src, i) => `<figure><img src="${src}" width="1080" height="1350" alt="Slide ${i + 1} de ${r.slides.length}" loading="${i < 2 ? 'eager' : 'lazy'}"><figcaption><b>${i + 1}</b> ${esc(r.slides[i].funcao)}</figcaption></figure>`).join('')}
    </div>
    <div class="detalhes">
      <details open><summary>Roteiro slide a slide</summary>
        <ol class="roteiro">${r.slides.map((s) => `<li><span class="fn">${esc(s.funcao)}</span> ${esc(limpo(s.blocos.flatMap(function t(b) { return b.tipo === 'grupo' ? b.blocos.flatMap(t) : b.tipo === 'titulo' ? [b.texto] : []; }).join(' ')))}</li>`).join('')}</ol>
      </details>
      <details><summary>Legenda e texto alternativo</summary>
        <div class="copiar"><pre id="leg-${esc(r.slug)}">${esc(r.legenda)}</pre><button type="button" data-copiar="leg-${esc(r.slug)}">Copiar legenda</button></div>
        <p class="alt"><b>Texto alternativo da capa:</b> ${esc(r.alt)}</p>
      </details>
      <details${achados.length ? '' : ''}><summary>Conferência automática</summary>
        ${achados.length ? `<ul class="avisos">${achados.map((a) => `<li><b>Slide ${a.slide || '–'}</b> · ${esc(a.msg)}</li>`).join('')}</ul>` : '<p>Nenhum aviso.</p>'}
        <p class="nota">Erros travam o carrossel; avisos são para decidir. O relatório completo fica em <code>saida/relatorio.json</code>.</p>
      </details>
      <div class="fb">
        <label for="fb-${esc(r.slug)}">Seu feedback sobre este carrossel</label>
        <textarea id="fb-${esc(r.slug)}" rows="3" placeholder="Ex.: capa ótima; slide 4 com muito texto; gostei do slide para imprimir"></textarea>
        <button type="button" data-fb="${esc(r.slug)}">Copiar para mandar no chat</button>
      </div>
    </div>
  </section>`);
}
const cmp = await webp(path.join(SAIDA, 'folhas', 'comparativo.png'), 'comparativo.webp', 1600);

const html = `<title>Prévia dos carrosséis Growlift</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap">
<style>
/* Mesa de aprovação: fundo escuro da marca, slides em trilho com rolagem lateral, detalhes recolhíveis. */
:root{--bg:#06080d;--surface:#0f1520;--line:rgba(255,255,255,.1);--fg:#f3f5f9;--soft:#c6cede;--muted:#a9b3c7;--accent:#0865fe;--accent-2:#4d8dff;--ok:#22c55e;--warn:#ffc94d;--bad:#ff6b5b;--display:Inter,ui-sans-serif,system-ui,sans-serif;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 var(--display);-webkit-font-smoothing:antialiased}
.wrap{max-width:1180px;margin:0 auto;padding-block:40px 80px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.topo h1{font-size:clamp(30px,5vw,48px);line-height:1.05;letter-spacing:-.03em;margin:8px 0 12px;text-wrap:balance}
.eyebrow{font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--accent-2);margin:0}
.lead{color:var(--soft);max-width:68ch;margin:0}
.indice{display:flex;flex-wrap:wrap;gap:10px;margin:22px 0 0;padding:0;list-style:none}
.indice a{display:inline-block;padding:10px 16px;border-radius:999px;border:1px solid var(--line);color:var(--fg);text-decoration:none;font-weight:600;font-size:15px}
.indice a:hover,.indice a:focus-visible{border-color:var(--accent-2);outline:none}
.car{margin-top:56px;padding-top:32px;border-top:1px solid var(--line)}
.car-h h2{font-size:clamp(24px,3.6vw,36px);line-height:1.12;letter-spacing:-.025em;margin:8px 0 12px;text-wrap:balance}
.estado{display:flex;flex-wrap:wrap;gap:8px;margin:0}
.pill{font-size:13px;font-weight:700;padding:5px 12px;border-radius:999px;background:rgba(8,101,254,.18);color:#cfe0ff}
.pill.ok{background:rgba(34,197,94,.16);color:#9be7b4}.pill.warn{background:rgba(255,201,77,.14);color:#ffe2a0}.pill.bad{background:rgba(255,107,91,.16);color:#ffb3a8}
.trilho{display:grid;grid-auto-flow:column;grid-auto-columns:min(78vw,340px);gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;padding:22px 2px 14px;margin-top:6px;overscroll-behavior-x:contain}
.trilho:focus-visible{outline:2px solid var(--accent-2);outline-offset:4px;border-radius:12px}
.trilho figure{margin:0;scroll-snap-align:start}
.trilho img{display:block;width:100%;height:auto;aspect-ratio:1080/1350;border-radius:14px;background:#0b0f17;box-shadow:0 20px 40px -24px rgba(0,0,0,.9)}
.trilho figcaption{font-size:14px;color:var(--muted);margin-top:8px}
.trilho figcaption b{color:var(--fg);margin-right:4px}
.detalhes{display:grid;gap:10px;margin-top:8px}
details{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px 18px}
summary{cursor:pointer;font-weight:700}
.roteiro{margin:12px 0 0;padding-left:22px;display:grid;gap:8px;color:var(--soft)}
.fn{display:inline-block;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--accent-2);margin-right:6px}
.copiar{position:relative;margin-top:12px}
pre{white-space:pre-wrap;overflow-wrap:anywhere;font:15px/1.55 var(--display);background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:14px;margin:0;color:var(--soft)}
button{font:600 14px var(--display);color:#fff;background:var(--accent);border:0;border-radius:10px;padding:10px 16px;cursor:pointer;min-height:44px;margin-top:10px}
button:hover{background:#0652d1}button:focus-visible{outline:2px solid #fff;outline-offset:2px}
.alt,.nota{color:var(--muted);font-size:14px}
.avisos{margin:12px 0 0;padding-left:18px;color:var(--soft);display:grid;gap:6px}
.fb{display:grid;gap:6px;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px 18px}
.fb label{font-weight:700}
textarea{width:100%;font:15px/1.5 var(--display);color:var(--fg);background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:12px;resize:vertical}
textarea:focus-visible{outline:2px solid var(--accent-2)}
.cmp img{width:100%;height:auto;border-radius:12px;margin-top:18px}
.cmp-scroll{overflow-x:auto}
.cmp-scroll img{min-width:720px}
code{font-size:.9em;color:var(--soft)}
@media (prefers-reduced-motion:reduce){.trilho{scroll-behavior:auto}}
</style>
<div class="wrap">
  <header class="topo">
    <p class="eyebrow">Growlift · Instagram · fase 1</p>
    <h1>Três carrosséis novos para aprovar</h1>
    <p class="lead">Arraste cada fileira para ver todos os slides. Abaixo de cada carrossel estão o roteiro, a legenda e o que a conferência automática encontrou. Nada daqui foi publicado nem entrou na Agenda.</p>
    <ul class="indice">${roteiros.map((r) => `<li><a href="#${esc(r.slug)}">${esc(r.serie)}</a></li>`).join('')}<li><a href="#comparativo">Antigo × novo</a></li></ul>
  </header>
  ${blocosCarrossel.join('')}
  <section class="car cmp" id="comparativo">
    <p class="eyebrow">Antes e depois</p>
    <h2>Gerador antigo × gerador novo</h2>
    <p class="lead">As duas primeiras fileiras são carrosséis atuais; as três de baixo, os novos. Mesmas cores, mesma fonte, menos marca repetida e mais variedade de composição.</p>
    <div class="cmp-scroll"><img src="${cmp}" alt="Comparativo: cinco primeiros slides de dois carrosséis antigos e dos três novos." loading="lazy"></div>
  </section>
</div>
<script>
async function copiar(texto, botao, rotulo) {
  try { await navigator.clipboard.writeText(texto); botao.textContent = 'Copiado'; }
  catch { botao.textContent = 'Selecione e copie'; }
  setTimeout(() => (botao.textContent = rotulo), 2200);
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.copiar) copiar(document.getElementById(b.dataset.copiar).textContent, b, 'Copiar legenda');
  if (b.dataset.fb) {
    const t = document.getElementById('fb-' + b.dataset.fb);
    if (!t.value.trim()) { t.focus(); return; }
    copiar('Feedback do carrossel ' + b.dataset.fb + ': ' + t.value.trim(), b, 'Copiar para mandar no chat');
  }
});
</script>
`;
await fs.writeFile(path.join(PV, 'index.html'), html);
console.log(`Folhas em ${path.relative(process.cwd(), path.join(SAIDA, 'folhas'))}; prévia em ${path.relative(process.cwd(), path.join(PV, 'index.html'))} (${(await fs.readdir(path.join(PV, 'img'))).length} imagens).`);
