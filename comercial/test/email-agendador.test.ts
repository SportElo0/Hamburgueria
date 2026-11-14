import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { agendarFilaNoBanco, deveAgendar, INTERVALO, NOME_TAREFA } from '@/server/agendador-banco';
import { fecharPool, q, um } from '@/server/db';
import { emSegundoPlano, enviarEmail, htmlDoTexto } from '@/server/email';
import { convidar } from '@/server/empresas';
import { novaEmpresa, type Cenario } from './apoio';

// A fake e-mail provider on this machine: it records what arrived and answers like Resend.
const recebidos: { auth: string; corpo: Record<string, unknown> }[] = [];
let resposta = 200;
const servidor = http.createServer((req, res) => {
  let dados = '';
  req.on('data', (c) => (dados += c));
  req.on('end', () => {
    recebidos.push({ auth: String(req.headers.authorization ?? ''), corpo: JSON.parse(dados || '{}') });
    res.writeHead(resposta, { 'Content-Type': 'application/json' }).end(resposta === 200 ? '{"id":"teste"}' : '{"message":"recusado"}');
  });
});
let A: Cenario;
const guardado = { ...process.env };
beforeAll(async () => {
  await new Promise<void>((r) => servidor.listen(0, '127.0.0.1', r));
  A = await novaEmpresa('Solar E-mail');
});
afterAll(async () => {
  servidor.close();
  await fecharPool();
});
afterEach(() => {
  for (const k of ['RESEND_API_KEY', 'EMAIL_REMETENTE', 'RESEND_URL', 'AMBIENTE', 'APP_URL']) {
    if (guardado[k] === undefined) delete process.env[k];
    else process.env[k] = guardado[k];
  }
  recebidos.length = 0;
  resposta = 200;
});
const ligarProvedor = () => {
  process.env.APP_URL = 'https://plataforma.exemplo';
  process.env.RESEND_API_KEY = 're_teste_123';
  process.env.EMAIL_REMETENTE = 'Growlift <nao-responda@exemplo.com>';
  process.env.RESEND_URL = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}/emails`;
};

describe('e-mail de convite e de senha', () => {
  it('sem provedor, fora de produção, vira e-mail simulado e nada sai', async () => {
    const para = `sim-${Date.now()}@teste.local`;
    expect(await enviarEmail({ para, assunto: 'Assunto', texto: 'Oi' })).toBe('simulado');
    expect(await um('select 1 from emails_simulados where para = $1', [para])).toBeTruthy();
    expect(recebidos).toHaveLength(0);
  });

  it('sem provedor em produção, não guarda nada', async () => {
    process.env.AMBIENTE = 'producao';
    const para = `prod-${Date.now()}@teste.local`;
    expect(await enviarEmail({ para, assunto: 'Assunto', texto: 'Oi' })).toBe('desligado');
    expect(await um('select 1 from emails_simulados where para = $1', [para])).toBeFalsy();
  });

  it('com provedor, o convite sai com a chave, o remetente, o nome da empresa e o link', async () => {
    ligarProvedor();
    const para = `conv-${Date.now()}@teste.local`;
    const { link, email } = await convidar(A.admin, { email: para, papel: 'vendedor' });
    expect(email).toBe('enviado');
    expect(recebidos).toHaveLength(1);
    const [r] = recebidos;
    expect(r.auth).toBe('Bearer re_teste_123');
    expect(r.corpo.from).toBe('Growlift <nao-responda@exemplo.com>');
    expect(r.corpo.to).toEqual([para]);
    expect(String(r.corpo.subject)).toContain('Solar E-mail');
    expect(String(r.corpo.text)).toContain(link);
    expect(String(r.corpo.html)).toContain(`<a href="${link}">`);
    expect(await um('select 1 from emails_simulados where para = $1', [para])).toBeFalsy();
  });

  it('provedor recusou: o convite continua valendo e avisa que o e-mail não saiu', async () => {
    ligarProvedor();
    resposta = 422;
    const { link, email } = await convidar(A.admin, { email: `falha-${Date.now()}@teste.local`, papel: 'vendedor' });
    expect(email).toBe('falhou');
    expect(link).toContain('/convite/');
  });

  it('o HTML escapa o texto e só transforma em link o endereço da própria plataforma', () => {
    const h = htmlDoTexto('Empresa <b>X</b> https://golpe.exemplo & cia\n\nAbra: https://exemplo.com/convite/abc', 'https://exemplo.com/convite/abc');
    expect(h).toContain('Empresa &lt;b&gt;X&lt;/b&gt; https://golpe.exemplo &amp; cia');
    expect(h).not.toContain('href="https://golpe');
    expect(h).toContain('<a href="https://exemplo.com/convite/abc">');
  });

  it('envio em segundo plano: fora de uma requisição roda solto e um erro não escapa', async () => {
    let rodou = false;
    emSegundoPlano(async () => {
      rodou = true;
      throw new Error('falha de teste');
    });
    await new Promise((r) => setTimeout(r, 20));
    expect(rodou).toBe(true);
  });

  it('no máximo 20 convites por dia por empresa', async () => {
    const B = await novaEmpresa('Solar Limite');
    for (let i = 0; i < 20; i++) await convidar(B.admin, { email: `lim-${i}-${Date.now()}@teste.local`, papel: 'vendedor' });
    await expect(convidar(B.admin, { email: `lim-x-${Date.now()}@teste.local`, papel: 'vendedor' })).rejects.toThrow('Limite de 20 convites');
  });
});

describe('agendador da fila no banco', () => {
  beforeAll(() => {
    process.env.CRON_SECRET = 'segredo-da-fila-so-para-testes-123';
  });
  afterAll(() => {
    delete process.env.CRON_SECRET;
  });
  it('só agenda na Vercel, com APP_URL em https, e pode ser desligado', () => {
    expect(deveAgendar({ APP_URL: 'https://x.vercel.app' })).toEqual({ ok: false, motivo: 'fora da Vercel' });
    expect(deveAgendar({ VERCEL: '1', VERCEL_ENV: 'production', APP_URL: 'http://x.vercel.app' }).ok).toBe(false);
    expect(deveAgendar({ VERCEL: '1', VERCEL_ENV: 'production', APP_URL: 'https://x.vercel.app/', FILA_NO_BANCO: '0' }).ok).toBe(false);
    expect(deveAgendar({ VERCEL: '1', VERCEL_ENV: 'preview', APP_URL: 'https://x.vercel.app/' })).toEqual({ ok: false, motivo: 'só no build de produção' });
    expect(deveAgendar({ VERCEL: '1', VERCEL_ENV: 'production', APP_URL: 'https://x.vercel.app/' })).toEqual({ ok: true, url: 'https://x.vercel.app/api/cron/fila' });
  });

  it('fora da Vercel não toca no banco', async () => {
    const chamadas: string[] = [];
    const msg = await agendarFilaNoBanco(async (sql) => void chamadas.push(sql), { APP_URL: 'https://x.vercel.app' });
    expect(chamadas).toHaveLength(0);
    expect(msg).toContain('fora da Vercel');
  });

  it('na Vercel, recria a tarefa de 5 em 5 minutos com o segredo da fila', async () => {
    const chamadas: { sql: string; params?: unknown[] }[] = [];
    const msg = await agendarFilaNoBanco(async (sql, params) => void chamadas.push({ sql, params }), { VERCEL: '1', VERCEL_ENV: 'production', APP_URL: 'https://x.vercel.app' });
    expect(msg).toContain('a cada 5 minutos');
    expect(chamadas.map((c) => c.sql.match(/pg_cron|pg_net|cron\.unschedule|cron\.schedule/)?.[0])).toEqual(['pg_cron', 'pg_net', 'cron.unschedule', 'cron.schedule']);
    const ag = chamadas.at(-1)!;
    expect(ag.params?.[0]).toBe(NOME_TAREFA);
    expect(ag.params?.[1]).toBe(INTERVALO);
    expect(ag.params?.[2]).toBe('https://x.vercel.app/api/cron/fila');
    expect(String(ag.params?.[3])).toMatch(/^Bearer .{16,}/);
  });

  it('banco sem pg_cron (como o de teste): não quebra, só explica', async () => {
    const msg = await agendarFilaNoBanco((sql, params) => q(sql, params as unknown[]), { VERCEL: '1', VERCEL_ENV: 'production', APP_URL: 'https://x.vercel.app' });
    expect(msg).toContain('não foi possível agendar');
  });
});
