import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { assumir, mensagensDe, simularEntradaWhatsApp } from '@/server/conversas';
import { fecharPool, q, um } from '@/server/db';
import { empresaPorId, salvarConfig } from '@/server/empresas';
import { varrerParadas, excluirFluxo, execucoesDoFluxo, listarFluxos, MODELOS_DE_FLUXO, obterFluxo, salvarFluxo, type EntradaFluxo } from '@/server/fluxos';
import { salvarWhatsApp } from '@/server/integracoes';
import { marcarServicoConcluido, mudarEtapa, tarefas } from '@/server/oportunidades';
import { receberPedido, type PedidoSalvo } from '@/server/pedidos';
import { processarFila } from '@/server/trabalhos';
import { contar, meta, novaEmpresa, pedido, telefone, type Cenario } from './apoio';

let C: Cenario;
const DIA = 1440;
/** Brings every waiting step of an opportunity to "now", as if the wait had passed. */
const passarTempo = (op: string) => q(`update trabalhos set executar_em = now() - interval '1 second' where oportunidade_id = $1 and tipo = 'fluxo_passo' and estado = 'pendente'`, [op]);
const rodarTudo = async (op: string, voltas = 12) => { for (let i = 0; i < voltas; i++) { await passarTempo(op); if ((await processarFila()) === 0) break; } };
const doFluxo = async (contatoId: string) => q<{ corpo: string; estado: string; simulada: boolean }>(`select m.corpo, m.estado, m.simulada from mensagens m join conversas v on v.id = m.conversa_id where v.contato_id = $1 and m.autor = 'sistema' order by m.criado_em`, [contatoId]);

const propostaSemResposta = (modelo = ''): EntradaFluxo => ({
  ...MODELOS_DE_FLUXO[0].fluxo,
  ativo: true,
  passos: MODELOS_DE_FLUXO[0].fluxo.passos.map((p) => (p.tipo === 'enviar_whatsapp' ? { ...p, modelo } : p)),
});

beforeAll(async () => {
  C = await novaEmpresa('Solar Fluxos');
  await salvarConfig(C.admin, 'regras', { ...C.empresa.config.regras, hora_inicio: 0, hora_fim: 24 });
  await salvarWhatsApp(C.admin, { modo: 'simulador' });
  C.empresa = (await empresaPorId(C.empresa.id))!;
});
afterAll(fecharPool);

describe('construtor de automações', () => {
  it('só o administrador cria; validação diz em qual passo está o erro', async () => {
    await expect(salvarFluxo(C.vendedor, null, propostaSemResposta())).rejects.toThrow('administrador');
    await expect(salvarFluxo(C.admin, null, { ...propostaSemResposta(), passos: [] })).rejects.toThrow('pelo menos um passo');
    await expect(salvarFluxo(C.admin, null, { ...propostaSemResposta(), passos: [{ tipo: 'esperar', minutos: 1 }, { tipo: 'enviar_whatsapp', texto: 'oi', modelo: '' }] })).rejects.toThrow('Passo 2: Escreva a mensagem');
    await expect(salvarFluxo(C.admin, null, { ...propostaSemResposta(), passos: Array.from({ length: 13 }, () => ({ tipo: 'esperar' as const, minutos: 1 })) })).rejects.toThrow('No máximo 12');
    await expect(salvarFluxo(C.admin, null, { ...propostaSemResposta(), gatilho: { tipo: 'etapa_alterada' } })).rejects.toThrow('etapa do gatilho');
    await expect(salvarFluxo(C.admin, null, { ...propostaSemResposta(), passos: [{ tipo: 'esperar', minutos: 99 * DIA }] })).rejects.toThrow('60 dias');
    // there is no step that closes a deal: it is simply not accepted
    await expect(salvarFluxo(C.admin, null, { ...propostaSemResposta(), passos: [{ tipo: 'mudar_etapa', etapa: 'ganho' } as never] })).rejects.toThrow();
  });

  it('proposta sem resposta: espera, manda a mensagem uma vez, espera de novo e cria a tarefa de ligar', async () => {
    // Starts the conversation outside the 24-hour window, so the step needs an approved template to send.
    const id = await salvarFluxo(C.admin, null, propostaSemResposta('modelo_proposta_aprovado'));
    const p = (await receberPedido(C.empresa, pedido({ nome: 'Ana Maria Souza' }), meta())) as PedidoSalvo;
    await mudarEtapa(C.vendedor, p.oportunidadeId, { etapa: 'proposta' });
    expect(await contar(`fluxo_execucoes where fluxo_id = $1 and estado = 'ativa'`, [id])).toBe(1);
    await processarFila();
    expect(await doFluxo(p.contatoId)).toHaveLength(0);
    await rodarTudo(p.oportunidadeId);
    const ms = (await doFluxo(p.contatoId)).filter((m) => /Conseguiu ver a proposta/.test(m.corpo));
    expect(ms).toHaveLength(1);
    expect(ms[0].corpo).toMatch(/^Olá, Ana! Aqui é da Solar Fluxos\./);
    expect(ms[0].corpo).toMatch(/responda SAIR\.$/);
    expect(ms[0]).toMatchObject({ estado: 'enviada', simulada: true });
    expect((await tarefas(C.admin, { de: 'todas', oportunidadeId: p.oportunidadeId })).map((t) => t.titulo)).toContain('Ligar para o cliente: proposta sem resposta há 5 dias');
    const ex = (await execucoesDoFluxo(C.admin, id))[0];
    expect(ex.estado).toBe('concluida');
    expect(ex.log.map((l) => l.tipo)).toEqual(['esperar', 'parar_se', 'parar_se', 'enviar_whatsapp', 'esperar', 'parar_se', 'parar_se', 'criar_tarefa']);
    // running again changes nothing
    await rodarTudo(p.oportunidadeId);
    expect((await doFluxo(p.contatoId)).filter((m) => /Conseguiu ver/.test(m.corpo))).toHaveLength(1);
  });

  it('o cliente respondeu: o fluxo para e nada é enviado', async () => {
    const tel = telefone();
    const p = (await receberPedido(C.empresa, pedido({ telefone: tel }), meta())) as PedidoSalvo;
    await mudarEtapa(C.vendedor, p.oportunidadeId, { etapa: 'proposta' });
    await simularEntradaWhatsApp(C.admin, tel, '', 'Vi a proposta, vou pensar');
    await rodarTudo(p.oportunidadeId);
    expect((await doFluxo(p.contatoId)).filter((m) => /Conseguiu ver/.test(m.corpo))).toHaveLength(0);
    const ex = await um<{ estado: string }>(`select estado from fluxo_execucoes where oportunidade_id = $1 order by criado_em desc limit 1`, [p.oportunidadeId]);
    expect(ex!.estado).toBe('parada');
  });

  it('a etapa mudou ou uma pessoa assumiu: para ou pula o envio, e o resto continua', async () => {
    const a = (await receberPedido(C.empresa, pedido(), meta())) as PedidoSalvo;
    await mudarEtapa(C.vendedor, a.oportunidadeId, { etapa: 'proposta' });
    await mudarEtapa(C.vendedor, a.oportunidadeId, { etapa: 'negociacao' });
    await rodarTudo(a.oportunidadeId);
    expect((await doFluxo(a.contatoId)).filter((m) => /Conseguiu ver/.test(m.corpo))).toHaveLength(0);
    expect(await contar(`tarefas where oportunidade_id = $1 and tipo = 'fluxo'`, [a.oportunidadeId])).toBe(0);

    // A person takes the conversation while the flow waits: the message step is skipped, the task step still runs.
    const tel = telefone();
    const b = (await receberPedido(C.empresa, pedido({ telefone: tel }), meta())) as PedidoSalvo;
    await salvarFluxo(C.admin, null, { nome: 'Teste pessoa assume', ativo: true, gatilho: { tipo: 'etapa_alterada', etapa: 'qualificado' }, passos: [{ tipo: 'esperar', minutos: DIA }, { tipo: 'enviar_whatsapp', texto: 'Olá {{nome}}, tudo bem?', modelo: '' }, { tipo: 'criar_tarefa', titulo: 'Fechar o ciclo do teste', prazo_horas: 1 }] });
    await mudarEtapa(C.vendedor, b.oportunidadeId, { etapa: 'qualificado' });
    await simularEntradaWhatsApp(C.admin, tel, '', 'Olá');
    await processarFila();
    const conversa = (await um<{ id: string }>(`select id from conversas where contato_id = $1`, [b.contatoId]))!;
    await assumir(C.vendedor, conversa.id);
    await rodarTudo(b.oportunidadeId);
    expect((await doFluxo(b.contatoId)).filter((m) => /tudo bem/.test(m.corpo))).toHaveLength(0);
    expect(await contar(`tarefas where oportunidade_id = $1 and titulo = 'Fechar o ciclo do teste'`, [b.oportunidadeId])).toBe(1);
    const log = (await q<{ log: { tipo: string; resultado: string }[] }>(`select log from fluxo_execucoes where oportunidade_id = $1 and estado = 'concluida' order by criado_em desc limit 1`, [b.oportunidadeId]))[0].log;
    expect(log.find((l) => l.tipo === 'enviar_whatsapp')!.resultado).toMatch(/Uma pessoa assumiu/);
  });

  it('editar o fluxo não muda uma execução que já começou; desligar para as que estão rodando', async () => {
    const id = await salvarFluxo(C.admin, null, { nome: 'Edição em andamento', ativo: true, gatilho: { tipo: 'etapa_alterada', etapa: 'atendimento' }, passos: [{ tipo: 'esperar', minutos: DIA }, { tipo: 'criar_tarefa', titulo: 'Versão antiga', prazo_horas: 1 }] });
    const p = (await receberPedido(C.empresa, pedido(), meta())) as PedidoSalvo;
    await mudarEtapa(C.vendedor, p.oportunidadeId, { etapa: 'atendimento' });
    await salvarFluxo(C.admin, id, { nome: 'Edição em andamento', ativo: true, gatilho: { tipo: 'etapa_alterada', etapa: 'atendimento' }, passos: [{ tipo: 'esperar', minutos: DIA }, { tipo: 'criar_tarefa', titulo: 'Versão nova', prazo_horas: 1 }] });
    await rodarTudo(p.oportunidadeId);
    expect(await contar(`tarefas where oportunidade_id = $1 and titulo = 'Versão antiga'`, [p.oportunidadeId])).toBe(1);
    expect(await contar(`tarefas where oportunidade_id = $1 and titulo = 'Versão nova'`, [p.oportunidadeId])).toBe(0);

    const q2 = (await receberPedido(C.empresa, pedido(), meta())) as PedidoSalvo;
    await mudarEtapa(C.vendedor, q2.oportunidadeId, { etapa: 'atendimento' });
    await salvarFluxo(C.admin, id, { nome: 'Edição em andamento', ativo: false, gatilho: { tipo: 'etapa_alterada', etapa: 'atendimento' }, passos: [{ tipo: 'esperar', minutos: DIA }, { tipo: 'criar_tarefa', titulo: 'Versão nova', prazo_horas: 1 }] });
    await rodarTudo(q2.oportunidadeId);
    expect(await contar(`tarefas where oportunidade_id = $1 and tipo = 'fluxo'`, [q2.oportunidadeId])).toBe(0);
    // switched off: a new event does not start it
    const r = (await receberPedido(C.empresa, pedido(), meta())) as PedidoSalvo;
    await mudarEtapa(C.vendedor, r.oportunidadeId, { etapa: 'atendimento' });
    expect(await contar(`fluxo_execucoes where oportunidade_id = $1 and fluxo_id = $2`, [r.oportunidadeId, id])).toBe(0);
  });

  it('gatilhos de pedido novo e de serviço concluído; o mesmo fluxo não roda duas vezes ao mesmo tempo na mesma oportunidade', async () => {
    const novo = await salvarFluxo(C.admin, null, { nome: 'Boas-vindas teste', ativo: true, gatilho: { tipo: 'pedido_recebido' }, passos: [{ tipo: 'avisar_equipe', titulo: 'Chegou pedido (fluxo)' }, { tipo: 'anotar', texto: 'Fluxo de boas-vindas rodou' }] });
    const pos = await salvarFluxo(C.admin, null, { nome: 'Pós-venda teste', ativo: true, gatilho: { tipo: 'servico_concluido' }, passos: [{ tipo: 'esperar', minutos: 7 * DIA }, { tipo: 'criar_tarefa', titulo: 'Pós-venda (fluxo)', prazo_horas: 48 }] });
    const p = (await receberPedido(C.empresa, pedido(), meta())) as PedidoSalvo;
    await processarFila();
    expect(await contar(`notificacoes where empresa_id = $1 and titulo = 'Chegou pedido (fluxo)'`, [C.empresa.id])).toBeGreaterThan(0);
    expect(await contar(`eventos where oportunidade_id = $1 and tipo = 'anotacao' and dados ->> 'texto' = 'Fluxo de boas-vindas rodou'`, [p.oportunidadeId])).toBe(1);
    await mudarEtapa(C.vendedor, p.oportunidadeId, { etapa: 'ganho' });
    await marcarServicoConcluido(C.vendedor, p.oportunidadeId);
    expect(await contar(`fluxo_execucoes where fluxo_id = $1`, [pos])).toBe(1);
    await rodarTudo(p.oportunidadeId);
    expect(await contar(`tarefas where oportunidade_id = $1 and titulo = 'Pós-venda (fluxo)'`, [p.oportunidadeId])).toBe(1);
    expect(await contar(`fluxo_execucoes where fluxo_id = $1`, [novo])).toBeGreaterThan(0);
    // The same flow never starts twice for the same opportunity at once.
    const f2 = await salvarFluxo(C.admin, null, { nome: 'Dupla', ativo: true, gatilho: { tipo: 'etapa_alterada', etapa: 'qualificado' }, passos: [{ tipo: 'esperar', minutos: DIA }, { tipo: 'anotar', texto: 'xx' }] });
    const q2 = (await receberPedido(C.empresa, pedido(), meta())) as PedidoSalvo;
    await mudarEtapa(C.vendedor, q2.oportunidadeId, { etapa: 'qualificado' });
    await mudarEtapa(C.vendedor, q2.oportunidadeId, { etapa: 'atendimento' });
    await mudarEtapa(C.vendedor, q2.oportunidadeId, { etapa: 'qualificado' });
    expect(await contar(`fluxo_execucoes where fluxo_id = $1 and oportunidade_id = $2`, [f2, q2.oportunidadeId])).toBe(1);
  });

  it('sem modelo aprovado e fora das 24 horas, a mensagem do fluxo vira tarefa para uma pessoa em vez de falhar', async () => {
    const E = await novaEmpresa('Solar Sem Modelo Fluxo');
    await salvarConfig(E.admin, 'regras', { ...E.empresa.config.regras, hora_inicio: 0, hora_fim: 24 });
    await salvarFluxo(E.admin, null, propostaSemResposta(''));
    const emp = (await empresaPorId(E.empresa.id))!;
    const p = (await receberPedido(emp, pedido(), meta())) as PedidoSalvo;
    await mudarEtapa(E.vendedor, p.oportunidadeId, { etapa: 'proposta' });
    await rodarTudo(p.oportunidadeId);
    expect(await contar('mensagens m join conversas v on v.id = m.conversa_id where v.contato_id = $1', [p.contatoId])).toBe(0);
    expect(await contar(`tarefas where oportunidade_id = $1 and tipo = 'contato_manual'`, [p.oportunidadeId])).toBe(1);
  });

  it('dentro das 24 horas da última mensagem do cliente, o texto livre do fluxo sai sem modelo', async () => {
    const tel = telefone();
    const F = await novaEmpresa('Solar Janela Fluxo');
    await salvarConfig(F.admin, 'regras', { ...F.empresa.config.regras, hora_inicio: 0, hora_fim: 24 });
    await salvarFluxo(F.admin, null, { nome: 'Texto livre', ativo: true, gatilho: { tipo: 'etapa_alterada', etapa: 'atendimento' }, passos: [{ tipo: 'enviar_whatsapp', texto: 'Oi {{nome}}, aqui é da {{empresa}}.', modelo: '' }] });
    const emp = (await empresaPorId(F.empresa.id))!;
    const p = (await receberPedido(emp, pedido({ telefone: tel, nome: 'Bia Lima' }), meta())) as PedidoSalvo;
    await simularEntradaWhatsApp(F.admin, tel, '', 'Olá, tenho uma dúvida');
    await processarFila();
    await mudarEtapa(F.vendedor, p.oportunidadeId, { etapa: 'atendimento' });
    await rodarTudo(p.oportunidadeId);
    const livres = (await doFluxo(p.contatoId)).filter((m) => /^Oi Bia, aqui é da Solar Janela Fluxo\./.test(m.corpo));
    expect(livres).toHaveLength(1);
    expect(livres[0].estado).toBe('enviada');
  });

  it('sem autorização de WhatsApp, a mensagem do fluxo não sai e o fluxo segue', async () => {
    const p = (await receberPedido(C.empresa, pedido({ aceite_whatsapp: false }), meta())) as PedidoSalvo;
    await mudarEtapa(C.vendedor, p.oportunidadeId, { etapa: 'proposta' });
    await rodarTudo(p.oportunidadeId);
    expect(await contar('mensagens m join conversas v on v.id = m.conversa_id where v.contato_id = $1', [p.contatoId])).toBe(0);
    const log = (await q<{ log: { tipo: string; resultado: string }[] }>(`select log from fluxo_execucoes where oportunidade_id = $1 order by criado_em desc limit 1`, [p.oportunidadeId]))[0].log;
    expect(log.find((l) => l.tipo === 'enviar_whatsapp')!.resultado).toMatch(/autorização/);
  });

  it('ramificação: “se tem responsável, ir para o passo 4”; senão segue para o passo 3', async () => {
    const G = await novaEmpresa('Solar Ramos');
    await salvarConfig(G.admin, 'regras', { ...G.empresa.config.regras, hora_inicio: 0, hora_fim: 24 });
    const modelo = MODELOS_DE_FLUXO.find((m) => m.id === 'pediu-visita')!;
    await salvarFluxo(G.admin, null, { ...modelo.fluxo, ativo: true });
    const emp = (await empresaPorId(G.empresa.id))!;
    // without assignee -> step 3 (choose who visits), then step 4 too (linear after the branch)
    const semResp = (await receberPedido(emp, pedido({ telefone: telefone() }), meta())) as PedidoSalvo;
    const tel1 = (await um<{ telefone: string }>('select telefone from contatos where id = $1', [semResp.contatoId]))!.telefone;
    await simularEntradaWhatsApp(G.admin, tel1, '', 'Quero agendar uma VISITA técnica');
    await rodarTudo(semResp.oportunidadeId);
    const t1 = (await tarefas(G.admin, { de: 'todas', oportunidadeId: semResp.oportunidadeId })).map((t) => t.titulo);
    expect(t1).toContain('Escolher quem vai fazer a visita');
    // with assignee -> jumps over step 3 straight to step 4
    const comResp = (await receberPedido(emp, pedido({ telefone: telefone() }), meta())) as PedidoSalvo;
    await q('update oportunidades set responsavel_id = $2 where id = $1', [comResp.oportunidadeId, G.vendedor.userId]);
    const tel2 = (await um<{ telefone: string }>('select telefone from contatos where id = $1', [comResp.contatoId]))!.telefone;
    await simularEntradaWhatsApp(G.admin, tel2, '', 'pode marcar a visita?');
    await rodarTudo(comResp.oportunidadeId);
    const t2 = (await tarefas(G.admin, { de: 'todas', oportunidadeId: comResp.oportunidadeId })).map((t) => t.titulo);
    expect(t2).toContain('Confirmar dia e horário da visita com o cliente');
    expect(t2).not.toContain('Escolher quem vai fazer a visita');
    const log = (await q<{ log: { tipo: string; resultado: string }[] }>(`select log from fluxo_execucoes where oportunidade_id = $1`, [comResp.oportunidadeId]))[0].log;
    expect(log.map((l) => l.tipo)).toEqual(['avisar_equipe', 'se', 'criar_tarefa']);
    expect(log[1].resultado).toMatch(/foi para o passo 4/);
    // a message without the keyword does not start it
    const outro = (await receberPedido(emp, pedido({ telefone: telefone() }), meta())) as PedidoSalvo;
    const tel3 = (await um<{ telefone: string }>('select telefone from contatos where id = $1', [outro.contatoId]))!.telefone;
    await simularEntradaWhatsApp(G.admin, tel3, '', 'Qual o horário de vocês?');
    expect(await contar('fluxo_execucoes where oportunidade_id = $1', [outro.oportunidadeId])).toBe(0);
  });

  it('ir para / terminar, e só se pode pular para frente', async () => {
    await expect(salvarFluxo(C.admin, null, { nome: 'Volta', ativo: true, gatilho: { tipo: 'pedido_recebido' }, passos: [{ tipo: 'anotar', texto: 'um' }, { tipo: 'ir_para', passo: 1 }] })).rejects.toThrow('Passo 2: só dá para ir para um passo mais abaixo');
    await expect(salvarFluxo(C.admin, null, { nome: 'Longe', ativo: true, gatilho: { tipo: 'pedido_recebido' }, passos: [{ tipo: 'se', condicao: 'tem_autorizacao', ir_para: 9 }, { tipo: 'anotar', texto: 'dois' }] })).rejects.toThrow('Passo 1');
    const id = await salvarFluxo(C.admin, null, { nome: 'Pulo', ativo: true, gatilho: { tipo: 'etapa_alterada', etapa: 'negociacao' }, passos: [{ tipo: 'se', condicao: 'tem_autorizacao', ir_para: 3 }, { tipo: 'anotar', texto: 'sem autorização' }, { tipo: 'anotar', texto: 'com autorização' }, { tipo: 'ir_para', passo: 0 }, { tipo: 'anotar', texto: 'nunca roda' }] });
    const comAut = (await receberPedido(C.empresa, pedido(), meta())) as PedidoSalvo;
    const semAut = (await receberPedido(C.empresa, pedido({ aceite_whatsapp: false }), meta())) as PedidoSalvo;
    for (const p of [comAut, semAut]) { await mudarEtapa(C.vendedor, p.oportunidadeId, { etapa: 'negociacao' }); await rodarTudo(p.oportunidadeId); }
    const notas = async (op: string) => (await q<{ t: string }>(`select dados ->> 'texto' as t from eventos where oportunidade_id = $1 and tipo = 'anotacao' order by id`, [op])).map((x) => x.t).filter((t) => t !== 'Fluxo de boas-vindas rodou');
    expect(await notas(comAut.oportunidadeId)).toEqual(['com autorização']);
    expect(await notas(semAut.oportunidadeId)).toEqual(['sem autorização', 'com autorização']);
    await excluirFluxo(C.admin, id);
  });

  it('gatilho por tempo: oportunidade parada há N dias começa o fluxo uma vez por período parado', async () => {
    const H = await novaEmpresa('Solar Parada');
    await salvarConfig(H.admin, 'regras', { ...H.empresa.config.regras, hora_inicio: 0, hora_fim: 24 });
    await expect(salvarFluxo(H.admin, null, { nome: 'Sem dias', ativo: true, gatilho: { tipo: 'sem_interacao' }, passos: [{ tipo: 'anotar', texto: 'xx' }] })).rejects.toThrow('quantos dias');
    const id = await salvarFluxo(H.admin, null, { ...MODELOS_DE_FLUXO.find((m) => m.id === 'orcamento-parado')!.fluxo, ativo: true });
    const emp = (await empresaPorId(H.empresa.id))!;
    const parada = (await receberPedido(emp, pedido({ aceite_whatsapp: false }), meta())) as PedidoSalvo;
    const recente = (await receberPedido(emp, pedido(), meta())) as PedidoSalvo;
    const fechada = (await receberPedido(emp, pedido(), meta())) as PedidoSalvo;
    await mudarEtapa(H.vendedor, fechada.oportunidadeId, { etapa: 'perdido', motivoPerda: 'Desistiu' });
    await q(`update oportunidades set ultima_interacao_em = now() - interval '8 days' where id = any($1)`, [[parada.oportunidadeId, fechada.oportunidadeId]]);
    expect(await varrerParadas()).toBeGreaterThanOrEqual(1);
    expect(await contar('fluxo_execucoes where fluxo_id = $1 and oportunidade_id = $2', [id, parada.oportunidadeId])).toBe(1);
    expect(await contar('fluxo_execucoes where fluxo_id = $1 and oportunidade_id = any($2)', [id, [recente.oportunidadeId, fechada.oportunidadeId]])).toBe(0);
    // no permission for WhatsApp -> branch goes straight to the call task
    await rodarTudo(parada.oportunidadeId);
    expect((await tarefas(H.admin, { de: 'todas', oportunidadeId: parada.oportunidadeId })).map((t) => t.titulo)).toContain('Oportunidade parada há 7 dias: retomar contato');
    expect(await contar('mensagens m join conversas v on v.id = m.conversa_id where v.contato_id = $1', [parada.contatoId])).toBe(0);
    // scanning again in the same quiet period starts nothing
    await varrerParadas();
    expect(await contar('fluxo_execucoes where fluxo_id = $1 and oportunidade_id = $2', [id, parada.oportunidadeId])).toBe(1);
    // a new interaction, then a new idle period -> starts again
    await q(`update fluxo_execucoes set criado_em = now() - interval '20 days' where fluxo_id = $1`, [id]);
    await q(`update oportunidades set ultima_interacao_em = now() - interval '9 days' where id = $1`, [parada.oportunidadeId]);
    await varrerParadas();
    expect(await contar('fluxo_execucoes where fluxo_id = $1 and oportunidade_id = $2', [id, parada.oportunidadeId])).toBe(2);
    // never touches another company's opportunities
    expect(await contar('fluxo_execucoes e join oportunidades o on o.id = e.oportunidade_id where e.fluxo_id = $1 and o.empresa_id <> $2', [id, H.empresa.id])).toBe(0);
  });

  it('isolamento: outra empresa não vê, edita, apaga nem dispara os fluxos desta', async () => {
    const D = await novaEmpresa('Solar Outra');
    const meu = (await listarFluxos(C.admin))[0];
    expect(await listarFluxos(D.admin)).toEqual([]);
    await expect(obterFluxo(D.admin, meu.id)).rejects.toThrow('não encontrado');
    await expect(salvarFluxo(D.admin, meu.id, propostaSemResposta())).rejects.toThrow('não encontrado');
    await expect(excluirFluxo(D.admin, meu.id)).rejects.toThrow('não encontrado');
    expect(await execucoesDoFluxo(D.admin, meu.id)).toEqual([]);
    const p = (await receberPedido(D.empresa, pedido(), meta())) as PedidoSalvo;
    await mudarEtapa(D.vendedor, p.oportunidadeId, { etapa: 'proposta' });
    expect(await contar('fluxo_execucoes where empresa_id = $1', [D.empresa.id])).toBe(0);
  });

  it('os modelos prontos são válidos e nascem desligados; excluir um fluxo encerra o que estava agendado', async () => {
    for (const m of MODELOS_DE_FLUXO) {
      expect(m.fluxo.ativo).toBe(false);
      const id = await salvarFluxo(C.admin, null, m.fluxo);
      await excluirFluxo(C.admin, id);
    }
    const id = await salvarFluxo(C.admin, null, { nome: 'Para excluir', ativo: true, gatilho: { tipo: 'etapa_alterada', etapa: 'atendimento' }, passos: [{ tipo: 'esperar', minutos: DIA }, { tipo: 'criar_tarefa', titulo: 'Não deve existir', prazo_horas: 1 }] });
    const p = (await receberPedido(C.empresa, pedido(), meta())) as PedidoSalvo;
    await mudarEtapa(C.vendedor, p.oportunidadeId, { etapa: 'atendimento' });
    await excluirFluxo(C.admin, id);
    await rodarTudo(p.oportunidadeId);
    expect(await contar(`tarefas where oportunidade_id = $1 and titulo = 'Não deve existir'`, [p.oportunidadeId])).toBe(0);
    expect(await mensagensDe(C.empresa.id, '00000000-0000-0000-0000-000000000000')).toEqual([]);
  });
});
