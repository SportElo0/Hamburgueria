import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { useFileStorage } from '@/lib/storage';
import { createDiagnosisRequest, listDiagnosisRequests } from '@/lib/diagnostics';
import { analisarPedido, lerHtml, lerPresenca, resumoDaManha, textoResumo } from '@/lib/diagnostico-auto';
import type { Abertura } from '@/lib/oportunidades/site';

const pedido = { business: 'Burger do Zé', segment: 'Hamburgueria', city: 'Santo André', whatsapp: '(11) 98888-7777', presence: 'www.burgerdoze.com.br', wishes: 'Quero vender mais pelo site', consent: true };

const BOM = `<html><head><title>Burger do Zé · Hamburgueria em Santo André</title>
<meta name="viewport" content="width=device-width"><meta name="description" content="Hambúrguer artesanal em Santo André, com entrega e retirada.">
<script type="application/ld+json">{"@type":"Restaurant","name":"Burger do Zé"}</script></head>
<body><h1>Burger do Zé</h1><h2>Cardápio</h2><p>X-Burger R$ 29,90</p><p>Seg a Sex 18h às 23h</p>
<a href="https://wa.me/5511988887777">Pedir no WhatsApp</a><a href="https://maps.app.goo.gl/abc">Como chegar</a><a href="https://instagram.com/burgerdoze">Instagram</a>
${'<p>texto do site com conteúdo suficiente para não parecer vazio.</p>'.repeat(8)}</body></html>`;
const FRACO = `<html><head><title>Home</title><meta name="viewport" content="width=device-width"></head><body><h1>Bem-vindo</h1><a href="/cardapio.pdf">Cardápio</a>${'<p>Nossa história começa com muito amor pela comida e pela família reunida.</p>'.repeat(5)}</body></html>`;

const pagina = (html: string, status = 200, location: string | null = null) => async (): Promise<Abertura> => ({ status, location, html });

beforeEach(() => {
  useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'diag-auto-')));
});
afterEach(() => {
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_CHAT_ID;
});

describe('diagnóstico automático: o que a pessoa escreveu', () => {
  it('acha o site, o Instagram e as redes', () => {
    expect(lerPresenca('www.burgerdoze.com.br').site?.hostname).toBe('www.burgerdoze.com.br');
    expect(lerPresenca('@burgerdoze')).toMatchObject({ redes: ['Instagram'], instagram: 'burgerdoze' });
    const as2 = lerPresenca('instagram.com/burgerdoze e o site https://burgerdoze.com.br/');
    expect(as2.site?.hostname).toBe('burgerdoze.com.br');
    expect(as2.instagram).toBe('burgerdoze');
    expect(lerPresenca('só insta').redes).toEqual(['Instagram']);
    expect(lerPresenca('não tenho').site).toBeUndefined();
    expect(lerPresenca('').site).toBeUndefined();
  });
});

describe('diagnóstico automático: a página inicial', () => {
  it('não aponta problemas num site completo', () => {
    const r = lerHtml(BOM);
    expect(r.pontos).toEqual([]);
    expect(r.ok.length).toBeGreaterThan(0);
  });

  it('aponta o que falta num site fraco', () => {
    const r = lerHtml(FRACO).pontos.join(' | ');
    expect(r).toMatch(/título/);
    expect(r).toMatch(/descrição/);
    expect(r).toMatch(/PDF/);
    expect(r).toMatch(/preços/);
    expect(r).toMatch(/WhatsApp/);
    expect(r).toMatch(/mapa/);
    expect(r).toMatch(/horário/);
  });
});

describe('diagnóstico automático: o pedido inteiro', () => {
  it('sem site: pede a prévia', async () => {
    const a = await analisarPedido({ presence: '@burgerdoze' });
    expect(a.tipo).toBe('sem-site');
    expect(a.instagram).toBe('burgerdoze');
    expect(a.pontos[0]).toMatch(/prévia/);
  });

  it('com site: junta os problemas técnicos e os de conteúdo', async () => {
    const a = await analisarPedido({ presence: 'http://burgerdoze.com.br' }, pagina(FRACO));
    expect(a.tipo).toBe('site');
    expect(a.site).toBe('burgerdoze.com.br');
    expect(a.pontos.join(' ')).toMatch(/HTTPS/);
    expect(a.pontos.join(' ')).toMatch(/PDF/);
  });

  it('site que redireciona para o Instagram conta como sem site', async () => {
    const a = await analisarPedido({ presence: 'burgerdoze.com.br' }, pagina('', 301, 'https://instagram.com/burgerdoze'));
    expect(a.tipo).toBe('sem-site');
  });

  it('nunca abre endereço interno', async () => {
    let abriu = false;
    const a = await analisarPedido({ presence: 'http://localhost/admin' }, async () => ((abriu = true), { status: 200, location: null, html: '' }));
    expect(abriu).toBe(false);
    expect(a.tipo).toBe('sem-site');
    const b = await analisarPedido({ presence: 'http://192.168.0.1' }, async () => ((abriu = true), { status: 200, location: null, html: '' }));
    expect(abriu).toBe(false);
    expect(b.tipo).toBe('conferir');
  });
});

describe('resumo das 6h30', () => {
  const envios: string[] = [];
  const telegram = (falha = false) =>
    (async (_url: string | URL | Request, init?: RequestInit) => {
      envios.push(JSON.parse(String(init?.body)).text);
      return new Response('{}', { status: falha ? 500 : 200 });
    }) as typeof fetch;
  const abrir = pagina(FRACO);
  // 05/11/2026 in São Paulo (UTC-3).
  const as = (hhmm: string, dia = '05') => new Date(`2026-11-${dia}T${hhmm}:00-03:00`);

  beforeEach(() => {
    envios.length = 0;
    process.env.TELEGRAM_BOT_TOKEN = 'teste';
    process.env.TELEGRAM_CHAT_ID = '123';
  });

  it('manda uma vez por dia, a partir das 6h30, só com pedidos novos e sem telefone', async () => {
    await createDiagnosisRequest(pedido, '', as('22:10', '04'));
    await createDiagnosisRequest({ ...pedido, business: 'Doces da Ana', presence: '@docesdaana', whatsapp: '(11) 97777-6666' }, '', as('01:00'));
    expect((await resumoDaManha('https://painel.test', as('06:10'), telegram(), abrir)).feito).toBe('cedo');
    const r = await resumoDaManha('https://painel.test', as('06:31'), telegram(), abrir);
    expect(r).toEqual({ feito: 'enviado', pedidos: 2 });
    expect(envios).toHaveLength(1);
    expect(envios[0]).toMatch(/Burger do Zé/);
    expect(envios[0]).toMatch(/Doces da Ana[\s\S]*Não tem site \(Instagram @docesdaana\)/);
    expect(envios[0]).toMatch(/painel\.test\/painel\/diagnosticos/);
    expect(envios[0]).not.toMatch(/98888|97777/);
    expect((await resumoDaManha('https://painel.test', as('06:36'), telegram(), abrir)).feito).toBe('ja-enviado');
    expect(envios).toHaveLength(1);
    // The analysis was saved on the request too (shown in the panel).
    expect((await listDiagnosisRequests(3, as('07:00'))).every((x) => x.analysis)).toBe(true);
    // Next day, nothing new: no message.
    expect((await resumoDaManha('https://painel.test', as('06:31', '06'), telegram(), abrir)).feito).toBe('sem-pedidos');
    expect(envios).toHaveLength(1);
  });

  it('se o Telegram falhar, tenta de novo no próximo minuto', async () => {
    await createDiagnosisRequest(pedido, '', as('01:00'));
    await expect(resumoDaManha('https://painel.test', as('06:31'), telegram(true), abrir)).rejects.toThrow(/Telegram/);
    expect((await resumoDaManha('https://painel.test', as('06:36'), telegram(), abrir)).feito).toBe('enviado');
    expect(envios).toHaveLength(2);
  });

  it('sem Telegram configurado, não faz nada', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    await createDiagnosisRequest(pedido, '', as('01:00'));
    expect((await resumoDaManha('https://painel.test', as('06:31'), telegram(), abrir)).feito).toBe('sem-telegram');
  });

  it('com muitos pedidos, corta por pedido inteiro e fica abaixo do limite do Telegram', () => {
    const longo = { tipo: 'site' as const, site: 'exemplo.com.br', redes: [], pontos: Array.from({ length: 9 }, (_, i) => `Ponto ${i} `.repeat(12)), ok: [], em: '' };
    const muitos = Array.from({ length: 12 }, (_, i) => ({ id: `${i}`, createdAt: '', business: `Negócio & ${i}`, segment: 'Bar', city: 'SP', whatsapp: '11999999999', presence: '', wishes: 'meu cel 11 99999-9999', consentAt: '', status: 'novo' as const, source: '', analysis: longo }));
    const t = textoResumo(muitos, 'https://p');
    expect(t.length).toBeLessThan(4096);
    expect(t).toMatch(/e mais \d+ no painel\./);
    expect(t).toMatch(/painel\/diagnosticos$/);
    expect((t.match(/<b>/g) ?? []).length).toBe((t.match(/<\/b>/g) ?? []).length);
    expect(t).not.toMatch(/99999/);
  });

  it('o texto escapa o que o cliente escreveu', () => {
    const t = textoResumo([{ id: 'x', createdAt: '', business: '<b>X</b>', segment: 'Bar', city: '', whatsapp: '11999999999', presence: '', wishes: '<script>', consentAt: '', status: 'novo', source: '' }], 'https://p');
    expect(t).not.toMatch(/<b>X<\/b>|<script>/);
    expect(t).toMatch(/&lt;b&gt;X/);
  });
});
