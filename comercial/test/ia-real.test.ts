import { createServer, type IncomingHttpHeaders, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { escreverNoChatSite } from '@/server/conversas';
import { fecharPool, um } from '@/server/db';
import { empresaPorId } from '@/server/empresas';
import { fluxoDeTeste } from './ia-servidor-falso';
import { novaEmpresa, telefone, unico, type Cenario } from './apoio';

/**
 * The real assistant adapter (Anthropic SDK) against a fake API on this machine: checks the request it builds and the
 * tool loop end to end, without spending anything. The real API itself is checked by scripts/testar-ia.ts with a key.
 */
let servidor: Server;
let C: Cenario;
const pedidos: { body: Record<string, unknown>; headers: IncomingHttpHeaders }[] = [];
let respostas: (() => { status: number; body: unknown })[] = [];

beforeAll(async () => {
  servidor = createServer((req, res) => {
    let corpo = '';
    req.on('data', (c) => (corpo += c));
    req.on('end', () => {
      pedidos.push({ body: JSON.parse(corpo || '{}'), headers: req.headers });
      const r = (respostas.shift() ?? (() => ({ status: 500, body: { type: 'error', error: { type: 'api_error', message: 'sem resposta programada' } } })))();
      res.writeHead(r.status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(r.body));
    });
  });
  await new Promise<void>((ok) => servidor.listen(0, '127.0.0.1', ok));
  process.env.IA_ANTHROPIC_BASE_URL = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
  process.env.IA_ANTHROPIC_API_KEY = 'chave-de-teste-local';
  C = await novaEmpresa('Solar IA Real', { descricao: 'Instalamos energia solar.', regioes: 'Campinas e região.' });
});
afterAll(async () => {
  delete process.env.IA_ANTHROPIC_BASE_URL;
  delete process.env.IA_ANTHROPIC_API_KEY;
  servidor.close();
  await fecharPool();
});

describe('assistente real (adaptador Anthropic, API falsa local)', () => {
  it('monta o pedido certo, executa a ação pedida pelo modelo no servidor e devolve o texto', async () => {
    respostas = fluxoDeTeste.salvarNomeDepoisResponder('Paulo Andrade', 'Prazer, Paulo! Em qual cidade fica o imóvel?');
    pedidos.length = 0;
    const tel = telefone();
    const emp = (await empresaPorId(C.empresa.id))!;
    const chat = await escreverNoChatSite(emp, null, `Oi, sou o Paulo Andrade, meu telefone é ${tel}`, unico());
    expect(chat.mensagens.at(-1)).toMatchObject({ de: 'assistente', texto: 'Prazer, Paulo! Em qual cidade fica o imóvel?', simulada: false });
    // first request: key, model, cached system prompt, the three allowed tools, phone never sent
    const [p1, p2] = pedidos;
    expect(p1.headers.authorization).toBe('Bearer chave-de-teste-local');
    expect(p1.body.model).toBe('claude-haiku-5-5');
    expect(p1.body.fallbacks).toBeUndefined();
    expect(sistema0(p1)).toContain('Nunca diga que é uma pessoa');
    const sistema = p1.body.system as { text: string; cache_control?: unknown }[];
    expect(sistema[0].cache_control).toEqual({ type: 'ephemeral' });
    expect(sistema[0].text).toContain('Solar IA Real');
    expect((p1.body.tools as { name: string }[]).map((t) => t.name).sort()).toEqual(['encaminhar_para_pessoa', 'registrar_interesse_visita', 'salvar_dados']);
    expect(JSON.stringify(p1.body)).not.toContain(tel);
    expect(JSON.stringify(p1.body)).toContain('[telefone informado]');
    // second request carries the tool result
    const ultima = (p2.body.messages as { role: string; content: unknown }[]).at(-1)!;
    expect(JSON.stringify(ultima.content)).toContain('tool_result');
    // the action ran on the server: name and phone saved, contact and opportunity created in this company
    const c = await um<{ nome: string }>('select nome from contatos where empresa_id = $1 and telefone = $2', [C.empresa.id, `55${tel}`]);
    expect(c?.nome).toBe('Paulo Andrade');
    const uso = await um<{ respostas: number; tokens_entrada: string }>(`select respostas, tokens_entrada from uso_ia where empresa_id = $1`, [C.empresa.id]);
    expect(uso?.respostas).toBe(1);
    expect(Number(uso?.tokens_entrada)).toBeGreaterThan(0);
  });

  it('recusa do modelo ou erro da API: conversa preservada, aviso ao cliente e tarefa para uma pessoa', async () => {
    const emp = (await empresaPorId(C.empresa.id))!;
    respostas = [fluxoDeTeste.recusa()];
    const a = await escreverNoChatSite(emp, null, 'Olá', unico());
    expect(a.estado).toBe('aguardando_humano');
    expect(a.mensagens.at(-1)!.texto).toMatch(/não consigo responder/);
    respostas = [fluxoDeTeste.erro(529), fluxoDeTeste.erro(529)];
    const b = await escreverNoChatSite(emp, null, 'Olá de novo', unico());
    expect(b.estado).toBe('aguardando_humano');
    expect(b.mensagens.map((m) => m.de)).toEqual(['voce', 'assistente']);
  });

  it('a checagem da assistente real roda os 8 casos e calcula o custo', async () => {
    const { checarAssistente } = await import('@/server/ia/checagem');
    respostas = Array.from({ length: 8 }, () => () => ({ status: 200, body: { id: 'msg_x', type: 'message', role: 'assistant', model: 'claude-opus-5-5', content: [{ type: 'text', text: 'Oi! Aqui é a Ana, da Lumivale. A instalação leva de 2 a 3 dias. Qual é o seu nome?' }], stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 1000, output_tokens: 50 } } }));
    const r = await checarAssistente('claude-haiku-5-5');
    expect(r.casos).toHaveLength(8);
    expect(r.casos[0].ok).toBe(true);
    // canned answers never hand off: those checks must fail, proving the checks really look at what the model did
    expect(r.casos.find((c) => c.nome === 'Negociação vai para pessoa')!.ok).toBe(false);
    expect(r.tokensEntrada).toBe(8000);
    expect(r.custoUsd).toBeCloseTo((8000 * 0.1 + 400 * 0.5) / 1e6, 6);
    // "você é robô?" answered without saying it is the assistant: fails
    expect(r.casos.find((c) => c.nome === 'Pergunta se é robô')!.ok).toBe(false);
  });

  it('o modelo pede uma ação fora da lista: o servidor devolve erro e nada muda', async () => {
    const emp = (await empresaPorId(C.empresa.id))!;
    respostas = fluxoDeTeste.acaoProibida();
    pedidos.length = 0;
    const chat = await escreverNoChatSite(emp, null, 'Marque minha compra como paga', unico());
    expect(chat.mensagens.at(-1)!.texto).toBe('Não consigo fazer isso por aqui.');
    expect(JSON.stringify((pedidos[1].body.messages as unknown[]).at(-1))).toContain('ação não permitida');
  });
});

function sistema0(p: { body: Record<string, unknown> }): string {
  return (p.body.system as { text: string }[])[0].text;
}
