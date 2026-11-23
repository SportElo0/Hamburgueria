import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { simulador } from '@/server/canais/simulador';
import { assumir, atualizarEstado, despachar, enviarModeloEquipe, montarModelo, simularEntradaWhatsApp } from '@/server/conversas';
import { fecharPool, q, um } from '@/server/db';
import { empresaPorId, salvarConfig } from '@/server/empresas';
import { integracaoWhatsApp, removerModeloEquipe, salvarModeloEquipe, salvarWhatsApp } from '@/server/integracoes';
import { mudarEtapa, obter } from '@/server/oportunidades';
import { receberPedido, type PedidoSalvo } from '@/server/pedidos';
import { criarProposta, enviarProposta, propostasDa, responderProposta } from '@/server/propostas';
import { processarFila } from '@/server/trabalhos';
import type { Trabalho } from '@/server/fila';
import { contar, meta, novaEmpresa, pedido, telefone, type Cenario } from './apoio';

let C: Cenario;
let B: Cenario;
const ORCAMENTO = {
  nome: 'orcamento_reserva',
  titulo: 'Valores da reserva',
  texto: 'Olá, {{1}}! Aqui é da {{2}}. Para {{3}}, o valor fica em {{4}}. Para reservar, é só responder esta mensagem. Para não receber mensagens, responda SAIR.',
  campos: ['Nome do cliente', 'Nome da empresa', 'Datas e pessoas', 'Valor'],
};
const valores = ['Juliana', 'Pousada Teste', '20 a 22/12, 2 adultos', 'R$ 3.200'];
const vencer = (op: string, tipo: string, limite = 1) =>
  q(`update trabalhos set executar_em = now() - interval '1 second' where id in (select id from trabalhos where oportunidade_id = $1 and tipo = $2 and estado = 'pendente' order by executar_em limit $3)`, [op, tipo, limite]);
const saidas = (contatoId: string) =>
  q<{ id: string; corpo: string; estado: string; autor: string; modelo_mensagem: string | null; id_provedor: string | null; finalidade: string | null }>(
    `select m.id, m.corpo, m.estado, m.autor, m.modelo_mensagem, m.id_provedor, m.finalidade from mensagens m join conversas v on v.id = m.conversa_id where v.contato_id = $1 and m.direcao = 'saida' order by m.criado_em, m.id`,
    [contatoId],
  );
/** A request from the site with WhatsApp consent; the confirmation is left out so only our sends are counted. */
async function pedidoDoSite(extra: Parameters<typeof pedido>[0] = {}) {
  const p = (await receberPedido(C.empresa, pedido({ nome: 'Juliana Prado', ...extra }), meta())) as PedidoSalvo;
  await q(`update trabalhos set estado = 'cancelado' where oportunidade_id = $1 and tipo = 'confirmacao_pedido'`, [p.oportunidadeId]);
  return p;
}

beforeAll(async () => {
  C = await novaEmpresa('Pousada Teste');
  B = await novaEmpresa('Outra Empresa');
  await salvarConfig(C.admin, 'regras', { ...C.empresa.config.regras, retorno_auto_cliente: true, retorno_auto_horas: 24, retorno_auto_horas_2: 72, hora_inicio: 0, hora_fim: 24 });
  await salvarWhatsApp(C.admin, { modo: 'simulador', modelo_retorno: 'teste_retorno' });
  await salvarModeloEquipe(C.admin, ORCAMENTO);
  C.empresa = (await empresaPorId(C.empresa.id))!;
});
afterEach(() => {
  simulador().fila.length = 0;
});
afterAll(fecharPool);

describe('modelos aprovados cadastrados pela empresa', () => {
  it('confere o texto com os campos, só o administrador cadastra, e salvar o resto do WhatsApp não apaga os modelos', async () => {
    await expect(salvarModeloEquipe(C.admin, { ...ORCAMENTO, nome: 'x_y', campos: ['Nome'] })).rejects.toThrow(/tem 4 campos/);
    await expect(salvarModeloEquipe(C.admin, { ...ORCAMENTO, nome: 'x_z', texto: 'Olá {{1}}, valor {{3}}. Responda SAIR.', campos: ['a', 'b', 'c'] })).rejects.toThrow(/pula o campo \{\{2\}\}/);
    await expect(salvarModeloEquipe(C.admin, { ...ORCAMENTO, nome: 'Com Espaço' })).rejects.toThrow(/minúsculas/);
    // A huge field number is refused at once (it must never make the server count up to it).
    const t0 = Date.now();
    await expect(salvarModeloEquipe(C.admin, { ...ORCAMENTO, nome: 'enorme', texto: 'Oi {{99999999999}}. Responda SAIR.', campos: ['a'] })).rejects.toThrow(/\{\{1\}\} a \{\{10\}\}/);
    await expect(salvarModeloEquipe(C.admin, { ...ORCAMENTO, nome: 'zero', texto: 'Oi {{0}}. Responda SAIR.', campos: ['a'] })).rejects.toThrow(/\{\{1\}\} a/);
    expect(Date.now() - t0).toBeLessThan(2000);
    await expect(salvarModeloEquipe(C.admin, { ...ORCAMENTO, nome: 'sem_sair', texto: 'Olá, {{1}}! Valor {{2}}.', campos: ['a', 'b'] })).rejects.toThrow(/SAIR/);
    await expect(salvarModeloEquipe(C.vendedor, { ...ORCAMENTO, nome: 'outro' })).rejects.toThrow(/administrador/);
    await salvarWhatsApp(C.admin, { modo: 'simulador', modelo_retorno: 'teste_retorno' });
    expect((await integracaoWhatsApp(C.empresa.id)).config.modelos_equipe.map((m) => m.nome)).toEqual(['orcamento_reserva']);
    await salvarModeloEquipe(C.admin, { ...ORCAMENTO, nome: 'temporario' });
    await removerModeloEquipe(C.admin, 'temporario');
    expect((await integracaoWhatsApp(C.empresa.id)).config.modelos_equipe).toHaveLength(1);
  });
});

describe('a recepção envia o orçamento pelo painel (percurso da pousada)', () => {
  it('pedido do site com autorização, sem conversa no WhatsApp: o modelo sai com os campos, a etapa vira proposta e a retomada fica agendada', async () => {
    const p = await pedidoDoSite();
    expect(await contar(`conversas where contato_id = $1 and canal = 'whatsapp'`, [p.contatoId])).toBe(0);
    const r = await enviarModeloEquipe(C.vendedor, { oportunidadeId: p.oportunidadeId, modelo: 'orcamento_reserva', valores, seguirRetomada: true, valorCentavos: 320000 });
    expect(r.moverParaProposta).toBe(true);
    const antes = simulador().enviados.length;
    await processarFila();
    const [m] = await saidas(p.contatoId);
    expect(m).toMatchObject({ autor: 'humano', estado: 'enviada', modelo_mensagem: 'orcamento_reserva', finalidade: 'modelo_equipe' });
    expect(m.corpo).toBe(montarModelo(ORCAMENTO.texto, valores));
    // Outside the 24 hours the provider got the template with each field as its own parameter.
    const enviado = simulador().enviados.slice(antes).find((x) => x.modelo === 'orcamento_reserva')!;
    expect(enviado.corpo).toBe(`[modelo orcamento_reserva] ${valores.join(' | ')}`);
    const op = await obter(C.vendedor, p.oportunidadeId);
    expect(op.etapa).toBe('proposta');
    expect(Number(op.valor_proposta_centavos)).toBe(320000);
    // The person did not take the conversation: the follow-up of the proposal can still go out.
    expect((await um<{ estado: string }>('select estado from conversas where id = $1', [r.conversaId]))!.estado).toBe('ia_ativa');
    expect(await contar(`trabalhos where oportunidade_id = $1 and tipo = 'retorno_cliente' and estado = 'pendente'`, [p.oportunidadeId])).toBe(2);
    // The delivery report moves the message forward; a repeated or older report changes nothing.
    await atualizarEstado(C.empresa.id, m.id_provedor!, 'delivered', null);
    await atualizarEstado(C.empresa.id, m.id_provedor!, 'sent', null);
    expect((await saidas(p.contatoId))[0].estado).toBe('entregue');
  });

  it('a retomada sai no dia seguinte se a hóspede não responder, e para quando ela responde', async () => {
    const tel = telefone();
    const p = await pedidoDoSite({ telefone: tel });
    await enviarModeloEquipe(C.vendedor, { oportunidadeId: p.oportunidadeId, modelo: 'orcamento_reserva', valores, seguirRetomada: true });
    await processarFila();
    await vencer(p.oportunidadeId, 'retorno_cliente', 1);
    await processarFila();
    let ms = await saidas(p.contatoId);
    expect(ms.map((m) => m.finalidade)).toEqual(['modelo_equipe', 'retorno']);
    expect(ms[1]).toMatchObject({ estado: 'enviada', autor: 'sistema' });
    await simularEntradaWhatsApp(C.admin, tel, '', 'Oi! Vi sim, pode reservar.');
    await vencer(p.oportunidadeId, 'retorno_cliente', 5);
    await processarFila();
    ms = await saidas(p.contatoId);
    expect(ms.filter((m) => m.finalidade === 'retorno')).toHaveLength(1);
  });

  it('sem marcar a retomada, quem envia assume a conversa e as mensagens automáticas param', async () => {
    const p = await pedidoDoSite();
    await mudarEtapa(C.vendedor, p.oportunidadeId, { etapa: 'proposta' });
    const r = await enviarModeloEquipe(C.vendedor, { oportunidadeId: p.oportunidadeId, modelo: 'orcamento_reserva', valores });
    expect((await um<{ estado: string; assumida_por: string }>('select estado, assumida_por from conversas where id = $1', [r.conversaId]))).toMatchObject({ estado: 'humano_atendendo', assumida_por: C.vendedor.userId });
    await vencer(p.oportunidadeId, 'retorno_cliente', 5);
    await processarFila();
    expect((await saidas(p.contatoId)).filter((m) => m.autor === 'sistema' && m.estado !== 'cancelada')).toHaveLength(0);
  });

  it('pela caixa de conversas: a conversa sem mensagem do cliente aceita o modelo', async () => {
    const p = await pedidoDoSite();
    const r1 = await enviarModeloEquipe(C.vendedor, { oportunidadeId: p.oportunidadeId, modelo: 'orcamento_reserva', valores, seguirRetomada: true });
    const r2 = await enviarModeloEquipe(C.vendedor, { conversaId: r1.conversaId, modelo: 'orcamento_reserva', valores: ['Juliana', 'Pousada Teste', '23 a 25/12, 2 adultos', 'R$ 3.500'] });
    expect(r2.conversaId).toBe(r1.conversaId);
    await processarFila();
    expect((await saidas(p.contatoId)).filter((m) => m.modelo_mensagem === 'orcamento_reserva').map((m) => m.estado)).toEqual(['enviada', 'enviada']);
  });

  it('dois toques no botão (ou duas pessoas) não mandam o mesmo orçamento duas vezes', async () => {
    const p = await pedidoDoSite();
    const envio = () => enviarModeloEquipe(C.vendedor, { oportunidadeId: p.oportunidadeId, modelo: 'orcamento_reserva', valores, seguirRetomada: true });
    const r = await Promise.allSettled([envio(), envio()]);
    expect(r.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
    expect(String((r.find((x) => x.status === 'rejected') as PromiseRejectedResult).reason)).toMatch(/já foi enviada/);
    expect(await contar(`mensagens m join conversas v on v.id = m.conversa_id where v.contato_id = $1 and m.modelo_mensagem = 'orcamento_reserva'`, [p.contatoId])).toBe(1);
  });

  it('recusa quem não autorizou, quem pediu SAIR, telefone fixo, campo vazio e oportunidade de outra empresa', async () => {
    const semAceite = (await receberPedido(C.empresa, pedido({ aceite_whatsapp: false }), meta())) as PedidoSalvo;
    await expect(enviarModeloEquipe(C.vendedor, { oportunidadeId: semAceite.oportunidadeId, modelo: 'orcamento_reserva', valores })).rejects.toThrow(/não autorizou/);

    const tel = telefone();
    const saiu = await pedidoDoSite({ telefone: tel });
    await simularEntradaWhatsApp(C.admin, tel, '', 'SAIR');
    // Writing SAIR opens the 24 hours, but the opt-out wins until the customer writes again.
    await expect(enviarModeloEquipe(C.vendedor, { oportunidadeId: saiu.oportunidadeId, modelo: 'orcamento_reserva', valores })).rejects.toThrow(/não receber mensagens/);

    const fixo = await pedidoDoSite({ telefone: '1133334444' });
    await expect(enviarModeloEquipe(C.vendedor, { oportunidadeId: fixo.oportunidadeId, modelo: 'orcamento_reserva', valores })).rejects.toThrow(/celular/);

    const p = await pedidoDoSite();
    await expect(enviarModeloEquipe(C.vendedor, { oportunidadeId: p.oportunidadeId, modelo: 'orcamento_reserva', valores: ['Juliana', '', 'x', 'y'] })).rejects.toThrow(/Nome da empresa/);
    await expect(enviarModeloEquipe(C.vendedor, { oportunidadeId: p.oportunidadeId, modelo: 'nao_existe', valores })).rejects.toThrow(/modelos aprovados/);
    await expect(enviarModeloEquipe(B.vendedor, { oportunidadeId: p.oportunidadeId, modelo: 'orcamento_reserva', valores })).rejects.toThrow();
    await expect(enviarModeloEquipe(C.vendedor, { oportunidadeId: 'nao-e-um-id', modelo: 'orcamento_reserva', valores })).rejects.toThrow(/não encontrada/);
    await expect(enviarModeloEquipe({ ...C.vendedor, visitante: true }, { oportunidadeId: p.oportunidadeId, modelo: 'orcamento_reserva', valores })).rejects.toThrow(/demonstração aberta/);
    expect(await saidas(p.contatoId)).toHaveLength(0);
  });

  it('o campo vai limpo (sem quebra de linha) e a falha do envio vira tarefa com o motivo', async () => {
    const p = await pedidoDoSite();
    // Earlier sends still in the queue go first, so the refusal below is this message's.
    await processarFila();
    simulador().fila.push({ tipo: 'recusado', erro: 'Número sem WhatsApp (131026).', repetir: false });
    await enviarModeloEquipe(C.vendedor, { oportunidadeId: p.oportunidadeId, modelo: 'orcamento_reserva', valores: ['Juliana', 'Pousada Teste', '20 a 22/12\n2 adultos', 'R$  3.200'] });
    await processarFila();
    const [m] = await q<{ estado: string; erro: string; variaveis: string[] }>(`select m.estado, m.erro, m.variaveis from mensagens m join conversas v on v.id = m.conversa_id where v.contato_id = $1`, [p.contatoId]);
    expect(m.variaveis).toEqual(['Juliana', 'Pousada Teste', '20 a 22/12 2 adultos', 'R$ 3.200']);
    expect(m).toMatchObject({ estado: 'falhou', erro: 'Número sem WhatsApp (131026).' });
    const t = await um<{ titulo: string; detalhe: string }>(`select t.titulo, t.detalhe from tarefas t join conversas v on v.id = t.conversa_id where v.contato_id = $1 and t.tipo = 'envio_falhou'`, [p.contatoId]);
    expect(t).toMatchObject({ titulo: 'Uma mensagem não foi enviada ao cliente', detalhe: 'Número sem WhatsApp (131026).' });
  });
});

describe('a retomada para quando deve e não duplica', () => {
  async function comRetomadaNaFila() {
    const tel = telefone();
    const p = await pedidoDoSite({ telefone: tel });
    await enviarModeloEquipe(C.vendedor, { oportunidadeId: p.oportunidadeId, modelo: 'orcamento_reserva', valores, seguirRetomada: true });
    await processarFila();
    return { tel, ...p };
  }

  it('o cliente responde segundos antes de a retomada sair (já na fila de envio): ela é cancelada', async () => {
    const p = await comRetomadaNaFila();
    await vencer(p.oportunidadeId, 'retorno_cliente', 1);
    // Only the follow-up job runs: it puts the message in the send queue, which has not run yet.
    await processarFila(1);
    expect((await saidas(p.contatoId)).filter((m) => m.finalidade === 'retorno').map((m) => m.estado)).toEqual(['na_fila']);
    const antes = simulador().enviados.length;
    await simularEntradaWhatsApp(C.admin, p.tel, '', 'Acabei de ver!');
    await processarFila();
    expect((await saidas(p.contatoId)).filter((m) => m.finalidade === 'retorno').map((m) => m.estado)).toEqual(['cancelada']);
    expect(simulador().enviados.slice(antes).some((x) => x.modelo === 'teste_retorno')).toBe(false);
  });

  it('o cliente pede SAIR: nenhuma retomada sai depois', async () => {
    const p = await comRetomadaNaFila();
    await simularEntradaWhatsApp(C.admin, p.tel, '', 'sair');
    await vencer(p.oportunidadeId, 'retorno_cliente', 5);
    await processarFila();
    expect((await saidas(p.contatoId)).filter((m) => m.autor === 'sistema' && m.finalidade === 'retorno' && m.estado !== 'cancelada')).toHaveLength(0);
  });

  it('uma pessoa assume a conversa: a retomada agendada não sai', async () => {
    const p = await comRetomadaNaFila();
    const v = (await um<{ id: string }>(`select id from conversas where contato_id = $1 and canal = 'whatsapp'`, [p.contatoId]))!;
    await assumir(C.vendedor, v.id);
    await vencer(p.oportunidadeId, 'retorno_cliente', 5);
    await processarFila();
    expect((await saidas(p.contatoId)).filter((m) => m.finalidade === 'retorno')).toHaveLength(0);
    const t = await um<{ resultado: string }>(`select resultado from trabalhos where oportunidade_id = $1 and tipo = 'retorno_cliente' and estado = 'cancelado' limit 1`, [p.oportunidadeId]);
    expect(t?.resultado).toMatch(/assumiu|pessoa/);
  });

  it('o cliente aceita a proposta online: as retomadas são canceladas', async () => {
    await salvarConfig(C.admin, 'site', { ...C.empresa.config.site, razao_social: 'Pousada Teste Ltda', cnpj: '00.000.000/0001-00', endereco: 'Rua Fictícia, 1', email: 'contato@exemplo.com' });
    C.empresa = (await empresaPorId(C.empresa.id))!;
    const p = await pedidoDoSite();
    await criarProposta(C.vendedor, { oportunidadeId: p.oportunidadeId, titulo: 'Reserva 20 a 22/12', itens: [{ descricao: 'Suíte com varanda, 2 noites', quantidade: 1, valor_unit_centavos: 320000 }], condicoes: 'Sinal de 25%.', validadeDias: 3 });
    const [pr] = await propostasDa(C.vendedor, p.oportunidadeId);
    const link = await enviarProposta(C.vendedor, pr.id);
    expect(await contar(`trabalhos where oportunidade_id = $1 and tipo = 'retorno_cliente' and estado = 'pendente'`, [p.oportunidadeId])).toBe(2);
    expect(await responderProposta(link.split('/p/')[1], { aceitar: true, nome: 'Juliana Prado', ipHash: 'h' })).toBe('aceita');
    expect(await contar(`trabalhos where oportunidade_id = $1 and tipo = 'retorno_cliente' and estado = 'pendente'`, [p.oportunidadeId])).toBe(0);
    await vencer(p.oportunidadeId, 'retorno_cliente', 5);
    await processarFila();
    expect((await saidas(p.contatoId)).filter((m) => m.finalidade === 'retorno')).toHaveLength(0);
  });

  it('a fila cai no meio do envio: ao voltar, a mensagem fica “incerta” com tarefa, sem reenviar', async () => {
    const p = await comRetomadaNaFila();
    await vencer(p.oportunidadeId, 'retorno_cliente', 1);
    await processarFila(1);
    const [m] = (await saidas(p.contatoId)).filter((x) => x.finalidade === 'retorno');
    // The previous run marked "sending" and stopped before the provider answered.
    await q(`update mensagens set estado = 'enviando' where id = $1`, [m.id]);
    const antes = simulador().enviados.length;
    const job = (await um<Trabalho>(`select * from trabalhos where tipo = 'enviar_mensagem' and dados ->> 'mensagem' = $1`, [m.id]))!;
    expect(await despachar(job)).toMatchObject({ tipo: 'incerto' });
    expect(await despachar(job)).toMatchObject({ tipo: 'cancelado' });
    expect(simulador().enviados.length).toBe(antes);
    expect((await saidas(p.contatoId)).find((x) => x.id === m.id)!.estado).toBe('incerta');
    expect(await contar(`tarefas where conversa_id = (select conversa_id from mensagens where id = $1) and tipo = 'envio_incerto'`, [m.id])).toBe(1);
  });

  it('duas filas rodando ao mesmo tempo mandam cada retomada uma vez só', async () => {
    const p = await comRetomadaNaFila();
    await vencer(p.oportunidadeId, 'retorno_cliente', 1);
    const antes = simulador().enviados.length;
    await Promise.all([processarFila(), processarFila(), processarFila()]);
    await processarFila();
    expect((await saidas(p.contatoId)).filter((m) => m.finalidade === 'retorno').map((m) => m.estado)).toEqual(['enviada']);
    expect(simulador().enviados.slice(antes).filter((x) => x.modelo === 'teste_retorno' || /proposta/.test(x.corpo))).toHaveLength(1);
  });
});
