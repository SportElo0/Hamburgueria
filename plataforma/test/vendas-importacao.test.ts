import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { storage, useFileStorage } from '@/lib/storage';
import { listarLeads } from '@/lib/oportunidades/dados';
import { analisarContato, nomeExibicao } from '@/lib/vendas/regras';
import {
  bloquearManual,
  completarContato,
  contatoPorId,
  criarContato,
  gerarRascunho,
  importarLeads,
  listarContatos,
  prepararRascunhosEmLote,
  situacaoNoCrm,
  sincronizarComOportunidade,
} from '@/lib/vendas/dados';

/** Fictitious leads, in the shape Oportunidades stores them: place ID + the team's findings, nothing from Google. */
const lead = (placeId: string, extra: Record<string, unknown> = {}) => ({
  placeId,
  cidade: 'Ilhabela',
  uf: 'SP',
  bairro: '',
  segmento: 'padarias',
  categoria: 'site-com-problemas',
  categoriaRevisada: false,
  sinais: ['Sem HTTPS (cadeado)'],
  checadoEm: '2026-11-01T12:00:00.000Z',
  verificacao: { situacao: 'pendente', fontes: [], links: '' },
  observacoes: '',
  situacao: 'nova',
  criadoEm: '2026-11-01T12:00:00.000Z',
  pesquisaId: 'p1',
  ...extra,
});

async function semear(n = 60, especiais: Record<string, Record<string, unknown>> = {}) {
  const doc: Record<string, unknown> = {};
  for (let i = 0; i < n; i++) {
    const id = `PlaceImport${String(i).padStart(4, '0')}`;
    doc[id] = lead(id, especiais[id] ?? {});
  }
  await storage().writeJSON('oportunidades/lugares.json', doc);
  return Object.keys(doc);
}

const completo = { negocio: 'Padaria Exemplo', email: 'contato@padariaexemplo.com.br', fonteTipo: 'instagram', fonteUrl: 'https://instagram.com/padariaexemplo', conferido: true };

beforeEach(() => {
  useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'importacao-')));
  vi.stubEnv('SESSION_SECRET', 'segredo-de-teste-com-mais-de-32-caracteres!!');
  vi.stubEnv('VERCEL', '');
  vi.stubEnv('VENDAS_IA', '');
  vi.stubGlobal(
    'fetch',
    vi.fn(() => {
      throw new Error('rede proibida nos testes');
    }),
  );
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('importar Oportunidades para o CRM', () => {
  it('importa 60 elegíveis de uma vez, como "Aguardando qualificação", só com o place ID e os dados da equipe', async () => {
    const ids = await semear(60);
    const r = await importarLeads('elegiveis', 'ana');
    expect(r.importadas).toHaveLength(60);
    expect(r.jaCadastradas).toHaveLength(0);
    const contatos = await listarContatos();
    expect(contatos).toHaveLength(60);
    for (const c of contatos) {
      expect(c).toMatchObject({ etapa: 'qualificar', origem: 'importado', negocio: '', email: '', fonte: null, cidade: 'Ilhabela', segmento: 'padarias' });
      expect(ids).toContain(c.placeId);
    }
    // Nothing that looks like Google's name, address, phone or site is stored.
    const bruto = JSON.stringify(await storage().readJSON('vendas/contatos.json'));
    expect(bruto).not.toMatch(/displayName|formattedAddress|telefone|websiteUri|nationalPhone/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rodar duas vezes (ou duas ao mesmo tempo) não duplica nada', async () => {
    await semear(20);
    const [a, b] = await Promise.all([importarLeads('elegiveis', 'ana'), importarLeads('elegiveis', 'bia')]);
    expect(a.importadas.length + b.importadas.length).toBe(20);
    expect(a.jaCadastradas.length + b.jaCadastradas.length).toBe(20);
    const de_novo = await importarLeads('elegiveis', 'ana');
    expect(de_novo.importadas).toHaveLength(0);
    expect(de_novo.jaCadastradas).toHaveLength(20);
    const contatos = await listarContatos();
    expect(contatos).toHaveLength(20);
    expect(new Set(contatos.map((c) => c.placeId)).size).toBe(20);
  });

  it('respeita Descartada, Não contatar, bloqueio, site próprio e fechado definitivamente', async () => {
    const ids = await semear(8, {
      PlaceImport0000: { situacao: 'descartada' },
      PlaceImport0001: { situacao: 'nao-contatar' },
      PlaceImport0002: { categoria: 'site-proprio' },
      PlaceImport0003: { categoria: 'incerta', sinais: ['O Google marca como fechado definitivamente.'] },
      PlaceImport0004: { categoria: 'sem-site' },
      PlaceImport0005: { categoria: 'sem-site', verificacao: { situacao: 'confirmado', fontes: ['instagram', 'busca-google'], links: '' } },
    });
    // a business blocked earlier (e.g. opted out) never comes back
    const c = await criarContato({ ...completo, placeId: 'PlaceImport0006' }, 'ana');
    const { bloquearContato } = await import('@/lib/vendas/dados');
    await bloquearContato(c.id, 'Pediu para sair', 'descadastro', 'o próprio negócio');
    const r = await importarLeads({ placeIds: [...ids, 'PlaceNaoExiste01'] }, 'ana');
    const motivos = Object.fromEntries(r.ignoradas.map((x) => [x.placeId, x.motivo]));
    expect(motivos).toMatchObject({
      PlaceImport0000: 'Descartada',
      PlaceImport0001: 'Não contatar',
      PlaceImport0002: 'Já tem site próprio funcionando',
      PlaceImport0003: 'Fechado definitivamente no Google',
      PlaceNaoExiste01: 'Não está na lista de Oportunidades',
    });
    // 0006 is already in the CRM (blocked contact): counted as already registered, not imported again
    expect(r.jaCadastradas.map((x) => x.placeId)).toEqual(['PlaceImport0006']);
    expect(r.importadas.map((x) => x.placeId).sort()).toEqual(['PlaceImport0004', 'PlaceImport0005', 'PlaceImport0007']);
    expect(r.pendentesVerificacao).toBe(1);
    const semSite = (await listarContatos()).find((x) => x.placeId === 'PlaceImport0004')!;
    expect(semSite.categoria).toBe('incerta');
  });

  it('importa só as selecionadas e a prévia da tela conta as elegíveis', async () => {
    const ids = await semear(10, { PlaceImport0009: { situacao: 'nao-contatar' } });
    expect((await situacaoNoCrm()).elegiveis).toHaveLength(9);
    const r = await importarLeads({ placeIds: ids.slice(0, 3) }, 'ana');
    expect(r.importadas).toHaveLength(3);
    const s = await situacaoNoCrm();
    expect(Object.keys(s.noCrm)).toHaveLength(3);
    expect(s.elegiveis).toHaveLength(6);
    await expect(importarLeads({ placeIds: [] }, 'ana')).rejects.toThrow(/Nenhuma/);
  });

  it('na prévia da Vercel a importação é recusada', async () => {
    await semear(3);
    vi.stubEnv('VERCEL', '1');
    vi.stubEnv('VERCEL_ENV', 'preview');
    await expect(importarLeads('elegiveis', 'ana')).rejects.toThrow(/prévia/);
  });
});

describe('qualificar e preparar abordagens', () => {
  it('sem nome, e-mail e fonte não sai texto nenhum; depois de completar, sai', async () => {
    await semear(1);
    const { importadas } = await importarLeads('elegiveis', 'ana');
    const id = importadas[0].id;
    await expect(gerarRascunho(id, 'primeiro', 'ana')).rejects.toThrow(/Complete o contato/);
    await expect(completarContato(id, { ...completo, fonteUrl: 'https://maps.app.goo.gl/x' }, 'ana')).rejects.toThrow(/Google/);
    await expect(completarContato(id, { ...completo, email: 'padaria@gmail.com' }, 'ana')).rejects.toThrow(/Gmail/);
    const c = await completarContato(id, completo, 'ana');
    expect(c).toMatchObject({ etapa: 'novo', negocio: 'Padaria Exemplo', fonte: { tipo: 'instagram' } });
    expect((await gerarRascunho(id, 'primeiro', 'ana')).rascunhos[0].corpo).toContain('Padaria Exemplo');
  });

  it('e-mail que já está em outro contato é recusado', async () => {
    await semear(2);
    const { importadas } = await importarLeads('elegiveis', 'ana');
    await completarContato(importadas[0].id, completo, 'ana');
    await expect(completarContato(importadas[1].id, completo, 'ana')).rejects.toThrow(/outro contato/);
  });

  it('e-mail bloqueado não entra na qualificação', async () => {
    await semear(1);
    const { importadas } = await importarLeads('elegiveis', 'ana');
    await bloquearManual({ valor: 'padariaexemplo.com.br', motivo: 'Pediu por telefone' }, 'ana');
    await expect(completarContato(importadas[0].id, completo, 'ana')).rejects.toThrow(/bloqueio/);
  });

  it('"Preparar abordagens" faz rascunho só para quem está completo, sem enviar nada', async () => {
    await semear(5);
    const { importadas } = await importarLeads('elegiveis', 'ana');
    await completarContato(importadas[0].id, completo, 'ana');
    await completarContato(importadas[1].id, { ...completo, negocio: 'Outra Padaria', email: 'oi@outrapadaria.com.br' }, 'ana');
    const r = await prepararRascunhosEmLote('ana');
    expect(r.gerados).toBe(2);
    const contatos = await listarContatos();
    expect(contatos.filter((c) => c.etapa === 'em-aprovacao')).toHaveLength(2);
    expect(contatos.filter((c) => c.etapa === 'qualificar')).toHaveLength(3);
    expect((await prepararRascunhosEmLote('ana')).gerados).toBe(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('a análise usa só os dados da equipe e diz o que falta', async () => {
    await semear(1, { PlaceImport0000: { categoria: 'sem-site', verificacao: { situacao: 'confirmado', fontes: ['instagram', 'busca-google'], links: '' } } });
    const { importadas } = await importarLeads('elegiveis', 'ana');
    const c = (await contatoPorId(importadas[0].id))!;
    const a = analisarContato(c, (await listarLeads())[0].verificacao);
    expect(a).toMatchObject({ prioridade: 'alta', plano: 'Grow', pronto: false });
    expect(a.falta).toEqual(['Nome do negócio (do site ou da rede dele)', 'E-mail comercial', 'Link da fonte do e-mail']);
    expect(nomeExibicao(c)).toBe('Padarias em Ilhabela (sem nome ainda)');
  });

  it('marcar "Não contatar" ou "Descartada" em Oportunidades vale no CRM', async () => {
    await semear(2);
    const { importadas } = await importarLeads('elegiveis', 'ana');
    await sincronizarComOportunidade(importadas[0].placeId, 'nao-contatar', 'ana');
    await sincronizarComOportunidade(importadas[1].placeId, 'descartada', 'ana');
    expect((await contatoPorId(importadas[0].id))!.etapa).toBe('nao-contatar');
    expect((await contatoPorId(importadas[1].id))!.etapa).toBe('perdido');
  });
});
