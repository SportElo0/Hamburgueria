import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { contextoDe } from '@/server/contexto';
import { fecharPool, q, um } from '@/server/db';
import { abrirAcessoAdmin, aceitarConvite, alterarMembro, convidar, salvarConfig } from '@/server/empresas';
import { metricas } from '@/server/metricas';
import { anotar, atribuir, exportarContatos, historico, listar, mudarEtapa, notificacoes, obter, tarefas } from '@/server/oportunidades';
import { ErroDeFormulario, receberPedido, type PedidoSalvo } from '@/server/pedidos';
import { adminPlataforma, contar, meta, novaEmpresa, pedido, type Cenario } from './apoio';

let A: Cenario;
let B: Cenario;
beforeAll(async () => {
  A = await novaEmpresa('Solar A');
  B = await novaEmpresa('Solar B');
});
afterAll(fecharPool);

describe('1. pedido do visitante', () => {
  it('fica salvo na empresa certa e gera tarefa, notificação e alerta agendado', async () => {
    const r = (await receberPedido(A.empresa, pedido({ campanha: { utm_source: 'google', lixo: 'x' } }), meta())) as PedidoSalvo;
    expect(r.repetido).toBe(false);
    const o = await obter(A.admin, r.oportunidadeId);
    expect(o.etapa).toBe('novo');
    expect(o.origem).toBe('site');
    expect(o.campanha).toEqual({ utm_source: 'google' });
    expect(o.contato_cidade).toBe('Campinas');
    expect((await tarefas(A.admin, { oportunidadeId: r.oportunidadeId })).map((t) => t.tipo)).toEqual(['atender_pedido']);
    expect((await notificacoes(A.admin)).some((n) => n.link.endsWith(r.oportunidadeId))).toBe(true);
    expect(await contar(`trabalhos where empresa_id = $1 and oportunidade_id = $2 and tipo = 'alerta_sla' and estado = 'pendente'`, [A.empresa.id, r.oportunidadeId])).toBe(1);
    expect(await contar(`consentimentos where empresa_id = $1 and contato_id = $2 and canal = 'whatsapp'`, [A.empresa.id, r.contatoId])).toBe(1);
    expect(await contar('oportunidades where empresa_id = $1', [B.empresa.id])).toBe(0);
  });

  it('recusa dados inválidos dizendo o campo, sem salvar nada', async () => {
    const antes = await contar('oportunidades where empresa_id = $1', [A.empresa.id]);
    const erro = await receberPedido(A.empresa, pedido({ telefone: '123', nome: '', extras: {} }), meta()).catch((e) => e);
    expect(erro).toBeInstanceOf(ErroDeFormulario);
    expect(Object.keys((erro as ErroDeFormulario).campos).sort()).toEqual(['nome', 'telefone', 'tipo_imovel']);
    expect(await contar('oportunidades where empresa_id = $1', [A.empresa.id])).toBe(antes);
  });

  it('limita envios repetidos do mesmo endereço', async () => {
    const m = meta();
    const resultados = [];
    for (let i = 0; i < 7; i++) resultados.push(await receberPedido(A.empresa, pedido(), m).then(() => 'ok', (e) => e.status));
    expect(resultados.filter((x) => x === 'ok')).toHaveLength(5);
    expect(resultados.slice(5)).toEqual([429, 429]);
  });
});

describe('2. reenvio', () => {
  it('a mesma submissão não duplica oportunidade, tarefa nem contato', async () => {
    const p = pedido();
    const [r1, r2] = (await Promise.all([receberPedido(A.empresa, p, meta()), receberPedido(A.empresa, p, meta())])) as PedidoSalvo[];
    const r3 = (await receberPedido(A.empresa, p, meta())) as PedidoSalvo;
    expect(new Set([r1.oportunidadeId, r2.oportunidadeId, r3.oportunidadeId]).size).toBe(1);
    expect([r1.repetido, r2.repetido].sort()).toEqual([false, true]);
    expect(r3.repetido).toBe(true);
    expect(await contar('oportunidades where empresa_id = $1 and contato_id = $2', [A.empresa.id, r1.contatoId])).toBe(1);
    expect(await contar(`tarefas where empresa_id = $1 and oportunidade_id = $2`, [A.empresa.id, r1.oportunidadeId])).toBe(1);
  });

  it('duplo clique com outra chave, mesmo telefone e mesma necessidade, também não duplica', async () => {
    const p = pedido();
    const r1 = (await receberPedido(A.empresa, p, meta())) as PedidoSalvo;
    const r2 = (await receberPedido(A.empresa, { ...p, chave_idempotencia: 'outra-chave-12345' }, meta())) as PedidoSalvo;
    expect(r2.oportunidadeId).toBe(r1.oportunidadeId);
  });

  it('o mesmo telefone em duas empresas vira dois contatos separados', async () => {
    const p = pedido();
    const a = (await receberPedido(A.empresa, p, meta())) as PedidoSalvo;
    const b = (await receberPedido(B.empresa, { ...p, nome: 'Outro Nome' }, meta())) as PedidoSalvo;
    expect(a.contatoId).not.toBe(b.contatoId);
    expect((await um<{ nome: string }>('select nome from contatos where id = $1', [a.contatoId]))!.nome).toBe('Marina Teste');
  });
});

describe('3. isolamento entre empresas', () => {
  it('usuário de outra empresa não consulta, edita nem exporta, mesmo com o ID', async () => {
    const r = (await receberPedido(A.empresa, pedido({ nome: 'Cliente Só Da A' }), meta())) as PedidoSalvo;
    for (const ctx of [B.admin, B.vendedor]) {
      await expect(obter(ctx, r.oportunidadeId)).rejects.toThrow('não encontrada');
      await expect(mudarEtapa(ctx, r.oportunidadeId, { etapa: 'ganho' })).rejects.toThrow('não encontrada');
      await expect(atribuir(ctx, r.oportunidadeId, ctx.userId)).rejects.toThrow('não encontrada');
      await expect(anotar(ctx, r.oportunidadeId, 'tentativa')).rejects.toThrow('não encontrada');
      expect(await historico(ctx, r.oportunidadeId)).toEqual([]);
      expect((await listar(ctx)).some((o) => o.id === r.oportunidadeId)).toBe(false);
      expect((await tarefas(ctx)).some((t) => t.oportunidade_id === r.oportunidadeId)).toBe(false);
    }
    expect(await exportarContatos(B.admin)).not.toContain('Cliente Só Da A');
    expect(await exportarContatos(A.admin)).toContain('Cliente Só Da A');
    await expect(exportarContatos(A.vendedor)).rejects.toThrow('administrador');
    expect((await obter(A.admin, r.oportunidadeId)).etapa).toBe('novo');
  });

  it('não dá para atribuir a alguém de outra empresa, e o banco recusa vínculo cruzado', async () => {
    const r = (await receberPedido(A.empresa, pedido(), meta())) as PedidoSalvo;
    await expect(atribuir(A.admin, r.oportunidadeId, B.vendedor.userId)).rejects.toThrow('equipe');
    await expect(q('insert into oportunidades (empresa_id, contato_id) values ($1, $2)', [B.empresa.id, r.contatoId])).rejects.toThrow(/foreign key/);
  });

  it('vendedor não administra equipe nem configurações; admin Growlift só entra com motivo registrado', async () => {
    await expect(convidar(A.vendedor, { email: 'x@teste.local', papel: 'vendedor' })).rejects.toThrow('administrador');
    await expect(salvarConfig(A.vendedor, 'regras', {})).rejects.toThrow('administrador');
    await expect(alterarMembro(A.vendedor, A.admin.userId, { ativo: false })).rejects.toThrow('administrador');
    const g = await adminPlataforma();
    expect((await contextoDe(g, 'Growlift')).ctx).toBeNull();
    await expect(abrirAcessoAdmin(g, A.empresa.id, '')).rejects.toThrow('motivo');
    await expect(abrirAcessoAdmin(A.admin.userId, B.empresa.id, 'curiosidade')).rejects.toThrow('Growlift');
    await abrirAcessoAdmin(g, A.empresa.id, 'Suporte pedido pelo cliente');
    const { ctx } = await contextoDe(g, 'Growlift');
    expect(ctx?.empresaId).toBe(A.empresa.id);
    expect(ctx?.acessoAdmin).toBeTruthy();
    expect(await contar(`eventos where empresa_id = $1 and tipo = 'acesso_admin_growlift'`, [A.empresa.id])).toBe(1);
    await q('update acessos_admin set fim = now() where user_id = $1', [g]);
    expect((await contextoDe(g, 'Growlift')).ctx).toBeNull();
  });

  it('convite cria login só na empresa que convidou e vale uma vez', async () => {
    const { link } = await convidar(A.admin, { email: `novo-${Date.now()}@teste.local`, papel: 'vendedor' });
    const token = link.split('/').pop()!;
    const [x, y] = await Promise.allSettled([aceitarConvite(token, 'Pessoa Nova', 'senha-bem-longa-1'), aceitarConvite(token, 'Pessoa Nova', 'senha-bem-longa-1')]);
    expect([x.status, y.status].sort()).toEqual(['fulfilled', 'rejected']);
    await expect(aceitarConvite(token, 'Outra', 'senha-bem-longa-1')).rejects.toThrow();
    expect(await contar(`membros m join "user" u on u.id = m.user_id where u.name = 'Pessoa Nova' and m.empresa_id = $1`, [A.empresa.id])).toBe(1);
  });
});

describe('4. vendedor muda etapa e responsável', () => {
  it('histórico e métricas refletem; fechar exige pessoa e motivo', async () => {
    const C = await novaEmpresa('Solar C');
    const r = (await receberPedido(C.empresa, pedido(), meta())) as PedidoSalvo;
    await atribuir(C.vendedor, r.oportunidadeId, C.vendedor.userId);
    await mudarEtapa(C.vendedor, r.oportunidadeId, { etapa: 'atendimento' });
    await mudarEtapa(C.vendedor, r.oportunidadeId, { etapa: 'proposta', valorCentavos: 1_850_000 });
    let o = await obter(C.vendedor, r.oportunidadeId);
    expect(o.responsavel_id).toBe(C.vendedor.userId);
    expect(o.primeiro_humano_em).not.toBeNull();
    const tipos = (await historico(C.vendedor, r.oportunidadeId)).map((e) => `${e.tipo}:${e.dados.para ?? ''}`);
    expect(tipos).toEqual(expect.arrayContaining(['pedido_recebido:', `responsavel_alterado:${C.vendedor.userId}`, 'etapa_alterada:atendimento', 'etapa_alterada:proposta']));
    // "Proposta enviada" creates the follow-up task; the first-contact task and its alert are closed.
    const abertas = await tarefas(C.vendedor, { oportunidadeId: r.oportunidadeId });
    expect(abertas.map((t) => t.tipo)).toEqual(['retorno_proposta']);
    expect(await contar(`trabalhos where oportunidade_id = $1 and tipo = 'alerta_sla' and estado = 'cancelado'`, [r.oportunidadeId])).toBe(1);

    let m = await metricas(C.admin, 30);
    expect(m.pedidos).toBe(1);
    expect(m.porEtapa.proposta).toBe(1);
    expect(m.propostasEnviadas).toBe(1);
    expect(m.primeiroHumano.atendidos).toBe(1);
    expect(m.ganhos).toBe(0);

    await expect(mudarEtapa(C.vendedor, r.oportunidadeId, { etapa: 'perdido' })).rejects.toThrow('motivo');
    await mudarEtapa(C.vendedor, r.oportunidadeId, { etapa: 'ganho' });
    o = await obter(C.vendedor, r.oportunidadeId);
    expect(o.fechada_em).not.toBeNull();
    m = await metricas(C.admin, 30);
    expect(m.ganhos).toBe(1);
    expect(m.valorGanhoCentavos).toBe(1_850_000);
    expect(m.porEtapa.proposta).toBe(0);
    expect((await metricas(C.vendedor, 30)).tecnico).toBeUndefined();
    await expect(mudarEtapa(C.vendedor, r.oportunidadeId, { etapa: 'negociacao' })).rejects.toThrow('administrador');
  });
});
