import { z } from 'zod';
import { ator, exigirAdmin, exigirNaoVisitante, registrar, type Ctx } from './contexto';
import { pool, q, tx, um, type Db } from './db';
import { empresaPorId, membroAtivo, type Empresa } from './empresas';
import { ErroDeUso, NaoEncontrado } from './erros';

/**
 * Agenda by professional. Each professional (with or without a login) has weekly working hours; one day can be adjusted
 * with "tirar" (a time or the whole day leaves the agenda) or "extra" (one more time). A start time is free when it is
 * inside the working hours (or is an extra), is not taken out, has no active visit with that professional and respects
 * the minimum notice and the booking window. Without active professionals the company keeps the old agenda
 * (company hours and "visits at the same time").
 */

export type Semana = Record<string, [number, number][]>;
export interface Profissional {
  id: string;
  nome: string;
  funcao: string;
  cor: string;
  user_id: string | null;
  semana: Semana;
  ativo: boolean;
  ordem: number;
}

export const CORES = ['#175cd3', '#0e9384', '#7a5af8', '#dd2590', '#e04f16', '#4e5ba6', '#099250', '#b54708'];
const ATIVAS = ['marcada', 'confirmada'];

export async function profissionais(empresaId: string, db?: Db, todos = false): Promise<Profissional[]> {
  return q<Profissional>(`select id, nome, funcao, cor, user_id, semana, ativo, ordem from profissionais where empresa_id = $1 ${todos ? '' : 'and ativo'} order by ativo desc, ordem, nome`, [empresaId], db);
}
export const usaProfissionais = async (empresaId: string, db?: Db) => !!(await um('select 1 from profissionais where empresa_id = $1 and ativo', [empresaId], db));

/* ---------- Local dates ---------- */

function partes(d: Date, fuso: string) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: fuso, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return { ano: +p.year, mes: +p.month, dia: +p.day, hora: +p.hour, minuto: +p.minute };
}
/** The instant of a local wall-clock time in the company's time zone. */
export function instante(data: string, minutos: number, fuso: string): Date {
  const [ano, mes, dia] = data.split('-').map(Number);
  const alvo = Date.UTC(ano, mes - 1, dia, Math.floor(minutos / 60), minutos % 60);
  let t = alvo;
  for (let i = 0; i < 2; i++) {
    const p = partes(new Date(t), fuso);
    t += alvo - Date.UTC(p.ano, p.mes - 1, p.dia, p.hora, p.minuto);
  }
  return new Date(t);
}
/** Local date (YYYY-MM-DD) of an instant. */
export function dataLocal(d: Date, fuso: string): string {
  const p = partes(d, fuso);
  return `${p.ano}-${String(p.mes).padStart(2, '0')}-${String(p.dia).padStart(2, '0')}`;
}
export const minutosLocais = (d: Date, fuso: string) => {
  const p = partes(d, fuso);
  return p.hora * 60 + p.minuto;
};
export const somarDias = (data: string, n: number) => new Date(Date.UTC(+data.slice(0, 4), +data.slice(5, 7) - 1, +data.slice(8, 10) + n)).toISOString().slice(0, 10);
export const diaDaSemana = (data: string) => new Date(`${data}T12:00:00Z`).getUTCDay();
export const textoHora = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;
export const dataValida = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T12:00:00Z`)) && somarDias(s, 0) === s;

/* ---------- Slots ---------- */

export type EstadoVaga = 'livre' | 'visita' | 'tirado' | 'passado';
export interface Vaga {
  profissionalId: string;
  inicio: Date;
  fim: Date;
  estado: EstadoVaga;
  extra: boolean;
  /** The "tirar" adjustment that covers it (to give the time back) or the "extra" that created it. */
  ajusteId: string | null;
  visita?: { id: string; nome: string; origem: string; oportunidade_id: string };
}

interface Dados {
  profs: Profissional[];
  ajustes: { id: string; profissional_id: string; tipo: 'tirar' | 'extra'; inicio: Date; fim: Date }[];
  visitas: { id: string; profissional_id: string; inicio: Date; fim: Date; nome: string; telefone: string; origem: string; oportunidade_id: string }[];
}

async function carregar(empresaId: string, de: Date, ate: Date, db?: Db, profissionalId?: string): Promise<Dados> {
  const profs = (await profissionais(empresaId, db)).filter((p) => !profissionalId || p.id === profissionalId);
  const [ajustes, visitas] = await Promise.all([
    q<Dados['ajustes'][number]>('select id, profissional_id, tipo, inicio, fim from agenda_ajustes where empresa_id = $1 and fim > $2 and inicio < $3', [empresaId, de, ate], db),
    q<Dados['visitas'][number]>(
      `select v.id, v.profissional_id, v.inicio, v.fim, c.nome, c.telefone, v.origem, v.oportunidade_id from visitas v join contatos c on c.id = v.contato_id
       where v.empresa_id = $1 and v.profissional_id is not null and v.estado = any($4) and v.fim > $2 and v.inicio < $3`,
      [empresaId, de, ate, ATIVAS],
      db,
    ),
  ]);
  return { profs, ajustes, visitas };
}

const sobrepoe = (a: { inicio: Date; fim: Date }, b: { inicio: Date; fim: Date }) => a.inicio < b.fim && a.fim > b.inicio;

/** Every slot of one local day, per professional, with its state (owner's view). */
function vagasDoDia(empresa: Empresa, dados: Dados, data: string, agora: Date): Vaga[] {
  const a = empresa.config.agenda;
  const fuso = empresa.config.regras.fuso;
  const dur = a.duracao_min * 60_000;
  const minimo = new Date(agora.getTime() + a.antecedencia_horas * 3_600_000);
  const feriado = a.bloqueios.some((b) => data >= b.de && data <= b.ate);
  const inicioDia = instante(data, 0, fuso);
  const fimDia = instante(somarDias(data, 1), 0, fuso);
  const out: Vaga[] = [];
  for (const p of dados.profs) {
    const lista: { inicio: Date; extra: boolean; ajusteId: string | null }[] = [];
    if (!feriado) {
      for (const [ini, fim] of p.semana[String(diaDaSemana(data))] ?? []) {
        for (let m = ini; m + a.duracao_min <= fim; m += a.duracao_min) lista.push({ inicio: instante(data, m, fuso), extra: false, ajusteId: null });
      }
    }
    for (const x of dados.ajustes) {
      if (x.profissional_id === p.id && x.tipo === 'extra' && x.inicio >= inicioDia && x.inicio < fimDia && !lista.some((l) => l.inicio.getTime() === x.inicio.getTime())) {
        lista.push({ inicio: x.inicio, extra: true, ajusteId: x.id });
      }
    }
    // Visits booked at a time outside the grid still show (a person may book any time).
    for (const v of dados.visitas) {
      if (v.profissional_id === p.id && v.inicio >= inicioDia && v.inicio < fimDia && !lista.some((l) => sobrepoe({ inicio: l.inicio, fim: new Date(l.inicio.getTime() + dur) }, v))) {
        lista.push({ inicio: v.inicio, extra: false, ajusteId: null });
      }
    }
    lista.sort((x, y) => x.inicio.getTime() - y.inicio.getTime());
    for (const l of lista) {
      const vaga = { inicio: l.inicio, fim: new Date(l.inicio.getTime() + dur) };
      const visita = dados.visitas.find((v) => v.profissional_id === p.id && sobrepoe(vaga, v));
      const tirado = l.extra ? null : dados.ajustes.find((x) => x.profissional_id === p.id && x.tipo === 'tirar' && sobrepoe(vaga, x));
      const estado: EstadoVaga = visita ? 'visita' : tirado ? 'tirado' : l.inicio < minimo ? 'passado' : 'livre';
      out.push({
        profissionalId: p.id,
        ...vaga,
        estado,
        extra: l.extra,
        ajusteId: tirado?.id ?? l.ajusteId,
        ...(visita ? { visita: { id: visita.id, nome: visita.nome || 'Cliente', origem: visita.origem, oportunidade_id: visita.oportunidade_id } } : {}),
      });
    }
  }
  return out;
}

/** Owner's grid of one day. */
export async function gradeDoDia(empresa: Empresa, data: string, agora = new Date(), db?: Db): Promise<Vaga[]> {
  const fuso = empresa.config.regras.fuso;
  const dados = await carregar(empresa.id, instante(data, 0, fuso), instante(somarDias(data, 1), 0, fuso), db);
  return vagasDoDia(empresa, dados, data, agora);
}

/** Free slots from now (plus the minimum notice) to the end of the booking window. */
export async function vagasLivres(empresa: Empresa, agora = new Date(), db?: Db, profissionalId?: string): Promise<Vaga[]> {
  const a = empresa.config.agenda;
  if (!a.ativa) return [];
  const fuso = empresa.config.regras.fuso;
  const hoje = dataLocal(agora, fuso);
  const ultimo = somarDias(hoje, a.janela_dias);
  const ate = new Date(agora.getTime() + a.janela_dias * 86_400_000);
  const dados = await carregar(empresa.id, instante(hoje, 0, fuso), instante(somarDias(ultimo, 1), 0, fuso), db, profissionalId);
  const out: Vaga[] = [];
  for (let d = hoje; d <= ultimo; d = somarDias(d, 1)) out.push(...vagasDoDia(empresa, dados, d, agora).filter((v) => v.estado === 'livre' && v.inicio <= ate));
  return out.sort((x, y) => x.inicio.getTime() - y.inicio.getTime());
}

/** Which professional can take a visit at this instant (the given one, or the first free by order). */
export async function profissionalLivre(empresa: Empresa, inicio: Date, profissionalId: string | null, db: Db, agora = new Date()): Promise<string | null> {
  const livres = (await vagasLivres(empresa, agora, db, profissionalId ?? undefined)).filter((v) => v.inicio.getTime() === inicio.getTime());
  return livres[0]?.profissionalId ?? null;
}

/* ---------- Owner: professionals ---------- */

const Faixa = z.tuple([z.number().int().min(0).max(1440), z.number().int().min(0).max(1440)]).refine(([i, f]) => f > i, 'Horário de fim antes do início.');
const EntradaProf = z.object({
  id: z.uuid().optional(),
  nome: z.string().trim().min(2, 'Escreva o nome.').max(60),
  funcao: z.string().trim().max(60).default(''),
  cor: z.string().regex(/^#[0-9a-f]{6}$/).default(CORES[0]),
  userId: z.string().max(64).optional().nullable(),
  semana: z.record(z.string().regex(/^[0-6]$/), z.array(Faixa).max(4)).default({}),
});

export async function salvarProfissional(ctx: Ctx, entrada: z.input<typeof EntradaProf>): Promise<string> {
  exigirAdmin(ctx);
  exigirNaoVisitante(ctx);
  const r = EntradaProf.safeParse(entrada);
  if (!r.success) throw new ErroDeUso(r.error.issues[0]?.message.startsWith('Invalid') ? 'Confira os dados do profissional.' : (r.error.issues[0]?.message ?? 'Confira os dados.'));
  const e = r.data;
  for (const faixas of Object.values(e.semana)) {
    const ord = [...faixas].sort((x, y) => x[0] - y[0]);
    for (let i = 1; i < ord.length; i++) if (ord[i][0] < ord[i - 1][1]) throw new ErroDeUso('Os horários de um mesmo dia não podem se sobrepor.');
  }
  return tx(async (db) => {
    const userId = e.userId ? e.userId : null;
    if (userId && !(await membroAtivo(db, ctx.empresaId, userId))) throw new ErroDeUso('Essa pessoa não está na equipe.');
    let id = e.id;
    if (id) {
      const r = await um<{ id: string }>('update profissionais set nome = $3, funcao = $4, cor = $5, user_id = $6, semana = $7 where empresa_id = $1 and id = $2 returning id', [ctx.empresaId, id, e.nome, e.funcao, e.cor, userId, JSON.stringify(e.semana)], db);
      if (!r) throw new NaoEncontrado('Profissional não encontrado.');
    } else {
      const n = (await um<{ n: number }>('select count(*)::int as n from profissionais where empresa_id = $1', [ctx.empresaId], db))!.n;
      if (n >= 30) throw new ErroDeUso('Limite de 30 profissionais por empresa.');
      id = (await um<{ id: string }>('insert into profissionais (empresa_id, nome, funcao, cor, user_id, semana, ordem) values ($1, $2, $3, $4, $5, $6, $7) returning id', [ctx.empresaId, e.nome, e.funcao, e.cor, userId, JSON.stringify(e.semana), n + 1], db))!.id;
    }
    await registrar(db, ctx.empresaId, { ator: ator(ctx), tipo: 'agenda_alterada', dados: { profissional: e.nome, acao: e.id ? 'editou' : 'cadastrou' } });
    return id;
  });
}

/** Professionals are never deleted (visits keep who they were with): they stop showing. */
export async function ativarProfissional(ctx: Ctx, id: string, ativo: boolean) {
  exigirAdmin(ctx);
  exigirNaoVisitante(ctx);
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new NaoEncontrado();
  const r = await um<{ nome: string }>('update profissionais set ativo = $3 where empresa_id = $1 and id = $2 returning nome', [ctx.empresaId, id, ativo]);
  if (!r) throw new NaoEncontrado('Profissional não encontrado.');
  // Visits already booked with this professional stay as they are (the owner moves them by hand).
  await registrar(pool(), ctx.empresaId, { ator: ator(ctx), tipo: 'agenda_alterada', dados: { profissional: r.nome, acao: ativo ? 'reativou' : 'desativou' } });
}

/* ---------- Owner: one day's adjustments ---------- */

async function profDaEmpresa(db: Db, empresaId: string, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new NaoEncontrado();
  const p = await um<{ nome: string }>('select nome from profissionais where empresa_id = $1 and id = $2 and ativo', [empresaId, id], db);
  if (!p) throw new NaoEncontrado('Profissional não encontrado.');
  return p;
}

async function limiteAjustes(db: Db, empresaId: string) {
  const n = (await um<{ n: number }>(`select count(*)::int as n from agenda_ajustes where empresa_id = $1 and criado_em > now() - interval '1 day'`, [empresaId], db))!.n;
  if (n >= 500) throw new ErroDeUso('Muitas mudanças na agenda hoje. Tente amanhã.');
}

/** "Tirar este horário" (one slot) or "Tirar o dia" (minutos null). */
export async function tirarHorario(ctx: Ctx, profissionalId: string, data: string, minutos: number | null) {
  exigirAdmin(ctx);
  if (!dataValida(data) || (minutos !== null && (!Number.isInteger(minutos) || minutos < 0 || minutos >= 1440))) throw new ErroDeUso('Horário inválido.');
  const empresa = (await empresaPorId(ctx.empresaId))!;
  const fuso = empresa.config.regras.fuso;
  await tx(async (db) => {
    const p = await profDaEmpresa(db, ctx.empresaId, profissionalId);
    await limiteAjustes(db, ctx.empresaId);
    const inicio = minutos === null ? instante(data, 0, fuso) : instante(data, minutos, fuso);
    const fim = minutos === null ? instante(somarDias(data, 1), 0, fuso) : new Date(inicio.getTime() + empresa.config.agenda.duracao_min * 60_000);
    await q('insert into agenda_ajustes (empresa_id, profissional_id, tipo, inicio, fim, criado_por) values ($1, $2, $3, $4, $5, $6)', [ctx.empresaId, profissionalId, 'tirar', inicio, fim, ctx.userId], db);
    // An extra time inside what was taken out goes away too.
    await q(`delete from agenda_ajustes where empresa_id = $1 and profissional_id = $2 and tipo = 'extra' and inicio >= $3 and inicio < $4`, [ctx.empresaId, profissionalId, inicio, fim], db);
    await registrar(db, ctx.empresaId, { ator: ator(ctx), tipo: 'agenda_alterada', dados: { profissional: p.nome, acao: minutos === null ? 'tirou o dia' : 'tirou um horário', data, hora: minutos === null ? null : textoHora(minutos) } });
  });
}

/** Gives back what was taken out, or removes an extra time. */
export async function desfazerAjuste(ctx: Ctx, ajusteId: string) {
  exigirAdmin(ctx);
  if (!/^[0-9a-f-]{36}$/i.test(ajusteId)) throw new NaoEncontrado();
  const r = await um<{ tipo: string }>('delete from agenda_ajustes where empresa_id = $1 and id = $2 returning tipo', [ctx.empresaId, ajusteId]);
  if (!r) throw new NaoEncontrado('Esse ajuste já não existe.');
}

/** "+ horário": one more time for a professional on a day (outside the working hours too). */
export async function adicionarHorario(ctx: Ctx, profissionalId: string, data: string, hora: string) {
  exigirAdmin(ctx);
  const m = hora.match(/^(\d{1,2}):(\d{2})$/);
  const minutos = m ? +m[1] * 60 + +m[2] : NaN;
  if (!dataValida(data) || !Number.isInteger(minutos) || minutos < 0 || minutos >= 1440) throw new ErroDeUso('Escolha um horário válido.');
  const empresa = (await empresaPorId(ctx.empresaId))!;
  const fuso = empresa.config.regras.fuso;
  const inicio = instante(data, minutos, fuso);
  if (inicio.getTime() < Date.now()) throw new ErroDeUso('Escolha um horário no futuro.');
  const fim = new Date(inicio.getTime() + empresa.config.agenda.duracao_min * 60_000);
  await tx(async (db) => {
    const p = await profDaEmpresa(db, ctx.empresaId, profissionalId);
    await limiteAjustes(db, ctx.empresaId);
    // If that time was taken out, adding it simply gives it back.
    const tirado = await um<{ id: string }>(`select id from agenda_ajustes where empresa_id = $1 and profissional_id = $2 and tipo = 'tirar' and inicio = $3 and fim = $4`, [ctx.empresaId, profissionalId, inicio, fim], db);
    if (tirado) await q('delete from agenda_ajustes where id = $1', [tirado.id], db);
    else {
      const grade = await gradeDoDia(empresa, data, new Date(), db);
      if (grade.some((v) => v.profissionalId === profissionalId && sobrepoe(v, { inicio, fim }) && v.estado !== 'tirado')) throw new ErroDeUso('Esse horário já existe na agenda.');
      await q('insert into agenda_ajustes (empresa_id, profissional_id, tipo, inicio, fim, criado_por) values ($1, $2, $3, $4, $5, $6)', [ctx.empresaId, profissionalId, 'extra', inicio, fim, ctx.userId], db);
    }
    await registrar(db, ctx.empresaId, { ator: ator(ctx), tipo: 'agenda_alterada', dados: { profissional: p.nome, acao: 'adicionou um horário', data, hora } });
  });
}
