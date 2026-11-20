import { beforeEach, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { ConflictError, useFileStorage } from '@/lib/storage';
import { conferirPin, criarPin, gravarDados, lerDados, validar } from '@/lib/viagem';

describe('caixa portugal (viagem)', () => {
  beforeEach(() => useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'viagem-'))));

  it('sem PIN pede para criar; o PIN só pode ser criado uma vez', async () => {
    expect(await conferirPin('123456')).toBe('sem-pin');
    expect(await criarPin('12a')).toBe('invalido');
    expect(await criarPin('482913')).toBe('ok');
    expect(await criarPin('000000')).toBe('existe');
    expect(await conferirPin('482913')).toBe('ok');
    expect(await conferirPin('000000')).toBe('errado');
  });

  it('trava depois de 8 erros em 15 minutos e destrava depois', async () => {
    await criarPin('482913');
    const t = 1_800_000_000_000;
    for (let i = 0; i < 7; i++) expect(await conferirPin('111111', t + i)).toBe('errado');
    expect(await conferirPin('111111', t + 8)).toBe('travado');
    expect(await conferirPin('482913', t + 9)).toBe('travado');
    expect(await conferirPin('482913', t + 16 * 60 * 1000)).toBe('ok');
  });

  it('grava com etag, recusa gravação velha e limpa o que não é do formato', async () => {
    await criarPin('482913');
    const a = await lerDados();
    const dados = a.dados as { entradas: unknown[] };
    const r = await gravarDados({ ...dados, entradas: [{ valor: 120000, data: '2026-11-10', pessoa: 0, origem: 'site', descricao: 'Site\u0007 da Clima', hack: 'x' }] }, a.etag);
    expect(r.dados.entradas[0]).toMatchObject({ valor: 120000, pessoa: 0, origem: 'site' });
    expect(r.dados.entradas[0].descricao).toBe('Site  da Clima');
    expect(r.dados.entradas[0]).not.toHaveProperty('hack');
    await expect(gravarDados(dados, a.etag)).rejects.toBeInstanceOf(ConflictError);
    expect(validar({ entradas: [{ valor: -5, pessoa: 9, origem: 'x' }] }).entradas[0]).toMatchObject({ valor: 0, pessoa: 2, origem: 'outro' });
  });
});
