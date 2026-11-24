import { exigirNaoVisitante, type Ctx } from './contexto';
import { q, um } from './db';
import { ErroDeUso } from './erros';

/**
 * Alerts page: every alert of the person (and the company's, for admins), grouped by subject, with filters and
 * "mark as read"; and what each person wants on the phone and on WhatsApp (subjects and quiet hours). The list in
 * the panel always keeps every alert: preferences only decide what reaches the phone.
 */
export const GRUPOS = {
  pedidos: 'Pedidos novos',
  conversas: 'Clientes esperando',
  ligacoes: 'Ligações perdidas',
  avaliacoes: 'Avaliações',
  agenda: 'Agenda',
  propostas: 'Propostas',
  tarefas: 'Tarefas',
  resumo: 'Resumo do dia',
  outros: 'Outros',
} as const;
export type Grupo = keyof typeof GRUPOS;
export const LISTA_GRUPOS = Object.keys(GRUPOS) as Grupo[];

/** The subject group of an alert type (set where each alert is created). */
export function grupoDoTipo(tipo: string): Grupo {
  if (tipo === 'tarefa:atender_pedido' || tipo === 'sla') return 'pedidos';
  if (tipo === 'conversa' || tipo === 'tarefa:assumir_conversa') return 'conversas';
  if (tipo === 'tarefa:retornar_ligacao') return 'ligacoes';
  if (tipo === 'tarefa:avaliacao_baixa') return 'avaliacoes';
  if (tipo === 'agenda' || tipo === 'tarefa:confirmar_visita') return 'agenda';
  if (tipo === 'proposta') return 'propostas';
  if (tipo === 'resumo') return 'resumo';
  if (tipo.startsWith('tarefa') || tipo === 'atribuicao' || tipo === 'fluxo') return 'tarefas';
  return 'outros';
}

export interface Aviso {
  id: string;
  titulo: string;
  corpo: string;
  link: string;
  tipo: string;
  grupo: Grupo;
  lida_em: Date | null;
  criado_em: Date;
}

const VISIVEL = `empresa_id = $1 and (user_id = $2 or (user_id is null and $3))`;

/** The person's alerts, newest first; optionally one group and/or only unread. Counts of unread per group for the filters. */
export async function listarAvisos(ctx: Ctx, filtro: { grupo?: Grupo | null; soNaoLidos?: boolean } = {}): Promise<{ avisos: Aviso[]; naoLidos: Record<Grupo, number> }> {
  const linhas = await q<Omit<Aviso, 'grupo'>>(
    `select id, titulo, corpo, link, tipo, lida_em, criado_em from notificacoes where ${VISIVEL} order by criado_em desc limit 300`,
    [ctx.empresaId, ctx.userId, ctx.papel === 'admin'],
  );
  const todos = linhas.map((l) => ({ ...l, grupo: grupoDoTipo(l.tipo) }));
  const naoLidos = Object.fromEntries(LISTA_GRUPOS.map((g) => [g, 0])) as Record<Grupo, number>;
  for (const a of todos) if (!a.lida_em) naoLidos[a.grupo]++;
  const avisos = todos.filter((a) => (!filtro.grupo || a.grupo === filtro.grupo) && (!filtro.soNaoLidos || !a.lida_em)).slice(0, 100);
  return { avisos, naoLidos };
}

/** Marks the person's alerts as read: all, or only one group. */
export async function marcarAvisosLidos(ctx: Ctx, grupo?: Grupo | null) {
  const ids = (await listarAvisos(ctx, { grupo, soNaoLidos: true })).avisos.map((a) => a.id);
  if (!grupo) {
    await q(`update notificacoes set lida_em = now() where ${VISIVEL} and lida_em is null`, [ctx.empresaId, ctx.userId, ctx.papel === 'admin']);
    return;
  }
  if (ids.length) await q(`update notificacoes set lida_em = now() where ${VISIVEL} and id = any($4)`, [ctx.empresaId, ctx.userId, ctx.papel === 'admin', ids]);
}

export interface Preferencias {
  grupos_desligados: Grupo[];
  silencio_inicio: number | null;
  silencio_fim: number | null;
}
const PADRAO: Preferencias = { grupos_desligados: [], silencio_inicio: null, silencio_fim: null };

export async function minhasPreferencias(ctx: Ctx): Promise<Preferencias> {
  return preferenciasDe(ctx.empresaId, ctx.userId);
}
export async function preferenciasDe(empresaId: string, userId: string): Promise<Preferencias> {
  const p = await um<Preferencias>('select grupos_desligados, silencio_inicio, silencio_fim from preferencias_avisos where empresa_id = $1 and user_id = $2', [empresaId, userId]);
  return p ? { ...p, grupos_desligados: p.grupos_desligados.filter((g): g is Grupo => g in GRUPOS) } : { ...PADRAO };
}

export async function salvarPreferencias(ctx: Ctx, p: { recebe: string[]; silencio_inicio: number | null; silencio_fim: number | null }) {
  exigirNaoVisitante(ctx);
  const hora = (h: number | null) => (h == null ? null : Number.isInteger(h) && h >= 0 && h <= 23 ? h : NaN);
  const ini = hora(p.silencio_inicio);
  const fim = hora(p.silencio_fim);
  if (Number.isNaN(ini) || Number.isNaN(fim)) throw new ErroDeUso('Escolha horas de 0 a 23.');
  if ((ini == null) !== (fim == null) || (ini != null && ini === fim)) throw new ErroDeUso('Escolha o começo e o fim do horário de silêncio (horas diferentes), ou nenhum dos dois.');
  const desligados = LISTA_GRUPOS.filter((g) => !p.recebe.includes(g));
  await q(
    `insert into preferencias_avisos (empresa_id, user_id, grupos_desligados, silencio_inicio, silencio_fim) values ($1, $2, $3, $4, $5)
     on conflict (empresa_id, user_id) do update set grupos_desligados = excluded.grupos_desligados, silencio_inicio = excluded.silencio_inicio, silencio_fim = excluded.silencio_fim, atualizado_em = now()`,
    [ctx.empresaId, ctx.userId, desligados, ini, fim],
  );
}

/** Hour of the day in the company's time zone. */
export function horaLocal(fuso: string, d = new Date()): number {
  try {
    return Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: fuso }).format(d));
  } catch {
    return d.getUTCHours();
  }
}

/** Whether this alert should reach the person's phone/WhatsApp now. The test alert always does. */
export function recebeAgora(p: Preferencias, tipo: string, hora: number): boolean {
  if (tipo === 'teste') return true;
  if (p.grupos_desligados.includes(grupoDoTipo(tipo))) return false;
  if (p.silencio_inicio == null || p.silencio_fim == null) return true;
  const { silencio_inicio: a, silencio_fim: b } = p;
  const dentro = a < b ? hora >= a && hora < b : hora >= a || hora < b;
  return !dentro;
}
