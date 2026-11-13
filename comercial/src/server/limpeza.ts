import { registrar, type Ctx } from './contexto';
import { pool, q, tx, um, type Db } from './db';
import { apagarContato } from './oportunidades';

/**
 * Data retention. Once a day: contacts that never became customers and had no interaction for the company's
 * retention period are deleted (with their conversations, consents, calls, visits and history), plus technical
 * leftovers. Customers (an opportunity won) are kept: their records may be needed for the service and the law.
 */

/** Contacts of a company that the retention rule would delete now. */
function sqlVencidos(limite: number) {
  return `
    select c.id from contatos c
    where c.empresa_id = $1
      and not exists (select 1 from oportunidades o where o.contato_id = c.id and o.etapa = 'ganho')
      and not exists (select 1 from visitas v where v.contato_id = c.id and v.estado in ('marcada', 'confirmada') and v.inicio > now())
      and greatest(
        c.criado_em,
        coalesce((select max(o.ultima_interacao_em) from oportunidades o where o.contato_id = c.id), c.criado_em),
        coalesce((select max(v.atualizado_em) from conversas v where v.contato_id = c.id), c.criado_em),
        coalesce((select max(l.recebida_em) from ligacoes l where l.contato_id = c.id), c.criado_em)
      ) < now() - make_interval(months => $2)
    order by c.criado_em
    limit ${limite}`;
}

export async function quantosVencidos(ctx: Ctx, meses: number): Promise<number> {
  if (meses <= 0) return 0;
  return (await q(sqlVencidos(10_000), [ctx.empresaId, meses])).length;
}

/** Runs at most once every 20 hours, whoever calls it (embedded queue every few minutes, scheduler once a day). */
export async function limparDadosAntigos(forcar = false): Promise<number> {
  const vez = await um<{ nome: string }>(
    `insert into rotinas_execucao (nome, em) values ('limpeza', now())
     on conflict (nome) do update set em = now() where rotinas_execucao.em < now() - interval '20 hours' or $1
     returning nome`,
    [forcar],
  );
  if (!vez) return 0;
  let total = 0;
  const empresas = await q<{ id: string; meses: number }>(
    `select id, coalesce((config -> 'dados' ->> 'guarda_meses')::int, 24) as meses from empresas where ativa`,
  );
  for (const e of empresas) {
    if (e.meses <= 0) continue;
    const n = await tx(async (db: Db) => {
      const ids = await q<{ id: string }>(sqlVencidos(500), [e.id, e.meses], db);
      for (const c of ids) await apagarContato(db, e.id, c.id);
      // Only the count goes to the history: nothing about the people deleted.
      if (ids.length) await registrar(db, e.id, { ator: { tipo: 'sistema' }, tipo: 'limpeza_automatica', dados: { contatos: ids.length, meses: e.meses } });
      return ids.length;
    });
    total += n;
  }
  // Technical leftovers.
  const p = pool();
  await q(`delete from limites where janela < now() - interval '1 day'`, [], p);
  await q(`delete from eventos_webhook where recebido_em < now() - interval '30 days'`, [], p);
  await q(`delete from emails_simulados where criado_em < now() - interval '1 day'`, [], p);
  await q(`delete from trabalhos where estado in ('concluido', 'cancelado', 'falhou') and coalesce(concluido_em, criado_em) < now() - interval '180 days'`, [], p);
  await q(`delete from notificacoes where lida_em is not null and lida_em < now() - interval '180 days'`, [], p);
  return total;
}
