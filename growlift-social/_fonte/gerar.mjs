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
const HIGHLIGHTS = [['1-projetos', 'projetos'], ['2-servicos', 'servicos'], ['3-clientes', 'clientes'], ['6-contato', 'contato']];
// Square covers, one per highlight in use (Clientes waits for a real client).
for (const [slug, ic] of HIGHLIGHTS) add(`03-destaques/capas/${slug}.png`, P.coverV2(ic), 1080, 1080);

// --- 03 Stories: Projetos -----------------------------------------------------------------
const S = (d, n, html) => add(`03-destaques/${d}/${String(n).padStart(2, '0')}.png`, html, 1080, 1920);
// Projetos, second generation: glass mark plate, HD captures of the concept sites (assets/hd/).
const HD = { 'Brasa Burger': 'hd/burger.png', 'Varanda Bistrô': 'hd/restaurante.png', 'Doce Ateliê': 'hd/confeitaria.png', 'Aurora Advocacia': 'hd/advocacia.png' };
S('1-projetos', 1, P.storyOpenV2({ plate: 'hd/marca-vidro-vertical.png', title: `Um visual para<br>cada ${B('ramo.')}`, lead: 'Modelos que criamos para mostrar o que dá para fazer. O site do seu negócio é feito do zero.' }));
MODELS.forEach((m, i) => S('1-projetos', i + 2, P.storyShowcaseV2({ index: `${i + 1}/4`, name: m.name, segment: m.segment, img: HD[m.name], features: m.story })));
S('1-projetos', 6, P.storySiteV2({ chip: 'Projeto real', title: `O nosso próprio ${B('site.')}`, lead: 'No computador e no celular.', desktop: 'hd/growlift.png', mobile: 'hd/growlift-cel.png', link: { sticker: 'Ver o site ao vivo', hint: 'Toque no link e veja funcionando' } }));

// --- 03 Stories: Serviços -----------------------------------------------------------------
// Serviços, second generation. Each service shows itself at work: real captures of the concept
// sites, or demonstrations drawn here and labelled as such (fictitious names, test order, sample text).
const demo = (t) => `<span style="position:absolute;left:24px;top:24px;z-index:3;font-size:24px;font-weight:600;color:#e8eefa;background:rgba(6,8,13,.72);border:1.5px solid rgba(255,255,255,.2);padding:8px 18px;border-radius:999px">${t}</span>`;
const card = (inner, style = '') => `<div style="position:absolute;border-radius:34px;background:#0f1520;border:1.5px solid rgba(255,255,255,.14);box-shadow:0 60px 120px -40px rgba(0,0,0,.95);${style}">${inner}</div>`;
const winHd = (src, url, style) => `<div class="win" style="position:absolute;${style}"><div class="bar"><i></i><i></i><i></i><span>${url}</span></div><img src="${src}"></div>`;

const visSite = `${winHd('hd/restaurante.png', 'seunegocio.com.br', 'left:260px;right:0;top:0;opacity:.8')}${winHd('hd/confeitaria.png', 'seunegocio.com.br', 'left:0;right:200px;top:110px')}${demo('Projetos conceito · nomes fictícios')}`;

const pinSvg = (x, y, c = '#0865fe') => `<svg style="position:absolute;left:${x}px;top:${y}px" width="56" height="70" viewBox="0 0 24 30"><path d="M12 29s9-9.4 9-17A9 9 0 0 0 3 12c0 7.6 9 17 9 17z" fill="${c}" stroke="#fff" stroke-width="1.5"/><circle cx="12" cy="12" r="3.6" fill="#fff"/></svg>`;
const mapBg = `<div style="position:absolute;inset:0;border-radius:34px;overflow:hidden;background:#101826"><svg width="1000" height="680" viewBox="0 0 1000 680" style="position:absolute;inset:0"><g stroke="#1d2a3d" stroke-width="22" fill="none" stroke-linecap="round"><path d="M-20 180 L1020 120"/><path d="M-20 470 L1020 540"/><path d="M260 -20 L330 700"/><path d="M700 -20 L640 700"/></g><g stroke="#16212f" stroke-width="10" fill="none"><path d="M-20 320 L1020 300"/><path d="M480 -20 L470 700"/><path d="M120 -20 L180 700"/><path d="M860 -20 L900 700"/></g><rect x="360" y="190" width="90" height="90" rx="14" fill="#13321f"/><rect x="740" y="360" width="140" height="70" rx="14" fill="#13321f"/></svg>${pinSvg(560, 120, '#3a4a63')}${pinSvg(820, 230, '#3a4a63')}${pinSvg(150, 260, '#3a4a63')}${pinSvg(470, 250)}</div>`;
const visGoogle = `${mapBg}${demo('Exemplo · nome fictício')}${card(`
  <div style="padding:34px 38px">
    <div style="display:flex;align-items:center;gap:18px;height:84px;padding:0 28px;border-radius:999px;background:#1a2333;font-size:32px;color:#c6cede">${P.icon('google', { size: 40, width: 2 })}confeitaria perto de mim</div>
    <p style="font-size:50px;font-weight:800;margin-top:30px;letter-spacing:-.02em">Doce Ateliê</p>
    <p style="font-size:30px;color:#c6cede;margin-top:6px">Confeitaria · Centro</p>
    <p style="font-size:30px;margin-top:6px"><span style="color:#6fcf8f;font-weight:700">Aberto</span><span style="color:#c6cede"> · fecha às 19h</span></p>
    <div style="display:flex;gap:14px;margin-top:28px">${['Rota', 'Ligar', 'Site'].map((b, i) => `<span style="flex:1;height:72px;border-radius:999px;display:grid;place-items:center;font-size:30px;font-weight:700;${i === 2 ? 'background:#0865fe;color:#fff' : 'background:#1a2333;color:#e8eefa'}">${b}</span>`).join('')}</div>
  </div>`, 'left:60px;right:60px;bottom:0')}`;

const visPedido = `${winHd('hd/burger.png', 'seunegocio.com.br', 'left:0;right:220px;top:0;opacity:.9')}${demo('Loja de demonstração · pedido de teste')}${card(`
  <div style="padding:34px 36px">
    <p style="font-size:26px;font-weight:700;letter-spacing:.08em;color:#8db8ff;text-transform:uppercase">Tela da loja</p>
    <p style="font-size:46px;font-weight:800;margin-top:10px;letter-spacing:-.02em">Novo pedido #0128</p>
    <p style="font-size:32px;color:#c6cede;margin-top:14px">2× Brasa Duplo</p>
    <p style="font-size:38px;font-weight:800;margin-top:6px">R$ 79,80</p>
    <div style="display:grid;gap:12px;margin-top:22px">
      <span style="height:66px;border-radius:999px;display:flex;align-items:center;gap:12px;padding:0 24px;font-size:28px;font-weight:700;color:#0b2a17;background:#6fcf8f">${P.icon('check', { size: 30, color: '#0b2a17', width: 3 })}Pix pago</span>
      <span style="height:66px;border-radius:999px;display:flex;align-items:center;padding:0 24px;font-size:28px;font-weight:700;color:#fff;background:#0865fe">Saiu para entrega</span>
    </div>
  </div>`, 'right:0;width:470px;top:250px')}`;

const visLista = `<div style="position:absolute;inset:0;border-radius:34px;overflow:hidden;background:#0b141a;border:1.5px solid rgba(255,255,255,.12)">
  <div style="display:flex;align-items:center;gap:20px;height:104px;padding:0 30px;background:#1f2c33"><span style="width:64px;height:64px;border-radius:50%;background:#e8b04a;display:grid;place-items:center;font-size:30px;font-weight:800;color:#0b0907">B</span><span><span style="display:block;font-size:32px;font-weight:700">Brasa Burger</span><span style="display:block;font-size:24px;color:#a9b3c7">Conta comercial</span></span></div>
  <div style="padding:40px 30px">
    <div style="max-width:780px;padding:30px 34px;border-radius:8px 30px 30px 30px;background:#1f2c33;font-size:34px;line-height:1.38;color:#eef2f7">Oi, Ana! Esta semana a entrega é grátis nos pedidos pelo site. 🍔<br><br><span style="color:#a9b3c7">Para não receber mais ofertas, responda <b style="color:#fff">SAIR</b>.</span><span style="display:block;text-align:right;font-size:24px;color:#8790a6;margin-top:10px">18:02</span></div>
    <div style="margin-top:26px;display:inline-flex;align-items:center;gap:12px;padding:16px 26px;border-radius:999px;background:rgba(111,207,143,.14);border:1.5px solid rgba(111,207,143,.5);font-size:28px;font-weight:600;color:#bff0cf">${P.icon('check', { size: 30, color: '#6fcf8f', width: 3 })}Ana aceitou receber ofertas ao pedir</div>
  </div>
</div>${demo('Exemplo de campanha · nomes fictícios').replace('left:24px;top:24px', 'right:24px;bottom:24px')}`;

S('2-servicos', 1, P.storyOpenV2({ plate: 'hd/marca-vidro-vertical.png', title: `O que a gente<br>${B('faz.')}`, lead: 'Site, Google e vendas pelo site. Você escolhe até onde ir.' }));
S('2-servicos', 2, P.storyServiceV2({ index: '1/4', plan: 'Em todos os planos', title: 'Site feito do zero', lead: 'Com as fotos, as cores e os serviços do seu negócio.', visual: visSite, bg: 'hd/confeitaria.png', items: ['Domínio e hospedagem por nossa conta', 'Botão de WhatsApp, mapa e horários', 'Pensado primeiro para o celular'] }));
S('2-servicos', 3, P.storyServiceV2({ index: '2/4', plan: 'A partir do Grow', title: 'Achado no Google', lead: 'Para quem procura o seu ramo na sua cidade.', visual: visGoogle, bg: 'hd/restaurante.png', items: ['SEO local no site', 'Perfil da Empresa no Google configurado', 'Acompanhamento do perfil'] }));
S('2-servicos', 4, P.storyServiceV2({ index: '3/4', plan: 'No plano Lift', title: 'Pedido e Pix no site', lead: 'Para restaurantes que querem vender direto.', visual: visPedido, bg: 'hd/burger.png', items: ['Cardápio com pedido e pagamento', 'Tela da loja com alerta e impressão', 'Sem comissão por pedido'] }));
S('2-servicos', 5, P.storyServiceV2({ index: '4/4', plan: 'A partir do Grow', title: 'Clientes que voltam', lead: 'Uma lista de quem autorizou receber as suas ofertas.', visual: visLista, bg: 'hd/burger.png', items: ['No Grow: cadastro direto pelo site', 'No Lift: campanha mensal no WhatsApp', 'Só para quem aceitou, com opção de sair'] }));
S('2-servicos', 6, P.storyPlansV2({ plate: 'hd/marca-vidro-vertical.png', title: `Qual é o seu ${B('momento?')}`, lead: 'Mensalidade fixa e nenhuma comissão por pedido.', plans: [['Start', 'Seu site no ar', 'Site feito do zero, com domínio e hospedagem.'], ['Grow', 'Achado no Google', 'Tudo do Start, mais SEO local e o seu perfil no Google.'], ['Lift', 'Vende pelo site', 'Tudo do Grow, mais pedido e Pix no seu site.']], link: { sticker: 'Ver os planos', hint: 'Toque no link e compare os planos' } }));

// --- 03 Stories: Contato ------------------------------------------------------------------
// Contato, second generation: two stories, each with its link button drawn where the sticker goes.
S('6-contato', 1, P.storyWhatsV2({ title: `Chama no ${B('WhatsApp.')}`, number: '(11) 99446-3234', note: 'Quem responde é quem faz o seu site', plate: 'hd/marca-vidro-vertical.png', link: { sticker: 'Chamar no WhatsApp', hint: 'Toque no link e chame a gente' } }));
S('6-contato', 2, P.storyDiagnosisV2({ chip: 'Diagnóstico grátis', title: `Peça o seu ${B('diagnóstico.')}`, lead: 'Sem compromisso. Você vê a prévia antes de decidir.', plate: 'hd/marca-vidro-vertical.png', steps: [['Conte sobre o seu negócio', 'Pelo site, em 2 minutos'], ['Receba a prévia do site', 'No WhatsApp, em até 2 dias úteis'], ['Decida com calma', 'Só segue se você quiser']], link: { sticker: 'Pedir diagnóstico grátis', hint: 'Toque no link e preencha pelo site' } }));

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
const q = 5;
// Quem somos, second generation: no photos of people (decision of 26/10/2026); initials instead.
const mosaic = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:30px">${['burger', 'restaurante', 'confeitaria', 'advocacia'].map((m) => `<img src="hd/${m}.png" style="display:block;width:100%;height:222px;object-fit:cover;object-position:top;border-radius:24px;border:1.5px solid rgba(255,255,255,.14)">`).join('')}</div>`;
const chips = (list) => `${mosaic}<div style="display:flex;flex-wrap:wrap;gap:14px">${list.map((t) => `<span style="height:76px;padding:0 30px;border-radius:999px;display:inline-flex;align-items:center;font-size:34px;font-weight:600;color:#e8eefa;background:rgba(15,21,32,.8);border:1.5px solid rgba(255,255,255,.16)">${t}</span>`).join('')}</div>`;
C('1-quem-somos', 1, P.slideCoverV2({ n: 1, total: q, plate: 'hd/marca-vidro-vertical.png', title: `Presença digital<br>que ${B('vende.')}`, sub: 'Sites, Google e vendas pelo site para negócios locais.' }));
C('1-quem-somos', 2, P.slideRowsV2({ n: 2, total: q, title: `Site, Google e vendas ${B('pelo site.')}`, rows: [['hd/confeitaria.png', 'Site feito do zero', 'Com domínio e hospedagem inclusos'], ['hd/restaurante.png', 'Achado no Google', 'SEO local e Perfil da Empresa'], ['hd/burger.png', 'Pedido e Pix no site', 'Para restaurantes, sem comissão']] }));
C('1-quem-somos', 3, P.slideTextV2({ n: 3, total: q, bg: 'hd/restaurante.png', title: `Negócios locais que querem ser ${B('encontrados.')}<span style="display:block;margin-top:14px;font-size:30px;font-weight:600;letter-spacing:0;color:#aeb8cc">Nas telas, projetos conceito com nomes fictícios</span>`, visual: chips(['Restaurantes', 'Bares', 'Confeitarias', 'Barbearias', 'Lojas', 'Escritórios', 'Prestadores de serviço']) }));
C('1-quem-somos', 4, P.slideRowsV2({ n: 4, total: q, title: `Você vê o site antes de ${B('pagar.')}`, lead: 'Três passos, sem surpresa no caminho.', rows: [[1, 'Diagnóstico grátis', 'Pelo site, em 2 minutos'], [2, 'Prévia no WhatsApp', 'Em até 2 dias úteis'], [3, 'Site no ar', 'Com o seu domínio']] }));
C('1-quem-somos', 5, P.slideCtaV2({ n: 5, total: q, plate: 'hd/marca-vidro-vertical.png', title: `Vamos ${B('começar?')}`, body: 'Peça o diagnóstico grátis e veja a prévia do seu site.', button: 'Diagnóstico grátis' }));

// Post 2: Portfólio
const p2 = 7;
const coverArt = `<div class="browser" style="position:absolute;left:260px;right:-140px;top:-40px;transform:rotate(-6deg);-webkit-mask-image:linear-gradient(180deg,#000 55%,transparent 92%)"><div class="bar"><i></i><i></i><i></i><span>seunegocio.com.br</span></div><img src="site-hamburgueria.webp"></div>`;
// Portfólio, second generation: HD captures, project colours behind, link in the bio.
C('2-portfolio', 1, P.slideCoverWallV2({ n: 1, total: p2, note: 'Projetos conceito · nomes fictícios', imgs: ['hd/burger.png', 'hd/restaurante.png', 'hd/confeitaria.png', 'hd/advocacia.png'], title: `Ideias que viram ${B('experiências digitais.')}`, sub: 'Projetos conceito para quatro ramos e o nosso próprio site.' }));
MODELS.forEach((m, i) => C('2-portfolio', i + 2, P.slideProjectV2({ n: i + 2, total: p2, name: m.name, segment: m.segment, img: HD[m.name], chips: m.chips })));
C('2-portfolio', 6, P.slideSiteV2({ n: 6, total: p2, chip: 'Projeto real', title: `O nosso site, no computador e no ${B('celular.')}`, desktop: 'hd/growlift.png', mobile: 'hd/growlift-cel.png' }));
C('2-portfolio', 7, P.slideCtaV2({ n: 7, total: p2, plate: 'hd/marca-vidro-vertical.png', title: `Quer ver o ${B('seu?')}`, body: 'No diagnóstico grátis você recebe uma prévia feita para o seu negócio.', button: 'Pedir minha prévia' }));

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
// node gerar.mjs [prefixo...]  → only the pieces whose path starts with one of the prefixes.
// ESCALA (default 2): pixel density of the PNGs; 2 gives 2160×3840 stories, sharp in the photo app.
const ONLY = process.argv.slice(2);
const SCALE = Number(process.env.ESCALA || 2);
const browser = await chromium.launch({ executablePath: CHROME });
const page = await (await browser.newContext({ deviceScaleFactor: SCALE })).newPage();
let count = 0;
for (const { file, html, w, h } of pieces) {
  if (!html) continue;
  if (ONLY.length && !ONLY.some((o) => file.startsWith(o))) continue;
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
