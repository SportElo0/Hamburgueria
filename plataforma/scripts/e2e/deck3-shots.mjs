// Screenshots for the El Patron proposal deck (local demo data).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [OUT, SITE = 'http://localhost:4313/', PANEL = 'http://localhost:3100'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const jpg = (p, name, opts = {}) => p.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 88, ...opts });
const m = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

// Desktop hero.
const dsk = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.5 });
await dsk.goto(SITE, { waitUntil: 'load' });
await dsk.waitForTimeout(4000);
await jpg(dsk, 'site-d');

// Mobile: menu tabs, "ver por dentro".
await m.goto(SITE, { waitUntil: 'load' });
await m.waitForTimeout(3500);
await jpg(m, 'site-m');
await m.evaluate(() => document.getElementById('cardapio').scrollIntoView());
await m.waitForTimeout(800);
await m.getByRole('tab', { name: 'Chefões' }).click();
await m.waitForTimeout(800);
await m.evaluate(() => window.scrollBy(0, -60));
await m.waitForTimeout(500);
await jpg(m, 'menu-m');
await m.getByRole('button', { name: 'Personalizar' }).first().click().catch(async () => {
  await m.locator('#cat-chefoes button', { hasText: 'El Patron' }).first().click();
});
await m.waitForTimeout(900);
const dentro = m.getByRole('button', { name: 'Ver por dentro' });
if (await dentro.count()) { await dentro.first().click(); await m.waitForTimeout(2200); }
await jpg(m, 'dentro-m');
await m.keyboard.press('Escape');

// Order with coupon on Pix (delivery) -> checkout + pix screen.
const order = async (name, phone, items, opts) => {
  await m.goto(SITE, { waitUntil: 'load' });
  await m.waitForTimeout(2500);
  await m.evaluate(() => document.getElementById('cardapio').scrollIntoView());
  for (const [tab, label] of items) {
    await m.getByRole('tab', { name: tab }).click();
    await m.waitForTimeout(400);
    await m.getByRole('button', { name: `Adicionar ${label}` }).click();
    await m.waitForTimeout(600);
    if (await m.locator('dialog[open] form').count()) { await m.locator('dialog[open] form button[type=submit]').click(); await m.waitForTimeout(500); }
  }
  await m.waitForTimeout(5500);
  await m.evaluate(() => document.querySelector('button[aria-label*="Abrir sacola"]').click());
  await m.waitForTimeout(700);
  await m.getByRole('button', { name: 'Continuar' }).click();
  const f = m.locator('dialog[open] form');
  await f.getByLabel('Seu nome').fill(name);
  await f.getByLabel('Telefone (WhatsApp)').fill(phone);
  if (opts.pickup) await f.getByText('Retirar no local', { exact: true }).click();
  else { await f.getByLabel('Bairro').selectOption('teste-a'); await f.getByLabel('Endereço').fill('Rua Antônio Agú, 255'); }
  await f.getByText(opts.pay, { exact: true }).click();
  if (opts.coupon) { await f.getByLabel(/Cupom de desconto/).fill(opts.coupon); await f.getByRole('button', { name: 'Aplicar' }).click(); await m.waitForTimeout(1200); }
  if (opts.shot) { await f.locator('.scroll-cream').evaluate((el) => el.scrollTo(0, el.scrollHeight)); await m.waitForTimeout(300); await jpg(m, opts.shot); }
  await f.locator('button[type=submit]').click();
  await m.waitForURL(/\/pedido/, { timeout: 15000 });
  await m.waitForTimeout(2500);
  return m.url();
};
const u1 = await order('Marina', '11 98765-4321', [['Chefões', 'El Patron'], ['Porções', 'Batata frita completa']], { pay: 'Pix', coupon: 'PATRON10', shot: 'checkout-cupom-m' });
await jpg(m, 'pix-m');
await m.getByRole('button', { name: /Simular pagamento/ }).click();
await m.waitForTimeout(1500);
await order('Rafael', '11 97654-3210', [['Especiais', 'Velásquez'], ['Bebidas', 'Coca-Cola 2 L']], { pickup: true, pay: 'Cartão no balcão' });
await order('Juliana', '11 96543-2109', [['Chefões', 'El Chapo'], ['Chefões', 'Ochoa']], { pay: 'Dinheiro' });

// Store screen.
const d = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1.5 });
await d.goto(`${PANEL}/login`);
await d.locator('input[name=email]').fill('caixa@teste.local');
await d.locator('input[name=senha]').fill('teste-1234-loja');
await d.locator('button[type=submit]').click();
await d.waitForURL(/\/loja\//);
await d.waitForTimeout(2500);
const card = (n) => d.locator('article', { hasText: `#${n} ·` });
await card(1).getByRole('button', { name: 'Aceitar pedido' }).click();
await d.waitForTimeout(1200);
await card(1).getByRole('button', { name: 'Saiu para entrega' }).click();
await d.waitForTimeout(1200);
await card(2).getByRole('button', { name: 'Aceitar pedido' }).click();
await d.waitForTimeout(5500);
await jpg(d, 'loja-d');
await d.getByRole('button', { name: /^Esgotados/ }).click();
await d.waitForTimeout(500);
await d.getByLabel('Abadia esgotado').check();
await d.getByLabel('Lucchese esgotado').check();
await d.waitForTimeout(1500);
await jpg(d, 'esgotados-d');
await d.getByRole('button', { name: 'Fechar' }).click();
await d.goto(`${PANEL}/loja/el-patron-burger/relatorio?dias=30`);
await d.waitForTimeout(1200);
await jpg(d, 'relatorio-d', { fullPage: true });

// Customer tracking.
await m.goto(u1, { waitUntil: 'load' });
await m.waitForTimeout(3000);
await jpg(m, 'acompanha-m');

// Team: coupons card.
const t = await b.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1.5 });
await t.goto(`${PANEL}/login`);
await t.locator('input[name=email]').fill('equipe@teste.local');
await t.locator('input[name=senha]').fill('equipe-teste-123');
await t.locator('button[type=submit]').click();
await t.waitForURL(/\/painel/);
await t.goto(`${PANEL}/painel/lojas/el-patron-burger?aba=online`);
await t.waitForTimeout(1500);
await t.getByLabel('Código').fill('PRIMEIRA');
await t.getByLabel('Tipo').selectOption('fixed');
await t.getByLabel('Desconto R$').fill('5');
await t.getByLabel('Mínimo R$').fill('40');
await t.getByRole('button', { name: 'Criar cupom' }).click();
await t.waitForTimeout(500);
await t.locator('section', { hasText: 'Cupons de desconto' }).screenshot({ path: `${OUT}/cupons-d.jpg`, type: 'jpeg', quality: 90 });
await b.close();
console.log('ok');
