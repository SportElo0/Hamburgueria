import { beforeEach, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { storage, useFileStorage } from '@/lib/storage';
import { limpezaDiaria } from '@/lib/limpeza';

// Thursday 5 Nov 2026, 3 a.m. in São Paulo.
const AGORA = new Date('2026-11-05T03:00:00-03:00');
const pessoa = (id: string) => ({ id, date: '', time: '19:00', people: 2, name: 'Ana Souza', phone: '11988887777', email: 'ana@exemplo.com' });

let raiz = '';
beforeEach(() => {
  raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'limpeza-'));
  useFileStorage(raiz);
});

describe('limpeza diária', () => {
  it('apaga nome, telefone e e-mail de reservas mais velhas que o prazo da loja (6 meses por padrão), mesmo sem reserva nova', async () => {
    await storage().writeJSON('reservas/loja-a/2026-03-01.json', [pessoa('r1')]);
    await storage().writeJSON('reservas/loja-a/2026-10-30.json', [pessoa('r2')]);
    const r = await limpezaDiaria(AGORA);
    expect(r).toMatchObject({ feito: 'ok', reservas: 1 });
    const velha = (await storage().readJSON<ReturnType<typeof pessoa>[]>('reservas/loja-a/2026-03-01.json'))!.data[0];
    expect(velha).toMatchObject({ id: 'r1', name: 'Dados apagados', phone: '', email: '', people: 2 });
    const nova = (await storage().readJSON<ReturnType<typeof pessoa>[]>('reservas/loja-a/2026-10-30.json'))!.data[0];
    expect(nova.name).toBe('Ana Souza');
  });

  it('apaga os dias antigos da fila de espera e mantém o de hoje', async () => {
    await storage().writeJSON('fila/loja-b/2026-11-01.json', [{ id: 'q1', name: 'Bia', phone: '11977776666' }]);
    await storage().writeJSON('fila/loja-b/2026-11-05.json', [{ id: 'q2', name: 'Caio', phone: '' }]);
    await limpezaDiaria(AGORA);
    expect(await storage().readJSON('fila/loja-b/2026-11-01.json')).toBeNull();
    expect(await storage().readJSON('fila/loja-b/2026-11-05.json')).not.toBeNull();
  });

  it('roda uma vez por dia', async () => {
    expect((await limpezaDiaria(AGORA)).feito).toBe('ok');
    expect((await limpezaDiaria(new Date('2026-11-05T23:00:00-03:00'))).feito).toBe('ja-feito');
    expect((await limpezaDiaria(new Date('2026-11-06T03:00:00-03:00'))).feito).toBe('ok');
  });

  it('não usa o prazo padrão quando não consegue ler a loja: pula, não apaga e tenta de novo em 1 hora', async () => {
    await storage().writeJSON('reservas/loja-c/2026-03-01.json', [pessoa('r9')]);
    // A store whose settings can't be read (a database hiccup, here a broken file).
    fs.mkdirSync(path.join(raiz, 'lojas/loja-c'), { recursive: true });
    fs.writeFileSync(path.join(raiz, 'lojas/loja-c/publicado.json'), '{quebrado');
    const r = await limpezaDiaria(AGORA);
    expect(r.falhas).toEqual(['reservas/loja-c']);
    const intacta = (await storage().readJSON<ReturnType<typeof pessoa>[]>('reservas/loja-c/2026-03-01.json'))!.data[0];
    expect(intacta.name).toBe('Ana Souza');
    expect((await limpezaDiaria(new Date(AGORA.getTime() + 30 * 60_000))).feito).toBe('ja-feito');
    fs.rmSync(path.join(raiz, 'lojas/loja-c/publicado.json'));
    expect((await limpezaDiaria(new Date(AGORA.getTime() + 61 * 60_000))).feito).toBe('ok');
    const agora = (await storage().readJSON<ReturnType<typeof pessoa>[]>('reservas/loja-c/2026-03-01.json'))!.data[0];
    expect(agora.name).toBe('Dados apagados');
  });
});
