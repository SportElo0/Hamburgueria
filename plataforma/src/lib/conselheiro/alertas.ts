import 'server-only';
import crypto from 'node:crypto';
import { storage } from '../storage';
import { brl, fmtBps } from './calculos';
import { chave, contexto, custoVigente, hoje, linhas, mutar, vendasDoPeriodo, type Contexto, type VendasPeriodo } from './dados';
import { getDecisoes, getTestes } from './registros';
import { estadoAlertaSchema, type Decisao, type EstadoAlerta, type Teste } from './modelo';

/**
 * Alertas por regra verificável, nunca inventados: cada um diz a evidência (o número ou a data que o
 * disparou), por que importa e o que fazer. A chave inclui a evidência: dispensar um alerta não esconde
 * um problema novo do mesmo produto.
 */

export type Relevancia = 'alta' | 'media' | 'baixa';

export interface Alerta {
  chave: string;
  regra: string;
  titulo: string;
  evidencia: string;
  relevancia: Relevancia;
  acao: { rotulo: string; href: string };
}

const fp = (s: string) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 10);
const br = (d: string) => d.split('-').reverse().join('/');
/** Mudança de custo a partir disso vira alerta. */
export const MUDANCA_CUSTO_BPS = 1000;
/** Queda de unidades a partir disso, com volume mínimo nos dois períodos. */
export const QUEDA_VENDAS_BPS = 2000;
export const VOLUME_MINIMO_QUEDA = 30;

export function calcularAlertas(ctx: Contexto, base: string, extras: { testes: Teste[]; recente: VendasPeriodo; anterior: VendasPeriodo }): Alerta[] {
  const out: Alerta[] = [];
  const add = (regra: string, sujeito: string, a: Omit<Alerta, 'chave' | 'regra'>) => out.push({ ...a, regra, chave: `${regra}:${sujeito}:${fp(a.evidencia)}` });
  const prioritarios = new Set(ctx.perfil.prioritarios);
  const vendidos = new Set(extras.recente.linhas.filter((l) => l.quantidade > 0).map((l) => l.produtoId));

  for (const p of ctx.produtos) {
    if (!prioritarios.has(p.id) && !vendidos.has(p.id)) continue;
    const custo = custoVigente(ctx.custos, ctx.ficha, p.id, ctx.dia, ctx.perfil.custoValidadeDias);
    if (!custo || custo.ingredientes === null) {
      add('sem-custo', p.id, {
        titulo: `${p.nome} está sem custo`,
        evidencia: prioritarios.has(p.id) ? 'Produto prioritário sem custo dos ingredientes.' : 'Teve vendas nos últimos 30 dias e não tem custo dos ingredientes.',
        relevancia: prioritarios.has(p.id) ? 'alta' : 'media',
        acao: { rotulo: 'Informar custo', href: `${base}/produtos#${p.id}` },
      });
      continue;
    }
    if (custo.desatualizado) {
      add('custo-antigo', p.id, {
        titulo: `Custo de ${p.nome} desatualizado`,
        evidencia: `Último custo de ${br(custo.inicio)}, mais de ${ctx.perfil.custoValidadeDias} dias atrás.`,
        relevancia: prioritarios.has(p.id) ? 'media' : 'baixa',
        acao: { rotulo: 'Atualizar custo', href: `${base}/produtos#${p.id}` },
      });
    }
    const ant = custo.anterior?.ingredientes;
    if (ant && custo.ingredientes !== null && Math.abs(custo.ingredientes - ant) * 10_000 >= MUDANCA_CUSTO_BPS * ant) {
      const mudou = Math.round(((custo.ingredientes - ant) * 10_000) / ant);
      add('custo-mudou', `${p.id}:${custo.versao}`, {
        titulo: `Custo de ${p.nome} ${mudou > 0 ? 'subiu' : 'caiu'} ${fmtBps(Math.abs(mudou))}`,
        evidencia: `De ${brl(ant)} (${br(custo.anterior!.inicio)}) para ${brl(custo.ingredientes)} (${br(custo.inicio)}).`,
        relevancia: mudou > 0 ? 'alta' : 'baixa',
        acao: { rotulo: 'Ver contribuição e simular preço', href: `${base}/simulador?produto=${p.id}` },
      });
    }
  }

  if (ctx.perfil.metaContribuicaoBps !== null) {
    for (const l of linhas(ctx)) {
      if (!l.resultado || l.resultado.margemBps === null) continue;
      if (!prioritarios.has(l.produto.id) && !vendidos.has(l.produto.id)) continue;
      if (l.resultado.margemBps < ctx.perfil.metaContribuicaoBps) {
        add('abaixo-meta', `${l.produto.id}:${l.canal.id}`, {
          titulo: `${l.produto.nome} em ${l.canal.nome} abaixo da meta`,
          evidencia: `${l.resultado.rotulo[0].toUpperCase()}${l.resultado.rotulo.slice(1)} de ${fmtBps(l.resultado.margemBps)} (${brl(l.resultado.contribuicao)} por unidade); a meta é ${fmtBps(ctx.perfil.metaContribuicaoBps)}.`,
          relevancia: l.resultado.margemBps < 0 ? 'alta' : 'media',
          acao: { rotulo: 'Simular preço', href: `${base}/simulador?produto=${l.produto.id}&canal=${l.canal.id}` },
        });
      }
    }
  }

  for (const cob of extras.recente.cobertura) {
    const canal = ctx.perfil.canais.find((c) => c.id === cob.canalId);
    if (!canal?.ativo) continue;
    const limite = hoje(new Date(Date.parse(`${ctx.dia}T12:00:00Z`) - 8 * 86_400_000));
    if (!cob.ultimoDia || cob.ultimoDia < limite) {
      add('vendas-incompletas', canal.id, {
        titulo: `Vendas de ${canal.nome} sem atualização`,
        evidencia: cob.ultimoDia ? `Último dia com venda registrada: ${br(cob.ultimoDia)}.` : 'Nenhuma venda registrada deste canal ainda.',
        relevancia: 'media',
        acao: { rotulo: cob.origem === 'painel' ? 'Ver pedidos' : 'Importar vendas', href: cob.origem === 'painel' ? `${base.replace('/conselheiro', '')}/pedidos` : `${base}/importar?tipo=vendas` },
      });
    }
  }

  for (const t of extras.testes) {
    if (t.status === 'em-andamento' && t.fim && t.fim < ctx.dia) {
      const temTeste = t.resultados.some((r) => r.grupo === 'teste');
      add('teste-sem-resultado', t.id, {
        titulo: `Teste "${t.nome}" terminou${temTeste ? '' : ' sem resultado'}`,
        evidencia: `Fim previsto em ${br(t.fim)}; ${t.resultados.length} resultado(s) registrado(s).`,
        relevancia: 'alta',
        acao: { rotulo: 'Registrar resultado e decidir', href: `${base}/testes#${t.id}` },
      });
    }
  }

  // Queda de vendas só com períodos do mesmo tamanho, dado nos dois e volume mínimo.
  const coberto = (v: VendasPeriodo, canal: string) => {
    const c = v.cobertura.find((x) => x.canalId === canal);
    return Boolean(c?.ultimoDia && c.ultimoDia >= v.fim);
  };
  if (extras.recente.dias === extras.anterior.dias) {
    for (const atual of extras.recente.linhas) {
      const antes = extras.anterior.linhas.find((l) => l.produtoId === atual.produtoId && l.canalId === atual.canalId);
      if (!antes || antes.quantidade < VOLUME_MINIMO_QUEDA || atual.quantidade < 1) continue;
      if (!coberto(extras.recente, atual.canalId) || !coberto(extras.anterior, atual.canalId)) continue;
      const queda = Math.round(((antes.quantidade - atual.quantidade) * 10_000) / antes.quantidade);
      if (queda < QUEDA_VENDAS_BPS) continue;
      const p = ctx.produtos.find((x) => x.id === atual.produtoId);
      const canal = ctx.perfil.canais.find((x) => x.id === atual.canalId);
      if (!p || !canal) continue;
      add('queda-vendas', `${p.id}:${canal.id}`, {
        titulo: `${p.nome} vendeu ${fmtBps(queda)} menos em ${canal.nome}`,
        evidencia: `${atual.quantidade} unidades de ${br(extras.recente.inicio)} a ${br(extras.recente.fim)}, contra ${antes.quantidade} nos ${extras.anterior.dias} dias anteriores. Pode ser época, falta de produto ou mudança de preço: confira antes de agir.`,
        relevancia: 'media',
        acao: { rotulo: 'Perguntar ao Conselheiro', href: `${base}/conversa?pergunta=${encodeURIComponent(`Por que ${p.nome} vendeu menos em ${canal.nome}?`)}` },
      });
    }
  }
  const peso: Record<Relevancia, number> = { alta: 0, media: 1, baixa: 2 };
  return out.sort((a, b) => peso[a.relevancia] - peso[b.relevancia]);
}

export async function getEstadosAlerta(slug: string): Promise<Record<string, EstadoAlerta>> {
  const raw = (await storage().readJSON<Record<string, unknown>>(chave(slug, 'alertas.json')))?.data ?? {};
  return Object.fromEntries(Object.entries(raw).flatMap(([k, v]) => {
    const r = estadoAlertaSchema.safeParse(v);
    return r.success ? [[k, r.data] as const] : [];
  }));
}

/** Resolve, adia (7 dias) ou dispensa um alerta, com o motivo. */
export async function marcarAlerta(slug: string, chaveAlerta: string, acao: EstadoAlerta['acao'], motivo: string, by: string, now = new Date()) {
  if (!/^[a-z-]{3,30}:[\w:-]{1,160}:[a-f0-9]{10}$/.test(chaveAlerta)) throw new Error('Alerta inválido.');
  if (acao === 'dispensado' && !motivo.trim()) throw new Error('Diga por que o alerta não vale.');
  const ate = acao === 'adiado' ? hoje(new Date(now.getTime() + 7 * 86_400_000)) : null;
  await mutar<Record<string, unknown>>(chave(slug, 'alertas.json'), () => ({}), (atual) => {
    const novo = { ...atual, [chaveAlerta]: estadoAlertaSchema.parse({ acao, ate, motivo: motivo.trim().slice(0, 300), em: now.toISOString(), por: by }) };
    // Guarda no máximo 500 estados (os mais recentes).
    const entradas = Object.entries(novo).sort((a, b) => String((b[1] as EstadoAlerta).em).localeCompare(String((a[1] as EstadoAlerta).em)));
    return { novo: Object.fromEntries(entradas.slice(0, 500)) };
  });
}

export const visivel = (a: Alerta, estados: Record<string, EstadoAlerta>, dia: string) => {
  const e = estados[a.chave];
  if (!e) return true;
  if (e.acao === 'adiado') return !e.ate || e.ate <= dia;
  return false;
};

/** Tudo o que a tela Hoje precisa, lido uma vez. */
export async function panorama(slug: string, base: string, now = new Date()) {
  const ctx = await contexto(slug, now);
  const ontem = hoje(new Date(now.getTime() - 86_400_000));
  const ini30 = hoje(new Date(now.getTime() - 30 * 86_400_000));
  const fimAnt = hoje(new Date(now.getTime() - 31 * 86_400_000));
  const iniAnt = hoje(new Date(now.getTime() - 60 * 86_400_000));
  const [recente, anterior, testes, decisoes, estados] = await Promise.all([
    vendasDoPeriodo(slug, ini30, ontem, now),
    vendasDoPeriodo(slug, iniAnt, fimAnt, now),
    getTestes(slug),
    getDecisoes(slug),
    getEstadosAlerta(slug),
  ]);
  const todos = calcularAlertas(ctx, base, { testes, recente, anterior });
  const alertas = todos.filter((a) => visivel(a, estados, ctx.dia));
  return { ctx, recente, testes, decisoes, alertas, ocultos: todos.length - alertas.length };
}

/** Até 3 prioridades: decisões esperando o dono, testes para decidir e alertas altos. Nunca inventa. */
export function prioridades(base: string, p: { alertas: Alerta[]; decisoes: Decisao[]; testes: Teste[] }) {
  const out: { titulo: string; porque: string; href: string; rotulo: string }[] = [];
  for (const d of p.decisoes.filter((x) => x.status === 'proposta').slice(0, 2)) out.push({ titulo: d.titulo, porque: 'Recomendação esperando sua aprovação.', href: `${base}/decisoes#${d.id}`, rotulo: 'Ver e decidir' });
  for (const a of p.alertas.filter((x) => x.relevancia === 'alta')) out.push({ titulo: a.titulo, porque: a.evidencia, href: a.acao.href, rotulo: a.acao.rotulo });
  for (const t of p.testes.filter((x) => x.status === 'aprovado')) out.push({ titulo: `Começar o teste "${t.nome}"`, porque: 'Aprovado, ainda não começou.', href: `${base}/testes#${t.id}`, rotulo: 'Abrir teste' });
  return out.slice(0, 3);
}
