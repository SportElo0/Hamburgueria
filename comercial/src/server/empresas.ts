import { z } from 'zod';
import { criarUsuario } from './auth';
import { ConfigEmpresa, SEGMENTOS, lerConfig } from './config';
import { ator, exigirAdmin, registrar, type Ctx } from './contexto';
import { pool, q, tx, um, type Db } from './db';
import { ErroDeUso, NaoAutorizado, NaoEncontrado } from './erros';
import { enviarEmail, type ResultadoEmail } from './email';
import { hashToken, novoToken } from './segredos';

export interface Empresa {
  id: string;
  nome: string;
  slug: string;
  segmento: string;
  chave_publica: string;
  demonstracao: boolean;
  ativa: boolean;
  config: ConfigEmpresa;
  responsavel_padrao: string | null;
}

type Linha = Omit<Empresa, 'config'> & { config: unknown };
const montar = (l: Linha | null): Empresa | null => (l ? { ...l, config: lerConfig(l.config) } : null);

export const empresaPorId = async (id: string, db?: Db) => montar(await um<Linha>('select * from empresas where id = $1', [id], db));
/** Public pages and forms find the company by its slug or public key; nothing else from the browser is trusted. */
export const empresaPorSlug = async (slug: string) => montar(await um<Linha>('select * from empresas where slug = $1 and ativa', [slug]));
export const empresaPorChave = async (chave: string) => montar(await um<Linha>('select * from empresas where chave_publica = $1 and ativa', [chave]));

export async function ehAdminPlataforma(userId: string): Promise<boolean> {
  return !!(await um('select 1 from admins_plataforma where user_id = $1', [userId]));
}
async function exigirPlataforma(userId: string) {
  if (!(await ehAdminPlataforma(userId))) throw new NaoAutorizado('Só a equipe Growlift pode fazer isso.');
}

const NovaEmpresa = z.object({
  nome: z.string().trim().min(2).max(80),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{3,40}$/, 'Use de 3 a 40 letras minúsculas, números ou hífen.'),
  segmento: z.string().refine((s) => s in SEGMENTOS, 'Segmento desconhecido.'),
  demonstracao: z.boolean().default(false),
});

/** A new company starts from the segment's preset: its own form fields, empty knowledge, no data from anyone else. */
export async function criarEmpresa(adminUserId: string, entrada: z.input<typeof NovaEmpresa>): Promise<Empresa> {
  await exigirPlataforma(adminUserId);
  const e = NovaEmpresa.parse(entrada);
  if (await um('select 1 from empresas where slug = $1', [e.slug])) throw new ErroDeUso('Já existe uma empresa com este endereço.');
  const config = ConfigEmpresa.parse({ campos: SEGMENTOS[e.segmento].campos });
  return tx(async (db) => {
    const l = await um<Linha>(
      `insert into empresas (nome, slug, segmento, chave_publica, demonstracao, config) values ($1, $2, $3, $4, $5, $6) returning *`,
      [e.nome, e.slug, e.segmento, `pk_${novoToken(18)}`, e.demonstracao, JSON.stringify(config)],
      db,
    );
    await q(`insert into conhecimento (empresa_id, versao, dados, criado_por) values ($1, 1, '{}', $2)`, [l!.id, adminUserId], db);
    await registrar(db, l!.id, { ator: { tipo: 'admin_growlift', id: adminUserId }, tipo: 'empresa_criada', dados: { segmento: e.segmento } });
    return montar(l)!;
  });
}

/** What the Growlift admin sees without entering a company: names and the health of integrations, no customer data. */
export async function painelPlataforma(adminUserId: string) {
  await exigirPlataforma(adminUserId);
  return q<{ id: string; nome: string; slug: string; segmento: string; demonstracao: boolean; ativa: boolean; membros: number; whatsapp: string | null; trabalhos_falhos: number; trabalhos_incertos: number; mensagens_falhas: number; ia_respostas_mes: number; ia_falhas_mes: number }>(
    `select e.id, e.nome, e.slug, e.segmento, e.demonstracao, e.ativa,
       (select count(*)::int from membros m where m.empresa_id = e.id and m.ativo) as membros,
       (select i.config ->> 'modo' from integracoes i where i.empresa_id = e.id and i.tipo = 'whatsapp') as whatsapp,
       (select count(*)::int from trabalhos t where t.empresa_id = e.id and t.estado = 'falhou' and t.criado_em > now() - interval '7 days') as trabalhos_falhos,
       (select count(*)::int from trabalhos t where t.empresa_id = e.id and t.estado = 'incerto' and t.criado_em > now() - interval '7 days') as trabalhos_incertos,
       (select count(*)::int from mensagens m where m.empresa_id = e.id and m.estado in ('falhou', 'incerta') and m.criado_em > now() - interval '7 days') as mensagens_falhas,
       coalesce((select u.respostas from uso_ia u where u.empresa_id = e.id and u.mes = date_trunc('month', now())::date), 0) as ia_respostas_mes,
       coalesce((select u.falhas from uso_ia u where u.empresa_id = e.id and u.mes = date_trunc('month', now())::date), 0) as ia_falhas_mes
     from empresas e order by e.nome`,
  );
}

/** Entering a company's data is explicit: it needs a reason, expires in one hour and is written to that company's history. */
export async function abrirAcessoAdmin(adminUserId: string, empresaId: string, motivo: string): Promise<string> {
  await exigirPlataforma(adminUserId);
  const m = motivo.trim();
  if (m.length < 5) throw new ErroDeUso('Escreva o motivo do acesso (pelo menos 5 letras).');
  if (await um('select 1 from membros where user_id = $1', [adminUserId])) throw new ErroDeUso('Este login já pertence a uma empresa.');
  return tx(async (db) => {
    if (!(await um('select 1 from empresas where id = $1', [empresaId], db))) throw new NaoEncontrado();
    await q('update acessos_admin set fim = now() where user_id = $1 and fim > now()', [adminUserId], db);
    const a = await um<{ id: string }>(`insert into acessos_admin (user_id, empresa_id, motivo, fim) values ($1, $2, $3, now() + interval '1 hour') returning id`, [adminUserId, empresaId, m], db);
    await registrar(db, empresaId, { ator: { tipo: 'admin_growlift', id: adminUserId }, tipo: 'acesso_admin_growlift', dados: { motivo: m } });
    return a!.id;
  });
}
export async function encerrarAcessoAdmin(adminUserId: string) {
  await q('update acessos_admin set fim = now() where user_id = $1 and fim > now()', [adminUserId]);
}
export async function definirAtiva(adminUserId: string, empresaId: string, ativa: boolean) {
  await exigirPlataforma(adminUserId);
  await q('update empresas set ativa = $2 where id = $1', [empresaId, ativa]);
  await registrar(pool(), empresaId, { ator: { tipo: 'admin_growlift', id: adminUserId }, tipo: ativa ? 'empresa_reativada' : 'empresa_suspensa' });
}

/* ---------- Team ---------- */

export interface Membro {
  user_id: string;
  nome: string;
  email: string;
  papel: 'admin' | 'vendedor';
  ativo: boolean;
}

export async function equipe(ctx: Ctx, db?: Db): Promise<Membro[]> {
  return q<Membro>(
    `select m.user_id, u.name as nome, u.email, m.papel, m.ativo from membros m join "user" u on u.id = m.user_id
     where m.empresa_id = $1 order by m.ativo desc, u.name`,
    [ctx.empresaId],
    db,
  );
}

export async function membroAtivo(db: Db, empresaId: string, userId: string): Promise<boolean> {
  return !!(await um('select 1 from membros where empresa_id = $1 and user_id = $2 and ativo', [empresaId, userId], db));
}

const Convite = z.object({ email: z.email('E-mail inválido.').trim().toLowerCase(), papel: z.enum(['admin', 'vendedor']) });

/** Invites someone to the company. The link is shown once to the admin (and stored as a simulated e-mail). */
export async function convidar(ctx: Ctx, entrada: z.input<typeof Convite>): Promise<{ link: string; email: ResultadoEmail }> {
  exigirAdmin(ctx);
  const c = Convite.parse(entrada);
  if (await um('select 1 from "user" where email = $1', [c.email])) throw new ErroDeUso('Este e-mail já tem login na plataforma.');
  const hoje = await um<{ n: number }>(`select count(*)::int as n from eventos where empresa_id = $1 and tipo = 'convite_criado' and criado_em > now() - interval '1 day'`, [ctx.empresaId]);
  if ((hoje?.n ?? 0) >= 20) throw new ErroDeUso('Limite de 20 convites por dia nesta empresa. Tente de novo amanhã.');
  const token = novoToken();
  const link = `${process.env.APP_URL ?? ''}/convite/${token}`;
  await tx(async (db) => {
    await q('delete from convites where empresa_id = $1 and email = $2 and aceito_em is null', [ctx.empresaId, c.email], db);
    await q(`insert into convites (empresa_id, email, papel, token_hash, expira_em, criado_por) values ($1, $2, $3, $4, now() + interval '7 days', $5)`, [ctx.empresaId, c.email, c.papel, hashToken(token), ctx.userId], db);
    await registrar(db, ctx.empresaId, { ator: ator(ctx), tipo: 'convite_criado', dados: { papel: c.papel } });
  });
  const empresa = (await um<{ nome: string }>('select nome from empresas where id = $1', [ctx.empresaId]))?.nome ?? 'a empresa';
  const email = await enviarEmail({
    para: c.email,
    assunto: `Convite para a equipe da ${empresa} · Growlift Comercial`,
    link,
    texto: `Você foi convidado para a equipe da ${empresa} no Growlift Comercial.\n\nPara criar seu acesso, abra: ${link}\n\nO convite vale por 7 dias. Se você não esperava este convite, ignore este e-mail.`,
  });
  return { link, email };
}

export async function conviteValido(token: string) {
  return um<{ id: string; email: string; papel: 'admin' | 'vendedor'; empresa_id: string; empresa: string }>(
    `select c.id, c.email, c.papel, c.empresa_id, e.nome as empresa from convites c join empresas e on e.id = c.empresa_id
     where c.token_hash = $1 and c.aceito_em is null and c.expira_em > now() and e.ativa`,
    [hashToken(token)],
  );
}

export async function aceitarConvite(token: string, nome: string, senha: string): Promise<{ email: string }> {
  const c = await conviteValido(token);
  if (!c) throw new ErroDeUso('Convite inválido ou vencido. Peça um novo ao administrador.');
  if (nome.trim().length < 2) throw new ErroDeUso('Escreva seu nome.');
  if (senha.length < 10) throw new ErroDeUso('A senha precisa de pelo menos 10 caracteres.');
  // Claim the invitation first, so two requests with the same link cannot both create a login.
  const meu = await um('update convites set aceito_em = now() where id = $1 and aceito_em is null returning id', [c.id]);
  if (!meu) throw new ErroDeUso('Este convite já foi usado.');
  try {
    const userId = await criarUsuario(c.email, nome, senha);
    await q('insert into membros (user_id, empresa_id, papel) values ($1, $2, $3)', [userId, c.empresa_id, c.papel]);
    await registrar(pool(), c.empresa_id, { ator: { tipo: 'usuario', id: userId }, tipo: 'convite_aceito', dados: { papel: c.papel } });
  } catch (err) {
    await q('update convites set aceito_em = null where id = $1', [c.id]);
    throw err;
  }
  return { email: c.email };
}

export async function alterarMembro(ctx: Ctx, userId: string, mudanca: { papel?: 'admin' | 'vendedor'; ativo?: boolean }) {
  exigirAdmin(ctx);
  await tx(async (db) => {
    const m = await um<{ papel: string; ativo: boolean }>('select papel, ativo from membros where empresa_id = $1 and user_id = $2 for update', [ctx.empresaId, userId], db);
    if (!m) throw new NaoEncontrado('Pessoa não encontrada na equipe.');
    const papel = mudanca.papel ?? m.papel;
    const ativo = mudanca.ativo ?? m.ativo;
    const outrosAdmins = await um<{ n: number }>(`select count(*)::int as n from membros where empresa_id = $1 and papel = 'admin' and ativo and user_id <> $2`, [ctx.empresaId, userId], db);
    if ((papel !== 'admin' || !ativo) && m.papel === 'admin' && (outrosAdmins?.n ?? 0) === 0) throw new ErroDeUso('A empresa precisa de pelo menos um administrador ativo.');
    await q('update membros set papel = $3, ativo = $4 where empresa_id = $1 and user_id = $2', [ctx.empresaId, userId, papel, ativo], db);
    // Who leaves the team loses the private calendar address for good (it does not come back if reactivated).
    if (!ativo) await q('delete from agenda_feeds where user_id = $1 and empresa_id = $2', [userId, ctx.empresaId], db);
    if (!ativo) {
      // Someone who left keeps no session, no default assignment.
      await q('delete from session where "userId" = $1', [userId], db);
      await q('update empresas set responsavel_padrao = null where id = $1 and responsavel_padrao = $2', [ctx.empresaId, userId], db);
    }
    await registrar(db, ctx.empresaId, { ator: ator(ctx), tipo: 'membro_alterado', dados: { membro: userId, papel, ativo } });
  });
}

export async function definirResponsavelPadrao(ctx: Ctx, userId: string | null) {
  exigirAdmin(ctx);
  await tx(async (db) => {
    if (userId && !(await membroAtivo(db, ctx.empresaId, userId))) throw new ErroDeUso('Escolha alguém ativo da equipe.');
    await q('update empresas set responsavel_padrao = $2 where id = $1', [ctx.empresaId, userId], db);
    await registrar(db, ctx.empresaId, { ator: ator(ctx), tipo: 'responsavel_padrao_alterado', dados: { responsavel: userId } });
  });
}

/** Saves one section of the company settings (validated as a whole) and records which section changed. */
export async function salvarConfig<K extends keyof ConfigEmpresa>(ctx: Ctx, secao: K, valor: unknown) {
  exigirAdmin(ctx);
  await tx(async (db) => {
    const l = await um<{ config: unknown }>('select config from empresas where id = $1 for update', [ctx.empresaId], db);
    const r = ConfigEmpresa.safeParse({ ...lerConfig(l?.config), [secao]: valor });
    if (!r.success) throw new ErroDeUso(`Não foi possível salvar: ${r.error.issues[0]?.message ?? 'valor inválido'}`);
    await q('update empresas set config = $2 where id = $1', [ctx.empresaId, JSON.stringify(r.data)], db);
    await registrar(db, ctx.empresaId, { ator: ator(ctx), tipo: 'config_alterada', dados: { secao } });
  });
}
