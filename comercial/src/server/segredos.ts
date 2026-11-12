import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/** Company credentials are stored encrypted (AES-256-GCM, Node's own crypto) with a key that lives only in the environment. */
function chave(): Buffer {
  const k = Buffer.from(process.env.CHAVE_CREDENCIAIS ?? '', 'base64');
  if (k.length !== 32) throw new Error('CHAVE_CREDENCIAIS ausente ou inválida (32 bytes em base64).');
  return k;
}

export function cifrar(obj: Record<string, string>): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', chave(), iv);
  const corpo = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()]);
  return ['v1', iv.toString('base64'), c.getAuthTag().toString('base64'), corpo.toString('base64')].join('.');
}

export function decifrar(texto: string | null): Record<string, string> {
  if (!texto) return {};
  const [v, iv, tag, corpo] = texto.split('.');
  if (v !== 'v1') throw new Error('Formato de credencial desconhecido.');
  const d = createDecipheriv('aes-256-gcm', chave(), Buffer.from(iv, 'base64'));
  d.setAuthTag(Buffer.from(tag, 'base64'));
  return JSON.parse(Buffer.concat([d.update(Buffer.from(corpo, 'base64')), d.final()]).toString('utf8'));
}

/** What the screen may show of a secret: only that it exists and its last characters. */
export const mascarar = (v: string | undefined) => (v ? `••••${v.slice(-4)}` : '');

export const novoToken = (bytes = 24) => randomBytes(bytes).toString('base64url');
/** Tokens (invitation, chat, review) are stored only as a hash. */
export const hashToken = (t: string) => createHash('sha256').update(t).digest('hex');
export function iguais(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
