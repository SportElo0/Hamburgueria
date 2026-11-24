import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { useFileStorage } from '@/lib/storage';
import { centavosDe, csvDoCrm, pareceCpf, soDigitosFone, totais, type ClienteCrm } from '@/lib/crm';
import { listarClientesCrm, mudarCrm } from '@/lib/crm-servidor';

beforeEach(() => {
  useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'crm-')));
  vi.stubEnv('VERCEL', '');
});
afterEach(() => vi.unstubAllEnvs());

const cli = (o: Partial<ClienteCrm>): ClienteCrm => ({ id: 'a', negocio: 'Loja A', contato: '', whatsapp: '', cidade: '', situacao: 'cliente', vendas: [], notas: [], criadoEm: '', atualizadoEm: '', ...o });

describe('crm da Growlift', () => {
  it('reads prices typed the Brazilian way', () => {
    expect(centavosDe('80')).toBe(8000);
    expect(centavosDe('147,00')).toBe(14700);
    expect(centavosDe('R$ 1.200,5')).toBe(120050);
    expect(centavosDe('abc')).toBeNaN();
    expect(centavosDe('12,345')).toBeNaN();
  });

  it('refuses CPF but not phones', () => {
    expect(pareceCpf('cliente 123.456.789-09')).toBe(true);
    expect(pareceCpf('CPF 12345678909')).toBe(true);
    expect(pareceCpf('Whats 12991234567')).toBe(false);
    expect(soDigitosFone('+55 (12) 99123-4567')).toBe('12991234567');
    expect(soDigitosFone('123')).toBe('');
  });

  it('adds up the month, what is owed and the monthly fees', () => {
    const v = (o: object) => ({ id: Math.random().toString(), produto: 'plaquinha-nfc' as const, descricao: '', valor: 8000, data: '2026-11-10', pago: true, mensal: false, vencimento: null, ...o });
    const lista = [
      cli({ id: 'a', vendas: [v({}), v({ pago: false }), v({ data: '2026-10-02' })] }),
      cli({ id: 'b', vendas: [v({ produto: 'app', valor: 14700, mensal: true, data: '2026-10-15', pago: true })] }),
      cli({ id: 'c', situacao: 'possivel' }),
    ];
    const t = totais(lista, '2026-11');
    expect(t).toMatchObject({ clientes: 2, possiveis: 1, aReceber: 8000, recorrente: 14700 });
    expect(t.vendidoNoMes).toBe(8000 + 8000 + 14700);
    expect(t.totalVendido).toBe(8000 * 3 + 14700);
  });

  it('exports a safe CSV', () => {
    const csv = csvDoCrm([cli({ negocio: '=cmd', vendas: [{ id: '1', produto: 'google', descricao: 'perfil', valor: 12000, data: '2026-11-20', pago: false, mensal: false, vencimento: null }] })]);
    expect(csv).toContain(`'=cmd;;;;Cliente;Perfil no Google;perfil;120,00;2026-11-20;não;não;`);
  });

  it('saves with the etag and keeps every change', async () => {
    await mudarCrm((l) => [...l, cli({ id: 'x' })]);
    await Promise.all([mudarCrm((l) => [...l, cli({ id: 'y' })]), mudarCrm((l) => [...l, cli({ id: 'z' })])]);
    expect((await listarClientesCrm()).map((c) => c.id).sort()).toEqual(['x', 'y', 'z']);
  });

  it('does not write on a preview deployment', async () => {
    vi.stubEnv('VERCEL', '1');
    vi.stubEnv('VERCEL_ENV', 'preview');
    await expect(mudarCrm((l) => l)).rejects.toThrow(/prévia/);
  });
});
