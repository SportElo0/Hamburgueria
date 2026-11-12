import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mensagensDe, simularEntradaWhatsApp } from '@/server/conversas';
import { fecharPool, q, um } from '@/server/db';
import { empresaPorId, salvarConfig } from '@/server/empresas';
import { salvarWhatsApp } from '@/server/integracoes';
import { marcarServicoConcluido, mudarEtapa, notificacoes, obter } from '@/server/oportunidades';
import { receberPedido, type PedidoSalvo } from '@/server/pedidos';
import { execucoes, processarFila } from '@/server/trabalhos';
import { contar, meta, novaEmpresa, pedido, telefone, type Cenario } from './apoio';

let C: Cenario;
const vencer = (op: string, tipo: string, limite = 1) =>
  q(`update trabalhos set executar_em = now() - interval '1 second' where id in (select id from trabalhos where oportunidade_id = $1 and tipo = $2 and estado = 'pendente' order by executar_em limit $3)`, [op, tipo, limite]);
const doSistema = async (contatoId: string) =>
  (await q<{ corpo: string; estado: string; simulada: boolean }>(`select m.corpo, m.estado, m.simulada from mensagens m join conversas v on v.id = m.conversa_id where v.contato_id = $1 and m.autor = 'sistema' order by m.criado_em`, [contatoId]));

beforeAll(async () => {
  C = await novaEmpresa('Solar Automações');
  await salvarConfig(C.admin, 'regras', { ...C.empresa.config.regras, retorno_auto_cliente: true, retorno_auto_horas: 24, retorno_auto_horas_2: 72, avaliacao_auto: true, hora_inicio: 0, hora_fim: 24 });
  await salvarConfig(C.admin, 'avaliacao', { link: 'https://exemplo.com/avaliar' });
  await salvarWhatsApp(C.admin, { modo: 'simulador', modelo_confirmacao: 'teste_confirmacao', modelo_retorno: 'teste_retorno', modelo_avaliacao: 'teste_avaliacao' });
  C.empresa = (await empresaPorId(C.empresa.id))!;
});
afterAll(fecharPool);

describe('automações de ponta a ponta (WhatsApp simulado)', () => {
  it('pedido novo: confirmação ao cliente sai sozinha e conta no tempo de confirmação', async () => {
    const p = (await receberPedido(C.empresa, pedido(), meta())) as PedidoSalvo;
    await vencer(p.oportunidadeId, 'confirmacao_pedido');
    await processarFila();
    const ms = await doSistema(p.contatoId);
    expect(ms).toHaveLength(1);
    expect(ms[0]).toMatchObject({ estado: 'enviada', simulada: true });
    expect(ms[0].corpo).toMatch(/Recebemos seu pedido/);
    expect((await obter(C.admin, p.oportunidadeId)).confirmacao_auto_em).not.toBeNull();
  });

  it('pedido sem atendimento no prazo: alerta interno para o responsável e para os administradores; atendido, não alerta', async () => {
    const a = (await receberPedido(C.empresa, pedido(), meta())) as PedidoSalvo;
    const b = (await receberPedido(C.empresa, pedido(), meta())) as PedidoSalvo;
    await mudarEtapa(C.vendedor, b.oportunidadeId, { etapa: 'atendimento' });
    await vencer(a.oportunidadeId, 'alerta_sla');
    await processarFila();
    const avisos = await notificacoes(C.admin);
    expect(avisos.filter((n) => n.titulo.startsWith('Pedido sem atendimento') && n.link.endsWith(a.oportunidadeId))).toHaveLength(1);
    expect(avisos.some((n) => n.titulo.startsWith('Pedido sem atendimento') && n.link.endsWith(b.oportunidadeId))).toBe(false);
    expect(await contar(`trabalhos where oportunidade_id = $1 and tipo = 'alerta_sla' and estado = 'cancelado'`, [b.oportunidadeId])).toBe(1);
  });

  it('proposta: sequência de dois retornos, cada um na sua hora, uma vez só', async () => {
    const p = (await receberPedido(C.empresa, pedido(), meta())) as PedidoSalvo;
    await mudarEtapa(C.vendedor, p.oportunidadeId, { etapa: 'proposta' });
    expect(await contar(`trabalhos where oportunidade_id = $1 and tipo = 'retorno_cliente' and estado = 'pendente'`, [p.oportunidadeId])).toBe(2);
    await processarFila();
    expect((await doSistema(p.contatoId)).filter((m) => /proposta/.test(m.corpo))).toHaveLength(0);
    await vencer(p.oportunidadeId, 'retorno_cliente', 1);
    await processarFila();
    await processarFila();
    let ms = (await doSistema(p.contatoId)).filter((m) => /proposta/.test(m.corpo));
    expect(ms).toHaveLength(1);
    expect(ms[0].corpo).toMatch(/Ficou alguma dúvida/);
    await vencer(p.oportunidadeId, 'retorno_cliente', 1);
    await processarFila();
    ms = (await doSistema(p.contatoId)).filter((m) => /proposta/.test(m.corpo));
    expect(ms.map((m) => m.estado)).toEqual(['enviada', 'enviada']);
    expect(ms[1].corpo).toMatch(/Passando para saber/);
  });

  it('proposta: a resposta do cliente depois do primeiro retorno cancela o segundo', async () => {
    const tel = telefone();
    const p = (await receberPedido(C.empresa, pedido({ telefone: tel }), meta())) as PedidoSalvo;
    await mudarEtapa(C.vendedor, p.oportunidadeId, { etapa: 'proposta' });
    await vencer(p.oportunidadeId, 'retorno_cliente', 1);
    await processarFila();
    await simularEntradaWhatsApp(C.admin, tel, '', 'Vi sim, obrigado!');
    expect(await contar(`trabalhos where oportunidade_id = $1 and tipo = 'retorno_cliente' and estado = 'cancelado'`, [p.oportunidadeId])).toBe(1);
    await vencer(p.oportunidadeId, 'retorno_cliente', 5);
    await processarFila();
    expect((await doSistema(p.contatoId)).filter((m) => /Passando para saber/.test(m.corpo))).toHaveLength(0);
  });

  it('serviço concluído: o convite de avaliação sai sozinho, neutro, com o link do convite', async () => {
    const p = (await receberPedido(C.empresa, pedido(), meta())) as PedidoSalvo;
    await mudarEtapa(C.vendedor, p.oportunidadeId, { etapa: 'ganho' });
    await marcarServicoConcluido(C.vendedor, p.oportunidadeId);
    await marcarServicoConcluido(C.vendedor, p.oportunidadeId);
    expect(await contar(`trabalhos where oportunidade_id = $1 and tipo = 'convite_avaliacao'`, [p.oportunidadeId])).toBe(1);
    await vencer(p.oportunidadeId, 'convite_avaliacao');
    await processarFila();
    const ms = (await doSistema(p.contatoId)).filter((m) => m.corpo.includes('/avaliar/'));
    expect(ms).toHaveLength(1);
    expect(ms[0].estado).toBe('enviada');
    expect(ms[0].corpo).not.toMatch(/desconto|brinde|prêmio|5 estrelas/i);
    expect(await contar('avaliacoes where oportunidade_id = $1', [p.oportunidadeId])).toBe(1);
  });

  it('sem modelo aprovado e sem conversa recente, a mensagem não sai: vira tarefa para uma pessoa', async () => {
    const S = await novaEmpresa('Solar Sem Modelo');
    await salvarConfig(S.admin, 'regras', { ...S.empresa.config.regras, hora_inicio: 0, hora_fim: 24 });
    const p = (await receberPedido((await empresaPorId(S.empresa.id))!, pedido(), meta())) as PedidoSalvo;
    await vencer(p.oportunidadeId, 'confirmacao_pedido');
    await processarFila();
    expect(await doSistema(p.contatoId)).toHaveLength(0);
    expect(await contar(`tarefas where oportunidade_id = $1 and tipo = 'contato_manual'`, [p.oportunidadeId])).toBe(1);
    expect((await obter(S.admin, p.oportunidadeId)).confirmacao_auto_em).toBeNull();
  });

  it('fora do horário da empresa, a mensagem espera a próxima abertura em vez de sair', async () => {
    const D = await novaEmpresa('Solar Horário');
    const h = Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: 'America/Sao_Paulo' }).format(new Date()));
    // A one-hour window that never contains "now".
    const inicio = (h + 2) % 23;
    await salvarConfig(D.admin, 'regras', { ...D.empresa.config.regras, hora_inicio: inicio, hora_fim: inicio + 1 });
    await salvarWhatsApp(D.admin, { modo: 'simulador', modelo_confirmacao: 'teste_confirmacao' });
    const p = (await receberPedido((await empresaPorId(D.empresa.id))!, pedido(), meta())) as PedidoSalvo;
    await vencer(p.oportunidadeId, 'confirmacao_pedido');
    await processarFila();
    expect(await doSistema(p.contatoId)).toHaveLength(0);
    const t = (await um<{ estado: string; executar_em: Date; resultado: string }>(`select estado, executar_em, resultado from trabalhos where oportunidade_id = $1 and tipo = 'confirmacao_pedido'`, [p.oportunidadeId]))!;
    expect(t.estado).toBe('pendente');
    expect(t.executar_em.getTime()).toBeGreaterThan(Date.now());
    expect(t.resultado).toMatch(/horário/);
  });

  it('a tela de Automações mostra o que rodou e o que está agendado, só desta empresa', async () => {
    const x = await execucoes(C.empresa.id);
    expect(x.recentes.some((e) => e.tipo === 'retorno_cliente' && e.estado === 'concluido')).toBe(true);
    expect(x.recentes.some((e) => e.tipo === 'retorno_cliente' && e.estado === 'cancelado' && /respondeu/.test(e.resultado ?? ''))).toBe(true);
    expect(x.recentes.every((e) => e.contato === null || e.contato === 'Marina Teste')).toBe(true);
    const outra = await novaEmpresa('Solar Vazia');
    expect((await execucoes(outra.empresa.id)).recentes).toEqual([]);
    expect((await mensagensDe(outra.empresa.id, '00000000-0000-0000-0000-000000000000'))).toEqual([]);
  });
});
