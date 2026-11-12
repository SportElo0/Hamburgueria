import { ETAPAS, ETAPAS_FECHADAS, NOME_ETAPA, type Etapa } from './config';
import { ator, criarTarefa, registrar, type Ctx } from './contexto';
import { pool, q, tx, um, type Db } from './db';
import { empresaPorId, membroAtivo } from './empresas';
import { ErroDeUso, NaoAutorizado, NaoEncontrado } from './erros';
import { agendar, cancelarPendentes } from './fila';
import { dispararFluxos } from './fluxos';

export interface Oportunidade {
  id: string;
  contato_id: string;
  contato_nome: string;
  contato_telefone: string;
  contato_cidade: string;
  necessidade: string;
  origem: string;
  campanha: Record<string, string>;
  etapa: Etapa;
  responsavel_id: string | null;
  responsavel_nome: string | null;
  proxima_acao: string;
  proxima_acao_em: Date | null;
  valor_proposta_centavos: string | null;
  motivo_perda: string;
  interesse_visita: string;
  entrada_em: Date;
  ultima_interacao_em: Date;
  confirmacao_auto_em: Date | null;
  primeiro_humano_em: Date | null;
  proposta_em: Date | null;
  fechada_em: Date | null;
  servico_concluido_em: Date | null;
}

const SELECAO = `select o.*, c.nome as contato_nome, c.telefone as contato_telefone, c.cidade as contato_cidade, u.name as responsavel_nome
  from oportunidades o join contatos c on c.id = o.contato_id left join "user" u on u.id = o.responsavel_id`;

export interface Filtro {
  etapa?: Etapa;
  responsavel?: string | 'fila';
  busca?: string;
}

/** Every query carries the company of the session: there is no way to ask for another company's rows. */
export async function listar(ctx: Ctx, f: Filtro = {}): Promise<Oportunidade[]> {
  const p: unknown[] = [ctx.empresaId];
  let w = '';
  if (f.etapa && ETAPAS.includes(f.etapa)) w += ` and o.etapa = $${p.push(f.etapa)}`;
  if (f.responsavel === 'fila') w += ' and o.responsavel_id is null';
  else if (f.responsavel && /^[0-9a-zA-Z_-]{1,64}$/.test(f.responsavel)) w += ` and o.responsavel_id = $${p.push(f.responsavel)}`;
  if (f.busca?.trim()) w += ` and (c.nome ilike $${p.push(`%${f.busca.trim().replace(/[%_\\]/g, '\\$&')}%`)} or c.telefone like $${p.length} or c.cidade ilike $${p.length})`;
  return q<Oportunidade>(`${SELECAO} where o.empresa_id = $1${w} order by o.ultima_interacao_em desc limit 500`, p);
}

export async function obter(ctx: Ctx, id: string, db?: Db): Promise<Oportunidade> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new NaoEncontrado('Oportunidade não encontrada.');
  const o = await um<Oportunidade>(`${SELECAO} where o.empresa_id = $1 and o.id = $2`, [ctx.empresaId, id], db);
  if (!o) throw new NaoEncontrado('Oportunidade não encontrada.');
  return o;
}

export interface Evento {
  id: string;
  ator_tipo: string;
  ator_nome: string | null;
  tipo: string;
  dados: Record<string, unknown>;
  criado_em: Date;
}
export async function historico(ctx: Ctx, oportunidadeId: string): Promise<Evento[]> {
  return q<Evento>(
    `select e.id, e.ator_tipo, u.name as ator_nome, e.tipo, e.dados, e.criado_em from eventos e left join "user" u on u.id = e.ator_id
     where e.empresa_id = $1 and e.oportunidade_id = $2 order by e.criado_em desc, e.id desc limit 200`,
    [ctx.empresaId, oportunidadeId],
  );
}

export async function contatoDe(ctx: Ctx, contatoId: string) {
  return um<{ id: string; nome: string; telefone: string; cidade: string; preferencia_contato: string; dados: Record<string, string | number>; nao_contatar_em: Date | null; consentimentos: { canal: string; texto: string; origem: string; criado_em: string; revogado_em: string | null }[] }>(
    `select c.*, coalesce((select json_agg(json_build_object('canal', k.canal, 'texto', k.texto, 'origem', k.origem, 'criado_em', k.criado_em, 'revogado_em', k.revogado_em) order by k.criado_em desc)
       from consentimentos k where k.empresa_id = c.empresa_id and k.contato_id = c.id), '[]') as consentimentos
     from contatos c where c.empresa_id = $1 and c.id = $2`,
    [ctx.empresaId, contatoId],
  );
}

/** Locks the opportunity row of this company for a change. */
async function travar(db: Db, ctx: Ctx, id: string) {
  const o = await um<{ id: string; etapa: Etapa; responsavel_id: string | null; contato_id: string; primeiro_humano_em: Date | null; proposta_em: Date | null; servico_concluido_em: Date | null }>(
    'select id, etapa, responsavel_id, contato_id, primeiro_humano_em, proposta_em, servico_concluido_em from oportunidades where empresa_id = $1 and id = $2 for update',
    [ctx.empresaId, id],
    db,
  );
  if (!o) throw new NaoEncontrado('Oportunidade não encontrada.');
  return o;
}

/** First human attendance: the first time a person (not the assistant, not a rule) acts on the request. */
export async function marcarAtendimentoHumano(db: Db, empresaId: string, oportunidadeId: string | null, userId: string) {
  if (!oportunidadeId) return;
  await q(`update oportunidades set primeiro_humano_em = coalesce(primeiro_humano_em, now()), ultima_interacao_em = now() where empresa_id = $1 and id = $2`, [empresaId, oportunidadeId], db);
  await q(`update tarefas set concluida_em = now(), concluida_por = $3 where empresa_id = $1 and oportunidade_id = $2 and tipo = 'atender_pedido' and concluida_em is null`, [empresaId, oportunidadeId, userId], db);
  await cancelarPendentes(db, empresaId, { oportunidadeId, tipos: ['alerta_sla'] }, 'Pedido atendido por uma pessoa.');
}

export interface MudancaEtapa {
  etapa: Etapa;
  motivoPerda?: string;
  /** Proposal value in cents, typed by the seller. */
  valorCentavos?: number | null;
}

/**
 * Moves the opportunity to another stage. Closing (won/lost) and the value are always a person's decision.
 * Each transition schedules or cancels the follow-ups that belong to it.
 */
export async function mudarEtapa(ctx: Ctx, id: string, m: MudancaEtapa): Promise<void> {
  if (!ETAPAS.includes(m.etapa)) throw new ErroDeUso('Etapa desconhecida.');
  await tx(async (db) => {
    const o = await travar(db, ctx, id);
    if (o.etapa === m.etapa) return;
    if (ETAPAS_FECHADAS.includes(o.etapa) && ctx.papel !== 'admin') throw new NaoAutorizado('Só o administrador reabre uma oportunidade encerrada.');
    const motivo = (m.motivoPerda ?? '').trim();
    if (m.etapa === 'perdido' && motivo.length < 3) throw new ErroDeUso('Escreva o motivo da perda.');
    if (m.valorCentavos != null && (!Number.isSafeInteger(m.valorCentavos) || m.valorCentavos < 0)) throw new ErroDeUso('Valor inválido.');
    const empresa = (await empresaPorId(ctx.empresaId, db))!;
    const fechando = ETAPAS_FECHADAS.includes(m.etapa);
    await q(
      `update oportunidades set etapa = $3, ultima_interacao_em = now(),
         motivo_perda = case when $3 = 'perdido' then $4 else '' end,
         valor_proposta_centavos = coalesce($5, valor_proposta_centavos),
         proposta_em = case when $3 = 'proposta' then now() else proposta_em end,
         fechada_em = case when $6 then now() else null end,
         servico_concluido_em = case when $3 = 'ganho' then servico_concluido_em else null end
       where empresa_id = $1 and id = $2`,
      [ctx.empresaId, id, m.etapa, motivo, m.valorCentavos ?? null, fechando],
      db,
    );
    await marcarAtendimentoHumano(db, ctx.empresaId, id, ctx.userId);
    await registrar(db, ctx.empresaId, {
      oportunidadeId: id,
      contatoId: o.contato_id,
      ator: ator(ctx),
      tipo: 'etapa_alterada',
      dados: { de: o.etapa, para: m.etapa, ...(m.etapa === 'perdido' ? { motivo } : {}), ...(m.valorCentavos != null ? { valor_centavos: m.valorCentavos } : {}) },
    });

    await dispararFluxos(db, ctx.empresaId, { tipo: 'etapa_alterada', etapa: m.etapa }, { id, contatoId: o.contato_id, etapa: m.etapa });
    // Leaving "proposta" (or closing) ends the follow-ups that the proposal had scheduled.
    if (o.etapa === 'proposta' || fechando) {
      await cancelarPendentes(db, ctx.empresaId, { oportunidadeId: id, tipos: fechando ? ['retorno_cliente', 'alerta_sla', 'confirmacao_pedido'] : ['retorno_cliente'] }, fechando ? 'Oportunidade encerrada.' : `Etapa mudou para ${NOME_ETAPA[m.etapa]}.`);
      await q(`update tarefas set concluida_em = now(), concluida_por = $3 where empresa_id = $1 and oportunidade_id = $2 and tipo = 'retorno_proposta' and concluida_em is null`, [ctx.empresaId, id, ctx.userId], db);
    }
    if (m.etapa === 'proposta') {
      const marca = Date.now();
      const regras = empresa.config.regras;
      await criarTarefa(db, ctx.empresaId, {
        oportunidadeId: id,
        tipo: 'retorno_proposta',
        titulo: 'Retornar sobre a proposta enviada',
        prazo: new Date(marca + regras.retorno_proposta_dias * 86_400_000),
        responsavelId: o.responsavel_id ?? ctx.userId,
        chave: `retorno:${id}:${marca}`,
      });
      if (regras.retorno_auto_cliente) {
        // A short sequence: each step is checked again when it is due, and any reply, take-over or stage change cancels what is left.
        const passos = [regras.retorno_auto_horas, regras.retorno_auto_horas_2].filter((h, i) => h > 0 && (i === 0 || h > regras.retorno_auto_horas));
        for (const [i, horas] of passos.entries()) {
          await agendar(db, ctx.empresaId, {
            tipo: 'retorno_cliente',
            chave: `retorno_cliente:${id}:${marca}:${i + 1}`,
            em: new Date(marca + horas * 3_600_000),
            oportunidadeId: id,
            dados: { agendado_em: new Date(marca).toISOString(), passo: i + 1 },
          });
        }
      }
    }
  });
}

/** Assigns to someone of the same company, or back to the unassigned queue (null). */
export async function atribuir(ctx: Ctx, id: string, userId: string | null): Promise<void> {
  await tx(async (db) => {
    const o = await travar(db, ctx, id);
    if (o.responsavel_id === userId) return;
    if (userId && !(await membroAtivo(db, ctx.empresaId, userId))) throw new ErroDeUso('Escolha alguém ativo da equipe.');
    await q('update oportunidades set responsavel_id = $3 where empresa_id = $1 and id = $2', [ctx.empresaId, id, userId], db);
    await q('update tarefas set responsavel_id = $3 where empresa_id = $1 and oportunidade_id = $2 and concluida_em is null', [ctx.empresaId, id, userId], db);
    await registrar(db, ctx.empresaId, { oportunidadeId: id, contatoId: o.contato_id, ator: ator(ctx), tipo: 'responsavel_alterado', dados: { de: o.responsavel_id, para: userId } });
    if (userId && userId !== ctx.userId) {
      await q('insert into notificacoes (empresa_id, user_id, titulo, link) values ($1, $2, $3, $4)', [ctx.empresaId, userId, 'Uma oportunidade foi atribuída a você', `/painel/oportunidades/${id}`], db);
    }
  });
}

export async function definirProximaAcao(ctx: Ctx, id: string, texto: string, quando: Date | null): Promise<void> {
  const t = texto.trim().slice(0, 300);
  await tx(async (db) => {
    const o = await travar(db, ctx, id);
    await q('update oportunidades set proxima_acao = $3, proxima_acao_em = $4 where empresa_id = $1 and id = $2', [ctx.empresaId, id, t, quando], db);
    await registrar(db, ctx.empresaId, { oportunidadeId: id, contatoId: o.contato_id, ator: ator(ctx), tipo: 'proxima_acao_definida', dados: { texto: t, quando: quando?.toISOString() ?? null } });
    if (t && quando) {
      await criarTarefa(db, ctx.empresaId, { oportunidadeId: id, tipo: 'proxima_acao', titulo: t, prazo: quando, responsavelId: o.responsavel_id ?? ctx.userId, chave: `acao:${id}:${quando.getTime()}:${t.length}` });
    }
  });
}

export async function anotar(ctx: Ctx, id: string, texto: string): Promise<void> {
  const t = texto.trim();
  if (t.length < 2) throw new ErroDeUso('Escreva a anotação.');
  await tx(async (db) => {
    const o = await travar(db, ctx, id);
    await registrar(db, ctx.empresaId, { oportunidadeId: id, contatoId: o.contato_id, ator: ator(ctx), tipo: 'anotacao', dados: { texto: t.slice(0, 2000) } });
    await q('update oportunidades set ultima_interacao_em = now() where empresa_id = $1 and id = $2', [ctx.empresaId, id], db);
  });
}

export async function definirValor(ctx: Ctx, id: string, valorCentavos: number | null): Promise<void> {
  if (valorCentavos != null && (!Number.isSafeInteger(valorCentavos) || valorCentavos < 0)) throw new ErroDeUso('Valor inválido.');
  await tx(async (db) => {
    const o = await travar(db, ctx, id);
    await q('update oportunidades set valor_proposta_centavos = $3 where empresa_id = $1 and id = $2', [ctx.empresaId, id, valorCentavos], db);
    await registrar(db, ctx.empresaId, { oportunidadeId: id, contatoId: o.contato_id, ator: ator(ctx), tipo: 'valor_informado', dados: { valor_centavos: valorCentavos } });
  });
}

/** A won deal whose service was delivered. With the rule on, schedules the neutral review invitation. */
export async function marcarServicoConcluido(ctx: Ctx, id: string): Promise<void> {
  await tx(async (db) => {
    const o = await travar(db, ctx, id);
    if (o.etapa !== 'ganho') throw new ErroDeUso('Só uma venda ganha pode ter o serviço marcado como concluído.');
    if (o.servico_concluido_em) return;
    const empresa = (await empresaPorId(ctx.empresaId, db))!;
    await q('update oportunidades set servico_concluido_em = now() where empresa_id = $1 and id = $2', [ctx.empresaId, id], db);
    await registrar(db, ctx.empresaId, { oportunidadeId: id, contatoId: o.contato_id, ator: ator(ctx), tipo: 'servico_concluido' });
    await dispararFluxos(db, ctx.empresaId, { tipo: 'servico_concluido' }, { id, contatoId: o.contato_id, etapa: 'ganho' });
    if (empresa.config.regras.avaliacao_auto && empresa.config.avaliacao.link) {
      await agendar(db, ctx.empresaId, { tipo: 'convite_avaliacao', chave: `avaliacao:${id}`, oportunidadeId: id, em: new Date(Date.now() + 60_000) });
    }
  });
}

/* ---------- Tasks and notifications ---------- */

export interface Tarefa {
  id: string;
  tipo: string;
  titulo: string;
  detalhe: string;
  prazo: Date | null;
  responsavel_id: string | null;
  responsavel_nome: string | null;
  oportunidade_id: string | null;
  conversa_id: string | null;
  contato_nome: string | null;
  concluida_em: Date | null;
  criado_em: Date;
}

export async function tarefas(ctx: Ctx, f: { de?: 'minhas' | 'fila' | 'todas'; estado?: 'abertas' | 'vencidas' | 'concluidas'; oportunidadeId?: string } = {}): Promise<Tarefa[]> {
  const p: unknown[] = [ctx.empresaId];
  let w = '';
  if (f.de === 'minhas') w += ` and t.responsavel_id = $${p.push(ctx.userId)}`;
  if (f.de === 'fila') w += ' and t.responsavel_id is null';
  if (f.estado === 'concluidas') w += ' and t.concluida_em is not null';
  else w += ' and t.concluida_em is null';
  if (f.estado === 'vencidas') w += ' and t.prazo < now()';
  if (f.oportunidadeId && /^[0-9a-f-]{36}$/i.test(f.oportunidadeId)) w += ` and t.oportunidade_id = $${p.push(f.oportunidadeId)}`;
  return q<Tarefa>(
    `select t.*, u.name as responsavel_nome, c.nome as contato_nome from tarefas t
       left join "user" u on u.id = t.responsavel_id
       left join oportunidades o on o.id = t.oportunidade_id left join contatos c on c.id = o.contato_id
     where t.empresa_id = $1${w} order by ${f.estado === 'concluidas' ? 't.concluida_em desc' : 't.prazo asc nulls last, t.criado_em'} limit 300`,
    p,
  );
}

export async function criarTarefaManual(ctx: Ctx, t: { titulo: string; prazo: Date | null; oportunidadeId?: string | null; responsavelId?: string | null }) {
  const titulo = t.titulo.trim();
  if (titulo.length < 3) throw new ErroDeUso('Escreva o que precisa ser feito.');
  await tx(async (db) => {
    if (t.oportunidadeId) await travar(db, ctx, t.oportunidadeId);
    const resp = t.responsavelId ?? ctx.userId;
    if (!(await membroAtivo(db, ctx.empresaId, resp)) && !ctx.acessoAdmin) throw new ErroDeUso('Escolha alguém ativo da equipe.');
    await criarTarefa(db, ctx.empresaId, { oportunidadeId: t.oportunidadeId ?? null, tipo: 'manual', titulo: titulo.slice(0, 200), prazo: t.prazo, responsavelId: ctx.acessoAdmin ? t.responsavelId ?? null : resp });
  });
}

export async function concluirTarefa(ctx: Ctx, id: string): Promise<void> {
  const r = await um('update tarefas set concluida_em = now(), concluida_por = $3 where empresa_id = $1 and id = $2 and concluida_em is null returning id', [ctx.empresaId, id, ctx.userId]);
  if (!r) throw new NaoEncontrado('Tarefa não encontrada ou já concluída.');
}

/** A person sees notifications sent to them; company admins also see the ones without recipient (the queue). */
export async function notificacoes(ctx: Ctx) {
  return q<{ id: string; titulo: string; corpo: string; link: string; lida_em: Date | null; criado_em: Date }>(
    `select id, titulo, corpo, link, lida_em, criado_em from notificacoes
     where empresa_id = $1 and (user_id = $2 or (user_id is null and $3)) order by criado_em desc limit 50`,
    [ctx.empresaId, ctx.userId, ctx.papel === 'admin'],
  );
}
export async function marcarNotificacoesLidas(ctx: Ctx) {
  await q('update notificacoes set lida_em = now() where empresa_id = $1 and lida_em is null and (user_id = $2 or (user_id is null and $3))', [ctx.empresaId, ctx.userId, ctx.papel === 'admin']);
}

/** Authorized export of the company's contacts (admin only), as CSV text. Cells are neutralized against spreadsheet formulas. */
export async function exportarContatos(ctx: Ctx): Promise<string> {
  if (ctx.papel !== 'admin') throw new NaoAutorizado('Só o administrador da empresa exporta os contatos.');
  const linhas = await q<{ nome: string; telefone: string; cidade: string; preferencia_contato: string; dados: Record<string, unknown>; nao_contatar_em: Date | null; criado_em: Date; etapa: string | null; origem: string | null }>(
    `select c.nome, c.telefone, c.cidade, c.preferencia_contato, c.dados, c.nao_contatar_em, c.criado_em,
       (select o.etapa from oportunidades o where o.contato_id = c.id order by o.entrada_em desc limit 1) as etapa,
       (select o.origem from oportunidades o where o.contato_id = c.id order by o.entrada_em desc limit 1) as origem
     from contatos c where c.empresa_id = $1 order by c.criado_em`,
    [ctx.empresaId],
  );
  await registrar(pool(), ctx.empresaId, { ator: ator(ctx), tipo: 'contatos_exportados', dados: { total: linhas.length } });
  const cel = (v: unknown) => {
    let s = v == null ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const cab = ['Nome', 'Telefone', 'Cidade', 'Preferência de contato', 'Dados do pedido', 'Pediu para não ser contatado em', 'Cadastrado em', 'Etapa atual', 'Origem'];
  return [cab.map(cel).join(';'), ...linhas.map((l) => [l.nome, l.telefone, l.cidade, l.preferencia_contato, JSON.stringify(l.dados), l.nao_contatar_em?.toISOString() ?? '', l.criado_em.toISOString(), l.etapa ? NOME_ETAPA[l.etapa as Etapa] : '', l.origem ?? ''].map(cel).join(';'))].join('\r\n');
}

/** Documented deletion: removes a contact and everything attached to it (admin only), keeping only an anonymous record that it happened. */
export async function excluirContato(ctx: Ctx, contatoId: string): Promise<void> {
  if (ctx.papel !== 'admin') throw new NaoAutorizado('Só o administrador da empresa exclui contatos.');
  await tx(async (db) => {
    const c = await um('select id from contatos where empresa_id = $1 and id = $2 for update', [ctx.empresaId, contatoId], db);
    if (!c) throw new NaoEncontrado('Contato não encontrado.');
    await q(`update trabalhos set estado = 'cancelado', resultado = 'Contato excluído.', concluido_em = now() where empresa_id = $1 and estado = 'pendente'
       and (oportunidade_id in (select id from oportunidades where contato_id = $2) or conversa_id in (select id from conversas where contato_id = $2))`, [ctx.empresaId, contatoId], db);
    await q('delete from eventos where empresa_id = $1 and (contato_id = $2 or oportunidade_id in (select id from oportunidades where contato_id = $2))', [ctx.empresaId, contatoId], db);
    await q('delete from contatos where empresa_id = $1 and id = $2', [ctx.empresaId, contatoId], db);
    await registrar(db, ctx.empresaId, { ator: ator(ctx), tipo: 'contato_excluido' });
  });
}
