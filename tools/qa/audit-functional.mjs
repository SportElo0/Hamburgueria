// Functional audit: drives the real UI and checks every flow against prices transcribed from the menu photo.
//   node tools/qa/audit-functional.mjs <baseUrl> <outDir>
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';

const base = process.argv[2] || 'http://localhost:3000';
const out = process.argv[3] || '.impeccable/audit';
await fs.mkdir(out, { recursive: true });
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

// Independent source of truth: prices read off the photographed paper menu (centavos).
const PHOTO = {
  'The Bacon Street': 4490, 'Downtown Classic': 3990, Holyfield: 6990, 'Little Downtown': 3990, Milkshake: 3490,
  'Bacon Cheddar Fries': 3490, 'Croc Canoa': 3990, 'Downtown Nuggets': 2490, 'Classic Fries': 2390,
  'Água': 600, 'Água com gás': 1000, 'Coca KS': 1200, 'Coca KS Zero': 1200, 'Água tônica': 1000, 'Tubaína': 1200,
  Schweppes: 1200, 'Guaraná': 1000, 'Suco natural One de laranja': 1200, 'Pink Lemonade': 1500,
  Heineken: 1500, Praya: 1500, 'Praya Clássica': 1500, 'Amstel Ultra': 1500, 'Lagunitas IPA': 1800, 'Blue Moon': 1800, Eisenbahn: 1300,
  'Brownie de chocolate com sorvete de creme': 3490,
  'add:Cheddar cremoso': 500, 'add:Blend de carne 160 g': 2500,
};
const brl = (c) => `R$ ${Math.floor(c / 100).toLocaleString('pt-BR')},${String(c % 100).padStart(2, '0')}`;
const parseBRL = (s) => {
  const m = s.replace(/\s/g, ' ').match(/R\$\s?([\d.]+),(\d{2})/);
  return m ? Number(m[1].replace(/\./g, '')) * 100 + Number(m[2]) : NaN;
};

const results = [];
const check = (area, name, ok, detail = '') => {
  results.push({ area, name, ok: Boolean(ok), detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} [${area}] ${name}${detail ? ' — ' + detail : ''}`);
};

const browser = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

async function run(label, viewport, mobile) {
  const ctx = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const A = (n) => `${label}`;
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const headerCount = async () => Number((await page.locator('header button[aria-label*="Abrir sacola"]').innerText()).trim());
  const sheet = page.locator('dialog.product-dialog[open]').first();
  const submitText = async () => (await sheet.locator('button[type=submit]').innerText()).replace(/\s+/g, ' ');
  const tryStep = async (name, fn) => {
    try {
      await fn();
    } catch (e) {
      check(A(), name, false, `exceção: ${e.message.split('\n')[0]}`);
      await page.screenshot({ path: `${out}/${label}-fail-${name.replace(/\W+/g, '_')}.png` });
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(400);
    }
  };

  // ── Load stays at the top (the cinematic opening must not be skipped) ──
  const jumps = [];
  for (let i = 0; i < 6; i++) {
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2200);
    const y = await page.evaluate(() => Math.round(scrollY));
    if (y > 10) jumps.push(y);
  }
  check(A(), 'carregamento: página fica no topo (6 cargas)', jumps.length === 0, jumps.length ? `pulou para ${jumps.join(', ')} px em ${jumps.length}/6` : '');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);

  // ── Hero quick add ──
  await tryStep('hero: + adiciona Holyfield', async () => {
    await page.locator('[data-copy="0"] button').first().click();
    await page.waitForTimeout(400);
    check(A(), 'hero: + adiciona Holyfield', (await headerCount()) === 1, `contador=${await headerCount()}`);
  });

  // ── Holyfield with two add-ons, qty 2 ──
  await tryStep('Holyfield + adicionais x2', async () => {
    await page.evaluate(() => document.getElementById('cat-burgers').scrollIntoView());
    await page.getByRole('button', { name: 'Ver detalhes de Holyfield' }).click();
    await sheet.waitFor();
    await page.waitForTimeout(500);
    await sheet.locator('label', { hasText: 'Blend de carne 160 g' }).click();
    await sheet.locator('label', { hasText: 'Cheddar cremoso' }).click();
    await sheet.getByRole('button', { name: 'Aumentar quantidade' }).click();
    const exp = (PHOTO.Holyfield + PHOTO['add:Blend de carne 160 g'] + PHOTO['add:Cheddar cremoso']) * 2;
    const t = await submitText();
    check(A(), 'Holyfield: preço com 2 adicionais x2', parseBRL(t) === exp, `botão="${t}" esperado=${brl(exp)}`);
    await page.getByRole('button', { name: 'Ver por dentro' }).click();
    await page.waitForTimeout(1100);
    check(A(), 'Holyfield: "Ver por dentro" mostra camadas', (await sheet.locator('.bs-layer').count()) === 10, `camadas=${await sheet.locator('.bs-layer').count()}`);
    await page.screenshot({ path: `${out}/${label}-sheet-holyfield-inside.png` });
    await sheet.locator('button[type=submit]').click();
    await page.waitForTimeout(500);
    check(A(), 'Holyfield: adicionado (contador 3)', (await headerCount()) === 3, `contador=${await headerCount()}`);
  });

  // ── Little Downtown: juice required, free ──
  await tryStep('Little Downtown suco', async () => {
    await page.getByRole('button', { name: 'Ver detalhes de Little Downtown' }).click();
    await sheet.waitFor();
    await page.waitForTimeout(400);
    const ariaDis = await sheet.locator('button[type=submit]').getAttribute('aria-disabled');
    check(A(), 'Little Downtown: botão não se anuncia como desativado quando ainda é clicável', ariaDis !== 'true', `aria-disabled=${ariaDis}`);
    await sheet.locator('button[type=submit]').click({ force: true });
    await page.waitForTimeout(300);
    const err = await sheet.getByRole('alert').first().innerText().catch(() => '');
    check(A(), 'Little Downtown: exige escolher suco', /Suco/i.test(err), `erro="${err}"`);
    await sheet.locator('label', { hasText: 'Uva' }).click();
    await page.waitForTimeout(300);
    const img = await sheet.locator('img').first().getAttribute('src');
    check(A(), 'Little Downtown: foto do cardápio', /\/photos\/little-downtown/.test(img || ''), img);
    const t = await submitText();
    check(A(), 'Little Downtown: suco não é cobrado', parseBRL(t) === PHOTO['Little Downtown'], t);
    await page.screenshot({ path: `${out}/${label}-sheet-little-downtown.png` });
    await sheet.locator('button[type=submit]').click();
    await page.waitForTimeout(400);
  });

  // ── Milkshake: flavour required ──
  await tryStep('Milkshake sabor', async () => {
    await page.evaluate(() => document.getElementById('cat-sobremesas').scrollIntoView());
    await page.getByRole('button', { name: 'Ver detalhes de Milkshake' }).click();
    await sheet.waitFor();
    await page.waitForTimeout(400);
    await sheet.locator('button[type=submit]').click({ force: true });
    await page.waitForTimeout(300);
    const err = await sheet.getByRole('alert').first().innerText().catch(() => '');
    check(A(), 'Milkshake: exige sabor', /sabor/i.test(err), `erro="${err}"`);
    await sheet.locator('label', { hasText: 'Nutella' }).click();
    await page.waitForTimeout(300);
    check(A(), 'Milkshake: foto do cardápio', /\/photos\/milkshake/.test((await sheet.locator('img').first().getAttribute('src')) || ''));
    check(A(), 'Milkshake: preço', parseBRL(await submitText()) === PHOTO.Milkshake, await submitText());
    await page.screenshot({ path: `${out}/${label}-sheet-milkshake.png` });
    await sheet.locator('button[type=submit]').click();
    await page.waitForTimeout(400);
  });

  // ── Quick add every item without options ──
  const quick = ['Bacon Cheddar Fries', 'Croc Canoa', 'Downtown Nuggets', 'Classic Fries', 'Água', 'Água com gás', 'Coca KS', 'Coca KS Zero', 'Água tônica', 'Tubaína', 'Schweppes', 'Guaraná', 'Suco natural One de laranja', 'Pink Lemonade', 'Heineken', 'Praya', 'Praya Clássica', 'Amstel Ultra', 'Lagunitas IPA', 'Blue Moon', 'Eisenbahn', 'Brownie de chocolate com sorvete de creme'];
  let quickOk = 0;
  const quickFail = [];
  for (const name of quick) {
    try {
      const before = await headerCount();
      await page.getByRole('button', { name: `Adicionar ${name}`, exact: true }).click();
      await page.waitForTimeout(250);
      if ((await headerCount()) === before + 1) quickOk++;
      else quickFail.push(name);
    } catch (e) {
      quickFail.push(`${name} (${e.message.split('\n')[0].slice(0, 80)})`);
    }
  }
  check(A(), `adicionar direto: ${quickOk}/${quick.length} itens`, quickOk === quick.length, quickFail.join('; '));

  // ── Add-on picker → Downtown Classic with cheddar preset ──
  await tryStep('Adicional via escolha de burger', async () => {
    await page.evaluate(() => document.getElementById('cat-adicionais').scrollIntoView());
    await page.getByRole('button', { name: /^Cheddar cremoso.*Escolher burger/ }).click();
    await page.locator('dialog[open]').getByRole('button', { name: /Downtown Classic/ }).click();
    await sheet.waitFor();
    await page.waitForTimeout(500);
    const pre = await sheet.getByRole('checkbox', { name: /Cheddar cremoso/ }).isChecked();
    check(A(), 'Adicionais: escolha de burger pré-marca o adicional', pre);
    check(A(), 'Adicionais: preço Classic + cheddar', parseBRL(await submitText()) === PHOTO['Downtown Classic'] + PHOTO['add:Cheddar cremoso'], await submitText());
    await sheet.locator('button[type=submit]').click();
    await page.waitForTimeout(400);
  });

  // ── Cart ──
  const expected =
    PHOTO.Holyfield + // hero quick add
    (PHOTO.Holyfield + PHOTO['add:Blend de carne 160 g'] + PHOTO['add:Cheddar cremoso']) * 2 +
    PHOTO['Little Downtown'] + PHOTO.Milkshake + quick.reduce((s, n) => s + PHOTO[n], 0) +
    PHOTO['Downtown Classic'] + PHOTO['add:Cheddar cremoso'];
  const cart = page.locator('dialog.cart-drawer');
  const cartTotal = async () => parseBRL(await cart.locator('dd').last().innerText());
  await tryStep('Sacola', async () => {
    await page.locator('header button[aria-label*="Abrir sacola"]').click();
    await page.waitForTimeout(700);
    check(A(), 'Sacola: total = soma dos preços da foto', (await cartTotal()) === expected, `site=${brl(await cartTotal())} esperado=${brl(expected)}`);
    await page.screenshot({ path: `${out}/${label}-cart.png` });
    const line = (n) => cart.locator('ul[aria-label="Itens da sacola"] > li', { hasText: n }).first();
    await line('Classic Fries').getByRole('button', { name: 'Aumentar quantidade' }).click();
    await line('Classic Fries').getByRole('button', { name: 'Aumentar quantidade' }).click();
    await page.waitForTimeout(300);
    check(A(), 'Sacola: aumentar quantidade recalcula', (await cartTotal()) === expected + 2 * PHOTO['Classic Fries'], brl(await cartTotal()));
    await line('Classic Fries').getByRole('button', { name: 'Diminuir quantidade', exact: true }).click();
    await page.waitForTimeout(300);
    check(A(), 'Sacola: diminuir quantidade recalcula', (await cartTotal()) === expected + PHOTO['Classic Fries'], brl(await cartTotal()));
    const minusDisabled = await line('Água tônica').getByRole('button', { name: 'Diminuir quantidade', exact: true }).isDisabled();
    check(A(), 'Sacola: "−" desativado em quantidade 1 (remoção pelo botão Remover)', minusDisabled);
    await line('Holyfield').getByRole('button', { name: 'Remover' }).click(); // the plain hero line, added first
    await page.waitForTimeout(400);
    const afterRemove = await cartTotal();
    check(A(), 'Sacola: remover item', afterRemove === expected + PHOTO['Classic Fries'] - PHOTO.Holyfield, brl(afterRemove));
    const undo = page.getByRole('button', { name: 'Desfazer' });
    const undoUsable = await undo.click({ timeout: 3000 }).then(() => true).catch(() => false);
    check(A(), 'Sacola: botão Desfazer acessível com a sacola aberta', undoUsable);
    if (!undoUsable) await line('Diminuir').count(); // keep flow going; restore by re-adding below
    if (!undoUsable) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      await page.locator('[data-copy="0"] button').first().click({ force: true }).catch(() => {});
      await page.locator('header button[aria-label*="Abrir sacola"]').click();
      await page.waitForTimeout(600);
    }
    await page.waitForTimeout(400);
    check(A(), 'Sacola: desfazer remoção', (await cartTotal()) === expected + PHOTO['Classic Fries'], brl(await cartTotal()));
    // Edit Little Downtown juice to laranja
    await line('Little Downtown').getByRole('button', { name: 'Editar' }).click();
    await sheet.waitFor();
    await page.waitForTimeout(400);
    await sheet.locator('label', { hasText: 'Laranja' }).click();
    await sheet.locator('button[type=submit]').click();
    await page.waitForTimeout(500);
    if (!(await cart.evaluate((d) => d.open))) await page.locator('header button[aria-label*="Abrir sacola"]').click();
    await page.waitForTimeout(500);
    check(A(), 'Sacola: editar item (suco → laranja)', /Laranja/.test(await line('Little Downtown').innerText()), (await line('Little Downtown').innerText()).replace(/\s+/g, ' ').slice(0, 90));
    // Message
    await cart.getByLabel(/Seu nome/).fill('Teste Auditoria');
    await cart.getByRole('button', { name: /Gerar mensagem do pedido|Enviar pedido/ }).click();
    await page.waitForTimeout(300);
    const adultErr = await cart.getByRole('alert').innerText().catch(() => '');
    check(A(), 'Sacola: exige declaração 18+ com long neck', /maioridade/i.test(adultErr), adultErr);
    await cart.locator('#adult-check').check();
    await cart.getByRole('button', { name: /Gerar mensagem do pedido/ }).click();
    await page.waitForTimeout(300);
    const msg = await cart.locator('pre').innerText();
    await fs.writeFile(`${out}/${label}-whatsapp.txt`, msg);
    const finalTotal = expected + PHOTO['Classic Fries'];
    check(A(), 'WhatsApp: total na mensagem', msg.includes(`Total: ${brl(finalTotal)}`), `esperado Total: ${brl(finalTotal)}`);
    check(A(), 'WhatsApp: Holyfield 2x + adicionais', msg.includes('2x Holyfield — R$ 139,80') && msg.includes('Adicional: blend de carne 160 g (2x) — R$ 50,00') && msg.includes('Adicional: cheddar cremoso (2x) — R$ 10,00'));
    check(A(), 'WhatsApp: suco incluso', msg.includes('Suco: laranja (incluso)'));
    check(A(), 'WhatsApp: sabor do milkshake', msg.includes('Sabor: nutella'));
    check(A(), 'WhatsApp: nome do cliente', msg.includes('Nome: Teste Auditoria'));
    const lines = msg.split('\n\n').length;
    check(A(), 'WhatsApp: um bloco por item', lines === 2 + (await cart.locator('ul[aria-label="Itens da sacola"] > li').count()), `blocos=${lines}`);
    await page.screenshot({ path: `${out}/${label}-cart-message.png` });
    await cart.getByRole('button', { name: /Copiar mensagem/ }).click();
    await page.waitForTimeout(300);
    const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '');
    check(A(), 'WhatsApp: copiar mensagem', clip === msg);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    check(A(), 'Sacola: Esc fecha', !(await cart.evaluate((d) => d.open)));
  });

  // ── Persistence ──
  await tryStep('Persistência', async () => {
    const before = await headerCount();
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    check(A(), 'Sacola persiste após recarregar', (await headerCount()) === before, `${before} → ${await headerCount()}`);
  });

  // ── Navigation overlay ──
  await tryStep('Menu', async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    const trigger = page.getByRole('button', { name: 'Abrir menu' });
    await trigger.click();
    const nav = page.locator('dialog.nav-overlay');
    await page.waitForTimeout(900);
    check(A(), 'Menu: abre', await nav.evaluate((d) => d.open));
    await page.screenshot({ path: `${out}/${label}-nav-open.png` });
    for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
    const inside = await page.evaluate(() => !!document.activeElement?.closest('dialog.nav-overlay'));
    check(A(), 'Menu: foco preso dentro (12× Tab)', inside);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    check(A(), 'Menu: Esc fecha', !(await nav.evaluate((d) => d.open)));
    const back = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
    check(A(), 'Menu: foco volta ao botão', back === 'Abrir menu', back);
    for (const [label2, id] of [['Cardápio', 'cardapio'], ['Nossa História', 'historia'], ['Localização', 'localizacao'], ['Início', 'inicio']]) {
      await trigger.click();
      await page.waitForTimeout(900);
      await nav.getByRole('link', { name: label2 }).click();
      await page.waitForTimeout(2800);
      const top = await page.evaluate((h) => (h === 'inicio' ? window.scrollY : document.getElementById(h).getBoundingClientRect().top), id);
      check(A(), `Menu: "${label2}" leva à seção`, id === 'inicio' ? top < 5 : Math.abs(top) < 200, `top=${Math.round(top)}`);
    }
  });

  // ── Category nav ──
  await tryStep('Categorias', async () => {
    await page.evaluate(() => document.getElementById('cardapio').scrollIntoView());
    await page.waitForTimeout(600);
    for (const [cat, id] of [['Entradas', 'entradas'], ['Adicionais', 'adicionais'], ['Bebidas', 'bebidas'], ['Long Necks', 'long-necks'], ['Sobremesas', 'sobremesas'], ['Burgers', 'burgers']]) {
      await page.locator(`nav[aria-label="Categorias do cardápio"] button[data-cat="${id}"]`).click();
      await page.waitForTimeout(2500);
      const r = await page.evaluate((i) => {
        const t = document.getElementById(`cat-${i}`).getBoundingClientRect().top;
        const cur = document.querySelector('nav[aria-label="Categorias do cardápio"] [aria-current="true"]')?.dataset.cat;
        return { t, cur };
      }, id);
      check(A(), `Categoria "${cat}": rola e marca ativa`, r.t > -80 && r.t < 320 && r.cur === id, `top=${Math.round(r.t)} ativa=${r.cur}`);
    }
  });

  // ── Hero CTAs ──
  await tryStep('CTAs do hero', async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(800);
    await page.getByRole('link', { name: 'Ver cardápio' }).first().click();
    await page.waitForTimeout(1800);
    const t = await page.evaluate(() => document.getElementById('cardapio').getBoundingClientRect().top);
    check(A(), 'Hero: "Ver cardápio" leva ao cardápio', Math.abs(t) < 200, `top=${Math.round(t)}`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(800);
    await page.locator('[data-copy="0"] button', { hasText: 'Peça agora' }).click();
    await page.waitForTimeout(800);
    check(A(), 'Hero: "Peça agora" abre a sacola (com itens)', await page.locator('dialog.cart-drawer').evaluate((d) => d.open));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  // ── Product sheet dismissal ──
  await tryStep('Fechar ficha', async () => {
    await page.evaluate(() => document.getElementById('cat-burgers').scrollIntoView());
    await page.getByRole('button', { name: 'Ver detalhes de Kill Bill' }).click();
    await sheet.waitFor();
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    check(A(), 'Ficha: Esc fecha', (await page.locator('dialog.product-dialog[open]').count()) === 0);
    await page.getByRole('button', { name: 'Ver detalhes de Kill Bill' }).click();
    await page.waitForTimeout(600);
    await page.locator('dialog.product-dialog[open]').getByRole('button', { name: 'Fechar' }).filter({ visible: true }).first().click();
    await page.waitForTimeout(500);
    check(A(), 'Ficha: botão Fechar', (await page.locator('dialog.product-dialog[open]').count()) === 0);
  });

  check(A(), 'sem erros de console/JS', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

await run('desktop-1440', { width: 1440, height: 900 }, false);
await run('iphone-390', { width: 390, height: 844 }, true);
await browser.close();
await fs.writeFile(`${out}/functional.json`, JSON.stringify(results, null, 2));
const fails = results.filter((r) => !r.ok);
console.log(`\n${results.length - fails.length}/${results.length} passaram`);
