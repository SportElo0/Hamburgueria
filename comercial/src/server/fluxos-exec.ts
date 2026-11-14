import { criarTarefa, registrar } from './contexto';
import { pool, q, tx, um, type Db } from './db';
import { agendar, type Resultado, type Trabalho } from './fila';
import type { Condicao, Passo } from './fluxos';
import { atribuirPorFluxo, moverEtapaPorFluxo } from './oportunidades';
import { nomeSeguro } from './trabalhos-texto';

/** Sends a message the company starts (checked again for consent, hours, who holds the conversation, channel rules). */
export type EnviarIniciada = (t: Trabalho, i: { oportunidadeId: string; corpo: string; finalidade: 'fluxo'; modelo: string }) => Promise<Resultado>;

interface Execucao {
  id: string;
  empresa_id: string;
  fluxo_id: string;
  oportunidade_id: string;
  contato_id: string;
  estado: 'ativa' | 'concluida' | 'parada' | 'falhou';
  passos: Passo[];
  etapa_inicial: string;
  criado_em: Date;
  ativo: boolean;
}

async function anotarLog(db: Db, id: string, passo: number, tipo: string, resultado: string) {
  await q(`update fluxo_execucoes set log = log || $2::jsonb where id = $1`, [id, JSON.stringify([{ em: new Date().toISOString(), passo, tipo, resultado }])], db);
}

async function encerrar(db: Db, id: string, estado: 'concluida' | 'parada' | 'falhou') {
  await q(`update fluxo_execucoes set estado = $2, concluido_em = now() where id = $1 and estado = 'ativa'`, [id, estado], db);
}

/** The conditions are read from the database at the moment the step runs, never remembered from earlier. */
async function condicaoVale(db: Db, e: Execucao, c: Condicao): Promise<boolean> {
  if (c === 'cliente_respondeu') {
    return !!(await um(`select 1 from conversas where empresa_id = $1 and contato_id = $2 and ultima_entrada_em > $3`, [e.empresa_id, e.contato_id, e.criado_em], db));
  }
  if (c === 'tem_autorizacao') {
    return !!(await um(`select 1 from consentimentos k join contatos ct on ct.id = k.contato_id where k.empresa_id = $1 and k.contato_id = $2 and k.canal = 'whatsapp' and k.revogado_em is null and k.origem not in ('ligacao', 'agenda') and ct.nao_contatar_em is null`, [e.empresa_id, e.contato_id], db));
  }
  if (c === 'tem_responsavel') {
    return !!(await um('select 1 from oportunidades where empresa_id = $1 and id = $2 and responsavel_id is not null', [e.empresa_id, e.oportunidade_id], db));
  }
  if (c === 'pessoa_assumiu') {
    return !!(await um(`select 1 from conversas where empresa_id = $1 and contato_id = $2 and estado = 'humano_atendendo'`, [e.empresa_id, e.contato_id], db));
  }
  const o = await um<{ etapa: string }>('select etapa from oportunidades where empresa_id = $1 and id = $2', [e.empresa_id, e.oportunidade_id], db);
  if (!o) return true;
  return c === 'etapa_mudou' ? o.etapa !== e.etapa_inicial : o.etapa === 'ganho' || o.etapa === 'perdido';
}

/**
 * Runs one step of a flow execution. Each step is its own queue job with a unique key, so a restart or a retry
 * never repeats a step that already ran, and the next step is only scheduled together with the record of this one.
 */
export async function executarPassoFluxo(t: Trabalho, enviar: EnviarIniciada): Promise<Resultado> {
  const execId = String(t.dados.execucao ?? '');
  const i = Number(t.dados.passo ?? 0);
  const e = await um<Execucao>(
    `select e.*, f.ativo from fluxo_execucoes e join fluxos f on f.empresa_id = e.empresa_id and f.id = e.fluxo_id where e.empresa_id = $1 and e.id = $2`,
    [t.empresa_id, execId],
  );
  if (!e) return { tipo: 'cancelado', motivo: 'O fluxo foi excluído.' };
  if (e.estado !== 'ativa') return { tipo: 'cancelado', motivo: 'A execução já terminou.' };
  if (!e.ativo) {
    await tx(async (db) => { await anotarLog(db, e.id, i, 'fluxo', 'Fluxo desligado: execução parada.'); await encerrar(db, e.id, 'parada'); });
    return { tipo: 'concluido', nota: 'Fluxo desligado.' };
  }
  const p = e.passos[i];
  if (!p) {
    await tx(async (db) => encerrar(db, e.id, 'concluida'));
    return { tipo: 'concluido', nota: 'Fluxo concluído.' };
  }
  const o = await um<{ responsavel_id: string | null; nome: string; empresa: string }>(
    `select o.responsavel_id, c.nome, em.nome as empresa from oportunidades o join contatos c on c.id = o.contato_id join empresas em on em.id = o.empresa_id where o.empresa_id = $1 and o.id = $2`,
    [e.empresa_id, e.oportunidade_id],
  );
  if (!o) return { tipo: 'cancelado', motivo: 'A oportunidade não existe mais.' };

  // Moves on: records what this step did and schedules the next one in the same transaction.
  // `proximo` is a 0-based step index; at or past the end, the execution finishes.
  const seguir = (db: Db, passo: number, resultado: string, atrasoMin = 0, proximo = passo + 1) =>
    (async () => {
      await anotarLog(db, e.id, passo, p.tipo, resultado);
      if (proximo >= e.passos.length) await encerrar(db, e.id, 'concluida');
      else await agendar(db, e.empresa_id, { tipo: 'fluxo_passo', chave: `fluxo:${e.id}:${proximo}`, oportunidadeId: e.oportunidade_id, em: new Date(Date.now() + atrasoMin * 60_000), dados: { execucao: e.id, passo: proximo } });
    })();
  /** 1-based target of a jump (0 = end) as a 0-based index; only forward targets are ever stored. */
  const alvo = (n: number) => (n === 0 ? e.passos.length : Math.max(i + 1, n - 1));

  try {
    if (p.tipo === 'esperar') {
      await tx(async (db) => seguir(db, i, `Esperou ${p.minutos} min`, p.minutos));
      return { tipo: 'concluido' };
    }
    if (p.tipo === 'parar_se') {
      return await tx(async (db): Promise<Resultado> => {
        if (await condicaoVale(db, e, p.condicao)) {
          await anotarLog(db, e.id, i, p.tipo, `Parou: ${p.condicao.replace(/_/g, ' ')}`);
          await encerrar(db, e.id, 'parada');
          return { tipo: 'concluido', nota: 'Fluxo parado pela condição.' };
        }
        await seguir(db, i, 'Condição não aconteceu: seguiu');
        return { tipo: 'concluido' };
      });
    }
    if (p.tipo === 'se') {
      await tx(async (db) => {
        const vale = await condicaoVale(db, e, p.condicao);
        await seguir(db, i, vale ? `Sim: ${p.ir_para ? `foi para o passo ${p.ir_para}` : 'terminou'}` : 'Não: seguiu', 0, vale ? alvo(p.ir_para) : i + 1);
      });
      return { tipo: 'concluido' };
    }
    if (p.tipo === 'ir_para') {
      await tx(async (db) => seguir(db, i, p.passo ? `Foi para o passo ${p.passo}` : 'Terminou', 0, alvo(p.passo)));
      return { tipo: 'concluido' };
    }
    if (p.tipo === 'enviar_whatsapp') {
      const corpo = p.texto.replace(/\{\{\s*nome\s*\}\}/g, nomeSeguro(o.nome) || 'tudo bem').replace(/\{\{\s*empresa\s*\}\}/g, o.empresa);
      const r = await enviar(t, { oportunidadeId: e.oportunidade_id, corpo: `${corpo} Para não receber mensagens, responda SAIR.`, finalidade: 'fluxo', modelo: p.modelo });
      // Outside the company's hours the same step waits for the next opening.
      if (r.tipo === 'adiar') return r;
      const quando = r.tipo === 'concluido' ? 'Mensagem enviada para a fila do WhatsApp' : r.tipo === 'cancelado' ? `Não enviada: ${r.motivo}` : `Não enviada: ${'erro' in r ? r.erro : ''}`;
      await tx(async (db) => seguir(db, i, quando));
      return { tipo: 'concluido', nota: quando };
    }
    if (p.tipo === 'criar_tarefa') {
      await tx(async (db) => {
        await criarTarefa(db, e.empresa_id, { oportunidadeId: e.oportunidade_id, tipo: 'fluxo', titulo: p.titulo, prazo: new Date(Date.now() + p.prazo_horas * 3_600_000), responsavelId: o.responsavel_id, chave: `fluxo:${e.id}:${i}` });
        await seguir(db, i, 'Tarefa criada');
      });
      return { tipo: 'concluido' };
    }
    if (p.tipo === 'avisar_equipe') {
      await tx(async (db) => {
        await q('insert into notificacoes (empresa_id, user_id, titulo, corpo, link) values ($1, $2, $3, $4, $5)', [e.empresa_id, o.responsavel_id, p.titulo, o.nome, `/painel/oportunidades/${e.oportunidade_id}`], db);
        await seguir(db, i, 'Equipe avisada');
      });
      return { tipo: 'concluido' };
    }
    if (p.tipo === 'atribuir') {
      await tx(async (db) => seguir(db, i, await atribuirPorFluxo(db, e.empresa_id, e.oportunidade_id, { modo: p.modo, userId: p.user_id, soSemResponsavel: p.so_sem_responsavel }, e.fluxo_id)));
      return { tipo: 'concluido' };
    }
    if (p.tipo === 'mover_etapa') {
      await tx(async (db) => seguir(db, i, await moverEtapaPorFluxo(db, e.empresa_id, e.oportunidade_id, p.etapa, e.fluxo_id)));
      return { tipo: 'concluido' };
    }
    // anotar
    await tx(async (db) => {
      await registrar(db, e.empresa_id, { oportunidadeId: e.oportunidade_id, contatoId: e.contato_id, ator: { tipo: 'sistema' }, tipo: 'anotacao', dados: { texto: p.texto } });
      await seguir(db, i, 'Anotação registrada');
    });
    return { tipo: 'concluido' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (t.tentativas >= t.max_tentativas) {
      await anotarLog(pool(), e.id, i, p.tipo, `Falhou: ${msg.slice(0, 200)}`);
      await encerrar(pool(), e.id, 'falhou');
    }
    return { tipo: 'repetir', erro: msg };
  }
}
