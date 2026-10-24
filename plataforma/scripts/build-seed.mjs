// One-off: builds seed/*.json from the four live sites' own data, so the panel starts with real menus.
//   node scripts/build-seed.mjs <downtown.json> <sites-dir>
import fs from 'node:fs';
import vm from 'node:vm';

const [downtownPath, sitesDir] = process.argv.slice(2);
const cents = (v) => Math.round(Number(v) * 100);
let n = 0;
const id = (prefix) => `${prefix}-${(++n).toString(36)}`;
const slugId = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const item = (o) => ({ id: o.id ?? id('i'), name: o.name, description: o.description ?? '', price: o.price ?? null, priceLabel: o.priceLabel ?? '', image: o.image ?? '', imageAlt: o.imageAlt ?? '', available: true, featured: o.featured ?? false, tags: o.tags ?? [], options: o.options ?? [] });
const base = (slug, name, segment) => ({
  slug, name, segment, siteUrl: '', contact: { whatsapp: '', instagram: '', email: '', phone: '' }, units: [], notice: { active: false, text: '' },
  catalog: { categories: [] }, extra: {}, account: { plan: 'parceiro', changeLimit: null, partnerUntil: '', monthlyFee: null, notes: '' },
});
const out = {};

// Downtown Burger: from the site's own menu module.
{
  const d = JSON.parse(fs.readFileSync(downtownPath, 'utf8'));
  const site = 'https://downtown-burger-gilt.vercel.app';
  const s = base('downtown-burger', 'Downtown Burger', 'restaurante');
  s.siteUrl = site;
  s.account.notes = 'Site vendido por R$ 597 sem mensalidade, com configuração do Google. WhatsApp, endereço, horários e Instagram ainda não informados.';
  for (const c of d.categories) {
    const cat = { id: c.id, name: c.label, description: c.blurb ?? '', items: [] };
    if (c.id === 'adicionais') {
      cat.items = d.addons.map((a) => item({ id: a.id, name: a.label, price: a.priceDelta, description: 'Adicional para qualquer burger.' }));
    } else {
      cat.items = d.products.filter((p) => p.category === c.id).map((p) =>
        item({
          id: p.id, name: p.name, description: p.description ?? '', price: p.price, image: p.image ? site + p.image : '', imageAlt: p.imageAlt ?? '',
          featured: p.id === 'holyfield',
          tags: p.alcoholic ? ['alcoólico'] : [],
          options: (p.options ?? []).map((g) => ({ id: g.id, name: g.label, type: g.type, required: Boolean(g.required), choices: g.choices.map((ch) => ({ id: ch.id, label: ch.label, priceDelta: ch.priceDelta })) })),
        }),
      );
    }
    s.catalog.categories.push(cat);
  }
  out['downtown-burger'] = s;
}

// Gara Pizza Bar: window.GARA_MENU from menu.js.
{
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(`${sitesDir}/gara-pizza-juquehy/menu.js`, 'utf8'), ctx);
  const menu = ctx.window.GARA_MENU;
  const s = base('gara-pizza', 'Gara Pizza Bar', 'restaurante');
  s.siteUrl = 'https://gara-pizza-juquehy.pages.dev';
  s.contact.whatsapp = '5512996175810';
  s.contact.instagram = '@gara.pizzabar';
  s.units = [{ id: 'juquehy', name: 'Juquehy', address: 'Farias Boulevard, Rua Benedito Izidoro de Morães, 222, Loja 04, Juquehy, São Sebastião, SP', mapsUrl: '', whatsapp: '', hours: [] }];
  const labels = { pizzas: 'Pizzas', entradas: 'Entradas', sobremesas: 'Sobremesas', drinks: 'Drinks', cervejas: 'Cervejas', bebidas: 'Bebidas' };
  for (const [key, rows] of Object.entries(menu)) {
    s.catalog.categories.push({
      id: key, name: labels[key] ?? key, description: '',
      items: rows.map(([name, price, description, tag]) => item({ id: slugId(name), name, price: cents(price), description: description ?? '', tags: tag ? [tag] : [], featured: Boolean(tag) })),
    });
  }
  s.account.notes = 'Parceiro: 2 mudanças grátis por mês. Horários a confirmar com a casa.';
  out['gara-pizza'] = s;
}

// SemvØ: the Réveillon selection (no prices on the site) and its two shops.
{
  const site = 'https://semvo-juquehy.pages.dev';
  const s = base('semvo', 'SemvØ Clothing', 'loja');
  s.siteUrl = site;
  s.contact.whatsapp = '5511940298057';
  s.units = [
    { id: 'juquehy', name: 'Juquehy', address: 'Farias Boulevard, R. Benedito Izidoro de Morães, 222, Juquehy, São Sebastião, SP', mapsUrl: '', whatsapp: '5511940298057', hours: [] },
    { id: 'maresias', name: 'Maresias', address: 'Av. Dr. Francisco Loup, 1116A, Maresias, São Sebastião, SP', mapsUrl: '', whatsapp: '5511994432348', hours: [] },
  ];
  const sizes = { id: 'tamanho', name: 'Tamanho', type: 'single', required: true, choices: ['P', 'M', 'G', 'GG'].map((t) => ({ id: t.toLowerCase(), label: t, priceDelta: 0 })) };
  const pieces = [
    ['linen-short', 'Camisa de manga curta', 'Camisa de linho natural de manga curta.', 'assets/linen-short.webp'],
    ['linen-long', 'Camisa de manga longa', 'Camisa de linho clara de manga longa.', 'assets/linen-long.webp'],
    ['linen-shorts', 'Shorts de linho', 'Shorts de linho em tom oliva.', 'assets/linen-shorts.webp'],
    ['linen-pants', 'Calça branca de linho', 'Calça branca de linho.', 'assets/linen-pants.webp'],
  ];
  s.catalog.categories.push({
    id: 'reveillon', name: 'Seleção Réveillon', description: 'Linho e leveza para celebrar. Reserva pelo WhatsApp para retirar na loja.',
    items: pieces.map(([pid, name, description, img]) => item({ id: pid, name, description, image: `${site}/${img}`, imageAlt: description, priceLabel: 'Consulte', options: [structuredClone(sizes)] })),
  });
  s.extra = { offers: { look: { enabled: true, percent: 10, code: 'VIRADA10', combinable: false } } };
  s.account.notes = 'Parceiro: 2 mudanças grátis por mês. Preços não aparecem no site (peças ilustrativas, consulta pelo WhatsApp).';
  out['semvo'] = s;
}

// Surflife: board shapes (no prices) and daily rental.
{
  const site = 'https://surflife-juquehy.pages.dev';
  const s = base('surflife', 'Surflife', 'loja');
  s.siteUrl = site;
  s.contact.whatsapp = '5512996062804';
  s.units = [{ id: 'juquehy', name: 'Juquehy', address: 'Juquehy, São Sebastião, SP', mapsUrl: '', whatsapp: '', hours: [] }];
  const src = fs.readFileSync(`${sitesDir}/surflife-juquehy/quiver.js`, 'utf8');
  const shapes = [...src.matchAll(/\{ name: '([A-Z ]+)', image: '([^']+)', alt: '([^']+)', kicker: '([^']+)', description: '([^']+)', feelings: \[([^\]]*)\]/g)].map((m) => ({
    name: m[1], image: m[2], alt: m[3], kicker: m[4], description: m[5], feelings: [...m[6].matchAll(/'([^']+)'/g)].map((f) => f[1]),
  }));
  s.catalog.categories.push({
    id: 'shapes', name: 'Pranchas (shapes)', description: 'Encontre sua onda.',
    items: shapes.map((b) => item({ id: slugId(b.name), name: b.name.charAt(0) + b.name.slice(1).toLowerCase(), description: b.description, image: `${site}/${b.image}`, imageAlt: b.alt, priceLabel: 'Consulte', tags: b.feelings.map((f) => f.toLowerCase()) })),
  });
  s.catalog.categories.push({ id: 'aluguel', name: 'Aluguel', description: 'Prancha por diária.', items: [item({ id: 'aluguel-diaria', name: 'Aluguel de prancha por diária', description: 'Consulte opções, valores e disponibilidade pelo WhatsApp.', priceLabel: 'Consulte' })] });
  s.extra = { shapes: shapes.map(({ name, kicker, feelings }) => ({ name, kicker, feelings })) };
  s.account.notes = 'Parceiro: 2 mudanças grátis por mês. Endereço completo e horários a confirmar.';
  out['surflife'] = s;
}

fs.mkdirSync('seed', { recursive: true });
for (const [slug, store] of Object.entries(out)) fs.writeFileSync(`seed/${slug}.json`, JSON.stringify(store, null, 1) + '\n');
console.log(Object.entries(out).map(([k, v]) => `${k}: ${v.catalog.categories.reduce((a, c) => a + c.items.length, 0)} itens`).join('\n'));
