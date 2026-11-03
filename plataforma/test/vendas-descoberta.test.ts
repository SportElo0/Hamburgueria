import { beforeEach, describe, expect, it, vi } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { storage, useFileStorage } from '@/lib/storage';
import { bloquearManual, contatoPorId, importarLeads, listarContatos, registrarContatoDireto } from '@/lib/vendas/dados';
import { buscarContatosNosSites, categoriasNoLeadFinder, confirmarSugestoes, escolherEmail, extrairDaPagina, pendentesDeBusca, telefoneAoVivo } from '@/lib/vendas/descoberta';
import { canalDoContato, contatoDiretoRecente, textosContatoDireto } from '@/lib/vendas/regras';
import type { Abertura } from '@/lib/oportunidades/site';
import type { LugarAoVivo } from '@/lib/oportunidades/places';

const lead = (placeId: string, categoria: string) => ({
  placeId,
  cidade: 'Ilhabela',
  uf: 'SP',
  bairro: '',
  segmento: 'restaurantes',
  categoria,
  categoriaRevisada: false,
  sinais: [],
  checadoEm: '2026-11-01T12:00:00.000Z',
  verificacao: { situacao: 'pendente', fontes: [], links: '' },
  observacoes: '',
  situacao: 'nova',
  criadoEm: '2026-11-01T12:00:00.000Z',
  pesquisaId: 'p1',
});

// Fictitious places and sites.
const SITES: Record<string, string | undefined> = {
  PlaceDescobertaA001: 'https://www.cantinadomar.com.br/',
  PlaceDescobertaB002: 'https://quiosquedapraia.com.br',
  PlaceDescobertaC003: 'https://sabordailha.com.br',
  PlaceDescobertaD004: 'http://bardoporto.com.br',
  PlaceDescobertaE005: undefined,
};
const PAGINAS: Record<string, Abertura> = {
  'https://www.cantinadomar.com.br/': {
    status: 200,
    location: null,
    html: '<html><head><meta property="og:site_name" content="Cantina do Mar"><title>Início | Cantina do Mar</title></head><body><a href="mailto:contato@cantinadomar.com.br">Fale com a gente</a> <img src="logo@2x.png"> erro: x@sentry.io</body></html>',
  },
  'https://quiosquedapraia.com.br/': {
    status: 200,
    location: null,
    html: '<html><head><title>Quiosque da Praia - Ilhabela</title></head><body><a href="/contato">Contato</a><a href="https://outrosite.com/contato">Parceiro</a></body></html>',
  },
  'https://quiosquedapraia.com.br/contato': { status: 200, location: null, html: '<p>Escreva para reservas&#64;quiosquedapraia.com.br</p>' },
  'https://sabordailha.com.br/': { status: 200, location: null, html: '<title>Sabor da Ilha</title><p>sabordailha@gmail.com</p>' },
  'http://bardoporto.com.br/': { status: 200, location: null, html: '<title>Bar do Porto</title><a href="mailto:bar@bardoporto.com.br">e-mail</a>' },
};
const abrir = async (url: URL): Promise<Abertura> => PAGINAS[url.href] ?? { status: 404, location: null, html: '' };
const consultas: string[] = [];
const ver = async (placeId: string): Promise<LugarAoVivo> => {
  consultas.push(placeId);
  return { id: placeId, nome: 'NOME DO GOOGLE', endereco: 'Rua do Google, 1', site: SITES[placeId], telefone: '(12) 99123-4567', fechado: false };
};

beforeEach(async () => {
  useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'descoberta-')));
  vi.stubEnv('SESSION_SECRET', 'segredo-de-teste-com-mais-de-32-caracteres!!');
  vi.stubEnv('VERCEL', '');
  vi.stubEnv('LEADS_MOSTRAR_TELEFONE', '');
  consultas.length = 0;
  const doc: Record<string, unknown> = {};
  for (const id of Object.keys(SITES)) doc[id] = lead(id, id.endsWith('E005') ? 'sem-site' : 'site-com-problemas');
  doc.PlaceDescobertaF006 = lead('PlaceDescobertaF006', 'so-rede-social');
  await storage().writeJSON('oportunidades/lugares.json', doc);
  await importarLeads('elegiveis', 'teste@growlift');
});

describe('lendo a página do negócio', () => {
  it('acha nome, e-mails e páginas de contato do próprio site, e ignora lixo', () => {
    const r = extrairDaPagina(PAGINAS['https://www.cantinadomar.com.br/'].html, new URL('https://www.cantinadomar.com.br/'));
    expect(r.nome).toBe('Cantina do Mar');
    expect(r.emails).toEqual(['contato@cantinadomar.com.br']);
    const q = extrairDaPagina(PAGINAS['https://quiosquedapraia.com.br/'].html, new URL('https://quiosquedapraia.com.br/'));
    expect(q.nome).toBe('Quiosque da Praia');
    expect(q.contatos.map((u) => u.href)).toEqual(['https://quiosquedapraia.com.br/contato']);
    expect(extrairDaPagina('<p>a&#64;b.com.br</p>', new URL('https://b.com.br')).emails).toEqual(['a@b.com.br']);
  });

  it('prefere o e-mail do domínio do site e nunca sugere Gmail ou Hotmail', () => {
    const site = new URL('https://www.cantinadomar.com.br');
    expect(escolherEmail(['joao@agencia.com', 'contato@cantinadomar.com.br'], site).email).toBe('contato@cantinadomar.com.br');
    expect(escolherEmail(['dono@gmail.com'], site).email).toBeUndefined();
    const outro = escolherEmail(['contato@outrodominio.com.br'], site);
    expect(outro.email).toBe('contato@outrodominio.com.br');
    expect(outro.avisos[0]).toMatch(/outro domínio/);
  });
});

describe('Buscar contatos nos sites', () => {
  it('só consulta o Google o que foi aprovado e guarda só o que veio do site', async () => {
    expect(pendentesDeBusca(await listarContatos(), await categoriasNoLeadFinder())).toHaveLength(4);
    const r = await buscarContatosNosSites(2, 'teste@growlift', { ver, abrir });
    expect(r).toEqual({ analisados: 2, achados: 2, semEmail: 0, adiados: 0, restantes: 2 });
    expect(consultas).toHaveLength(2);
    const todos = JSON.stringify(await listarContatos());
    expect(todos).not.toMatch(/NOME DO GOOGLE|Rua do Google|99123/);
    const r2 = await buscarContatosNosSites(5, 'teste@growlift', { ver, abrir });
    expect(r2).toEqual({ analisados: 2, achados: 0, semEmail: 2, adiados: 0, restantes: 0 });
    const lista = await listarContatos();
    const por = (p: string) => lista.find((c) => c.placeId === p)!;
    expect(por('PlaceDescobertaA001').sugestao).toMatchObject({ negocio: 'Cantina do Mar', email: 'contato@cantinadomar.com.br', fonteUrl: 'https://www.cantinadomar.com.br/' });
    expect(por('PlaceDescobertaB002').sugestao).toMatchObject({ email: 'reservas@quiosquedapraia.com.br', fonteUrl: 'https://quiosquedapraia.com.br/contato' });
    expect(por('PlaceDescobertaC003').sugestao?.motivo).toMatch(/Gmail/);
    expect(por('PlaceDescobertaC003').sugestao?.email).toBeUndefined();
    expect(por('PlaceDescobertaD004').sugestao?.motivo).toMatch(/HTTPS/);
    // Nothing became "complete" on its own.
    expect(lista.every((c) => c.etapa === 'qualificar' && c.email === '')).toBe(true);
    await expect(buscarContatosNosSites(5, 'teste@growlift', { ver, abrir })).rejects.toThrow(/Nenhum contato/);
  });

  it('a confirmação passa pelas regras de sempre (bloqueio incluído)', async () => {
    await buscarContatosNosSites(4, 'teste@growlift', { ver, abrir });
    const lista = await listarContatos();
    const a = lista.find((c) => c.placeId === 'PlaceDescobertaA001')!;
    const b = lista.find((c) => c.placeId === 'PlaceDescobertaB002')!;
    await bloquearManual({ valor: 'reservas@quiosquedapraia.com.br', motivo: 'pediu para não receber' }, 'teste@growlift');
    const r = await confirmarSugestoes([a.id, b.id], 'teste@growlift');
    expect(r.confirmados).toEqual([a.id]);
    expect(r.falhas[0].erro).toMatch(/bloqueio/);
    const ca = (await contatoPorId(a.id))!;
    expect(ca).toMatchObject({ etapa: 'novo', negocio: 'Cantina do Mar', email: 'contato@cantinadomar.com.br', fonte: { tipo: 'site', url: 'https://www.cantinadomar.com.br/' } });
    expect(ca.sugestao).toBeUndefined();
  });
});

describe('Contato direto (sem e-mail)', () => {
  it('escolhe o canal pelo que o negócio tem', async () => {
    const lista = await listarContatos();
    const cat = await categoriasNoLeadFinder();
    const e = lista.find((c) => c.placeId === 'PlaceDescobertaE005')!;
    expect(e.categoria).toBe('incerta');
    expect(canalDoContato(e, cat[e.placeId!])).toBe('telefone');
    expect(canalDoContato(lista.find((c) => c.placeId === 'PlaceDescobertaF006')!)).toBe('instagram');
    expect(canalDoContato(lista.find((c) => c.placeId === 'PlaceDescobertaA001')!)).toBe('email');
  });

  it('os textos falam como a Growlift, sem preço, sem "mensagem automática" e com a opção de sair', () => {
    for (const categoria of ['sem-site', 'so-rede-social'] as const) {
      const t = textosContatoDireto({ negocio: '', segmento: 'restaurantes', categoria, cidade: 'Ilhabela' });
      for (const texto of [t.instagram, t.whatsapp, t.ligacao]) {
        expect(texto).toMatch(/Growlift/);
        expect(texto).not.toMatch(/R\$|mensagem autom|rob[oô]|Scale|garant/i);
      }
      for (const texto of [t.instagram, t.whatsapp]) {
        expect(texto).toMatch(/Google Maps/);
        expect(texto).toMatch(/NÃO ou SAIR/);
        expect(texto).toMatch(/privacidade/);
        expect(texto).toMatch(/não custa nada e não obriga a contratar/);
        expect(texto).not.toMatch(/de graça|sem compromisso|Vimos o perfil/);
      }
    }
    expect(textosContatoDireto({ negocio: 'Cantina do Mar', segmento: 'restaurantes', categoria: 'sem-site', cidade: '' }).whatsapp).toMatch(/Achamos o Cantina do Mar pelo Google Maps e não achamos um site próprio/);
  });

  it('contato direto: uma vez só', async () => {
    const c = (await listarContatos()).find((x) => x.placeId === 'PlaceDescobertaE005')!;
    await registrarContatoDireto(c.id, 'whatsapp', 'teste@growlift', new Date('2026-11-03T12:00:00Z'));
    await expect(registrarContatoDireto(c.id, 'instagram', 'teste@growlift', new Date('2026-12-01T12:00:00Z'))).rejects.toThrow(/não mande de novo/);
    await expect(registrarContatoDireto(c.id, 'email', 'teste@growlift')).rejects.toThrow(/Canal/);
    const depois = (await contatoPorId(c.id))!;
    expect(depois.contatoDireto?.canal).toBe('whatsapp');
    expect(contatoDiretoRecente(depois, new Date('2026-12-01T12:00:00Z'))).toBe(true);
    expect(contatoDiretoRecente(depois, new Date('2027-03-01T12:00:00Z'))).toBe(false);
  });

  it('telefone só aparece com a opção ligada, e nunca fica guardado', async () => {
    const c = (await listarContatos()).find((x) => x.placeId === 'PlaceDescobertaE005')!;
    expect(await telefoneAoVivo(c, new Date(), ver)).toEqual({ liberado: false });
    vi.stubEnv('LEADS_MOSTRAR_TELEFONE', 'sim');
    const r = await telefoneAoVivo(c, new Date(), ver);
    expect(r).toMatchObject({ liberado: true, telefone: '(12) 99123-4567', whatsapp: 'https://wa.me/5512991234567' });
    expect(JSON.stringify(await listarContatos())).not.toMatch(/99123/);
  });
});
