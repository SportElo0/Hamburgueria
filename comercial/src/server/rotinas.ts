import type { ConfigEmpresa } from './config';
import { lerConfig } from './config';
import { q, tx, um } from './db';

/**
 * Routines that run on the clock (every few minutes, with the queue): late tasks go up to the admins,
 * and each person gets a summary of the day in the panel. Internal notices only: nothing is sent to customers.
 */

function horaLocal(fuso: string, d = new Date()): number {
  try {
    return Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: fuso }).format(d));
  } catch {
    return d.getUTCHours();
  }
}
function diaLocal(fuso: string, d = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: fuso }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

async function empresasAtivas() {
  return (await q<{ id: string; config: unknown }>('select id, config from empresas where ativa')).map((e) => ({ id: e.id, config: lerConfig(e.config) as ConfigEmpresa }));
}

/** Open tasks late by more than the company's limit: one notice to the admins per task, ever. */
export async function escalarTarefas(): Promise<number> {
  let n = 0;
  for (const e of await empresasAtivas()) {
    const horas = e.config.regras.escalar_horas;
    if (!horas) continue;
    n += await tx(async (db) => {
      const lista = await q<{ id: string; titulo: string; oportunidade_id: string | null; conversa_id: string | null; responsavel: string | null; prazo: Date }>(
        `update tarefas t set escalada_em = now()
         from (select id from tarefas where empresa_id = $1 and concluida_em is null and escalada_em is null and prazo < now() - make_interval(hours => $2)
               order by prazo limit 100 for update skip locked) alvo
         where t.id = alvo.id
         returning t.id, t.titulo, t.oportunidade_id, t.conversa_id, (select name from "user" u where u.id = t.responsavel_id) as responsavel, t.prazo`,
        [e.id, horas],
        db,
      );
      for (const t of lista) {
        const link = t.conversa_id ? `/painel/atendimento/${t.conversa_id}` : t.oportunidade_id ? `/painel/oportunidades/${t.oportunidade_id}` : '/painel/tarefas?estado=vencidas&de=todas';
        // No recipient = the company admins (see notificacoes in oportunidades.ts).
        await q('insert into notificacoes (empresa_id, user_id, titulo, corpo, link) values ($1, null, $2, $3, $4)', [
          e.id,
          `Tarefa vencida há mais de ${horas} h: ${t.titulo}`.slice(0, 200),
          `${t.responsavel ? `Responsável: ${t.responsavel}` : 'Sem responsável'}.`,
          link,
        ], db);
      }
      return lista.length;
    });
  }
  return n;
}

interface Numeros { novos: number; hoje: number; vencidas: number; fila: number }

/** Once a day per company, at or after the chosen local hour: a notice per active member (and the whole company for admins). */
export async function enviarResumos(agora = new Date()): Promise<number> {
  let n = 0;
  for (const e of await empresasAtivas()) {
    const r = e.config.regras;
    if (!r.resumo_diario || horaLocal(r.fuso, agora) < r.resumo_hora) continue;
    const dia = diaLocal(r.fuso, agora);
    n += await tx(async (db) => {
      const meu = await um('insert into resumos_diarios (empresa_id, dia) values ($1, $2) on conflict do nothing returning dia', [e.id, dia], db);
      if (!meu) return 0;
      const membros = await q<{ user_id: string; papel: 'admin' | 'vendedor' }>('select user_id, papel from membros where empresa_id = $1 and ativo', [e.id], db);
      const contar = async (filtro: string, p: unknown[]) =>
        (await um<Numeros>(
          `select
             (select count(*)::int from oportunidades o where o.empresa_id = $1 and o.entrada_em > now() - interval '24 hours' ${filtro.replace(/X\./g, 'o.')}) as novos,
             (select count(*)::int from tarefas t where t.empresa_id = $1 and t.concluida_em is null and (t.prazo at time zone $2)::date = (now() at time zone $2)::date and t.prazo >= now() ${filtro.replace(/X\./g, 't.')}) as hoje,
             (select count(*)::int from tarefas t where t.empresa_id = $1 and t.concluida_em is null and t.prazo < now() ${filtro.replace(/X\./g, 't.')}) as vencidas,
             (select count(*)::int from oportunidades o where o.empresa_id = $1 and o.responsavel_id is null and o.etapa not in ('ganho', 'perdido')) as fila`,
          [e.id, r.fuso, ...p],
          db,
        ))!;
      let enviados = 0;
      for (const m of membros) {
        const x = m.papel === 'admin' ? await contar('', []) : await contar('and X.responsavel_id = $3', [m.user_id]);
        if (!x.novos && !x.hoje && !x.vencidas && !(m.papel === 'admin' && x.fila)) continue;
        const partes = [
          `${x.novos} pedido(s) novo(s) nas últimas 24 h`,
          `${x.hoje} tarefa(s) para hoje`,
          `${x.vencidas} vencida(s)`,
          ...(m.papel === 'admin' ? [`${x.fila} oportunidade(s) sem responsável`] : []),
        ];
        await q('insert into notificacoes (empresa_id, user_id, titulo, corpo, link) values ($1, $2, $3, $4, $5)', [
          e.id,
          m.user_id,
          m.papel === 'admin' ? 'Resumo do dia da empresa' : 'Seu resumo do dia',
          `${partes.join(' · ')}.`,
          x.vencidas ? `/painel/tarefas?estado=vencidas&de=${m.papel === 'admin' ? 'todas' : 'minhas'}` : '/painel/tarefas',
        ], db);
        enviados++;
      }
      return enviados;
    });
  }
  return n;
}
