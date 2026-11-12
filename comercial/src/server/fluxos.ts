import { z } from 'zod';
import { ETAPAS, NOME_ETAPA, type Etapa } from './config';
import { ator, exigirAdmin, registrar, type Ctx } from './contexto';
import { q, tx, um, type Db } from './db';
import { ErroDeUso, NaoEncontrado } from './erros';
import { agendar } from './fila';

/** What starts a flow. */
export const GATILHOS = ['pedido_recebido', 'etapa_alterada', 'servico_concluido', 'mensagem_recebida', 'sem_interacao'] as const;
export const NOME_GATILHO: Record<(typeof GATILHOS)[number], string> = {
  pedido_recebido: 'Quando chega um pedido novo',
  etapa_alterada: 'Quando a oportunidade entra em uma etapa',
  servico_concluido: 'Quando o serviço é marcado como concluído',
  mensagem_recebida: 'Quando o cliente manda uma mensagem',
  sem_interacao: 'Quando a oportunidade fica parada (sem interação)',
};

/** Conditions a flow can check before going on. */
export const CONDICOES = ['cliente_respondeu', 'etapa_mudou', 'encerrada', 'pessoa_assumiu', 'tem_autorizacao', 'tem_responsavel'] as const;
export type Condicao = (typeof CONDICOES)[number];
export const NOME_CONDICAO: Record<Condicao, string> = {
  cliente_respondeu: 'o cliente respondeu depois que o fluxo começou',
  etapa_mudou: 'a oportunidade saiu da etapa em que o fluxo começou',
  encerrada: 'a oportunidade foi ganha ou perdida',
  pessoa_assumiu: 'uma pessoa assumiu a conversa',
  tem_autorizacao: 'o cliente autorizou mensagens pelo WhatsApp',
  tem_responsavel: 'a oportunidade tem um responsável',
};

const Gatilho = z
  .object({
    tipo: z.enum(GATILHOS),
    etapa: z.enum(ETAPAS).optional(),
    /** Message trigger only: start just when the message contains this word (empty = any message). */
    palavra: z.string().trim().max(40, 'Palavra-chave de no máximo 40 caracteres.').optional(),
    /** Idle trigger only: days without any interaction on an open opportunity. */
    dias: z.number().int().min(1, 'Use pelo menos 1 dia.').max(365, 'No máximo 365 dias.').optional(),
  })
  .refine((g) => g.tipo !== 'sem_interacao' || !!g.dias, { message: 'Diga quantos dias sem interação.' })
  .refine((g) => g.tipo !== 'etapa_alterada' || !!g.etapa, { message: 'Escolha a etapa do gatilho.' });

/**
 * The only actions a flow can take. Closing a deal, its value and changing stages stay with people:
 * a flow never marks a sale as won or lost.
 */
const Passo = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('esperar'), minutos: z.number().int().min(0, 'A espera não pode ser negativa.').max(60 * 24 * 60, 'Espera de no máximo 60 dias.') }),
  z.object({ tipo: z.literal('parar_se'), condicao: z.enum(CONDICOES) }),
  /** Branch: when the condition holds, jump ahead to step `ir_para` (0 = end the flow); otherwise go on to the next step. */
  z.object({ tipo: z.literal('se'), condicao: z.enum(CONDICOES), ir_para: z.number().int().min(0).max(12) }),
  z.object({ tipo: z.literal('ir_para'), passo: z.number().int().min(0).max(12) }),
  z.object({ tipo: z.literal('enviar_whatsapp'), texto: z.string().trim().min(5, 'Escreva a mensagem.').max(600, 'Mensagem de no máximo 600 caracteres.'), modelo: z.string().trim().max(80).default('') }),
  z.object({ tipo: z.literal('criar_tarefa'), titulo: z.string().trim().min(3, 'Escreva o título da tarefa.').max(160), prazo_horas: z.number().int().min(0).max(24 * 60) }),
  z.object({ tipo: z.literal('avisar_equipe'), titulo: z.string().trim().min(3, 'Escreva o aviso.').max(160) }),
  z.object({ tipo: z.literal('anotar'), texto: z.string().trim().min(2, 'Escreva a anotação.').max(500) }),
]);
export type Passo = z.infer<typeof Passo>;
export type GatilhoFluxo = z.infer<typeof Gatilho>;

export const EntradaFluxo = z.object({
  nome: z.string().trim().min(3, 'Dê um nome ao fluxo.').max(80),
  ativo: z.boolean().default(false),
  gatilho: Gatilho,
  passos: z.array(Passo).min(1, 'Coloque pelo menos um passo.').max(12, 'No máximo 12 passos por fluxo.'),
}).superRefine((f, c) => {
  // Jumps only go forward (or to the end), so a flow always finishes and each step runs at most once per execution.
  f.passos.forEach((p, i) => {
    const alvo = p.tipo === 'se' ? p.ir_para : p.tipo === 'ir_para' ? p.passo : null;
    if (alvo === null || alvo === 0) return;
    if (alvo <= i + 1 || alvo > f.passos.length) c.addIssue({ code: 'custom', path: ['passos', i], message: `só dá para ir para um passo mais abaixo (de ${i + 2} a ${f.passos.length}) ou 0 para terminar.` });
  });
});
export type EntradaFluxo = z.input<typeof EntradaFluxo>;

export interface Fluxo {
  id: string;
  nome: string;
  ativo: boolean;
  gatilho: GatilhoFluxo;
  passos: Passo[];
  atualizado_em: Date;
  execucoes: number;
  ativas: number;
}

export const MAX_FLUXOS = 20;

export function descreverGatilho(g: GatilhoFluxo): string {
  if (g.tipo === 'etapa_alterada') return `Quando a oportunidade entra em “${NOME_ETAPA[g.etapa as Etapa]}”`;
  if (g.tipo === 'sem_interacao') return `Quando a oportunidade fica ${g.dias} dia(s) sem interação`;
  if (g.tipo === 'mensagem_recebida' && g.palavra) return `Quando o cliente manda uma mensagem com “${g.palavra}”`;
  return NOME_GATILHO[g.tipo];
}

export function descreverPasso(p: Passo): string {
  switch (p.tipo) {
    case 'esperar': return p.minutos % 1440 === 0 && p.minutos ? `Esperar ${p.minutos / 1440} dia(s)` : p.minutos % 60 === 0 && p.minutos ? `Esperar ${p.minutos / 60} hora(s)` : `Esperar ${p.minutos} minuto(s)`;
    case 'parar_se': return `Parar se ${NOME_CONDICAO[p.condicao]}`;
    case 'se': return `Se ${NOME_CONDICAO[p.condicao]}, ${p.ir_para ? `ir para o passo ${p.ir_para}` : 'terminar'}; senão, seguir`;
    case 'ir_para': return p.passo ? `Ir para o passo ${p.passo}` : 'Terminar o fluxo';
    case 'enviar_whatsapp': return `Enviar WhatsApp: “${p.texto}”`;
    case 'criar_tarefa': return `Criar tarefa: ${p.titulo}${p.prazo_horas ? ` (prazo ${p.prazo_horas} h)` : ''}`;
    case 'avisar_equipe': return `Avisar a equipe: ${p.titulo}`;
    case 'anotar': return `Anotar no histórico: ${p.texto}`;
  }
}

function validar(entrada: unknown): z.infer<typeof EntradaFluxo> {
  const r = EntradaFluxo.safeParse(entrada);
  if (!r.success) {
    const i = r.error.issues[0];
    const onde = i.path[0] === 'passos' && typeof i.path[1] === 'number' ? `Passo ${i.path[1] + 1}: ` : '';
    throw new ErroDeUso(`${onde}${i.message}`);
  }
  return r.data;
}

const UUID = /^[0-9a-f-]{36}$/i;

export async function listarFluxos(ctx: Ctx): Promise<Fluxo[]> {
  return q<Fluxo>(
    `select f.id, f.nome, f.ativo, f.gatilho, f.passos, f.atualizado_em,
       (select count(*)::int from fluxo_execucoes e where e.empresa_id = f.empresa_id and e.fluxo_id = f.id) as execucoes,
       (select count(*)::int from fluxo_execucoes e where e.empresa_id = f.empresa_id and e.fluxo_id = f.id and e.estado = 'ativa') as ativas
     from fluxos f where f.empresa_id = $1 order by f.criado_em`,
    [ctx.empresaId],
  );
}

export async function obterFluxo(ctx: Ctx, id: string): Promise<Fluxo> {
  const f = UUID.test(id) ? (await listarFluxos(ctx)).find((x) => x.id === id) : undefined;
  if (!f) throw new NaoEncontrado('Fluxo não encontrado.');
  return f;
}

export async function salvarFluxo(ctx: Ctx, id: string | null, entrada: unknown): Promise<string> {
  exigirAdmin(ctx);
  const f = validar(entrada);
  return tx(async (db) => {
    await db.query('select pg_advisory_xact_lock(hashtext($1))', [`fluxos:${ctx.empresaId}`]);
    if (!id) {
      const n = await um<{ n: number }>('select count(*)::int as n from fluxos where empresa_id = $1', [ctx.empresaId], db);
      if ((n?.n ?? 0) >= MAX_FLUXOS) throw new ErroDeUso(`Cada empresa pode ter até ${MAX_FLUXOS} fluxos.`);
      const novo = await um<{ id: string }>('insert into fluxos (empresa_id, nome, ativo, gatilho, passos) values ($1, $2, $3, $4, $5) returning id', [ctx.empresaId, f.nome, f.ativo, JSON.stringify(f.gatilho), JSON.stringify(f.passos)], db);
      await registrar(db, ctx.empresaId, { ator: ator(ctx), tipo: 'fluxo_criado', dados: { fluxo: f.nome, ativo: f.ativo } });
      return novo!.id;
    }
    const antes = await um<{ ativo: boolean }>('select ativo from fluxos where empresa_id = $1 and id = $2 for update', [ctx.empresaId, id], db);
    if (!antes) throw new NaoEncontrado('Fluxo não encontrado.');
    await q('update fluxos set nome = $3, ativo = $4, gatilho = $5, passos = $6, atualizado_em = now() where empresa_id = $1 and id = $2', [ctx.empresaId, id, f.nome, f.ativo, JSON.stringify(f.gatilho), JSON.stringify(f.passos)], db);
    await registrar(db, ctx.empresaId, { ator: ator(ctx), tipo: 'fluxo_alterado', dados: { fluxo: f.nome, ativo: f.ativo, estava_ativo: antes.ativo } });
    return id;
  });
}

export async function excluirFluxo(ctx: Ctx, id: string): Promise<void> {
  exigirAdmin(ctx);
  await tx(async (db) => {
    const f = UUID.test(id) ? await um<{ nome: string }>('delete from fluxos where empresa_id = $1 and id = $2 returning nome', [ctx.empresaId, id], db) : null;
    if (!f) throw new NaoEncontrado('Fluxo não encontrado.');
    // Pending steps of its executions find nothing to run and end by themselves.
    await registrar(db, ctx.empresaId, { ator: ator(ctx), tipo: 'fluxo_excluido', dados: { fluxo: f.nome } });
  });
}

export interface ExecucaoFluxo {
  id: string;
  estado: 'ativa' | 'concluida' | 'parada' | 'falhou';
  contato: string | null;
  oportunidade_id: string;
  criado_em: Date;
  concluido_em: Date | null;
  log: { em: string; passo: number; tipo: string; resultado: string }[];
}

export async function execucoesDoFluxo(ctx: Ctx, fluxoId: string): Promise<ExecucaoFluxo[]> {
  if (!UUID.test(fluxoId)) return [];
  return q<ExecucaoFluxo>(
    `select e.id, e.estado, c.nome as contato, e.oportunidade_id, e.criado_em, e.concluido_em, e.log
     from fluxo_execucoes e join contatos c on c.id = e.contato_id
     where e.empresa_id = $1 and e.fluxo_id = $2 order by e.criado_em desc limit 40`,
    [ctx.empresaId, fluxoId],
  );
}

/**
 * Starts every active flow of the company whose trigger matches the event. Called inside the transaction of the event itself,
 * so the flow starts if and only if the event really happened. A flow already running for the same opportunity is not started twice.
 */
export async function dispararFluxos(db: Db, empresaId: string, evento: { tipo: (typeof GATILHOS)[number]; etapa?: Etapa; texto?: string }, op: { id: string; contatoId: string; etapa: Etapa }): Promise<number> {
  const sem = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const todos = await q<{ id: string; nome: string; passos: Passo[]; palavra: string | null }>(
    `select f.id, f.nome, f.passos, f.gatilho ->> 'palavra' as palavra from fluxos f
     where f.empresa_id = $1 and f.ativo and f.gatilho ->> 'tipo' = $2 and ($3::text is null or f.gatilho ->> 'etapa' = $3)
       and not exists (select 1 from fluxo_execucoes e where e.empresa_id = f.empresa_id and e.fluxo_id = f.id and e.oportunidade_id = $4 and e.estado = 'ativa')`,
    [empresaId, evento.tipo, evento.tipo === 'etapa_alterada' ? evento.etapa ?? null : null, op.id],
    db,
  );
  // Message trigger: an optional keyword, compared without accents or case.
  const lista = todos.filter((f) => evento.tipo !== 'mensagem_recebida' || !f.palavra || sem(evento.texto ?? '').includes(sem(f.palavra)));
  for (const f of lista) await iniciarExecucao(db, empresaId, f, op);
  return lista.length;
}

async function iniciarExecucao(db: Db, empresaId: string, f: { id: string; nome: string; passos: Passo[] }, op: { id: string; contatoId: string; etapa: Etapa }) {
  {
    const e = await um<{ id: string }>(
      `insert into fluxo_execucoes (empresa_id, fluxo_id, oportunidade_id, contato_id, passos, etapa_inicial) values ($1, $2, $3, $4, $5, $6) returning id`,
      [empresaId, f.id, op.id, op.contatoId, JSON.stringify(f.passos), op.etapa],
      db,
    );
    await agendar(db, empresaId, { tipo: 'fluxo_passo', chave: `fluxo:${e!.id}:0`, oportunidadeId: op.id, dados: { execucao: e!.id, passo: 0 } });
    await registrar(db, empresaId, { oportunidadeId: op.id, contatoId: op.contatoId, ator: { tipo: 'sistema' }, tipo: 'fluxo_iniciado', dados: { fluxo: f.nome } });
  }
}

/**
 * Time trigger: starts "idle" flows on open opportunities without any interaction for the flow's number of days.
 * Runs every few minutes (worker, embedded queue or scheduler). A flow starts again on the same opportunity only after
 * a new interaction followed by a new idle period, never twice for the same quiet spell.
 */
export async function varrerParadas(limitePorFluxo = 200): Promise<number> {
  const fluxos = await q<{ id: string; empresa_id: string; nome: string; passos: Passo[]; dias: number }>(
    `select f.id, f.empresa_id, f.nome, f.passos, (f.gatilho ->> 'dias')::int as dias from fluxos f join empresas em on em.id = f.empresa_id
     where f.ativo and em.ativa and f.gatilho ->> 'tipo' = 'sem_interacao'`,
  );
  let n = 0;
  for (const f of fluxos) {
    n += await tx(async (db) => {
      // One scanner per flow at a time (embedded queue, worker and scheduler may overlap).
      const livre = await um<{ ok: boolean }>('select pg_try_advisory_xact_lock(hashtext($1)) as ok', [`varrer:${f.id}`], db);
      if (!livre?.ok) return 0;
      const ops = await q<{ id: string; contato_id: string; etapa: Etapa }>(
        `select o.id, o.contato_id, o.etapa from oportunidades o
         where o.empresa_id = $1 and o.etapa not in ('ganho', 'perdido') and o.ultima_interacao_em < now() - make_interval(days => $2)
           and not exists (select 1 from fluxo_execucoes e where e.empresa_id = o.empresa_id and e.fluxo_id = $3 and e.oportunidade_id = o.id
                           and (e.estado = 'ativa' or e.criado_em > o.ultima_interacao_em))
         order by o.ultima_interacao_em limit $4`,
        [f.empresa_id, f.dias, f.id, limitePorFluxo],
        db,
      );
      for (const o of ops) await iniciarExecucao(db, f.empresa_id, f, { id: o.id, contatoId: o.contato_id, etapa: o.etapa });
      return ops.length;
    });
  }
  return n;
}

/** Ready-made flows the admin can start from. They are created switched off, to be read and turned on. */
export const MODELOS_DE_FLUXO: { id: string; nome: string; descricao: string; fluxo: EntradaFluxo }[] = [
  {
    id: 'proposta-sem-resposta',
    nome: 'Proposta sem resposta',
    descricao: 'Depois que a proposta é enviada, espera 2 dias; se o cliente não respondeu, manda uma mensagem; espera mais 3 dias e, se continuar sem resposta, cria a tarefa de ligar.',
    fluxo: {
      nome: 'Proposta sem resposta',
      ativo: false,
      gatilho: { tipo: 'etapa_alterada', etapa: 'proposta' },
      passos: [
        { tipo: 'esperar', minutos: 2 * 1440 },
        { tipo: 'parar_se', condicao: 'cliente_respondeu' },
        { tipo: 'parar_se', condicao: 'etapa_mudou' },
        { tipo: 'enviar_whatsapp', texto: 'Olá, {{nome}}! Aqui é da {{empresa}}. Conseguiu ver a proposta que enviamos? Se tiver qualquer dúvida, é só responder por aqui.', modelo: '' },
        { tipo: 'esperar', minutos: 3 * 1440 },
        { tipo: 'parar_se', condicao: 'cliente_respondeu' },
        { tipo: 'parar_se', condicao: 'etapa_mudou' },
        { tipo: 'criar_tarefa', titulo: 'Ligar para o cliente: proposta sem resposta há 5 dias', prazo_horas: 24 },
      ],
    },
  },
  {
    id: 'boas-vindas',
    nome: 'Boas-vindas ao pedido',
    descricao: 'Assim que chega um pedido, manda uma mensagem de boas-vindas e, se ninguém falar com o cliente em 2 horas, avisa a equipe.',
    fluxo: {
      nome: 'Boas-vindas ao pedido',
      ativo: false,
      gatilho: { tipo: 'pedido_recebido' },
      passos: [
        { tipo: 'enviar_whatsapp', texto: 'Olá, {{nome}}! Recebemos seu pedido na {{empresa}}. Já avisamos a equipe e logo uma pessoa fala com você.', modelo: '' },
        { tipo: 'esperar', minutos: 120 },
        { tipo: 'parar_se', condicao: 'pessoa_assumiu' },
        { tipo: 'parar_se', condicao: 'etapa_mudou' },
        { tipo: 'avisar_equipe', titulo: 'Pedido novo ainda sem atendimento depois de 2 horas' },
      ],
    },
  },
  {
    id: 'pos-venda',
    nome: 'Pós-venda',
    descricao: 'Uma semana depois do serviço concluído, cria a tarefa de perguntar se está tudo certo e pedir indicação.',
    fluxo: {
      nome: 'Pós-venda',
      ativo: false,
      gatilho: { tipo: 'servico_concluido' },
      passos: [
        { tipo: 'esperar', minutos: 7 * 1440 },
        { tipo: 'criar_tarefa', titulo: 'Pós-venda: perguntar se está tudo certo e pedir indicação', prazo_horas: 48 },
      ],
    },
  },
  {
    id: 'pediu-visita',
    nome: 'Cliente pediu visita',
    descricao: 'Quando o cliente escreve “visita”, avisa a equipe; se a oportunidade não tem responsável, cria tarefa para o administrador distribuir; senão, cria a tarefa para o responsável confirmar o horário.',
    fluxo: {
      nome: 'Cliente pediu visita',
      ativo: false,
      gatilho: { tipo: 'mensagem_recebida', palavra: 'visita' },
      passos: [
        { tipo: 'avisar_equipe', titulo: 'Cliente pediu visita pelo atendimento' },
        { tipo: 'se', condicao: 'tem_responsavel', ir_para: 4 },
        { tipo: 'criar_tarefa', titulo: 'Escolher quem vai fazer a visita', prazo_horas: 4 },
        { tipo: 'criar_tarefa', titulo: 'Confirmar dia e horário da visita com o cliente', prazo_horas: 24 },
      ],
    },
  },
  {
    id: 'orcamento-parado',
    nome: 'Orçamento parado',
    descricao: 'Quando uma oportunidade aberta fica 7 dias sem nenhuma interação, manda uma mensagem a quem autorizou; para quem não autorizou, cria a tarefa de ligar.',
    fluxo: {
      nome: 'Orçamento parado',
      ativo: false,
      gatilho: { tipo: 'sem_interacao', dias: 7 },
      passos: [
        { tipo: 'se', condicao: 'tem_autorizacao', ir_para: 3 },
        { tipo: 'ir_para', passo: 4 },
        { tipo: 'enviar_whatsapp', texto: 'Olá, {{nome}}! Aqui é da {{empresa}}. Ainda tem interesse no orçamento? Se quiser, é só responder por aqui.', modelo: '' },
        { tipo: 'criar_tarefa', titulo: 'Oportunidade parada há 7 dias: retomar contato', prazo_horas: 24 },
      ],
    },
  },
];
