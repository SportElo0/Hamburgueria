import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { enviarModeloEquipe } from '@/server/conversas';
import { fecharPool, q } from '@/server/db';
import { empresaPorId, salvarConfig } from '@/server/empresas';
import { salvarModeloEquipe, salvarWhatsApp } from '@/server/integracoes';
import { definirValor, historico, mudarEtapa } from '@/server/oportunidades';
import { receberPedido, type PedidoSalvo } from '@/server/pedidos';
import { definirRelato, hojeEm, recebimentosDa, registrarRecebimento, relatorioVendas, removerRecebimento } from '@/server/recebimentos';
import { processarFila } from '@/server/trabalhos';
import { meta, novaEmpresa, pedido, type Cenario } from './apoio';

let C: Cenario;
let B: Cenario;
const hoje = () => hojeEm('America/Sao_Paulo');
const mes = () => hoje().slice(0, 7);
const vencer = (op: string, tipo: string, limite = 1) =>
  q(`update trabalhos set executar_em = now() - interval '1 second' where id in (select id from trabalhos where oportunidade_id = $1 and tipo = $2 and estado = 'pendente' order by executar_em limit $3)`, [op, tipo, limite]);

beforeAll(async () => {
  C = await novaEmpresa('Pousada Recebimentos');
  B = await novaEmpresa('Outra Recebimentos');
  await salvarConfig(C.admin, 'regras', { ...C.empresa.config.regras, retorno_auto_cliente: true, retorno_auto_horas: 24, retorno_auto_horas_2: 72, hora_inicio: 0, hora_fim: 24 });
  await salvarWhatsApp(C.admin, { modo: 'simulador', modelo_retorno: 'teste_retorno' });
  await salvarModeloEquipe(C.admin, { nome: 'orcamento', titulo: 'Orçamento', texto: 'Olá, {{1}}! O valor fica em {{2}}. Para não receber mensagens, responda SAIR.', campos: ['Nome', 'Valor'] });
  C.empresa = (await empresaPorId(C.empresa.id))!;
});
afterAll(fecharPool);

describe('recebimentos de uma venda', () => {
  it('proposta de R$ 3.200 com sinal de R$ 800: R$ 800 recebidos e R$ 2.400 em aberto; tudo fica no histórico', async () => {
    const p = (await receberPedido(C.empresa, pedido(), meta())) as PedidoSalvo;
    await definirValor(C.vendedor, p.oportunidadeId, 320000);
    await mudarEtapa(C.vendedor, p.oportunidadeId, { etapa: 'negociacao' });
    await registrarRecebimento(C.vendedor, p.oportunidadeId, { valorCentavos: 80000, recebidoEm: hoje(), descricao: 'Sinal' });
    const rs = await recebimentosDa(C.vendedor, p.oportunidadeId);
    const total = rs.reduce((t, r) => t + r.valor_centavos, 0);
    expect(total).toBe(80000);
    expect(320000 - total).toBe(240000);
    expect(rs[0]).toMatchObject({ descricao: 'Sinal', recebido_em: hoje() });
    // Accepted and not fully paid yet: the sale is not "won" by itself.
    const [o] = await q<{ etapa: string }>('select etapa from oportunidades where id = $1', [p.oportunidadeId]);
    expect(o.etapa).toBe('negociacao');
    expect((await historico(C.admin, p.oportunidadeId)).some((e) => e.tipo === 'recebimento_registrado' && (e.dados as { valor_centavos: number }).valor_centavos === 80000)).toBe(true);
  });

  it('recusa valor zero, data no futuro e oportunidade perdida; outra empresa não vê nem registra', async () => {
    const p = (await receberPedido(C.empresa, pedido(), meta())) as PedidoSalvo;
    await expect(registrarRecebimento(C.vendedor, p.oportunidadeId, { valorCentavos: 0, recebidoEm: hoje() })).rejects.toThrow(/maior que zero/);
    await expect(registrarRecebimento(C.vendedor, p.oportunidadeId, { valorCentavos: 100, recebidoEm: '2099-01-01' })).rejects.toThrow(/futuro/);
    await expect(registrarRecebimento(C.vendedor, p.oportunidadeId, { valorCentavos: 100, recebidoEm: '2026-02-30' })).rejects.toThrow(/inválida/);
    await expect(registrarRecebimento(B.admin, p.oportunidadeId, { valorCentavos: 100, recebidoEm: hoje() })).rejects.toThrow(/não encontrada/);
    await registrarRecebimento(C.vendedor, p.oportunidadeId, { valorCentavos: 100, recebidoEm: hoje() });
    expect(await recebimentosDa(B.admin, p.oportunidadeId)).toHaveLength(0);
    await mudarEtapa(C.vendedor, p.oportunidadeId, { etapa: 'perdido', motivoPerda: 'desistiu' });
    await expect(registrarRecebimento(C.vendedor, p.oportunidadeId, { valorCentavos: 100, recebidoEm: hoje() })).rejects.toThrow(/perdida/);
  });

  it('só quem registrou ou o administrador remove, e a remoção fica no histórico', async () => {
    const p = (await receberPedido(C.empresa, pedido(), meta())) as PedidoSalvo;
    const id = await registrarRecebimento(C.admin, p.oportunidadeId, { valorCentavos: 5000, recebidoEm: hoje() });
    await expect(removerRecebimento(C.vendedor, id)).rejects.toThrow(/Só quem registrou/);
    await expect(removerRecebimento(B.admin, id)).rejects.toThrow(/não encontrado/);
    await removerRecebimento(C.admin, id);
    expect(await recebimentosDa(C.admin, p.oportunidadeId)).toHaveLength(0);
    expect((await historico(C.admin, p.oportunidadeId)).some((e) => e.tipo === 'recebimento_removido')).toBe(true);
  });
});

describe('relatório: vendas pagas após retomada', () => {
  it('separa a venda paga depois de uma retomada enviada da venda paga sem retomada, e mostra o que o vendedor disse', async () => {
    // With follow-up: the quote goes, nobody answers, the follow-up goes, then the down payment arrives.
    const com = (await receberPedido(C.empresa, pedido({ nome: 'Com Retomada' }), meta())) as PedidoSalvo;
    await q(`update trabalhos set estado = 'cancelado' where oportunidade_id = $1 and tipo = 'confirmacao_pedido'`, [com.oportunidadeId]);
    await enviarModeloEquipe(C.vendedor, { oportunidadeId: com.oportunidadeId, modelo: 'orcamento', valores: ['Ana', 'R$ 3.200'], seguirRetomada: true, valorCentavos: 320000 });
    await processarFila();
    await vencer(com.oportunidadeId, 'retorno_cliente', 1);
    await processarFila();
    await mudarEtapa(C.vendedor, com.oportunidadeId, { etapa: 'negociacao' });
    await registrarRecebimento(C.vendedor, com.oportunidadeId, { valorCentavos: 80000, recebidoEm: hoje(), descricao: 'Sinal' });
    await definirRelato(C.vendedor, com.oportunidadeId, 'voltou_pela_retomada');

    // Without follow-up: paid right after the quote.
    const sem = (await receberPedido(C.empresa, pedido({ nome: 'Sem Retomada' }), meta())) as PedidoSalvo;
    await q(`update trabalhos set estado = 'cancelado' where oportunidade_id = $1 and tipo = 'confirmacao_pedido'`, [sem.oportunidadeId]);
    await enviarModeloEquipe(C.vendedor, { oportunidadeId: sem.oportunidadeId, modelo: 'orcamento', valores: ['Bia', 'R$ 1.000'], seguirRetomada: true, valorCentavos: 100000 });
    await processarFila();
    await mudarEtapa(C.vendedor, sem.oportunidadeId, { etapa: 'ganho' });
    await registrarRecebimento(C.vendedor, sem.oportunidadeId, { valorCentavos: 100000, recebidoEm: hoje(), descricao: 'Pagamento integral' });

    await expect(relatorioVendas(C.vendedor, mes())).rejects.toThrow(/administrador/);
    const r = await relatorioVendas(C.admin, mes());
    const linhaCom = r.linhas.find((l) => l.oportunidade_id === com.oportunidadeId)!;
    const linhaSem = r.linhas.find((l) => l.oportunidade_id === sem.oportunidadeId)!;
    expect(linhaCom).toMatchObject({ cliente: 'Com Retomada', recebido_mes_centavos: 80000, recebido_total_centavos: 80000, valor_proposta_centavos: 320000, relato: 'voltou_pela_retomada' });
    expect(linhaCom.retomada_em).not.toBeNull();
    expect(linhaSem.retomada_em).toBeNull();
    expect(r.aposRetomada.map((l) => l.oportunidade_id)).toContain(com.oportunidadeId);
    expect(r.aposRetomada.map((l) => l.oportunidade_id)).not.toContain(sem.oportunidadeId);
    expect(r.recebidoAposRetomada).toBeGreaterThanOrEqual(80000);
    expect(r.recebidoMes).toBeGreaterThanOrEqual(180000);
    // The other company's report sees none of it.
    expect((await relatorioVendas(B.admin, mes())).linhas).toHaveLength(0);
    await expect(definirRelato(C.vendedor, com.oportunidadeId, 'inventado')).rejects.toThrow(/inválida/);
  });
});
