import { beforeEach, describe, expect, it, vi } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { storage, useFileStorage } from '@/lib/storage';
import { listarLeads, marcarContatado, marcarNaoContatar } from '@/lib/oportunidades/dados';
import { filaWhatsapp, paginaWhatsapp } from '@/lib/oportunidades/whatsapp';
import type { LugarAoVivo } from '@/lib/oportunidades/places';

const lead = (placeId: string, categoria: string, criadoEm = '2026-11-01T12:00:00.000Z') => ({
  placeId, cidade: 'Ilhabela', uf: 'SP', bairro: '', segmento: 'restaurantes', categoria, categoriaRevisada: false, sinais: [],
  checadoEm: criadoEm, verificacao: { situacao: 'pendente', fontes: [], links: '' }, observacoes: '', situacao: 'nova', criadoEm, pesquisaId: 'p1',
});
const ver = async (id: string): Promise<LugarAoVivo> => ({ id, nome: `Restaurante ${id.slice(-2)}`, endereco: 'Rua X', telefone: id.endsWith('03') ? '(12) 3896-1234' : '(12) 99123-45' + id.slice(-2), fechado: false });

beforeEach(async () => {
  useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'whats-')));
  vi.stubEnv('VERCEL', '');
  vi.stubEnv('LEADS_MOSTRAR_TELEFONE', 'sim');
  const cats = ['site-com-problemas', 'sem-site', 'site-proprio', 'so-rede-social', 'incerta', 'sem-site'];
  const doc: Record<string, unknown> = {};
  cats.forEach((c, i) => (doc[`PlaceWhats00000${i}`] = lead(`PlaceWhats00000${i}`, c)));
  await storage().writeJSON('oportunidades/lugares.json', doc);
});

describe('Mandar WhatsApp', () => {
  it('lista quem não tem site primeiro e deixa de fora site próprio', async () => {
    const fila = filaWhatsapp(await listarLeads());
    expect(fila.map((l) => l.categoria)).toEqual(['sem-site', 'sem-site', 'so-rede-social', 'site-com-problemas', 'incerta']);
  });

  it('traz nome e WhatsApp ao vivo com a mensagem pronta, e não guarda nada do Google', async () => {
    const linhas = await paginaWhatsapp([], new Date(), ver);
    expect(linhas).toHaveLength(5);
    const cel = linhas.find((l) => l.placeId.endsWith('01'))!;
    expect(cel.nome).toBe('Restaurante 01');
    expect(cel.whatsapp).toMatch(/^https:\/\/wa\.me\/55\d+\?text=/);
    expect(decodeURIComponent(cel.whatsapp)).toMatch(/Achamos o Restaurante 01 pelo Google Maps.*NÃO ou SAIR/);
    const fixo = linhas.find((l) => l.placeId.endsWith('03'))!;
    expect(fixo.whatsapp).toBe('');
    expect(fixo.telefone).toBe('(12) 3896-1234');
    expect(JSON.stringify(await listarLeads())).not.toMatch(/Restaurante 0|99123|3896/);
  });

  it('cada negócio uma vez só; "não quer" sai da lista', async () => {
    await marcarContatado('PlaceWhats000001', 'whatsapp', 'teste');
    await marcarNaoContatar('PlaceWhats000005', 'não quer', 'teste');
    const fila = filaWhatsapp(await listarLeads()).map((l) => l.placeId);
    expect(fila).not.toContain('PlaceWhats000001');
    expect(fila).not.toContain('PlaceWhats000005');
    await expect(marcarContatado('PlaceWhats000005', 'whatsapp', 'teste')).rejects.toThrow(/não ser contatado/);
    expect((await listarLeads()).find((l) => l.placeId === 'PlaceWhats000001')!.contatado).toMatchObject({ canal: 'whatsapp', por: 'teste' });
  });

  it('pula quem já está na tela e respeita o telefone desligado', async () => {
    const primeira = await paginaWhatsapp(['PlaceWhats000001', 'PlaceWhats000005'], new Date(), ver);
    expect(primeira.map((l) => l.placeId)).not.toContain('PlaceWhats000001');
    vi.stubEnv('LEADS_MOSTRAR_TELEFONE', '');
    await expect(paginaWhatsapp([], new Date(), ver)).rejects.toThrow(/LEADS_MOSTRAR_TELEFONE/);
  });
});
