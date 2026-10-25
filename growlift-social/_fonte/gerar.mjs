// Builds every Growlift social piece: writes the editable HTML to _fonte/html/ and the PNG
// next to it in the delivery folders.   node growlift-social/_fonte/gerar.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import * as P from './pecas.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const ASSETS = pathToFileURL(path.join(HERE, 'assets') + '/').href;
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const B = (t) => `<span class="blue">${t}</span>`;

const MODELS = [
  { name: 'Brasa Burger', segment: 'Hamburgueria', img: 'site-hamburgueria.webp', story: ['Cardápio com fotos e preços', 'Pedido e Pix no próprio site', 'Botão de pedido sempre à vista'], chips: ['Cardápio', 'Pedido e Pix', 'Delivery'] },
  { name: 'Varanda Bistrô', segment: 'Restaurante', img: 'site-restaurante.webp', story: ['Cardápio do dia', 'Horários de almoço e jantar', 'Reserva pelo WhatsApp'], chips: ['Cardápio', 'Horários', 'Reserva'] },
  { name: 'Doce Ateliê', segment: 'Confeitaria', img: 'site-confeitaria.webp', story: ['Catálogo de bolos e sabores', 'Encomenda pelo WhatsApp', 'Galeria de fotos'], chips: ['Catálogo', 'Encomendas', 'Galeria'] },
  { name: 'Aurora Advocacia', segment: 'Escritório', img: 'site-advocacia.webp', story: ['Áreas de atuação', 'Conteúdos e contato', 'Texto discreto, como pede a OAB'], chips: ['Áreas de atuação', 'Conteúdos', 'Contato'] },
];

const phone = (src, w = 520, crop = '') => `<div class="phone" style="width:${w}px;margin:0 auto"><img src="${src}" style="${crop}"></div>`;
const photos = (h = 520) => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">${[['lucas.webp', 'Lucas'], ['antonio.webp', 'Antônio']].map(([f, n]) => `<figure><img src="${f}" style="width:100%;height:${h}px;object-fit:cover;border-radius:28px;border:1px solid rgba(255,255,255,.1)"><figcaption style="margin-top:16px;font-size:32px;font-weight:700">${n}</figcaption></figure>`).join('')}</div>`;

const pieces = [];
const add = (file, html, w, h) => pieces.push({ file, html, w, h });

// --- 02 Profile photo ---------------------------------------------------------------------
add('02-instagram-perfil/foto-perfil.png', P.profilePhoto(), 1080, 1080);

// --- 03 Highlight covers: both directions, all six ---------------------------------------
const HIGHLIGHTS = [['1-projetos', 'projetos'], ['2-servicos', 'servicos'], ['3-clientes', 'clientes'], ['4-design', 'design'], ['5-processo', 'processo'], ['6-contato', 'contato']];
for (const v of ['A', 'B']) for (const [slug, ic] of HIGHLIGHTS) add(`03-destaques/capas/direcao-${v}/${slug}.png`, P.cover(ic, v), 1080, 1920);

// --- 03 Stories: Projetos -----------------------------------------------------------------
const S = (d, n, html) => add(`03-destaques/${d}/${String(n).padStart(2, '0')}.png`, html, 1080, 1920);
S('1-projetos', 1, P.storyTitle({ iconName: 'projetos', eyebrow: 'Projetos', title: `Um visual para cada ${B('ramo.')}`, lead: 'Modelos que criamos para mostrar o que dá para fazer. O site do seu negócio é feito do zero.' }));
MODELS.forEach((m, i) => S('1-projetos', i + 2, P.storyProject({ index: `${i + 1}/4`, name: m.name, segment: m.segment, img: m.img, features: m.story })));
S('1-projetos', 6, P.storyVisual({ eyebrow: 'Projeto real', title: `O nosso próprio ${B('site.')}`, lead: 'Animações, diagnóstico grátis e planos, tudo pensado para o celular.', visual: phone('site-growlift-mobile.png', 560, 'height:900px;object-fit:cover;object-position:top') }));

// --- 03 Stories: Serviços -----------------------------------------------------------------
S('2-servicos', 1, P.storyTitle({ iconName: 'servicos', eyebrow: 'Serviços', title: `O que a gente ${B('faz.')}`, lead: 'Site, Google e vendas pelo site. Você escolhe até onde ir.' }));
S('2-servicos', 2, P.storyService({ index: '1/4', iconName: 'site', title: 'Site feito do zero', lead: 'Com as fotos, as cores e os serviços do seu negócio.', items: ['Domínio e hospedagem por nossa conta', 'Botão de WhatsApp, mapa e horários', 'Pensado primeiro para o celular'] }));
S('2-servicos', 3, P.storyService({ index: '2/4', iconName: 'google', title: 'Achado no Google', lead: 'Para quem procura o seu ramo na sua cidade.', items: ['SEO local no site', 'Perfil da Empresa no Google configurado', 'Acompanhamento do perfil'] }));
S('2-servicos', 4, P.storyService({ index: '3/4', iconName: 'pedido', title: 'Pedido e Pix no site', lead: 'Para restaurantes que querem vender direto.', items: ['Cardápio com pedido e pagamento', 'Tela da loja com alerta e impressão', 'Sem comissão por pedido'] }));
S('2-servicos', 5, P.storyService({ index: '4/4', iconName: 'lista', title: 'Clientes que voltam', lead: 'Uma lista de quem autorizou receber as suas ofertas.', items: ['No Grow: cadastro direto pelo site', 'No Lift: uma campanha por mês no WhatsApp', 'Só para quem aceitou, com opção de sair'] }));
S('2-servicos', 6, P.storyTitle({ iconName: 'contato', eyebrow: 'Por onde começar', title: `Peça um diagnóstico ${B('grátis.')}`, lead: 'Em até 2 dias úteis chega no seu WhatsApp uma prévia do seu site novo.' }));

// --- 03 Stories: Design -------------------------------------------------------------------
const palettes = [['Brasa Burger', 'Anton', ['#0b0907', '#e8b04a', '#f4ead8']], ['Varanda Bistrô', 'Fraunces', ['#f6f1e7', '#2f4a3c', '#a07a43']], ['Doce Ateliê', 'Cormorant', ['#fbf4ee', '#5a3527', '#c06a6a']], ['Aurora Advocacia', 'Cormorant', ['#0d1626', '#c2a26a', '#eef1f6']]];
const paletteGrid = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:22px">${palettes.map(([n, f, cs]) => `<div class="card" style="padding:30px"><div style="display:flex;gap:10px">${cs.map((c) => `<i style="flex:1;height:120px;border-radius:18px;background:${c};border:1px solid rgba(255,255,255,.12)"></i>`).join('')}</div><p style="font-size:32px;font-weight:700;margin-top:22px">${n}</p><p style="font-size:26px;color:#8790a6;margin-top:4px">Letra: ${f}</p></div>`).join('')}</div>`;
S('4-design', 1, P.storyTitle({ iconName: 'design', eyebrow: 'Design', title: `Nada de modelo com cara de todo ${B('mundo.')}`, lead: 'Cada negócio tem as suas cores, letras e fotos.' }));
S('4-design', 2, P.storyVisual({ eyebrow: 'Cores e letras', title: `Cada ramo, uma ${B('identidade.')}`, lead: 'As cores e as letras dos nossos projetos conceito.', visual: paletteGrid }));
S('4-design', 3, P.storyVisual({ eyebrow: 'Celular primeiro', title: `Pensado para o ${B('celular.')}`, lead: 'Tudo cabe na tela e o botão de contato fica sempre à mão.', visual: phone('site-growlift-mobile.png', 520, 'height:880px;object-fit:cover;object-position:top') }));
S('4-design', 4, P.storyVisual({ eyebrow: 'Movimento', title: `Animação com ${B('propósito.')}`, lead: 'Movimento que guia o olhar, sem atrapalhar a leitura.', visual: `<div style="display:grid;gap:22px"><img src="hero.webp" style="width:100%;border-radius:28px;border:1px solid rgba(255,255,255,.1)"><img src="marca-3d.webp" style="width:100%;border-radius:28px;border:1px solid rgba(255,255,255,.1)"></div>` }));

// --- 03 Stories: Processo -----------------------------------------------------------------
const STEPS = [
  ['Peça o diagnóstico', 'Conte o nome, o ramo e o Instagram ou site do seu negócio. Leva 2 minutos.', 'Pelo site growlift.com.br, sem compromisso.'],
  ['Receba a prévia', 'Em até 2 dias úteis chega no seu WhatsApp o diagnóstico e uma prévia do site novo.', 'Você vê o site antes de pagar.'],
  ['Escolha o plano', 'Start, Grow ou Lift. Mensalidade fixa, sem comissão por pedido.', 'Tudo combinado em contrato, com 7 dias para desistir sem multa.'],
  ['Ajustes e publicação', 'Com o seu material em mãos, o site vai ao ar em até 7 dias úteis, com até 2 rodadas de ajuste.', 'O domínio fica no nome do seu negócio.'],
  ['Depois do ar', 'Alterações todo mês: 1 no Start, 2 no Grow e 4 no Lift.', 'Cada alteração fica pronta em até 2 dias úteis.'],
];
S('5-processo', 1, P.storyTitle({ iconName: 'processo', eyebrow: 'Processo', title: `Do primeiro oi ao site no ${B('ar.')}`, lead: 'Cinco passos, sem surpresa no caminho.' }));
STEPS.forEach(([t, l, d], i) => S('5-processo', i + 2, P.storyStep({ n: i + 1, total: STEPS.length, title: t, lead: l, detail: d })));

// --- 03 Stories: Contato ------------------------------------------------------------------
S('6-contato', 1, P.storyContact({ title: 'Vamos conversar?', lead: 'Peça o diagnóstico grátis ou escreva para a gente.', rows: [['Site', 'growlift.com.br'], ['E-mail', 'contato@growlift.com.br']], cta: 'Diagnóstico grátis no site' }));
S('6-contato', 2, P.storyVisual({ eyebrow: 'Quem atende você', title: `Lucas e ${B('Antônio.')}`, lead: 'Quem conversa com você é quem faz o seu site.', visual: photos(640) }));

// --- 03 Clientes: template only, never with invented content ---------------------------
add('03-destaques/3-clientes/_modelo-nao-publicar.png', P.page(1080, 1920, `
    <div class="glow" style="width:1300px;height:1300px;left:-260px;top:-380px;opacity:.5"></div>
    <div style="position:absolute;left:96px;right:96px;top:250px;bottom:330px;display:flex;flex-direction:column">
      <p class="eyebrow">Cliente · [ramo]</p>
      <h1 class="h1" style="font-size:96px;margin-top:24px">[Nome do negócio]</h1>
      <div class="card" style="margin-top:60px;padding:56px"><p style="font-size:120px;line-height:.6;color:#4d8dff">“</p><p style="font-size:48px;line-height:1.35;font-weight:600">[Depoimento real, com as palavras do cliente e autorização por escrito.]</p><p style="font-size:32px;color:#a9b3c7;margin-top:36px">[Nome], [cargo]</p></div>
      <div class="browser" style="margin-top:auto"><div class="bar"><i></i><i></i><i></i><span>[endereço do site]</span></div><div style="aspect-ratio:16/10;display:grid;place-items:center;color:#8790a6;font-size:32px">[print do site entregue]</div></div>
    </div>
    <div style="position:absolute;inset:0;display:grid;place-items:center;pointer-events:none"><p style="transform:rotate(-28deg);font-size:120px;font-weight:800;color:rgba(255,80,80,.35);letter-spacing:.04em">MODELO · NÃO PUBLICAR</p></div>`), 1080, 1920);

// --- 04 Pinned carousels ------------------------------------------------------------------
const C = (d, n, html) => add(`04-posts-fixados/${d}/${String(n).padStart(2, '0')}.png`, html, 1080, 1350);
const bigMark = `<div style="position:absolute;right:-40px;top:20px;width:520px;opacity:.9">${P.MARK.replace('<svg ', '<svg width="520" ')}</div>`;

// Post 1: Quem somos
const q = 6;
C('1-quem-somos', 1, P.slideCover({ n: 1, total: q, kicker: 'Quem somos', title: `GROWLIFT<br>${B('Presença digital que vende.')}`, sub: 'Sites, Google e vendas pelo site para negócios locais.', art: bigMark }));
C('1-quem-somos', 2, P.slideText({ n: 2, total: q, eyebrow: 'Quem somos', title: 'Gente de verdade do outro lado do WhatsApp.', body: 'A Growlift é o Lucas e o Antônio. Somos jovens, de São Paulo, e crescemos usando a internet do jeito que o seu cliente usa.', extra: `<div style="margin-top:auto">${photos(380)}</div>` }));
C('1-quem-somos', 3, P.slideList({ n: 3, total: q, eyebrow: 'O que fazemos', title: 'Site, Google e vendas pelo site.', items: [['site', 'Site feito do zero', 'Com domínio e hospedagem inclusos'], ['google', 'Achado no Google', 'SEO local e Perfil da Empresa'], ['pedido', 'Pedido e Pix no site', 'Para restaurantes, sem comissão']] }));
C('1-quem-somos', 4, P.slideText({ n: 4, total: q, glow: 'right', eyebrow: 'Para quem', title: 'Negócios locais que querem ser encontrados.', extra: `<div style="margin-top:auto;display:flex;flex-wrap:wrap;gap:16px">${['Restaurantes', 'Bares', 'Confeitarias', 'Barbearias', 'Lojas', 'Escritórios', 'Prestadores de serviço'].map((t) => `<span class="chip" style="font-size:30px;padding:18px 28px;letter-spacing:.02em;text-transform:none;color:#f3f5f9;border-color:rgba(255,255,255,.18)">${t}</span>`).join('')}</div>` }));
C('1-quem-somos', 5, P.slideList({ n: 5, total: q, eyebrow: 'Como trabalhamos', title: 'Você vê o site antes de pagar.', items: [['contato', '1. Diagnóstico grátis', 'Pelo site, em 2 minutos'], ['phone', '2. Prévia no WhatsApp', 'Em até 2 dias úteis'], ['check', '3. Site no ar', 'Com o seu domínio']] }));
C('1-quem-somos', 6, P.slideCta({ n: 6, total: q, title: 'Vamos começar?', body: 'Peça o diagnóstico grátis e veja a prévia do seu site.', button: 'Diagnóstico grátis', url: 'growlift.com.br · link na bio' }));

// Post 2: Portfólio
const p2 = 7;
const coverArt = `<div class="browser" style="position:absolute;left:260px;right:-140px;top:-40px;transform:rotate(-6deg);-webkit-mask-image:linear-gradient(180deg,#000 55%,transparent 92%)"><div class="bar"><i></i><i></i><i></i><span>seunegocio.com.br</span></div><img src="site-hamburgueria.webp"></div>`;
C('2-portfolio', 1, P.slideCover({ n: 1, total: p2, kicker: 'Portfólio', title: `Ideias que viram ${B('experiências digitais.')}`, sub: 'Projetos conceito para quatro ramos e o nosso próprio site.', art: coverArt }));
MODELS.forEach((m, i) => C('2-portfolio', i + 2, P.slideProject({ n: i + 2, total: p2, name: m.name, segment: m.segment, img: m.img, features: m.chips })));
C('2-portfolio', 6, P.slideText({ n: 6, total: p2, glow: 'right', eyebrow: 'Projeto real', title: 'O nosso site, no computador e no celular.', extra: `<div style="position:relative;margin-top:auto;height:560px"><div class="browser" style="position:absolute;left:0;right:150px;top:30px"><div class="bar"><i></i><i></i><i></i><span>growlift.com.br</span></div><img src="site-growlift-desktop.png"></div><div class="phone" style="position:absolute;right:0;top:0;width:250px;padding:10px;border-radius:40px"><img src="site-growlift-mobile.png" style="height:500px;object-fit:cover;object-position:top;border-radius:32px"></div></div>` }));
C('2-portfolio', 7, P.slideCta({ n: 7, total: p2, title: 'Quer ver o seu?', body: 'No diagnóstico grátis você recebe uma prévia feita para o seu negócio.', button: 'Pedir minha prévia', url: 'growlift.com.br · link na bio' }));

// Post 3: Serviços
const p3 = 6;
C('3-servicos', 1, P.slideCover({ n: 1, total: p3, kicker: 'Serviços', title: `Sua marca merece ${B('mais.')}`, sub: 'Três planos, mensalidade fixa e nenhuma comissão por pedido.', art: bigMark }));
C('3-servicos', 2, P.slideList({ n: 2, total: p3, eyebrow: 'Plano Start', title: 'Seu site no ar.', items: [['site', 'Site feito do zero', 'Para o seu negócio'], ['check', 'Domínio e hospedagem', 'Por nossa conta'], ['google', 'WhatsApp, mapa e horários', 'Tudo à mão do cliente'], ['check', '1 alteração por mês', '']] }));
C('3-servicos', 3, P.slideList({ n: 3, total: p3, glow: 'right', eyebrow: 'Plano Grow', title: 'Achado no Google.', items: [['check', 'Tudo do Start', 'Com 2 alterações por mês'], ['google', 'SEO local', 'Site preparado para a sua cidade'], ['google', 'Perfil da Empresa no Google', 'Configurado e acompanhado'], ['lista', 'Lista de clientes', 'Quem quer receber ofertas']] }));
C('3-servicos', 4, P.slideList({ n: 4, total: p3, eyebrow: 'Plano Lift', title: 'Vende pelo site.', items: [['check', 'Tudo do Grow', 'Com 4 alterações por mês'], ['pedido', 'Pedido e Pix no site', 'Cartão e dinheiro na entrega'], ['pedido', 'Tela da loja', 'Alerta, impressão e esgotado'], ['lista', 'Campanha mensal', 'No WhatsApp, só para quem aceitou']] }));
C('3-servicos', 5, P.slideList({ n: 5, total: p3, glow: 'bottom', eyebrow: 'Em todos os planos', title: 'Sem letra miúda.', items: [['check', 'Contrato claro', 'Fidelidade informada antes de assinar'], ['check', 'Domínio no seu nome', 'O endereço é do seu negócio'], ['check', '7 dias para desistir', 'Sem multa'], ['check', 'Sem comissão', 'Nada sobre os seus pedidos']] }));
C('3-servicos', 6, P.slideCta({ n: 6, total: p3, title: 'Qual é o seu momento?', body: 'Conte como está o seu negócio. A gente indica o plano que faz sentido.', button: 'Pedir orçamento', url: 'growlift.com.br · link na bio' }));

// --- 01 Visual system board -------------------------------------------------------------
const swatch = ([hex, name, role, dark]) => `<div><div style="height:150px;border-radius:22px;background:${hex};border:1px solid rgba(255,255,255,.14)"></div><p style="font-size:22px;font-weight:700;margin-top:14px">${name}</p><p style="font-size:18px;color:#8790a6;margin-top:2px">${hex} · ${role}</p></div>`;
add('01-identidade/sistema-visual.png', P.page(1600, 1200, `
  <div class="glow" style="width:1200px;height:1200px;left:-300px;top:-500px;opacity:.45"></div>
  <div style="position:absolute;inset:72px">
    <div style="display:flex;justify-content:space-between;align-items:center"><div class="brand" style="font-size:34px">${P.MARK}GROWLIFT</div><p class="eyebrow" style="font-size:20px">Sistema visual · redes sociais</p></div>
    <p class="eyebrow" style="font-size:18px;margin-top:56px">Cores (as mesmas do site)</p>
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:20px;margin-top:20px">${[
      ['#0865FE', 'Azul Growlift', 'logo e botões'], ['#4D8DFF', 'Azul claro', 'ícones e destaques'], ['#06080D', 'Fundo', 'base de tudo'],
      ['#0F1520', 'Superfície', 'cartões'], ['#F3F5F9', 'Texto', 'títulos'], ['#A9B3C7', 'Cinza', 'textos de apoio']].map(swatch).join('')}</div>
    <div style="display:grid;grid-template-columns:1.25fr 1fr;gap:60px;margin-top:64px">
      <div>
        <p class="eyebrow" style="font-size:18px">Tipografia: Inter</p>
        <p class="h1" style="font-size:86px;margin-top:22px">Título 800, ${B('apertado.')}</p>
        <p class="lead" style="font-size:30px;margin-top:20px">Texto de apoio em 400, cinza claro, frases curtas.</p>
        <p class="eyebrow" style="font-size:20px;margin-top:26px">Rótulo 600 · maiúsculas · espaçado</p>
        <div class="btn" style="margin-top:30px;height:72px;padding:0 36px;font-size:24px">Botão principal</div>
      </div>
      <div>
        <p class="eyebrow" style="font-size:18px">Ícones: traço fino, cantos redondos</p>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:22px">${['projetos', 'servicos', 'clientes', 'design', 'processo', 'contato', 'google', 'pedido'].map((n) => `<div class="card" style="aspect-ratio:1;display:grid;place-items:center;border-radius:22px">${P.icon(n, { size: 56, width: 1.5 })}</div>`).join('')}</div>
        <p style="font-size:20px;color:#8790a6;margin-top:22px">Formatos: story 1080×1920 · post 1080×1350 · capa de destaque 1080×1920 (ícone no centro).</p>
      </div>
    </div>
  </div>`), 1600, 1200);

// --- Render -------------------------------------------------------------------------------
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage();
let count = 0;
for (const { file, html, w, h } of pieces) {
  if (!html) continue;
  const doc = html.replace('<head>', `<head><base href="${ASSETS}">`);
  const htmlPath = path.join(HERE, 'html', file.replace(/\.png$/, '.html'));
  await fs.mkdir(path.dirname(htmlPath), { recursive: true });
  await fs.writeFile(htmlPath, doc);
  await page.setViewportSize({ width: w, height: h });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const out = path.join(ROOT, file);
  await fs.mkdir(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out });
  count++;
}
await browser.close();
console.log(`${count} peças geradas`);
