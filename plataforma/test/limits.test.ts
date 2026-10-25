import { beforeEach, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { useFileStorage } from '@/lib/storage';
import { count, record, take } from '@/lib/limits';
import { operatorActive, removeOperator, upsertOperator } from '@/lib/operators';

beforeEach(() => {
  useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'limites-')));
});

describe('limites contra abuso', () => {
  it('deixa passar até o limite, por chave e por janela', async () => {
    for (let i = 0; i < 3; i++) expect(await take('teste', '1.2.3.4', 3, '2026-10-25')).toBe(true);
    expect(await take('teste', '1.2.3.4', 3, '2026-10-25')).toBe(false);
    expect(await take('teste', '5.6.7.8', 3, '2026-10-25')).toBe(true);
    expect(await take('teste', '1.2.3.4', 3, '2026-10-26')).toBe(true);
  });

  it('não guarda o endereço em claro', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'limites-'));
    useFileStorage(dir);
    await record('login-ip', '9.9.9.9', '2026-10-25T10');
    const doc = fs.readFileSync(path.join(dir, 'limites/login-ip/2026-10-25T10.json'), 'utf8');
    expect(doc).not.toContain('9.9.9.9');
    expect(await count('login-ip', '9.9.9.9', '2026-10-25T10')).toBe(1);
  });

  it('conta pedidos concorrentes sem perder nenhum', async () => {
    const results = await Promise.all(Array.from({ length: 8 }, () => take('teste', 'x', 5, 'd')));
    expect(results.filter(Boolean)).toHaveLength(5);
  });
});

describe('sessão da loja', () => {
  it('cai quando o login é removido ou ganha senha nova', async () => {
    await upsertOperator('loja-a', { email: 'caixa@teste.local', name: 'Caixa' }, 'equipe');
    const start = Date.now() + 1;
    expect(await operatorActive('caixa@teste.local', 'loja-a', start)).toBe(true);
    expect(await operatorActive('caixa@teste.local', 'loja-b', start)).toBe(false);
    await new Promise((r) => setTimeout(r, 5));
    await upsertOperator('loja-a', { email: 'caixa@teste.local', name: 'Caixa' }, 'equipe');
    expect(await operatorActive('caixa@teste.local', 'loja-a', start)).toBe(false);
    await removeOperator('loja-a', 'caixa@teste.local');
    expect(await operatorActive('caixa@teste.local', 'loja-a', Date.now())).toBe(false);
  });
});
