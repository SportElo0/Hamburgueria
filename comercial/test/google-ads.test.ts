import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { resultadosAnuncios } from '@/server/anuncios';
import { fecharPool, um } from '@/server/db';
import { empresaDaChaveGoogle, gerarChaveGoogle, googleAdsDa, lerLead } from '@/server/google-ads';
import { POST } from '@/app/api/webhooks/google-ads/route';
import { contar, novaEmpresa, telefone, unico, type Cenario } from './apoio';

vi.mock('next/server', () => ({ after: () => {} }));

let A: Cenario;
let B: Cenario;
let chaveA: string;

/** The JSON Google Ads sends for a filled lead form. */
const lead = (tel: string, extra: Record<string, unknown> = {}) => ({
  lead_id: `lead_${unico()}`,
  api_version: '1.0',
  form_id: 4455,
  campaign_id: 987654321,
  gcl_id: 'gclid-teste',
  google_key: chaveA,
  is_test: false,
  user_column_data: [
    { column_id: 'FULL_NAME', column_name: 'Full Name', string_value: 'Paula Teste' },
    { column_id: 'PHONE_NUMBER', column_name: 'User Phone', string_value: `+55${tel}` },
    { column_id: 'CITY', column_name: 'City', string_value: 'Campinas' },
    { column_id: 'EMAIL', column_name: 'User Email', string_value: 'paula@teste.local' },
    { column_id: 'tipo_de_imovel', column_name: 'Tipo de imóvel', string_value: 'Casa' },
  ],
  ...extra,
});
const enviar = (corpo: unknown) => POST(new Request('http://x/api/webhooks/google-ads', { method: 'POST', body: JSON.stringify(corpo), headers: { 'content-type': 'application/json' } }));

beforeAll(async () => {
  A = await novaEmpresa('Solar Google');
  B = await novaEmpresa('Solar Google B');
  chaveA = await gerarChaveGoogle(A.admin);
});
afterAll(fecharPool);

describe('formulário de anúncio do Google', () => {
  it('só o administrador cria a chave; o banco guarda só o hash', async () => {
    await expect(gerarChaveGoogle(A.vendedor)).rejects.toThrow();
    expect(chaveA).toMatch(/^gads_/);
    expect((await empresaDaChaveGoogle(chaveA))?.id).toBe(A.empresa.id);
    expect(await um(`select 1 from integracoes where config::text like $1`, [`%${chaveA}%`])).toBeFalsy();
  });

  it('o lead vira pedido no funil, com contato, campanha, tarefa e sem WhatsApp automático', async () => {
    const tel = telefone();
    const r = await enviar(lead(tel));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({});
    const op = await um<{ id: string; origem: string; etapa: string; necessidade: string; campanha: Record<string, string> }>(
      `select o.id, o.origem, o.etapa, o.necessidade, o.campanha from oportunidades o join contatos c on c.id = o.contato_id where o.empresa_id = $1 and c.telefone = $2`,
      [A.empresa.id, `55${tel}`],
    );
    expect(op).toMatchObject({ origem: 'anuncio_google', etapa: 'novo', necessidade: 'Tipo de imóvel: Casa' });
    expect(op!.campanha).toEqual({ utm_source: 'google', utm_medium: 'formulario_anuncio', utm_campaign: '987654321', gclid: 'gclid-teste' });
    const c = await um<{ nome: string; cidade: string; dados: Record<string, string> }>('select nome, cidade, dados from contatos where empresa_id = $1 and telefone = $2', [A.empresa.id, `55${tel}`]);
    expect(c).toEqual({ nome: 'Paula Teste', cidade: 'Campinas', dados: { 'E-mail': 'paula@teste.local' } });
    expect(await contar('tarefas where oportunidade_id = $1', [op!.id])).toBeGreaterThan(0);
    expect(await contar('consentimentos k join contatos c on c.id = k.contato_id where c.telefone = $1', [`55${tel}`])).toBe(0);
    expect(await contar(`trabalhos where oportunidade_id = $1 and tipo = 'confirmacao_pedido'`, [op!.id])).toBe(0);
    expect((await googleAdsDa(A.empresa.id))?.ultimo_lead_em).toBeTruthy();
    // It shows in the ads report as Google, by campaign id.
    const mes = new Date().toISOString().slice(0, 7);
    const linha = (await resultadosAnuncios(A.admin, mes)).find((l) => l.fonte === 'google' && l.campanha === '987654321');
    expect(linha?.pedidos).toBeGreaterThanOrEqual(1);
  });

  it('o mesmo lead entregue duas vezes não cria uma segunda oportunidade', async () => {
    const tel = telefone();
    const corpo = lead(tel);
    expect((await enviar(corpo)).status).toBe(200);
    expect((await enviar(corpo)).status).toBe(200);
    expect(await contar('oportunidades o join contatos c on c.id = o.contato_id where o.empresa_id = $1 and c.telefone = $2', [A.empresa.id, `55${tel}`])).toBe(1);
  });

  it('dados de teste do Google só marcam a ligação, sem criar pedido', async () => {
    const tel = telefone();
    expect((await enviar(lead(tel, { is_test: true }))).status).toBe(200);
    expect(await contar('contatos where empresa_id = $1 and telefone = $2', [A.empresa.id, `55${tel}`])).toBe(0);
    expect((await googleAdsDa(A.empresa.id))?.ultimo_teste_em).toBeTruthy();
  });

  it('chave errada, de outra empresa ou ausente é recusada', async () => {
    const tel = telefone();
    expect((await enviar(lead(tel, { google_key: 'gads_chave_que_nao_existe_123456' }))).status).toBe(401);
    expect((await enviar(lead(tel, { google_key: undefined }))).status).toBe(401);
    expect((await enviar([1, 2]))).toHaveProperty('status', 401);
    expect(await contar('contatos where telefone = $1', [`55${tel}`])).toBe(0);
    // Company B has no key: A's key never puts a lead in B.
    expect(await googleAdsDa(B.empresa.id)).toBeNull();
  });

  it('trocar a chave invalida a anterior', async () => {
    const antiga = chaveA;
    chaveA = await gerarChaveGoogle(A.admin);
    expect(await empresaDaChaveGoogle(antiga)).toBeNull();
    expect((await empresaDaChaveGoogle(chaveA))?.id).toBe(A.empresa.id);
  });

  it('sem telefone válido: recusa com explicação (4xx, o Google não reenvia)', async () => {
    const r = await enviar({ ...lead(telefone()), user_column_data: [{ column_id: 'FULL_NAME', string_value: 'Sem Fone' }, { column_id: 'EMAIL', string_value: 'x@teste.local' }] });
    expect(r.status).toBe(422);
    expect((await r.json()).message).toMatch(/telefone/);
  });

  it('lê nome separado em primeiro e último, e JSON inválido dá 400', async () => {
    expect(lerLead([{ column_id: 'FIRST_NAME', string_value: 'Ana' }, { column_id: 'LAST_NAME', string_value: 'Lima' }, { column_id: 'PHONE_NUMBER', string_value: '+5511912345678' }])).toMatchObject({ nome: 'Ana Lima', telefone: '5511912345678', necessidade: 'Preencheu o formulário do anúncio do Google.' });
    const r = await POST(new Request('http://x/api/webhooks/google-ads', { method: 'POST', body: '{ruim' }));
    expect(r.status).toBe(400);
  });
});
