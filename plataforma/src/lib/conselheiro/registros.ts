import 'server-only';
import { storage } from '../storage';
import { avaliarResultado, contribuicaoAgregada, type EntradaUnidade } from './calculos';
import { DadosError, chave, contexto, custoVigente, dias, entradaDe, fontesDe, hoje, limpar, mutar, novoId, precoVigente, taxasDoCanal, vendasDoPeriodo, type Contexto } from './dados';
import { executar, simulacaoSalvaSchema, type SimulacaoSalva } from './simulacoes';
import {
  CANAL_PAINEL,
  NOME_SIMULACAO,
  PROXIMOS_TESTE,
  decisaoSchema,
  resultadoSchema,
  testeSchema,
  type Decisao,
  type Fonte,
  type Metrica,
  type StatusDecisao,
  type StatusTeste,
  type Teste,
  type TipoSimulacao,
} from './modelo';

/**
 * Simulações salvas, decisões (recomendações que o dono aprova ou descarta) e testes com metas.
 *
 *   conselheiro/<slug>/simulacoes.json        índice (id, tipo, título, data)
 *   conselheiro/<slug>/simulacoes/<id>.json   entrada + resultado + fontes (fotografia dos dados usados)
 *   conselheiro/<slug>/decisoes.json          decisões e histórico de status
 *   conselheiro/<slug>/testes.json            testes, resultados e histórico
 */

const MAX_SIMULACOES = 1000;
const MAX_DECISOES = 300;
const MAX_TESTES = 200;

// ───────────────────────────── Preparar uma simulação a partir dos dados ─────────────────────────────

export interface Preparo {
  produtoNome: string;
  canalNome: string;
  base: EntradaUnidade | null;
  volumeAtual: number | null;
  origemVolume: string;
  fontes: Fonte[];
  faltando: string[];
}

/**
 * Monta a base de uma simulação com os dados vigentes do produto no canal e o volume vendido nos
 * últimos `diasVolume` dias (quando há dado). Sem dado, o volume fica null: quem simula informa.
 */
export async function prepararBase(ctx: Contexto, produtoId: string, canalId: string, diasVolume = 30, now = new Date()): Promise<Preparo> {
  const produto = ctx.produtos.find((p) => p.id === produtoId);
  const canal = ctx.perfil.canais.find((c) => c.id === canalId);
  if (!produto) throw new DadosError('Produto não encontrado.');
  if (!canal) throw new DadosError('Canal não encontrado.');
  const preco = precoVigente(ctx.precos, produto, canal, ctx.dia);
  const custo = custoVigente(ctx.custos, ctx.ficha, produto.id, ctx.dia, ctx.perfil.custoValidadeDias);
  const faltando: string[] = [];
  if (!preco) faltando.push(`preço de ${produto.nome} em ${canal.nome}`);
  if (!custo || custo.ingredientes === null) faltando.push(`custo dos ingredientes de ${produto.nome}`);
  if (custo?.desatualizado) faltando.push(`custo atualizado de ${produto.nome} (o último é de ${custo.inicio.split('-').reverse().join('/')})`);
  const fim = hoje(new Date(now.getTime() - 86_400_000));
  const inicio = hoje(new Date(now.getTime() - diasVolume * 86_400_000));
  const v = await vendasDoPeriodo(ctx.slug, inicio, fim, now);
  const ag = v.linhas.find((l) => l.produtoId === produto.id && l.canalId === canal.id);
  const cob = v.cobertura.find((c) => c.canalId === canal.id);
  let volumeAtual: number | null = null;
  let origemVolume = 'sem dado de vendas: informe o volume';
  if (ag) {
    volumeAtual = ag.quantidade;
    origemVolume = `vendas de ${inicio.split('-').reverse().join('/')} a ${fim.split('-').reverse().join('/')} (${cob?.origem === 'painel' ? 'pedidos do painel' : 'planilha importada'})`;
  } else if (cob?.ultimoDia && cob.ultimoDia >= inicio) {
    volumeAtual = 0;
    origemVolume = `nenhuma venda registrada de ${inicio.split('-').reverse().join('/')} a ${fim.split('-').reverse().join('/')}`;
  } else faltando.push(`vendas recentes de ${produto.nome} em ${canal.nome}`);
  const fontes = fontesDe(produto, canal, preco, custo);
  fontes.push({ rotulo: `Volume de ${produto.nome} em ${canal.nome}`, origem: volumeAtual === null ? 'hipotese' : cob?.origem === 'painel' ? 'calculado' : 'importado', versao: origemVolume.slice(0, 60), data: fim });
  return { produtoNome: produto.nome, canalNome: canal.nome, base: preco ? entradaDe(preco, custo, canal) : null, volumeAtual, origemVolume, fontes, faltando };
}

// ───────────────────────────── Simulações salvas ─────────────────────────────

export async function salvarSimulacao(
  slug: string,
  input: { tipo: TipoSimulacao; titulo: string; entrada: unknown; fontes: Fonte[]; hipoteses: string[]; origem: 'simulador' | 'conselheiro'; conversaId: string | null },
  by: string,
): Promise<SimulacaoSalva> {
  // A conta é refeita aqui: o resultado salvo nunca vem do navegador nem da IA.
  const sim = executar(input.tipo, input.entrada);
  const id = novoId('s');
  const registro = simulacaoSalvaSchema.parse({
    id,
    tipo: sim.tipo,
    titulo: limpar(input.titulo, 140) || NOME_SIMULACAO[sim.tipo],
    entrada: sim.entrada,
    resultado: sim.resultado,
    fontes: input.fontes.slice(0, 30),
    hipoteses: input.hipoteses.map((h) => limpar(h, 200)).filter(Boolean).slice(0, 20),
    origem: input.origem,
    conversaId: input.conversaId,
    criadaEm: new Date().toISOString(),
    criadaPor: by,
  });
  await mutar<{ id: string; tipo: string; titulo: string; criadaEm: string }[]>(chave(slug, 'simulacoes.json'), () => [], (lista) => {
    if (lista.length >= MAX_SIMULACOES) throw new DadosError('Limite de simulações salvas atingido.');
    return { novo: [{ id, tipo: registro.tipo, titulo: registro.titulo, criadaEm: registro.criadaEm }, ...lista] };
  });
  await storage().writeJSON(chave(slug, `simulacoes/${id}.json`), registro, null);
  return registro as SimulacaoSalva;
}

export async function getSimulacao(slug: string, id: string): Promise<SimulacaoSalva | null> {
  if (!/^s-[a-f0-9]{12}$/.test(id)) return null;
  const doc = await storage().readJSON<unknown>(chave(slug, `simulacoes/${id}.json`));
  const r = simulacaoSalvaSchema.safeParse(doc?.data);
  return r.success ? (r.data as SimulacaoSalva) : null;
}

export async function listarSimulacoes(slug: string) {
  return (await storage().readJSON<{ id: string; tipo: TipoSimulacao; titulo: string; criadaEm: string }[]>(chave(slug, 'simulacoes.json')))?.data ?? [];
}

// ───────────────────────────── Decisões ─────────────────────────────

export async function getDecisoes(slug: string): Promise<Decisao[]> {
  const raw = (await storage().readJSON<unknown[]>(chave(slug, 'decisoes.json')))?.data ?? [];
  return raw.flatMap((d) => {
    const r = decisaoSchema.safeParse(d);
    return r.success ? [r.data] : [];
  });
}

export type NovaDecisao = Pick<Decisao, 'titulo' | 'pergunta' | 'metodo' | 'dadosUsados' | 'faltando' | 'hipoteses' | 'calculos' | 'recomendacao' | 'riscos' | 'proximoPasso' | 'simulacaoIds' | 'produtos' | 'origem' | 'conversaId'>;

export async function criarDecisao(slug: string, input: NovaDecisao, by: string): Promise<Decisao> {
  for (const s of input.simulacaoIds) if (!(await getSimulacao(slug, s))) throw new DadosError('Simulação não encontrada.');
  const em = new Date().toISOString();
  const d = decisaoSchema.parse({
    ...input,
    titulo: limpar(input.titulo, 140),
    pergunta: limpar(input.pergunta, 600),
    calculos: limpar(input.calculos, 1200),
    recomendacao: limpar(input.recomendacao, 1200),
    proximoPasso: limpar(input.proximoPasso, 400),
    dadosUsados: input.dadosUsados.map((x) => limpar(x, 200)).filter(Boolean),
    faltando: input.faltando.map((x) => limpar(x, 200)).filter(Boolean),
    hipoteses: input.hipoteses.map((x) => limpar(x, 200)).filter(Boolean),
    riscos: input.riscos.map((x) => limpar(x, 300)).filter(Boolean),
    id: novoId('d'),
    status: 'proposta',
    testeId: null,
    historico: [{ em, por: by, de: '', para: 'proposta', motivo: 'criada' }],
    criadaEm: em,
    criadaPor: by,
  });
  return mutar<unknown[], Decisao>(chave(slug, 'decisoes.json'), () => [], (lista) => {
    if (lista.length >= MAX_DECISOES) throw new DadosError('Limite de decisões atingido.');
    return { novo: [d, ...lista], retorno: d };
  });
}

const PROXIMOS_DECISAO: Record<StatusDecisao, StatusDecisao[]> = {
  proposta: ['aprovada', 'descartada'],
  aprovada: ['em-teste', 'concluida', 'descartada'],
  'em-teste': ['concluida', 'descartada'],
  concluida: [],
  descartada: [],
};

/** Muda o status de uma decisão. Só o dono (ou a equipe) chama, por ação na tela; a IA nunca. */
export async function mudarDecisao(slug: string, id: string, para: StatusDecisao, motivo: string, by: string, testeId?: string): Promise<Decisao> {
  return mutar<unknown[], Decisao>(chave(slug, 'decisoes.json'), () => [], (lista) => {
    const i = lista.findIndex((d) => (d as Decisao).id === id);
    if (i === -1) throw new DadosError('Decisão não encontrada.');
    const atual = decisaoSchema.parse(lista[i]);
    if (!PROXIMOS_DECISAO[atual.status].includes(para)) throw new DadosError(`Uma decisão "${atual.status}" não pode ir para "${para}".`);
    if (para === 'descartada' && !limpar(motivo, 400)) throw new DadosError('Diga por que a decisão foi descartada.');
    const prox = decisaoSchema.parse({
      ...atual,
      status: para,
      testeId: testeId ?? atual.testeId,
      historico: [...atual.historico, { em: new Date().toISOString(), por: by, de: atual.status, para, motivo: limpar(motivo, 400) }].slice(-50),
    });
    const novo = [...lista];
    novo[i] = prox;
    return { novo, retorno: prox };
  });
}

// ───────────────────────────── Testes e metas ─────────────────────────────

export async function getTestes(slug: string): Promise<Teste[]> {
  const raw = (await storage().readJSON<unknown[]>(chave(slug, 'testes.json')))?.data ?? [];
  return raw.flatMap((d) => {
    const r = testeSchema.safeParse(d);
    return r.success ? [r.data] : [];
  });
}

export type NovoTeste = Pick<Teste, 'nome' | 'hipotese' | 'produtos' | 'canais' | 'responsavel' | 'metrica' | 'protecao' | 'comparacao' | 'inicio' | 'fim' | 'premissas' | 'limites' | 'decisaoId'>;

export async function criarTeste(slug: string, input: NovoTeste, by: string): Promise<Teste> {
  const ctx = await contexto(slug);
  for (const p of input.produtos) if (!ctx.produtos.some((x) => x.id === p)) throw new DadosError('Produto do teste não encontrado.');
  for (const c of input.canais) if (!ctx.perfil.canais.some((x) => x.id === c)) throw new DadosError('Canal do teste não encontrado.');
  if (input.inicio && input.fim && input.inicio > input.fim) throw new DadosError('O teste termina antes de começar.');
  if (input.decisaoId) {
    const d = (await getDecisoes(slug)).find((x) => x.id === input.decisaoId);
    if (!d) throw new DadosError('Decisão não encontrada.');
    if (d.status !== 'aprovada') throw new DadosError('Só uma decisão aprovada vira teste.');
  }
  const em = new Date().toISOString();
  const t = testeSchema.parse({
    ...input,
    nome: limpar(input.nome, 120),
    hipotese: limpar(input.hipotese, 600),
    responsavel: limpar(input.responsavel, 80),
    premissas: limpar(input.premissas, 600),
    limites: limpar(input.limites, 600),
    protecao: input.protecao.map((x) => limpar(x, 120)).filter(Boolean),
    id: novoId('t'),
    status: 'rascunho',
    resultados: [],
    decisaoFinal: '',
    historico: [{ em, por: by, de: '', para: 'rascunho', motivo: 'criado' }],
    criadoEm: em,
    criadoPor: by,
  });
  return mutar<unknown[], Teste>(chave(slug, 'testes.json'), () => [], (lista) => {
    if (lista.length >= MAX_TESTES) throw new DadosError('Limite de testes atingido.');
    return { novo: [t, ...lista], retorno: t };
  });
}

async function mudarTesteDoc(slug: string, id: string, fn: (t: Teste) => Teste): Promise<Teste> {
  return mutar<unknown[], Teste>(chave(slug, 'testes.json'), () => [], (lista) => {
    const i = lista.findIndex((d) => (d as Teste).id === id);
    if (i === -1) throw new DadosError('Teste não encontrado.');
    const prox = testeSchema.parse(fn(testeSchema.parse(lista[i])));
    const novo = [...lista];
    novo[i] = prox;
    return { novo, retorno: prox };
  });
}

export async function mudarStatusTeste(slug: string, id: string, para: StatusTeste, input: { motivo: string; decisaoFinal?: string }, by: string): Promise<Teste> {
  const t = await mudarTesteDoc(slug, id, (atual) => {
    if (!PROXIMOS_TESTE[atual.status].includes(para)) throw new DadosError(`Um teste "${atual.status}" não pode ir para "${para}".`);
    if (para === 'em-andamento' && (!atual.inicio || !atual.fim)) throw new DadosError('Defina as datas de início e fim antes de começar.');
    if (para === 'concluido') {
      const grupos = new Set(atual.resultados.map((r) => r.grupo));
      if (!grupos.has('base') || !grupos.has('teste')) throw new DadosError('Registre o resultado da base e do teste antes de concluir.');
    }
    const decisaoFinal = limpar(input.decisaoFinal ?? atual.decisaoFinal, 800);
    if ((para === 'concluido' || para === 'inconclusivo') && !decisaoFinal) throw new DadosError('Escreva a decisão final (manter, desfazer, repetir…).');
    if (para === 'interrompido' && !limpar(input.motivo, 400)) throw new DadosError('Diga por que o teste foi interrompido.');
    return { ...atual, status: para, decisaoFinal, historico: [...atual.historico, { em: new Date().toISOString(), por: by, de: atual.status, para, motivo: limpar(input.motivo, 400) }].slice(-50) };
  });
  if (t.decisaoId && para === 'em-andamento') await mudarDecisao(slug, t.decisaoId, 'em-teste', `teste "${t.nome}" começou`, by, t.id).catch(() => undefined);
  return t;
}

export async function registrarResultado(
  slug: string,
  id: string,
  input: { grupo: 'base' | 'teste'; valor: number; dias: number; atendimentos: number | null; nota: string; origem: 'manual' | 'calculado' },
  by: string,
): Promise<Teste> {
  return mudarTesteDoc(slug, id, (atual) => {
    if (!['aprovado', 'em-andamento'].includes(atual.status)) throw new DadosError('Resultados entram em testes aprovados ou em andamento.');
    const r = resultadoSchema.parse({ ...input, nota: limpar(input.nota, 400), id: novoId('r'), em: new Date().toISOString(), por: by });
    return { ...atual, resultados: [...atual.resultados, r].slice(-40) };
  });
}

/** O último resultado de cada grupo e a comparação entre eles (sem afirmar causa). */
export function comparar(t: Teste) {
  const ultimo = (g: 'base' | 'teste') => [...t.resultados].reverse().find((r) => r.grupo === g) ?? null;
  const base = ultimo('base');
  const teste = ultimo('teste');
  if (!base || !teste) return null;
  return { base, teste, avaliacao: avaliarResultado({ desenho: t.comparacao, base, teste }) };
}

export interface Medicao {
  base: { valor: number; dias: number; atendimentos: number | null; periodo: string };
  teste: { valor: number; dias: number; atendimentos: number | null; periodo: string };
  avisos: string[];
}

/**
 * Soma a métrica do teste a partir das vendas registradas (antes e depois). Grupo de controle precisa de
 * resultado informado: o painel não sabe quais atendimentos ficaram fora do teste.
 */
export async function medirTeste(slug: string, t: Teste, now = new Date()): Promise<Medicao> {
  if (t.comparacao !== 'antes-depois') throw new DadosError('Com grupo de controle, registre os resultados de cada grupo à mão.');
  if (!t.inicio || !t.fim) throw new DadosError('O teste não tem datas.');
  const ontem = hoje(new Date(now.getTime() - 86_400_000));
  if (t.inicio > ontem) throw new DadosError('O teste ainda não tem um dia completo.');
  const fimTeste = t.fim < ontem ? t.fim : ontem;
  const nDias = dias(t.inicio, fimTeste).length;
  const fimBase = hoje(new Date(Date.parse(`${t.inicio}T12:00:00Z`) - 86_400_000));
  const inicioBase = hoje(new Date(Date.parse(`${t.inicio}T12:00:00Z`) - nDias * 86_400_000));
  const ctx = await contexto(slug, now);
  const avisos: string[] = [];
  if (fimTeste < t.fim) avisos.push(`O teste vai até ${t.fim.split('-').reverse().join('/')}: esta é uma medição parcial, até ontem.`);
  const medir = async (inicio: string, fim: string) => {
    const v = await vendasDoPeriodo(slug, inicio, fim, now);
    if (v.parciaisForaDaConta) avisos.push(`${v.parciaisForaDaConta} linha(s) importada(s) cruzam o período ${inicio}–${fim} só em parte e ficaram fora.`);
    for (const c of t.canais) {
      const cob = v.cobertura.find((x) => x.canalId === c);
      const nome = ctx.perfil.canais.find((x) => x.id === c)?.nome ?? c;
      if (!cob?.ultimoDia || cob.ultimoDia < fim) avisos.push(`Vendas de ${nome} sem dado até ${fim.split('-').reverse().join('/')}: o período pode estar incompleto.`);
    }
    const ls = v.linhas.filter((l) => (!t.produtos.length || t.produtos.includes(l.produtoId)) && (!t.canais.length || t.canais.includes(l.canalId)));
    let valor = 0;
    for (const l of ls) {
      if (t.metrica === 'unidades') valor += l.quantidade;
      else if (t.metrica === 'receita') valor += l.receita;
      else {
        const canal = ctx.perfil.canais.find((c) => c.id === l.canalId);
        const custo = custoVigente(ctx.custos, ctx.ficha, l.produtoId, fim, ctx.perfil.custoValidadeDias);
        if (!canal || !custo) throw new DadosError('Falta custo de um produto do teste: sem ele não há contribuição.');
        const r = contribuicaoAgregada({ receita: l.receita, quantidade: l.quantidade, desconto: null, custos: { ingredientes: custo.ingredientes, embalagem: canal.embalagem ? custo.embalagem : 0, outros: custo.outros }, taxas: taxasDoCanal(canal) });
        if (r.contribuicao === null) throw new DadosError('Falta custo dos ingredientes de um produto do teste.');
        if (r.naoConsiderados.length) avisos.push(`Fora da conta: ${[...new Set(r.naoConsiderados)].join(', ')}.`);
        valor += r.contribuicao;
      }
    }
    const usaAtendimento = t.canais.length === 1 && t.canais[0] === CANAL_PAINEL;
    if (t.metrica === 'contribuicao-por-atendimento' && !usaAtendimento) throw new DadosError('Contribuição por atendimento só é calculada para o canal do painel (que conta os pedidos). Registre à mão para outros canais.');
    return { valor, dias: v.dias, atendimentos: usaAtendimento ? v.pedidosPainel : null, periodo: `${inicio.split('-').reverse().join('/')} a ${fim.split('-').reverse().join('/')}` };
  };
  const base = await medir(inicioBase, fimBase);
  const teste = await medir(t.inicio, fimTeste);
  return { base, teste, avisos: [...new Set(avisos)] };
}

export const metricaEmDinheiro = (m: Metrica) => m !== 'unidades';

export interface BaseSimulador {
  produtoId: string;
  produtoNome: string;
  canalId: string;
  canalNome: string;
  base: EntradaUnidade | null;
  volumeAtual: number | null;
  origemVolume: string;
  faltando: string[];
}

/** Bases de todos os produtos em todos os canais ativos, com o volume dos últimos 30 dias (uma leitura de vendas). */
export async function basesParaSimulador(ctx: Contexto, now = new Date()): Promise<BaseSimulador[]> {
  const fim = hoje(new Date(now.getTime() - 86_400_000));
  const inicio = hoje(new Date(now.getTime() - 30 * 86_400_000));
  const v = await vendasDoPeriodo(ctx.slug, inicio, fim, now);
  const periodo = `${inicio.split('-').reverse().join('/')} a ${fim.split('-').reverse().join('/')}`;
  return ctx.produtos.flatMap((p) =>
    ctx.perfil.canais
      .filter((c) => c.ativo)
      .map((c) => {
        const preco = precoVigente(ctx.precos, p, c, ctx.dia);
        const custo = custoVigente(ctx.custos, ctx.ficha, p.id, ctx.dia, ctx.perfil.custoValidadeDias);
        const ag = v.linhas.find((l) => l.produtoId === p.id && l.canalId === c.id);
        const cob = v.cobertura.find((x) => x.canalId === c.id);
        const faltando: string[] = [];
        if (!preco) faltando.push('preço neste canal');
        if (!custo || custo.ingredientes === null) faltando.push('custo dos ingredientes');
        else if (custo.desatualizado) faltando.push('custo atualizado');
        const temDado = Boolean(cob?.ultimoDia && cob.ultimoDia >= inicio);
        if (!ag && !temDado) faltando.push('vendas recentes (informe o volume)');
        return {
          produtoId: p.id,
          produtoNome: p.nome,
          canalId: c.id,
          canalNome: c.nome,
          base: preco ? entradaDe(preco, custo, c) : null,
          volumeAtual: ag ? ag.quantidade : temDado ? 0 : null,
          origemVolume: ag || temDado ? `vendas de ${periodo}` : 'sem dado de vendas',
          faltando,
        };
      }),
  );
}
