// Local end-to-end fixture: El Patron published with online ordering on, store open, one staff login.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const [dataDir, seedFile] = process.argv.slice(2);
const w = (key, data) => { const f = path.join(dataDir, key); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(data)); };
const store = JSON.parse(fs.readFileSync(seedFile, 'utf8'));
store.ordering = { enabled: true, delivery: true, pickup: true, minOrder: 0, eta: '40 a 60 min', pix: true, card: true, cash: true, pixMode: 'demo',
  coupons: [{ code: 'PATRON10', type: 'percent', value: 10, minOrder: 0, active: true, until: '' }, { code: 'VOLTEI', type: 'frete', value: 0, minOrder: 0, active: true, until: '' }],
  areas: [{ id: 'teste-a', name: 'Bairro Teste A', fee: 500 }, { id: 'teste-b', name: 'Bairro Teste B', fee: 800 }] };
const rec = { store, updatedAt: new Date().toISOString(), updatedBy: 'e2e', publishedAt: new Date().toISOString() };
w('lojas/el-patron-burger/rascunho.json', rec);
w('lojas/el-patron-burger/publicado.json', rec);
w('lojas/el-patron-burger/operacao.json', { open: true, updatedAt: null, updatedBy: '' });
const b64 = (b) => Buffer.from(b).toString('base64url');
const salt = crypto.randomBytes(16);
const hash = crypto.pbkdf2Sync('teste-1234-loja', salt, 210000, 32, 'sha256');
const email = 'caixa@teste.local';
const key = crypto.createHash('sha256').update(email).digest('hex');
w(`acessos/${key}.json`, { email, name: 'Caixa Teste', slug: 'el-patron-burger', hash: `pbkdf2.210000.${b64(salt)}.${b64(hash)}`, createdAt: new Date().toISOString(), createdBy: 'e2e' });
console.log('seeded', dataDir);
