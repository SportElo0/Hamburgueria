import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { fecharPool, q } from '@/server/db';
import { salvarConfig } from '@/server/empresas';
import { limparDadosAntigos, quantosVencidos } from '@/server/limpeza';
import { receberPedido, type PedidoSalvo } from '@/server/pedidos';
import { contar, meta, novaEmpresa, pedido, type Cenario } from './apoio';

let A: Cenario;
let B: Cenario;
const envelhecer = (contatoId: string, meses: number) =>
  Promise.all([
    q(`update contatos set criado_em = now() - make_interval(months => $2) where id = $1`, [contatoId, meses]),
    q(`update oportunidades set ultima_interacao_em = now() - make_interval(months => $2), entrada_em = now() - make_interval(months => $2) where contato_id = $1`, [contatoId, meses]),
    q(`update conversas set atualizado_em = now() - make_interval(months => $2) where contato_id = $1`, [contatoId, meses]),
  ]);
const existe = (id: string) => contar('contatos where id = $1', [id]);

beforeAll(async () => {
  A = await novaEmpresa('Solar Limpeza');
  B = await novaEmpresa('Solar Limpeza B');
  await salvarConfig(A.admin, 'dados', { guarda_meses: 12 });
  await salvarConfig(B.admin, 'dados', { guarda_meses: 0 });
});
afterAll(fecharPool);

describe('limpeza automática', () => {
  it('apaga quem não virou cliente e ficou sem contato no prazo; mantém clientes, recentes, visita marcada e quem desligou', async () => {
    const velho = (await receberPedido(A.empresa, pedido(), meta())) as PedidoSalvo;
    const cliente = (await receberPedido(A.empresa, pedido(), meta())) as PedidoSalvo;
    const recente = (await receberPedido(A.empresa, pedido(), meta())) as PedidoSalvo;
    const outra = (await receberPedido(B.empresa, pedido(), meta())) as PedidoSalvo;
    await envelhecer(velho.contatoId, 13);
    await envelhecer(cliente.contatoId, 30);
    await q(`update oportunidades set etapa = 'ganho' where id = $1`, [cliente.oportunidadeId]);
    await envelhecer(recente.contatoId, 6);
    await envelhecer(outra.contatoId, 60);

    expect(await quantosVencidos(A.admin, 12)).toBe(1);
    expect(await limparDadosAntigos(true)).toBeGreaterThanOrEqual(1);
    expect(await existe(velho.contatoId)).toBe(0);
    expect(await contar('oportunidades where id = $1', [velho.oportunidadeId])).toBe(0);
    expect(await contar('consentimentos where contato_id = $1', [velho.contatoId])).toBe(0);
    expect(await existe(cliente.contatoId)).toBe(1);
    expect(await existe(recente.contatoId)).toBe(1);
    expect(await existe(outra.contatoId)).toBe(1); // company with retention off
    // only the count goes to the history
    const ev = await q<{ dados: { contatos: number } }>(`select dados from eventos where empresa_id = $1 and tipo = 'limpeza_automatica'`, [A.empresa.id]);
    expect(ev.at(-1)!.dados).toEqual({ contatos: 1, meses: 12 });
  });

  it('roda no máximo uma vez a cada 20 horas', async () => {
    await limparDadosAntigos(true);
    const p = (await receberPedido(A.empresa, pedido(), meta())) as PedidoSalvo;
    await envelhecer(p.contatoId, 20);
    expect(await limparDadosAntigos()).toBe(0);
    expect(await existe(p.contatoId)).toBe(1);
    await limparDadosAntigos(true);
    expect(await existe(p.contatoId)).toBe(0);
  });
});
