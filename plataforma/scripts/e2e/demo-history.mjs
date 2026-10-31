// Demo sales history for the deck's report screenshot (past 29 days, clearly demo data).
import fs from 'node:fs';
import path from 'node:path';
const [dataDir] = process.argv.slice(2);
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const burgers = [['el-patron', 'El Patron', 4799, 5], ['al-capone', 'Al Capone', 3299, 4], ['el-chapo', 'El Chapo', 3199, 3], ['ochoa', 'Ochoa', 2999, 3], ['abadia', 'Abadia', 3199, 2], ['velasquez', 'Velásquez', 3899, 2], ['lucchese', 'Lucchese', 3399, 2], ['gacha', 'Gacha', 1999, 2], ['figueroa', 'Figueroa', 2399, 1]];
const pool = burgers.flatMap((b) => Array(b[3]).fill(b));
const extras = [['batata-completa', 'Batata frita completa', 3299], ['onion-rings', 'Onion rings', 2599], ['coca-2l', 'Coca-Cola 2 L', 1799], ['refri-lata', 'Refrigerante lata', 699]];
const names = ['Marina', 'Rafael', 'Juliana', 'Bruno', 'Camila', 'Diego', 'Larissa', 'Thiago', 'Paula', 'Lucas', 'Aline', 'Gustavo', 'Renata', 'Felipe', 'Bianca', 'Rodrigo', 'Patrícia', 'André'];
const phones = names.map((_, i) => `1197${String(1000000 + i * 7919).slice(-7)}`);
const day = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const now = Date.now();
for (let back = 29; back >= 1; back--) {
  const date = new Date(now - back * 86_400_000);
  const dow = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short' }).format(date);
  const base = { Fri: 16, Sat: 19, Sun: 14, Mon: 5, Tue: 7, Wed: 8, Thu: 10 }[dow];
  const count = Math.round(base * (0.8 + rnd() * 0.4));
  const d = day(date);
  const orders = [];
  for (let n = 1; n <= count; n++) {
    const hour = pick([18, 19, 19, 20, 20, 20, 21, 21, 22, 23]);
    const at = new Date(`${d}T${String(hour).padStart(2, '0')}:${String(Math.floor(rnd() * 60)).padStart(2, '0')}:00-03:00`);
    const lines = [];
    const nb = rnd() < 0.55 ? 2 : rnd() < 0.7 ? 1 : 3;
    for (let i = 0; i < nb; i++) { const [id, name, price] = pick(pool); lines.push({ productId: id, name, quantity: 1, unit: price, total: price, options: [], notes: '' }); }
    if (rnd() < 0.5) { const [id, name, price] = pick(extras); lines.push({ productId: id, name, quantity: 1, unit: price, total: price, options: [], notes: '' }); }
    const subtotal = lines.reduce((s, l) => s + l.total, 0);
    const mode = rnd() < 0.72 ? 'entrega' : 'retirada';
    const fee = mode === 'entrega' ? pick([500, 500, 700, 800]) : 0;
    const coupon = rnd() < 0.12 ? 'PATRON10' : '';
    const discount = coupon ? Math.round(subtotal * 0.1) : 0;
    const method = pick(['pix', 'pix', 'pix', 'cartao', 'cartao', 'dinheiro']);
    const status = rnd() < 0.04 ? 'recusado' : 'concluido';
    const ci = Math.floor(rnd() * names.length);
    orders.push({
      id: `${d.replaceAll('-', '')}-demo${String(n).padStart(5, '0')}`, number: n, tokenHash: 'demo', createdAt: at.toISOString(), updatedAt: at.toISOString(), status,
      history: [{ status: 'novo', at: at.toISOString(), by: 'site' }, { status, at: at.toISOString(), by: 'demo' }],
      customer: { name: names[ci], phone: phones[ci], email: '' }, mode, address: mode === 'entrega' ? { area: 'Bairro Teste A', street: 'Rua Demo, 1', reference: '' } : null,
      payment: { method, status: method === 'pix' ? 'pago' : 'na-entrega', changeFor: null, pix: null, paidAt: method === 'pix' ? at.toISOString() : null },
      lines, subtotal, deliveryFee: fee, feePending: false, discount, coupon, total: subtotal - discount + fee, note: '', optIn: ci % 4 !== 0, reason: status === 'recusado' ? 'Fora da área de entrega' : '',
    });
  }
  const f = path.join(dataDir, 'pedidos/el-patron-burger', `${d}.json`);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(orders));
}
console.log('history ok');
