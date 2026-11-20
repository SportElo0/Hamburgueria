import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { useFileStorage } from '@/lib/storage';
import { LINHA_SAIR, csvDoCrm, linhasDoCrm } from '@/lib/importados';
import { modulosDa, produtoDa } from '@/lib/produto';
import { conversar } from '@/lib/torpedo-servidor';

beforeEach(() => {
  useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'app-')));
  vi.stubEnv('VERCEL', '');
  vi.stubEnv('ANTHROPIC_API_KEY', '');
  vi.stubEnv('CAMPANHA_IA', '');
});
afterEach(() => vi.unstubAllEnvs());

describe('produto sob medida', () => {
  it('reads the product and keeps only known modules', () => {
    expect(produtoDa({ extra: { produto: 'sob-medida' } })).toBe('sob-medida');
    expect(produtoDa({ extra: {} })).toBe('completo');
    expect(modulosDa({ extra: { modulos: ['torpedo', 'xyz', 'clientes'] } })).toEqual(['clientes', 'torpedo']);
    expect(modulosDa({ extra: { modulos: 'clientes' } })).toEqual([]);
  });
});

describe('lista de clientes', () => {
  const clientes = [
    { phone: '11987654321', name: 'Ana', orders: 3, inactiveDays: 40 },
    { phone: '11912345678', name: '=HYPERLINK("x")', orders: 9, inactiveDays: 10 },
  ];
  it('adds the days since the import, the status and sorts by orders', () => {
    const l = linhasDoCrm(clientes, { importadoEm: '2026-11-01T12:00:00Z', agora: new Date('2026-11-11T12:00:00Z'), optOuts: ['11987654321'], enviados: { '11912345678': '2026-11-05T10:00:00Z' } });
    expect(l.map((x) => x.name)).toEqual(['=HYPERLINK("x")', 'Ana']);
    expect(l[1]).toMatchObject({ diasParado: 50, saiu: true, chamadoEm: null });
    expect(l[0]).toMatchObject({ diasParado: 20, saiu: false, chamadoEm: '2026-11-05T10:00:00Z' });
  });
  it('exports a CSV that Excel opens and never runs a formula from a name', () => {
    const csv = csvDoCrm(linhasDoCrm(clientes, { importadoEm: '2026-11-01T12:00:00Z', agora: new Date('2026-11-01T12:00:00Z') }));
    expect(csv.startsWith('﻿Nome;Celular;')).toBe(true);
    expect(csv).toContain(`"'=HYPERLINK(""x"")";11912345678;9;10;;`);
    expect(csv).toContain('Ana;11987654321;3;40;;');
  });
});

describe('torpedo com IA', () => {
  const falas = [{ quem: 'dono' as const, texto: 'o bacon não está saindo, quero promoção hoje' }];
  const cliente = (content: unknown[]) => ({ messages: { create: vi.fn().mockResolvedValue({ content }) } }) as never;

  it('says it is off without the key', async () => {
    const r = await conversar('loja-a', 'Loja A', falas);
    expect(r.ok).toBe(false);
  });

  it('asks back when the AI only talks', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'teste');
    const r = await conversar('loja-a', 'Loja A', falas, { cliente: cliente([{ type: 'text', text: 'Boa! Qual o preço do X-Bacon na promoção?' }]) });
    expect(r).toEqual({ ok: true, resposta: 'Boa! Qual o preço do X-Bacon na promoção?', mensagem: null });
  });

  it('returns the message ready, always with the SAIR line once', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'teste');
    const c = cliente([
      { type: 'text', text: 'Pronto!' },
      { type: 'tool_use', id: 't1', name: 'preparar_mensagem', input: { mensagem: 'Hoje o X-Bacon sai por R$ 25. Bora?\n\nPara não receber mais promoções, responda SAIR.' } },
    ]);
    const r = await conversar('loja-a', 'Loja A', [...falas, { quem: 'ia', texto: 'Qual o preço?' }, { quem: 'dono', texto: 'R$ 25 só hoje' }], { cliente: c });
    expect(r.ok && r.mensagem).toBe(`Hoje o X-Bacon sai por R$ 25. Bora?\n\n${LINHA_SAIR}`);
    const args = (c as unknown as { messages: { create: ReturnType<typeof vi.fn> } }).messages.create.mock.calls[0][0];
    expect(args.messages.map((m: { role: string }) => m.role)).toEqual(['user', 'assistant', 'user']);
    expect(args.system).toContain('nunca invente preço');
  });

  it('refuses a conversation that does not end with the owner', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'teste');
    const r = await conversar('loja-a', 'Loja A', [{ quem: 'ia', texto: 'oi' }], { cliente: cliente([]) });
    expect(r.ok).toBe(false);
  });
});

describe('demonstração', async () => {
  const { DEMOS, clientesDemo, iaSimulada } = await import('@/lib/demo-app');
  const { celularBR } = await import('@/lib/importados');
  const demo = DEMOS['fish-burguer'];

  it('makes the same made-up customers every time, with valid but fake phones', () => {
    const a = clientesDemo();
    expect(a).toEqual(clientesDemo());
    expect(new Set(a.map((c) => c.phone)).size).toBe(a.length);
    expect(a.every((c) => celularBR(c.phone) === c.phone && c.phone.startsWith('1290000'))).toBe(true);
  });

  it('asks what is missing and never invents the offer', () => {
    const f = (...t: string[]) => t.flatMap((texto, i) => (i ? [{ quem: 'ia' as const, texto: '?' }, { quem: 'dono' as const, texto }] : [{ quem: 'dono' as const, texto }]));
    expect(iaSimulada(f('o bacon não está saindo, quero fazer promoção'), demo)).toMatchObject({ mensagem: null, resposta: expect.stringMatching(/Por quanto/) });
    expect(iaSimulada(f('o bacon não está saindo', 'R$ 25'), demo).resposta).toMatch(/até quando/);
    expect(iaSimulada(f('o bacon não está saindo', 'R$ 25 hoje e amanhã'), demo).resposta).toMatch(/delivery/);
    const pronta = iaSimulada(f('o bacon não está saindo', 'R$ 25 hoje e amanhã', 'delivery'), demo);
    expect(pronta.mensagem).toBe(`Oi! Aqui é do Fish Burguer 🍔 Hoje e amanhã, o X-Bacon sai por R$ 25 no delivery. Bora matar a vontade?\n\n${LINHA_SAIR}`);
  });

  it('writes a "we miss you" message without any discount', () => {
    const r = iaSimulada([{ quem: 'dono', texto: 'Quero chamar de volta quem sumiu, sem desconto' }], demo);
    expect(r.mensagem).toMatch(/Fish Burguer/);
    expect(r.mensagem).not.toMatch(/R\$|desconto|%/);
  });
});
