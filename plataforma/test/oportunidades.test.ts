import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { useFileStorage } from '@/lib/storage';
import { csv, estimar, lerLink, linhasCsv, naCidade, textoDaBusca } from '@/lib/oportunidades/regras';
import { mascaraBusca, mascaraDetalhes } from '@/lib/oportunidades/places';
import { executarPesquisa, estimarPesquisa, listarLeads, listarPesquisas, revisar, usoDoMes, verAoVivo } from '@/lib/oportunidades/dados';
import { checarLink, ipInterno, lookupPublico, type Abertura, type Checagem } from '@/lib/oportunidades/site';

/** Fake DNS: one name answers with an internal address, everything else with a public one. */
vi.mock('node:dns', () => {
  const lookup = (host: string, _opts: unknown, cb: (e: Error | null, a: { address: string; family: number }[]) => void) =>
    cb(null, host === 'interno.exemplo.com.br' ? [{ address: '10.0.0.5', family: 4 }] : [{ address: '93.184.216.34', family: 4 }]);
  return { default: { lookup }, lookup };
});

const CHAVE = 'chave-de-teste-nao-real';
const pedido = { cidade: 'Ilhabela', uf: 'SP', bairro: '', segmento: 'barbearias', paginas: 2 };

/** Fictitious places, in the shape Google returns them. */
const lugar = (id: string, cidade = 'Ilhabela', site?: string) => ({
  id,
  displayName: { text: `Barbearia Exemplo ${id}` },
  formattedAddress: `Rua Exemplo, 10 - Centro, ${cidade} - SP, 11630-000, Brasil`,
  ...(site ? { websiteUri: site } : {}),
  businessStatus: 'OPERATIONAL',
  googleMapsUri: `https://maps.google.com/?cid=${id}`,
});

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Fake Google: page 1 → 3 places (one in another city), page 2 → a repeat and a new one. */
function googleFalso() {
  const chamadas: { url: string; init?: RequestInit }[] = [];
  const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
    chamadas.push({ url: String(url), init });
    const body = JSON.parse(String(init?.body ?? '{}')) as { pageToken?: string };
    if (!body.pageToken)
      return json({ places: [lugar('PlaceAAAAAAAA1'), lugar('PlaceAAAAAAAA2', 'Ilhabela', 'https://instagram.com/exemplo'), lugar('PlaceAAAAAAAA3', 'São Sebastião')], nextPageToken: 'pagina2' });
    return json({ places: [lugar('PlaceAAAAAAAA1'), lugar('PlaceAAAAAAAA4', 'Ilhabela', 'https://exemplo.com.br')] });
  });
  vi.stubGlobal('fetch', fetchMock);
  return chamadas;
}

const checarFalso = async (site: string | undefined): Promise<Checagem> =>
  !site ? { categoria: 'sem-site', sinais: ['sem site'] } : site.includes('instagram') ? { categoria: 'so-rede-social', sinais: ['Instagram'] } : { categoria: 'site-proprio', sinais: ['ok'] };

beforeEach(() => {
  useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'leads-')));
  vi.stubEnv('GOOGLE_MAPS_API_KEY', CHAVE);
  vi.stubEnv('LEADS_LIMITE_BUSCAS_MES', '');
  vi.stubEnv('LEADS_MOSTRAR_TELEFONE', '');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('regras do Lead Finder', () => {
  it('lê o link do perfil: nenhum, rede social, site próprio e inválido', () => {
    expect(lerLink(undefined)).toEqual({ tipo: 'nenhum' });
    expect(lerLink('  ')).toEqual({ tipo: 'nenhum' });
    expect(lerLink('https://www.instagram.com/barbearia')).toEqual({ tipo: 'rede', rede: 'Instagram' });
    expect(lerLink('http://m.facebook.com/x')).toEqual({ tipo: 'rede', rede: 'Facebook' });
    expect(lerLink('https://linktr.ee/x')).toEqual({ tipo: 'rede', rede: 'Linktree' });
    expect(lerLink('https://www.ifood.com.br/delivery/x')).toEqual({ tipo: 'rede', rede: 'iFood' });
    expect(lerLink('https://wa.me/5512999999999')).toEqual({ tipo: 'rede', rede: 'WhatsApp' });
    expect(lerLink('fakeinstagram.com').tipo).toBe('site');
    expect(lerLink('barbeariaexemplo.com.br').tipo).toBe('site');
    expect(lerLink('javascript:alert(1)').tipo).toBe('invalido');
  });

  it('estima o custo pela tabela do Google e respeita o limite do mês', () => {
    expect(estimar('busca', 3, 0, 200)).toMatchObject({ chamadas: 3, pagas: 0, usd: 0, cabe: true, gratisRestantes: 1000 });
    expect(estimar('busca', 3, 999, 2000)).toMatchObject({ pagas: 2, usd: 0.07, cabe: true });
    expect(estimar('busca', 3, 199, 200).cabe).toBe(false);
  });

  it('pede só os campos necessários; telefone só quando liberado', () => {
    expect(mascaraBusca(false)).toBe('places.id,places.displayName,places.formattedAddress,places.websiteUri,places.businessStatus,places.googleMapsUri,nextPageToken');
    expect(mascaraBusca(true)).toContain('places.nationalPhoneNumber');
    expect(mascaraDetalhes(false)).not.toContain('Phone');
    expect(mascaraBusca(true)).not.toContain('*');
  });

  it('monta a busca e confere a cidade pelo endereço', () => {
    expect(textoDaBusca('confeitarias', 'São Sebastião', 'SP', 'Maresias')).toBe('confeitaria em Maresias, São Sebastião - SP');
    expect(naCidade('Av. X, 1 - Maresias, São Sebastião - SP, 11600-000, Brasil', 'Sao Sebastiao', 'SP')).toBe(true);
    expect(naCidade('Rua Y, 2 - Perequê, Ilhabela - SP, 11630-000, Brasil', 'São Sebastião', 'SP')).toBe(false);
  });

  it('gera CSV para o Excel e neutraliza células que parecem fórmula', () => {
    const out = csv([
      ['a', 'b;c'],
      ['=HYPERLINK("x")', 'diz "oi"'],
    ]);
    expect(out.startsWith('﻿')).toBe(true);
    expect(out).toContain('"a";"b;c"\r\n');
    expect(out).toContain(`"'=HYPERLINK(""x"")";"diz ""oi"""`);
  });
});

describe('pesquisa paga', () => {
  it('não chama o Google sem aprovar a estimativa nem sem chave', async () => {
    const chamadas = googleFalso();
    await expect(executarPesquisa(pedido, 0, 'equipe@growlift.com.br', { checar: checarFalso })).rejects.toThrow(/Aprove a estimativa/);
    await expect(executarPesquisa(pedido, 1, 'equipe@growlift.com.br', { checar: checarFalso })).rejects.toThrow(/Aprove a estimativa/);
    vi.stubEnv('GOOGLE_MAPS_API_KEY', '');
    await expect(executarPesquisa(pedido, 2, 'equipe@growlift.com.br', { checar: checarFalso })).rejects.toThrow(/GOOGLE_MAPS_API_KEY/);
    expect(chamadas).toHaveLength(0);
  });

  it('pesquisa, tira repetidos pelo place ID, descarta outra cidade e guarda só o que pode', async () => {
    const chamadas = googleFalso();
    const est = await estimarPesquisa(pedido);
    expect(est).toMatchObject({ chamadas: 2, sku: 'Text Search Enterprise', usd: 0 });
    const r = await executarPesquisa(pedido, est.chamadas, 'equipe@growlift.com.br', { checar: checarFalso });

    expect(chamadas).toHaveLength(2);
    const primeira = chamadas[0].init!;
    const headers = primeira.headers as Record<string, string>;
    expect(headers['X-Goog-Api-Key']).toBe(CHAVE);
    expect(headers['X-Goog-FieldMask']).not.toContain('nationalPhoneNumber');
    expect(JSON.parse(String(primeira.body))).toMatchObject({ textQuery: 'barbearia em Ilhabela - SP', includedType: 'barber_shop', pageSize: 20, regionCode: 'BR' });
    expect(JSON.parse(String(chamadas[1].init!.body)).pageToken).toBe('pagina2');

    expect(r.pesquisa).toMatchObject({ chamadas: 2, encontrados: 3, novos: 3, repetidos: 0, foraDaCidade: 1 });
    expect(r.linhas.map((l) => [l.id, l.categoria])).toEqual([
      ['PlaceAAAAAAAA1', 'sem-site'],
      ['PlaceAAAAAAAA2', 'so-rede-social'],
      ['PlaceAAAAAAAA4', 'site-proprio'],
    ]);
    // The result screen gets Google's data; storage gets none of it.
    expect(r.linhas[0].nome).toBe('Barbearia Exemplo PlaceAAAAAAAA1');
    const leads = await listarLeads();
    expect(leads.map((l) => l.placeId).sort()).toEqual(['PlaceAAAAAAAA1', 'PlaceAAAAAAAA2', 'PlaceAAAAAAAA4']);
    const guardado = JSON.stringify([leads, await listarPesquisas()]);
    for (const proibido of ['Barbearia Exemplo', 'Rua Exemplo', '11630', 'instagram.com', 'exemplo.com.br', 'maps.google.com', CHAVE]) expect(guardado).not.toContain(proibido);
    expect((await usoDoMes()).busca).toBe(2);
  });

  it('uma segunda pesquisa conta os repetidos e não apaga a revisão da equipe', async () => {
    googleFalso();
    await executarPesquisa(pedido, 2, 'a@growlift.com.br', { checar: checarFalso });
    await revisar('PlaceAAAAAAAA1', { categoria: 'so-rede-social', situacao: 'boa', observacoes: 'Tem Instagram ativo', verificacao: { situacao: 'confirmado', fontes: ['instagram', 'busca-google'], links: 'https://instagram.com/x' } }, 'b@growlift.com.br');
    const r = await executarPesquisa(pedido, 2, 'a@growlift.com.br', { checar: checarFalso });
    expect(r.pesquisa).toMatchObject({ novos: 0, repetidos: 3 });
    const lead = (await listarLeads()).find((l) => l.placeId === 'PlaceAAAAAAAA1')!;
    expect(lead).toMatchObject({ categoria: 'so-rede-social', categoriaRevisada: true, situacao: 'boa', observacoes: 'Tem Instagram ativo' });
    expect(lead.verificacao).toMatchObject({ situacao: 'confirmado', por: 'b@growlift.com.br' });
    expect(lead.verificacao.em).toBeTruthy();
  });

  it('para no limite do mês, mesmo com a pesquisa aprovada', async () => {
    googleFalso();
    vi.stubEnv('LEADS_LIMITE_BUSCAS_MES', '3');
    await executarPesquisa(pedido, 2, 'a@growlift.com.br', { checar: checarFalso });
    await expect(executarPesquisa(pedido, 2, 'a@growlift.com.br', { checar: checarFalso })).rejects.toThrow(/limite do mês/);
    expect((await usoDoMes()).busca).toBe(2);
  });

  it('não mostra a chave quando o Google recusa', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ error: { status: 'PERMISSION_DENIED', message: `API key ${CHAVE} not valid` } }, 403)));
    const err = await executarPesquisa(pedido, 2, 'a@growlift.com.br', { checar: checarFalso }).catch((e: Error) => e);
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toContain('PERMISSION_DENIED');
    expect((err as Error).message).not.toContain(CHAVE);
  });

  it('só confirma "sem website" depois de conferir outras fontes', async () => {
    googleFalso();
    await executarPesquisa(pedido, 2, 'a@growlift.com.br', { checar: checarFalso });
    const base = { categoria: 'sem-site', situacao: 'nova', observacoes: '', verificacao: { situacao: 'confirmado', fontes: ['busca-google'], links: '' } };
    await expect(revisar('PlaceAAAAAAAA1', base, 'a@growlift.com.br')).rejects.toThrow(/pelo menos 2 fontes/);
    await expect(revisar('PlaceAAAAAAAA1', { ...base, verificacao: { ...base.verificacao, situacao: 'encontrou-site' } }, 'a')).rejects.toThrow(/mude a categoria/);
    const ok = await revisar('PlaceAAAAAAAA1', { ...base, verificacao: { ...base.verificacao, fontes: ['busca-google', 'instagram', 'busca-google'] } }, 'a@growlift.com.br');
    expect(ok.verificacao.fontes).toEqual(['busca-google', 'instagram']);
  });

  it('consulta ao vivo conta no limite e o telefone só vem quando liberado', async () => {
    const fetchMock = vi.fn(async () => json({ id: 'PlaceAAAAAAAA1', displayName: { text: 'X' }, nationalPhoneNumber: '(12) 3333-4444' }));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('LEADS_LIMITE_DETALHES_MES', '1');
    await verAoVivo('PlaceAAAAAAAA1');
    expect((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].headers).toMatchObject({ 'X-Goog-FieldMask': expect.not.stringContaining('Phone') });
    await expect(verAoVivo('PlaceAAAAAAAA1')).rejects.toThrow(/limite do mês/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await expect(verAoVivo('../../etc')).rejects.toThrow();
  });

  it('exporta só as conclusões da equipe, com fonte e data', async () => {
    googleFalso();
    await executarPesquisa(pedido, 2, 'a@growlift.com.br', { checar: checarFalso });
    const linhas = linhasCsv(await listarLeads());
    expect(linhas[0]).toContain('place_id');
    expect(linhas[0]).toContain('fontes_consultadas');
    expect(linhas).toHaveLength(4);
    expect(JSON.stringify(linhas)).not.toContain('Barbearia Exemplo');
    expect(linhas[1][1]).toMatch(/^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=Google&query_place_id=Place/);
  });
});

describe('checagem do site', () => {
  const conteudo = `<p>${'Cardápio e horários da casa. '.repeat(20)}</p>`;
  const pagina = (html: string, status = 200, location: string | null = null): Abertura => ({ status, location, html });

  it('site bom, sem HTTPS, sem celular, parado e redirecionando para o Instagram', async () => {
    const respostas: Record<string, Abertura> = {
      'https://bom.exemplo.com.br/': pagina(`<meta name="viewport" content="width=device-width">${conteudo}`),
      'http://velho.exemplo.com.br/': pagina(conteudo),
      'https://parado.exemplo.com.br/': pagina('<meta name="viewport" content="x"><h1>Este domínio está à venda</h1>'),
      'https://pulo.exemplo.com.br/': pagina('', 301, 'https://www.instagram.com/exemplo'),
      'https://erro.exemplo.com.br/': pagina('x', 500),
    };
    const abrir = async (u: URL) => respostas[String(u)];
    expect((await checarLink('https://bom.exemplo.com.br', abrir)).categoria).toBe('site-proprio');
    const velho = await checarLink('velho.exemplo.com.br', abrir);
    expect(velho.categoria).toBe('site-com-problemas');
    expect(velho.sinais.join()).toMatch(/HTTPS.*celular/);
    expect((await checarLink('https://parado.exemplo.com.br', abrir)).sinais.join()).toMatch(/parada/);
    expect(await checarLink('https://pulo.exemplo.com.br', abrir)).toEqual({ categoria: 'so-rede-social', sinais: ['O site cadastrado redireciona para o Instagram.'] });
    expect((await checarLink('https://erro.exemplo.com.br', abrir)).sinais).toEqual(['O site responde com erro 500.']);
  });

  it('não abre endereços internos, nem escritos em IPv6 nem depois de redirecionar', async () => {
    const abrir = vi.fn(async () => pagina('', 302, 'http://[::ffff:a9fe:a9fe]/latest'));
    for (const u of ['http://127.0.0.1/', 'http://169.254.169.254/latest', 'http://localhost:3000', 'http://[::1]/', 'http://[::ffff:127.0.0.1]/', 'http://[::ffff:7f00:1]/', 'http://[64:ff9b::a9fe:a9fe]/', 'http://[2002:7f00:1::]/', 'http://intranet/'])
      expect((await checarLink(u, abrir)).categoria).toBe('incerta');
    expect(abrir).not.toHaveBeenCalled();
    // A public site that redirects to an internal address stops at the redirect.
    expect((await checarLink('https://publico.exemplo.com.br', abrir)).categoria).toBe('incerta');
    expect(abrir).toHaveBeenCalledTimes(1);
  });

  it('classifica endereços internos e públicos em IPv4 e IPv6', () => {
    for (const ip of ['10.1.2.3', '192.168.0.1', '172.20.0.1', '100.64.0.1', '198.18.0.1', '192.0.2.5', '0.0.0.0', '::', '::1', '::ffff:7f00:1', '::7f00:1', '::ffff:10.0.0.1', '64:ff9b::7f00:1', '2002:a9fe:a9fe::1', 'fc00::1', 'fd12::1', 'fe80::1', 'fec0::1', 'ff02::1', '2001:db8::1', '2001:0:1::1'])
      expect(ipInterno(ip), ip).toBe(true);
    for (const ip of ['93.184.216.34', '8.8.8.8', '2606:4700::1111', '::ffff:8.8.8.8', '2002:0808:0808::1']) expect(ipInterno(ip), ip).toBe(false);
  });

  it('a conexão recusa nomes que o DNS manda para endereço interno', async () => {
    const resposta = (host: string) => new Promise<{ err: NodeJS.ErrnoException | null; addr: unknown }>((r) => lookupPublico(host, { all: true }, (err, addr) => r({ err, addr })));
    expect((await resposta('interno.exemplo.com.br')).err?.code).toBe('EINTERNO');
    expect((await resposta('publico.exemplo.com.br')).addr).toEqual([{ address: '93.184.216.34', family: 4 }]);
  });
});
