// Gera o hash de senha para a variável ADMIN_USERS.
//   npm run hash-senha -- "sua senha"
import { webcrypto as crypto } from 'node:crypto';

const password = process.argv[2];
if (!password || password.length < 10) {
  console.error('Use uma senha com pelo menos 10 caracteres: npm run hash-senha -- "sua senha"');
  process.exit(1);
}
const enc = new TextEncoder();
const b64url = (b) => Buffer.from(b).toString('base64url');
const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 210000 }, key, 256);
console.log(`pbkdf2.210000.${b64url(salt)}.${b64url(new Uint8Array(bits))}`);
