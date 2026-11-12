import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { fecharPool, q, um } from '@/server/db';
import { empresaPorId, salvarConfig } from '@/server/empresas';
import { atribuir, criarTarefaManual, notificacoes, tarefas } from '@/server/oportunidades';
import { receberPedido, type PedidoSalvo } from '@/server/pedidos';
import { enviarResumos, escalarTarefas } from '@/server/rotinas';
import { contar, meta, novaEmpresa, pedido, type Cenario } from './apoio';

let A: Cenario;
let B: Cenario;
const avisos = async (c: Cenario['admin'], inicio: string) => (await notificacoes(c)).filter((n) => n.titulo.startsWith(inicio));

beforeAll(async () => {
  A = await novaEmpresa('Solar Rotinas');
  B = await novaEmpresa('Solar Rotinas B');
});
afterAll(fecharPool);

describe('tarefa vencida sobe para o administrador', () => {
  it('avisa os administradores uma vez, só depois do limite de horas, e só na empresa da tarefa', async () => {
    await salvarConfig(A.admin, 'regras', { ...A.empresa.config.regras, escalar_horas: 4 });
    await criarTarefaManual(A.vendedor, { titulo: 'Ligar para o cliente atrasado', prazo: new Date(Date.now() - 5 * 3_600_000) });
    await criarTarefaManual(A.vendedor, { titulo: 'Atrasada só um pouco', prazo: new Date(Date.now() - 1 * 3_600_000) });
    await escalarTarefas();
    const lista = await avisos(A.admin, 'Tarefa vencida');
    expect(lista.map((n) => n.titulo)).toEqual(['Tarefa vencida há mais de 4 h: Ligar para o cliente atrasado']);
    expect(lista[0].corpo).toMatch(/Responsável: Vendedor Solar Rotinas/);
    // the seller (not admin) does not get this notice; the other company neither
    expect(await avisos(A.vendedor, 'Tarefa vencida')).toHaveLength(0);
    expect(await avisos(B.admin, 'Tarefa vencida')).toHaveLength(0);
    // once only
    await escalarTarefas();
    expect(await avisos(A.admin, 'Tarefa vencida')).toHaveLength(1);
    // a finished task is never reported
    await criarTarefaManual(A.vendedor, { titulo: 'Feita a tempo', prazo: new Date(Date.now() - 9 * 3_600_000) });
    await q(`update tarefas set concluida_em = now() where titulo = 'Feita a tempo'`);
    await escalarTarefas();
    expect((await avisos(A.admin, 'Tarefa vencida')).some((n) => n.titulo.includes('Feita a tempo'))).toBe(false);
  });

  it('com 0 horas, a rotina fica desligada', async () => {
    await salvarConfig(B.admin, 'regras', { ...B.empresa.config.regras, escalar_horas: 0 });
    await criarTarefaManual(B.vendedor, { titulo: 'Muito atrasada', prazo: new Date(Date.now() - 48 * 3_600_000) });
    await escalarTarefas();
    expect(await avisos(B.admin, 'Tarefa vencida')).toHaveLength(0);
  });
});

describe('resumo do dia', () => {
  it('cada pessoa recebe o seu, o administrador o da empresa; uma vez por dia; nada quando não há nada', async () => {
    const C = await novaEmpresa('Solar Resumo');
    await salvarConfig(C.admin, 'regras', { ...C.empresa.config.regras, resumo_diario: true, resumo_hora: 0 });
    const emp = (await empresaPorId(C.empresa.id))!;
    const p1 = (await receberPedido(emp, pedido(), meta())) as PedidoSalvo;
    await receberPedido(emp, pedido(), meta());
    await atribuir(C.admin, p1.oportunidadeId, C.vendedor.userId);
    await criarTarefaManual(C.vendedor, { titulo: 'Vencida do vendedor', prazo: new Date(Date.now() - 3_600_000) });
    await enviarResumos();
    const doVendedor = (await notificacoes(C.vendedor)).filter((n) => n.titulo === 'Seu resumo do dia');
    expect(doVendedor).toHaveLength(1);
    // the seller: 1 new request assigned to him, his overdue task (and the request's first-contact task, due later today or tomorrow)
    expect(doVendedor[0].corpo).toMatch(/^1 pedido\(s\) novo\(s\)/);
    expect(doVendedor[0].corpo).toMatch(/[1-9] vencida\(s\)/);
    const doAdmin = (await notificacoes(C.admin)).filter((n) => n.titulo === 'Resumo do dia da empresa');
    expect(doAdmin).toHaveLength(1);
    expect(doAdmin[0].corpo).toMatch(/^2 pedido\(s\) novo\(s\)/);
    expect(doAdmin[0].corpo).toMatch(/1 oportunidade\(s\) sem responsável/);
    // same day: nothing again
    await enviarResumos();
    expect((await notificacoes(C.vendedor)).filter((n) => n.titulo === 'Seu resumo do dia')).toHaveLength(1);
    expect(await contar('resumos_diarios where empresa_id = $1', [C.empresa.id])).toBe(1);
    // another day: sent again
    await q(`update resumos_diarios set dia = dia - 1 where empresa_id = $1`, [C.empresa.id]);
    await enviarResumos();
    expect((await notificacoes(C.vendedor)).filter((n) => n.titulo === 'Seu resumo do dia')).toHaveLength(2);
  });

  it('não envia antes da hora, nem desligado, nem para quem não tem nada', async () => {
    const D = await novaEmpresa('Solar Resumo Hora');
    const h = Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: 'America/Sao_Paulo' }).format(new Date()));
    if (h < 23) {
      await salvarConfig(D.admin, 'regras', { ...D.empresa.config.regras, resumo_hora: h + 1 });
      await receberPedido((await empresaPorId(D.empresa.id))!, pedido(), meta());
      await enviarResumos();
      expect(await contar('resumos_diarios where empresa_id = $1', [D.empresa.id])).toBe(0);
    }
    await salvarConfig(D.admin, 'regras', { ...D.empresa.config.regras, resumo_diario: false, resumo_hora: 0 });
    await enviarResumos();
    expect(await contar('resumos_diarios where empresa_id = $1', [D.empresa.id])).toBe(0);
    // an empty company: the day is marked, but no notice goes out
    const E = await novaEmpresa('Solar Resumo Vazia');
    await salvarConfig(E.admin, 'regras', { ...E.empresa.config.regras, resumo_hora: 0 });
    await enviarResumos();
    expect(await contar('resumos_diarios where empresa_id = $1', [E.empresa.id])).toBe(1);
    expect(await contar(`notificacoes where empresa_id = $1 and titulo like '%resumo%'`, [E.empresa.id])).toBe(0);
    expect((await um<{ n: number }>(`select count(*)::int as n from notificacoes where empresa_id = $1`, [E.empresa.id]))!.n).toBe(0);
    expect(await tarefas(E.admin)).toEqual([]);
  });
});
