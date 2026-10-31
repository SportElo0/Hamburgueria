// Compares every item rendered on the live menu against a transcription of the printed menu photo.
import { chromium } from 'playwright-core';
const base = process.argv[2];
// Transcribed by reading the photographed menu (names, descriptions as printed, prices in BRL).
const PHOTO = [
  ['Bacon Cheddar Fries', 'Batata frita palito fininha (300 g), cheddar e bacon.', 'R$ 34,90'],
  ['Croc Canoa', 'Batata frita canoa (300 g), cream cheese, bacon e cebolinha.', 'R$ 39,90'],
  ['Downtown Nuggets', '5 unidades de nuggets, acompanhadas de molho da casa.', 'R$ 24,90'],
  ['Classic Fries', 'Batata frita palito (300 g). acompanhada de molho da casa.', 'R$ 23,90'],
  ['Cheddar cremoso', '', 'R$ 5,00'], ['Cream cheese', '', 'R$ 5,00'], ['Queijo prato', '', 'R$ 5,00'],
  ['Maionese artesanal', '', 'R$ 5,00'], ['Salada (alface, tomate e cebola)', '', 'R$ 5,00'], ['Blend de carne 160 g', '', 'R$ 25,00'],
  ['Downtown Classic', 'Pão brioche, blend bovino 180 g, queijo prato e maionese da casa.', 'R$ 39,90'],
  ['The Bacon Street', 'Pão brioche, blend bovino 180 g, queijo prato, bacon, alface americana, tomate, cebola roxa e maionese da casa.', 'R$ 44,90'],
  ['Australian Cheddar', 'Pão australiano, blend bovino 180 g, queijo cheddar, bacon, cebola caramelizada e maionese da casa.', 'R$ 58,90'],
  ['Kill Bill', 'Pão australiano, blend bovino 180 g, queijo cheddar, bacon, rúcula, tomate, cebola roxa e maionese da casa.', 'R$ 58,90'],
  ['Golden Chicken', 'Pão brioche, sobrecoxa desossada empanada, queijo prato e coleslaw com maionese da casa.', 'R$ 49,90'],
  ['Holyfield', 'Pão brioche, dois blends bovinos de 130 g cada, queijo prato, bacon, alface americana, tomate, cebola roxa e maionese da casa.', 'R$ 69,90'],
  ['Green Burger', 'Pão brioche, burger à base de plantas, queijo prato, alface americana, tomate, cebola roxa e maionese da casa.', 'R$ 59,90'],
  ['Little Downtown', 'Pão brioche, blend bovino 100 g e queijo prato. Acompanha batata frita e suco de uva ou laranja.', 'R$ 39,90'],
  ['Água', '', 'R$ 6,00'], ['Água com gás', '', 'R$ 10,00'], ['Coca KS', '', 'R$ 12,00'], ['Coca KS Zero', '', 'R$ 12,00'],
  ['Água tônica', '', 'R$ 10,00'], ['Tubaína', '', 'R$ 12,00'], ['Schweppes', '', 'R$ 12,00'], ['Guaraná', '', 'R$ 10,00'],
  ['Suco natural One de laranja', '', 'R$ 12,00'], ['Pink Lemonade', '', 'R$ 15,00'],
  ['Heineken', '', 'R$ 15,00'], ['Praya', '', 'R$ 15,00'], ['Praya Clássica', '', 'R$ 15,00'], ['Amstel Ultra', '', 'R$ 15,00'],
  ['Lagunitas IPA', '', 'R$ 18,00'], ['Blue Moon', '', 'R$ 18,00'], ['Eisenbahn', '', 'R$ 13,00'],
  ['Brownie de chocolate com sorvete de creme', '', 'R$ 34,90'],
  ['Milkshake', 'Morango ou Nutella ou baunilha', 'R$ 34,90'],
];
const norm = (s) => s.toLowerCase().normalize('NFC').replace(/\s+/g, ' ').replace(/[.]/g, '').trim();
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(base, { waitUntil: 'networkidle' });
const items = await p.evaluate(() => {
  const out = [];
  document.querySelectorAll('#cardapio article, #cardapio li').forEach((el) => {
    const name = el.querySelector('h4, .cond.text-\\[1\\.2rem\\], .cond.text-\\[1\\.25rem\\]')?.textContent?.trim();
    if (!name) return;
    const priceEl = el.querySelector('[aria-label^="R$"]');
    const text = el.textContent.replace(/\s+/g, ' ');
    const price = priceEl ? priceEl.getAttribute('aria-label') : (text.match(/R\$\s?[\d.]+,\d{2}/) || [''])[0].replace('R$', 'R$ ').replace('  ', ' ');
    const desc = el.querySelector('p')?.textContent?.trim() || '';
    out.push({ name, price: price.replace(/ /g, ' '), desc });
  });
  return out;
});
let ok = 0;
const issues = [];
for (const [name, desc, price] of PHOTO) {
  const it = items.find((i) => norm(i.name) === norm(name));
  if (!it) { issues.push(`AUSENTE no site: ${name}`); continue; }
  const pOk = it.price === price;
  const dOk = !desc || norm(it.desc) === norm(desc);
  if (pOk && dOk) ok++;
  else issues.push(`${name}: ${pOk ? '' : `preço site="${it.price}" foto="${price}" `}${dOk ? '' : `descrição site="${it.desc}" foto="${desc}"`}`);
}
const extra = items.filter((i) => !PHOTO.some(([n]) => norm(n) === norm(i.name))).map((i) => i.name);
console.log(`itens na foto: ${PHOTO.length} | no site: ${items.length} | iguais: ${ok}`);
console.log(issues.length ? 'DIVERGÊNCIAS:\n- ' + issues.join('\n- ') : 'nenhuma divergência');
console.log(extra.length ? 'EXTRAS no site (não estão na foto): ' + extra.join(', ') : 'nenhum item extra');
await b.close();
