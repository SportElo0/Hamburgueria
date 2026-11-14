import { z } from 'zod';
import { formatarTelefone, type Etapa } from './config';
import { ator, criarTarefa, registrar, type Ctx } from './contexto';
import { q, tx, um, type Db } from './db';
import { empresaPorId, membroAtivo, type Empresa } from './empresas';
import { ErroDeUso, NaoEncontrado } from './erros';
import { agendar } from './fila';
import { dispararFluxos } from './fluxos';
import { hashToken, novoToken } from './segredos';

/**
 * Visit calendar. Free times come from the company's settings (weekdays, hours, length, how many at once) minus the
 * visits already booked. The assistant can only book one of the free times it was shown, checked again here with the
 * calendar locked, so two customers never get the same last spot.
 */

export const ESTADOS_VISITA = ['marcada', 'confirmada', 'realizada', 'faltou', 'cancelada'] as const;
export type EstadoVisita = (typeof ESTADOS_VISITA)[number];
export const NOME_ESTADO_VISITA: Record<EstadoVisita, string> = { marcada: 'Marcada', confirmada: 'Confirmada', realizada: 'Realizada', faltou: 'Cliente faltou', cancelada: 'Cancelada' };
const ATIVAS = ['marcada', 'confirmada'];
const MAX_VISITAS_IA_DIA = 20;

/* ---------- Local time of the company ---------- */

function partes(d: Date, fuso: string) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: fuso, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short' })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  const dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  return { ano: +p.year, mes: +p.month, dia: +p.day, hora: +p.hour, minuto: +p.minute, semana: dia };
}

/** The instant of a local wall-clock time in the company's time zone. */
export function instanteLocal(ano: number, mes: number, dia: number, hora: number, minuto: number, fuso: string): Date {
  const alvo = Date.UTC(ano, mes - 1, dia, hora, minuto);
  let t = alvo;
  for (let i = 0; i < 2; i++) {
    const p = partes(new Date(t), fuso);
    t += alvo - Date.UTC(p.ano, p.mes - 1, p.dia, p.hora, p.minuto);
  }
  return new Date(t);
}

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
/** "sexta, 14/11 às 10h" in the company's time zone. */
export function textoHorario(d: Date, fuso: string): string {
  const p = partes(d, fuso);
  return `${DIAS[p.semana]}, ${String(p.dia).padStart(2, '0')}/${String(p.mes).padStart(2, '0')} às ${p.hora}h${p.minuto ? String(p.minuto).padStart(2, '0') : ''}`;
}

/** Value for <input type="datetime-local"> in the company's time zone, and back. */
export function paraCampoLocal(d: Date, fuso: string): string {
  const p = partes(d, fuso);
  const z2 = (n: number) => String(n).padStart(2, '0');
  return `${p.ano}-${z2(p.mes)}-${z2(p.dia)}T${z2(p.hora)}:${z2(p.minuto)}`;
}
export function deCampoLocal(v: string, fuso: string): Date | null {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  return m ? instanteLocal(+m[1], +m[2], +m[3], +m[4], +m[5], fuso) : null;
}

/* ---------- Free times ---------- */

export interface Horario {
  /** Stable id the assistant sends back (ISO instant). */
  id: string;
  inicio: Date;
  texto: string;
}

/** Free start times in the next days, at most `max`, spread over different days first. */
export async function horariosLivres(empresa: Empresa, max = 6, agora = new Date(), db?: Db): Promise<Horario[]> {
  const a = empresa.config.agenda;
  const fuso = empresa.config.regras.fuso;
  if (!a.ativa || !a.dias.length) return [];
  const desde = new Date(agora.getTime() + a.antecedencia_horas * 3_600_000);
  const ate = new Date(agora.getTime() + a.janela_dias * 86_400_000);
  const ocupadas = await q<{ inicio: Date; fim: Date }>(`select inicio, fim from visitas where empresa_id = $1 and estado = any($2) and fim > $3 and inicio < $4`, [empresa.id, ATIVAS, desde, ate], db);
  const porDia: Horario[][] = [];
  const hoje = partes(agora, fuso);
  for (let d = 0; d <= a.janela_dias; d++) {
    const base = new Date(Date.UTC(hoje.ano, hoje.mes - 1, hoje.dia + d));
    const dataLocal = base.toISOString().slice(0, 10);
    const semana = base.getUTCDay();
    if (!a.dias.includes(semana) || a.bloqueios.some((b) => dataLocal >= b.de && dataLocal <= b.ate)) continue;
    const horas = a.por_dia[String(semana)] ?? { inicio: a.hora_inicio, fim: a.hora_fim };
    const dia: Horario[] = [];
    for (let min = horas.inicio * 60; min + a.duracao_min <= horas.fim * 60; min += a.duracao_min) {
      const inicio = instanteLocal(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate(), Math.floor(min / 60), min % 60, fuso);
      const fim = new Date(inicio.getTime() + a.duracao_min * 60_000);
      if (inicio < desde || inicio > ate) continue;
      const usadas = ocupadas.filter((o) => o.inicio < fim && o.fim > inicio).length;
      if (usadas < a.capacidade) dia.push({ id: inicio.toISOString(), inicio, texto: textoHorario(inicio, fuso) });
    }
    if (dia.length) porDia.push(dia);
  }
  // A morning and an afternoon option on the first days, before more times of the same day.
  const escolhidos: Horario[] = [];
  for (let rodada = 0; escolhidos.length < max && porDia.some((d) => d.length); rodada++) {
    for (const d of porDia) {
      if (escolhidos.length >= max) break;
      const h = rodada % 2 === 0 ? d.shift() : d.splice(Math.floor(d.length / 2), 1)[0];
      if (h) escolhidos.push(h);
    }
  }
  return escolhidos.sort((x, y) => x.inicio.getTime() - y.inicio.getTime());
}

/* ---------- Booking ---------- */

const celular = (tel: string) => /^55[1-9]\d9\d{8}$/.test(tel);
/** The question the system itself adds after the assistant books a visit on WhatsApp (never left to the model's wording). */
export const PERGUNTA_LEMBRETE = 'Quer que eu te mande um lembrete por aqui um dia antes da visita? Responda SIM. Para não receber mensagens, responda SAIR.';
/** Recorded consents: version 1 = the customer answered yes on WhatsApp; version 2 = the customer asked a team member. */
export const TEXTO_ACEITE_LEMBRETE_WHATSAPP = (empresa: string, quando: string, resposta: string) =>
  `Pelo WhatsApp da ${empresa}, à pergunta "${PERGUNTA_LEMBRETE}", respondeu "${resposta.slice(0, 60)}": aceitou receber o lembrete da visita de ${quando}.`;
export const TEXTO_ACEITE_LEMBRETE_EQUIPE = (empresa: string, quando: string, quem: string) =>
  `Pediu à equipe da ${empresa} o lembrete pelo WhatsApp da visita de ${quando} (registrado por ${quem}).`;

interface NovaVisita {
  oportunidadeId: string;
  inicio: Date;
  responsavelId?: string | null;
  endereco?: string;
  observacao?: string;
  origem: 'usuario' | 'ia';
  criadoPor?: string | null;
  /** The customer asked a team member for the WhatsApp reminder (name of who recorded it). */
  aceiteLembreteEquipe?: string | null;
  /** Assistant bookings must fit the free times; a person may book any time. */
  checarLivre: boolean;
}

/** Books a visit inside the caller's transaction. Returns the visit id and its text. */
export async function marcarVisita(db: Db, empresa: Empresa, v: NovaVisita): Promise<{ id: string; texto: string; lembrete: boolean }> {
  const a = empresa.config.agenda;
  const fuso = empresa.config.regras.fuso;
  await db.query('select pg_advisory_xact_lock(hashtext($1))', [`agenda:${empresa.id}`]);
  const o = await um<{ id: string; contato_id: string; etapa: Etapa; responsavel_id: string | null; nome: string; telefone: string }>(
    `select o.id, o.contato_id, o.etapa, o.responsavel_id, c.nome, c.telefone from oportunidades o join contatos c on c.id = o.contato_id where o.empresa_id = $1 and o.id = $2`,
    [empresa.id, v.oportunidadeId],
    db,
  );
  if (!o) throw new NaoEncontrado('Oportunidade não encontrada.');
  if (o.etapa === 'ganho' || o.etapa === 'perdido') throw new ErroDeUso('A oportunidade já está encerrada.');
  if (Number.isNaN(v.inicio.getTime()) || v.inicio.getTime() < Date.now() - 5 * 60_000) throw new ErroDeUso('Escolha um horário no futuro.');
  if (v.checarLivre && !(await horariosLivres(empresa, 1000, new Date(), db)).some((h) => h.inicio.getTime() === v.inicio.getTime())) {
    throw new ErroDeUso('Esse horário não está mais livre.');
  }
  if (await um(`select 1 from visitas where empresa_id = $1 and oportunidade_id = $2 and estado = any($3) and inicio > now()`, [empresa.id, o.id, ATIVAS], db)) {
    throw new ErroDeUso('Esta oportunidade já tem uma visita marcada. Remarque a que existe.');
  }
  if (v.origem === 'ia') {
    // The public chat cannot fill the calendar: one booking per contact at a time and a daily cap per company.
    if (await um(`select 1 from visitas where empresa_id = $1 and contato_id = $2 and estado = any($3) and inicio > now()`, [empresa.id, o.contato_id, ATIVAS], db)) throw new ErroDeUso('Este cliente já tem uma visita marcada.');
    const hoje = await um<{ n: number }>(`select count(*)::int as n from visitas where empresa_id = $1 and origem = 'ia' and criado_em > now() - interval '24 hours'`, [empresa.id], db);
    if ((hoje?.n ?? 0) >= MAX_VISITAS_IA_DIA) throw new ErroDeUso('Limite de visitas marcadas pela assistente hoje.');
  }
  const responsavel = v.responsavelId && (await membroAtivo(db, empresa.id, v.responsavelId)) ? v.responsavelId : o.responsavel_id;
  const fim = new Date(v.inicio.getTime() + a.duracao_min * 60_000);
  const texto = textoHorario(v.inicio, fuso);
  const r = (await um<{ id: string }>(
    `insert into visitas (empresa_id, oportunidade_id, contato_id, responsavel_id, inicio, fim, endereco, observacao, origem, criado_por) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning id`,
    [empresa.id, o.id, o.contato_id, responsavel, v.inicio, fim, (v.endereco ?? '').trim().slice(0, 300), (v.observacao ?? '').trim().slice(0, 500), v.origem, v.criadoPor ?? null],
    db,
  ))!;
  await q(`update oportunidades set interesse_visita = $3, ultima_interacao_em = now() where empresa_id = $1 and id = $2`, [empresa.id, o.id, `Visita marcada: ${texto}`], db);
  const lembrete = vaiTerLembrete(empresa, v.inicio);
  if (v.aceiteLembreteEquipe && lembrete && celular(o.telefone)) {
    await q(`insert into consentimentos (empresa_id, contato_id, canal, texto, origem, versao) values ($1, $2, 'whatsapp', $3, 'agenda', 2)`, [empresa.id, o.contato_id, TEXTO_ACEITE_LEMBRETE_EQUIPE(empresa.nome, texto, v.aceiteLembreteEquipe)], db);
  }
  await agendarLembrete(db, empresa, r.id, o.id, v.inicio);
  await registrar(db, empresa.id, { oportunidadeId: o.id, contatoId: o.contato_id, ator: v.origem === 'ia' ? { tipo: 'ia' } : { tipo: 'usuario', id: v.criadoPor ?? undefined }, tipo: 'visita_marcada', dados: { quando: texto, origem: v.origem } });
  if (v.origem === 'ia') {
    // The assistant only books the slot: a person confirms the address and the visit.
    const prazo = new Date(Math.min(Date.now() + empresa.config.regras.sla_minutos * 60_000, v.inicio.getTime() - 2 * 3_600_000));
    await criarTarefa(db, empresa.id, { oportunidadeId: o.id, tipo: 'confirmar_visita', titulo: `Confirmar a visita de ${texto}: ${o.nome || formatarTelefone(o.telefone)}`, detalhe: 'Marcada pela assistente. Confirme o endereço com o cliente e marque a visita como confirmada na agenda.', prazo: prazo > new Date() ? prazo : new Date(), responsavelId: responsavel, chave: `visita-ia:${r.id}` });
  } else if (responsavel && responsavel !== v.criadoPor) {
    await q('insert into notificacoes (empresa_id, user_id, titulo, corpo, link) values ($1, $2, $3, $4, $5)', [empresa.id, responsavel, `Visita marcada para você: ${texto}`, o.nome, '/painel/agenda'], db);
  }
  await dispararFluxos(db, empresa.id, { tipo: 'visita_marcada' }, { id: o.id, contatoId: o.contato_id, etapa: o.etapa });
  return { id: r.id, texto, lembrete };
}

/** Booked less than about a day ahead there is no reminder: the booking message itself is the reminder. */
export const vaiTerLembrete = (empresa: Empresa, inicio: Date) => empresa.config.agenda.lembrete && inicio.getTime() - 24 * 3_600_000 >= Date.now() + 30 * 60_000;

async function agendarLembrete(db: Db, empresa: Empresa, visitaId: string, oportunidadeId: string, inicio: Date) {
  if (!vaiTerLembrete(empresa, inicio)) return;
  const em = new Date(inicio.getTime() - 24 * 3_600_000);
  await agendar(db, empresa.id, { tipo: 'lembrete_visita', chave: `lembrete-visita:${visitaId}:${inicio.toISOString()}`, oportunidadeId, em, dados: { visita: visitaId, inicio: inicio.toISOString() } });
}

/** Text of the reminder (the visit must still be on and at the same time; checked by the job). */
export function textoLembrete(empresa: Empresa, nome: string, inicio: Date): string {
  return `Oi${nome ? `, ${nome}` : ''}! Lembrete da ${empresa.nome}: sua visita está marcada para ${textoHorario(inicio, empresa.config.regras.fuso)}. Se precisar remarcar, é só responder aqui. Para não receber mensagens, responda SAIR.`;
}

/* ---------- Team actions ---------- */

const EntradaVisita = z.object({
  oportunidadeId: z.uuid(),
  inicio: z.string(),
  responsavelId: z.string().max(64).optional(),
  endereco: z.string().max(300).optional(),
  observacao: z.string().max(500).optional(),
  aceiteLembrete: z.boolean(),
});


export async function marcarVisitaManual(ctx: Ctx, entrada: z.input<typeof EntradaVisita>): Promise<string> {
  const e = EntradaVisita.parse(entrada);
  const empresa = (await empresaPorId(ctx.empresaId))!;
  const inicio = deCampoLocal(e.inicio, empresa.config.regras.fuso);
  if (!inicio) throw new ErroDeUso('Escolha o dia e o horário da visita.');
  const { aceiteLembrete, ...resto } = e;
  return tx(async (db) => (await marcarVisita(db, empresa, { ...resto, inicio, origem: 'usuario', criadoPor: ctx.userId, checarLivre: false, aceiteLembreteEquipe: aceiteLembrete ? ctx.nome : null })).texto);
}

type AtorEvento = Parameters<typeof registrar>[2]['ator'];

/** Cancels inside the caller's transaction: the reminder and the assistant's "confirm" task go too. */
async function cancelarNoBanco(db: Db, empresaId: string, id: string, quem: AtorEvento) {
  const v = await um<{ oportunidade_id: string; contato_id: string; estado: EstadoVisita }>('select oportunidade_id, contato_id, estado from visitas where empresa_id = $1 and id = $2 for update', [empresaId, id], db);
  if (!v) throw new NaoEncontrado('Visita não encontrada.');
  if (v.estado === 'cancelada') throw new ErroDeUso('Esta visita foi cancelada.');
  await q(`update visitas set estado = 'cancelada', atualizado_em = now() where empresa_id = $1 and id = $2`, [empresaId, id], db);
  await q(`update tarefas set concluida_em = now() where empresa_id = $1 and chave = $2 and concluida_em is null`, [empresaId, `visita-ia:${id}`], db);
  await q(`update trabalhos set estado = 'cancelado', resultado = 'Visita cancelada.', concluido_em = now() where empresa_id = $1 and tipo = 'lembrete_visita' and estado = 'pendente' and dados ->> 'visita' = $2`, [empresaId, id], db);
  await registrar(db, empresaId, { oportunidadeId: v.oportunidade_id, contatoId: v.contato_id, ator: quem, tipo: 'visita_alterada', dados: { estado: 'cancelada' } });
  return v;
}

/** Moves a visit inside the caller's transaction (calendar locked); the reminder follows the new time. */
async function remarcarNoBanco(db: Db, empresa: Empresa, id: string, inicio: Date, quem: AtorEvento, checarLivre: boolean) {
  await db.query('select pg_advisory_xact_lock(hashtext($1))', [`agenda:${empresa.id}`]);
  const v = await um<{ oportunidade_id: string; contato_id: string; estado: EstadoVisita }>('select oportunidade_id, contato_id, estado from visitas where empresa_id = $1 and id = $2 for update', [empresa.id, id], db);
  if (!v) throw new NaoEncontrado('Visita não encontrada.');
  if (!ATIVAS.includes(v.estado)) throw new ErroDeUso('Só dá para remarcar uma visita marcada ou confirmada.');
  if (checarLivre && !(await horariosLivres(empresa, 1000, new Date(), db)).some((h) => h.inicio.getTime() === inicio.getTime())) throw new ErroDeUso('Esse horário não está mais livre.');
  await q(`update visitas set inicio = $3, fim = $4, estado = 'marcada', atualizado_em = now() where empresa_id = $1 and id = $2`, [empresa.id, id, inicio, new Date(inicio.getTime() + empresa.config.agenda.duracao_min * 60_000)], db);
  await q(`update trabalhos set estado = 'cancelado', resultado = 'Visita remarcada.', concluido_em = now() where empresa_id = $1 and tipo = 'lembrete_visita' and estado = 'pendente' and dados ->> 'visita' = $2`, [empresa.id, id], db);
  await agendarLembrete(db, empresa, id, v.oportunidade_id, inicio);
  const texto = textoHorario(inicio, empresa.config.regras.fuso);
  await registrar(db, empresa.id, { oportunidadeId: v.oportunidade_id, contatoId: v.contato_id, ator: quem, tipo: 'visita_alterada', dados: { estado: 'remarcada', quando: texto } });
  return { ...v, texto };
}

export async function mudarVisita(ctx: Ctx, id: string, acao: 'confirmada' | 'realizada' | 'faltou' | 'cancelada') {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new NaoEncontrado();
  await tx(async (db) => {
    if (acao === 'cancelada') return void (await cancelarNoBanco(db, ctx.empresaId, id, ator(ctx)));
    const v = await um<{ oportunidade_id: string; contato_id: string; estado: EstadoVisita }>('select oportunidade_id, contato_id, estado from visitas where empresa_id = $1 and id = $2 for update', [ctx.empresaId, id], db);
    if (!v) throw new NaoEncontrado('Visita não encontrada.');
    if (v.estado === 'cancelada') throw new ErroDeUso('Esta visita foi cancelada.');
    await q('update visitas set estado = $3, atualizado_em = now() where empresa_id = $1 and id = $2', [ctx.empresaId, id, acao], db);
    await registrar(db, ctx.empresaId, { oportunidadeId: v.oportunidade_id, contatoId: v.contato_id, ator: ator(ctx), tipo: 'visita_alterada', dados: { estado: acao } });
  });
}

export async function remarcarVisita(ctx: Ctx, id: string, novo: string) {
  const empresa = (await empresaPorId(ctx.empresaId))!;
  const inicio = deCampoLocal(novo, empresa.config.regras.fuso);
  if (!inicio || inicio.getTime() < Date.now()) throw new ErroDeUso('Escolha um horário no futuro.');
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new NaoEncontrado();
  await tx((db) => remarcarNoBanco(db, empresa, id, inicio, ator(ctx), false));
}

/* ---------- The customer changes the visit on WhatsApp (through the assistant) ---------- */

/** The contact's next active visit, if any (what the assistant may move or cancel: never another customer's). */
export async function proximaVisitaDoContato(empresa: Empresa, contatoId: string, db?: Db): Promise<{ id: string; texto: string; responsavel_id: string | null; oportunidade_id: string } | null> {
  const v = await um<{ id: string; inicio: Date; responsavel_id: string | null; oportunidade_id: string }>(
    `select id, inicio, responsavel_id, oportunidade_id from visitas where empresa_id = $1 and contato_id = $2 and estado = any($3) and inicio > now() order by inicio limit 1`,
    [empresa.id, contatoId, ATIVAS],
    db,
  );
  return v ? { id: v.id, texto: textoHorario(v.inicio, empresa.config.regras.fuso), responsavel_id: v.responsavel_id, oportunidade_id: v.oportunidade_id } : null;
}

async function avisarEquipe(db: Db, empresaId: string, para: string | null, titulo: string, oportunidadeId: string) {
  await q('insert into notificacoes (empresa_id, user_id, titulo, corpo, link) values ($1, $2, $3, $4, $5)', [empresaId, para, titulo, '', `/painel/oportunidades/${oportunidadeId}`], db);
}

export async function remarcarPeloCliente(db: Db, empresa: Empresa, contatoId: string, inicio: Date): Promise<string> {
  const v = await proximaVisitaDoContato(empresa, contatoId, db);
  if (!v) throw new ErroDeUso('Este cliente não tem visita marcada.');
  const r = await remarcarNoBanco(db, empresa, v.id, inicio, { tipo: 'visitante' }, true);
  await avisarEquipe(db, empresa.id, v.responsavel_id, `Cliente remarcou a visita: ${r.texto}`, v.oportunidade_id);
  return r.texto;
}

export async function cancelarPeloCliente(db: Db, empresa: Empresa, contatoId: string): Promise<string> {
  const v = await proximaVisitaDoContato(empresa, contatoId, db);
  if (!v) throw new ErroDeUso('Este cliente não tem visita marcada.');
  await cancelarNoBanco(db, empresa.id, v.id, { tipo: 'visitante' });
  await avisarEquipe(db, empresa.id, v.responsavel_id, `Cliente cancelou a visita de ${v.texto}`, v.oportunidade_id);
  return v.texto;
}

export interface VisitaLista {
  id: string;
  oportunidade_id: string;
  inicio: Date;
  fim: Date;
  estado: EstadoVisita;
  endereco: string;
  observacao: string;
  origem: 'usuario' | 'ia';
  nome: string;
  telefone: string;
  cidade: string;
  responsavel: string | null;
  responsavel_id: string | null;
  /** Already started (computed by the database, so the screens stay pure). */
  passou: boolean;
}

/** Visits of the company between two instants (sellers see all of the company's, like the opportunities board). */
export async function visitas(ctx: Ctx, de: Date, ate: Date, oportunidadeId?: string): Promise<VisitaLista[]> {
  return q<VisitaLista>(
    `select v.id, v.oportunidade_id, v.inicio, v.fim, v.estado, v.endereco, v.observacao, v.origem, c.nome, c.telefone, c.cidade, u.name as responsavel, v.responsavel_id, v.inicio < now() as passou
     from visitas v join contatos c on c.id = v.contato_id left join "user" u on u.id = v.responsavel_id
     where v.empresa_id = $1 and v.inicio >= $2 and v.inicio < $3 and ($4::uuid is null or v.oportunidade_id = $4)
     order by v.inicio limit 300`,
    [ctx.empresaId, de, ate, oportunidadeId ?? null],
  );
}

/* ---------- Google Calendar (subscription to a private address) ---------- */

export async function criarLinkAgenda(ctx: Ctx): Promise<string> {
  if (ctx.acessoAdmin) throw new ErroDeUso('O acesso da equipe Growlift não cria link de agenda.');
  const token = `ag_${novoToken(24)}`;
  await q(
    `insert into agenda_feeds (user_id, empresa_id, token_hash) values ($1, $2, $3)
     on conflict (user_id) do update set empresa_id = excluded.empresa_id, token_hash = excluded.token_hash, criado_em = now()`,
    [ctx.userId, ctx.empresaId, hashToken(token)],
  );
  return token;
}

export async function temLinkAgenda(ctx: Ctx): Promise<boolean> {
  return !!(await um('select 1 from agenda_feeds where user_id = $1 and empresa_id = $2', [ctx.userId, ctx.empresaId]));
}

const ics = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r\n|\r|\n/g, '\\n');
const dataIcs = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** Calendar file for the private address: admins see the company's visits, sellers their own. Only active members. */
export async function calendarioDoLink(token: string, base: string): Promise<string | null> {
  if (!/^ag_[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const f = await um<{ user_id: string; empresa_id: string; papel: string; empresa: string }>(
    `select f.user_id, f.empresa_id, m.papel, e.nome as empresa from agenda_feeds f
     join membros m on m.user_id = f.user_id and m.empresa_id = f.empresa_id and m.ativo
     join empresas e on e.id = f.empresa_id and e.ativa
     where f.token_hash = $1`,
    [hashToken(token)],
  );
  if (!f) return null;
  const vs = await q<{ id: string; inicio: Date; fim: Date; estado: EstadoVisita; endereco: string; nome: string; oportunidade_id: string; atualizado_em: Date }>(
    `select v.id, v.inicio, v.fim, v.estado, v.endereco, c.nome, v.oportunidade_id, v.atualizado_em from visitas v join contatos c on c.id = v.contato_id
     where v.empresa_id = $1 and v.inicio > now() - interval '30 days' and v.inicio < now() + interval '120 days' and ($2 or v.responsavel_id = $3)
     order by v.inicio limit 500`,
    [f.empresa_id, f.papel === 'admin', f.user_id],
  );
  const linhas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Growlift//Comercial//PT', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${ics(`Visitas · ${f.empresa}`)}`];
  for (const v of vs) {
    // Only the first name in the event: the rest stays in the panel.
    const primeiro = (v.nome || 'Cliente').split(/\s+/)[0];
    linhas.push(
      'BEGIN:VEVENT',
      `UID:${v.id}@growlift-comercial`,
      `DTSTAMP:${dataIcs(v.atualizado_em)}`,
      `DTSTART:${dataIcs(v.inicio)}`,
      `DTEND:${dataIcs(v.fim)}`,
      `SUMMARY:${ics(`${v.estado === 'cancelada' ? 'CANCELADA: ' : ''}Visita · ${primeiro}`)}`,
      ...(v.endereco ? [`LOCATION:${ics(v.endereco)}`] : []),
      `DESCRIPTION:${ics(`${NOME_ESTADO_VISITA[v.estado]}. Detalhes no painel: ${base}/painel/oportunidades/${v.oportunidade_id}`)}`,
      `STATUS:${v.estado === 'cancelada' ? 'CANCELLED' : v.estado === 'marcada' ? 'TENTATIVE' : 'CONFIRMED'}`,
      'END:VEVENT',
    );
  }
  linhas.push('END:VCALENDAR');
  return linhas.join('\r\n') + '\r\n';
}

/** "Add to Google Calendar" link for one visit (opens Google with the event filled in; nothing is sent by us). */
export function linkGoogle(v: { inicio: Date; fim: Date; nome: string; endereco: string }, empresa: string): string {
  const p = new URLSearchParams({ action: 'TEMPLATE', text: `Visita · ${(v.nome || 'Cliente').split(/\s+/)[0]} (${empresa})`, dates: `${dataIcs(v.inicio)}/${dataIcs(v.fim)}`, location: v.endereco });
  return `https://calendar.google.com/calendar/render?${p}`;
}

/** "Sim" to the reminder question right after the assistant booked: records the consent (inside the caller's transaction). */
export async function aceitarLembrete(db: Db, empresa: Empresa, visitaId: string, contatoId: string, resposta: string): Promise<boolean> {
  const v = await um<{ inicio: Date; estado: EstadoVisita }>('select inicio, estado from visitas where empresa_id = $1 and id = $2 and contato_id = $3', [empresa.id, visitaId, contatoId], db);
  if (!v || !ATIVAS.includes(v.estado) || !vaiTerLembrete(empresa, v.inicio)) return false;
  await q(`insert into consentimentos (empresa_id, contato_id, canal, texto, origem, versao) values ($1, $2, 'whatsapp', $3, 'agenda', 1)`, [empresa.id, contatoId, TEXTO_ACEITE_LEMBRETE_WHATSAPP(empresa.nome, textoHorario(v.inicio, empresa.config.regras.fuso), resposta.trim())], db);
  return true;
}
