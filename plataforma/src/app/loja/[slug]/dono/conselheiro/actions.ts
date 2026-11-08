'use server';

import { refresh } from 'next/cache';
import { z } from 'zod';
import { DONO, requireStoreAccess } from '@/lib/auth';
import { isSlug } from '@/lib/slug';
import { hourWindow, take } from '@/lib/limits';
import { parseReais } from '@/lib/dono-resumo';
import { CalculoError } from '@/lib/conselheiro/calculos';
import { MAX_BYTES_CSV, percentualBR } from '@/lib/conselheiro/csv';
import { DadosError, adicionarCustos, adicionarPrecos, adicionarProduto, contexto, desfazerLote, hoje, salvarCanal, salvarPerfil } from '@/lib/conselheiro/dados';
import { importar, previsualizar, type Previa } from '@/lib/conselheiro/importar';
import { criarDecisao, criarTeste, medirTeste, mudarDecisao, mudarStatusTeste, prepararBase, registrarResultado, salvarSimulacao, getTestes, type Medicao } from '@/lib/conselheiro/registros';
import { marcarAlerta } from '@/lib/conselheiro/alertas';
import { getConversa, responder, type Resposta } from '@/lib/conselheiro/ia';
import { METRICAS, STATUS_DECISAO, STATUS_TESTE, TIPOS_CANAL, TIPOS_LOTE, CANAL_PAINEL, type Fonte, type TipoSimulacao } from '@/lib/conselheiro/modelo';

/**
 * Ações do Conselheiro. Cada uma confere o slug e o login (dono da loja ou equipe da Growlift) antes de
 * tudo; os dados vêm do formulário e são validados de novo na biblioteca. Nada aqui é chamado pela IA.
 */

export interface Estado {
  ok: boolean;
  msg: string;
}

async function quem(slug: unknown) {
  if (typeof slug !== 'string' || !isSlug(slug)) throw new DadosError('Loja inválida.');
  const u = await requireStoreAccess(slug, DONO);
  // Escritas por hora por loja: bem acima do uso normal, abaixo de um robô.
  if (!(await take('conselheiro-escrita', slug, 600, hourWindow()))) throw new DadosError('Muitas alterações nesta hora. Espere um pouco.');
  return { slug, by: u.name || u.email };
}

async function rodar(fn: () => Promise<string>): Promise<Estado> {
  try {
    const msg = await fn();
    refresh();
    return { ok: true, msg };
  } catch (err) {
    if (err instanceof DadosError || err instanceof CalculoError) return { ok: false, msg: err.message };
    if (err instanceof z.ZodError) return { ok: false, msg: `Confira os campos: ${err.issues.slice(0, 2).map((i) => i.path.join('.') || i.message).join(', ')}.` };
    if (err instanceof Error && /alterado por outra pessoa|Alerta inválido|Diga por que/.test(err.message)) return { ok: false, msg: err.message };
    console.error('conselheiro ação', err instanceof Error ? err.message : 'erro');
    return { ok: false, msg: 'Não foi possível salvar. Tente de novo.' };
  }
}

const txt = (fd: FormData, k: string, max = 600) => String(fd.get(k) ?? '').trim().slice(0, max);
function reais(fd: FormData, k: string, obrigatorio = false): number | null {
  const v = parseReais(txt(fd, k, 30));
  if (v === null) {
    if (obrigatorio) throw new DadosError('Informe o valor.');
    return null;
  }
  if (Number.isNaN(v)) throw new DadosError(`Valor inválido em "${k}". Use o formato 12,50.`);
  return v;
}
function pctCampo(fd: FormData, k: string): number | null {
  const v = txt(fd, k, 10);
  if (!v) return null;
  const r = percentualBR(v);
  if (!r.ok) throw new DadosError(r.erro);
  return r.valor;
}
function dia(fd: FormData, k: string, padrao: string | null): string | null {
  const v = txt(fd, k, 10);
  if (!v) return padrao;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new DadosError('Data inválida.');
  return v;
}

// ───────────────────────────── Cadastro ─────────────────────────────

export async function salvarNegocioAction(slug: string, _prev: Estado | null, fd: FormData): Promise<Estado> {
  return rodar(async () => {
    const q = await quem(slug);
    await salvarPerfil(q.slug, { segmento: txt(fd, 'segmento', 80), unidade: txt(fd, 'unidade', 80), horarios: txt(fd, 'horarios', 300), publico: txt(fd, 'publico', 300), objetivos: txt(fd, 'objetivos'), restricoes: txt(fd, 'restricoes'), sistemaAtual: txt(fd, 'sistemaAtual', 120) }, 'negocio', q.by);
    return 'Negócio salvo.';
  });
}

export async function salvarCanalAction(slug: string, _prev: Estado | null, fd: FormData): Promise<Estado> {
  return rodar(async () => {
    const q = await quem(slug);
    const tipo = z.enum(TIPOS_CANAL).parse(txt(fd, 'tipo', 30));
    const id = txt(fd, 'id', 40) || undefined;
    const tributosBps = pctCampo(fd, 'tributos');
    await salvarCanal(
      q.slug,
      {
        id,
        nome: txt(fd, 'nome', 60),
        tipo,
        comissaoBps: pctCampo(fd, 'comissao'),
        comissaoBase: fd.get('comissaoBruto') === 'on' ? 'bruto' : 'liquido',
        pagamentoBps: pctCampo(fd, 'pagamento'),
        tributosBps,
        tributosConfirmado: fd.get('tributosConfirmado') === 'on',
        embalagem: fd.get('embalagem') === 'on',
        ativo: id ? fd.get('ativo') === 'on' : true,
      },
      q.by,
    );
    await salvarPerfil(q.slug, {}, 'canais', q.by);
    return 'Canal salvo.';
  });
}

export async function criarCanalPainelAction(slug: string, _prev: Estado | null, fd: FormData): Promise<Estado> {
  void fd;
  return rodar(async () => {
    const q = await quem(slug);
    await salvarCanal(q.slug, { id: CANAL_PAINEL, nome: 'Pedidos pelo painel', tipo: 'delivery-proprio', comissaoBps: 0, comissaoBase: 'liquido', pagamentoBps: null, tributosBps: null, tributosConfirmado: false, embalagem: true, ativo: true }, q.by);
    await salvarPerfil(q.slug, {}, 'canais', q.by);
    // As vendas desse canal já vêm dos pedidos do painel.
    await salvarPerfil(q.slug, {}, 'vendas', q.by);
    return 'Canal dos pedidos do painel criado. Informe a taxa de pagamento.';
  });
}

export async function salvarPrioritariosAction(slug: string, _prev: Estado | null, fd: FormData): Promise<Estado> {
  return rodar(async () => {
    const q = await quem(slug);
    const ids = fd.getAll('produto').map(String).slice(0, 15);
    const ctx = await contexto(q.slug);
    if (ids.some((id) => !ctx.produtos.some((p) => p.id === id))) throw new DadosError('Produto não encontrado.');
    const meta = pctCampo(fd, 'meta');
    const validade = Number(txt(fd, 'validade', 4) || 90);
    await salvarPerfil(q.slug, { prioritarios: ids, metaContribuicaoBps: meta, custoValidadeDias: Number.isInteger(validade) ? validade : 90 }, 'produtos', q.by);
    return 'Produtos prioritários salvos.';
  });
}

export async function adicionarProdutoAction(slug: string, _prev: Estado | null, fd: FormData): Promise<Estado> {
  return rodar(async () => {
    const q = await quem(slug);
    const p = await adicionarProduto(q.slug, { nome: txt(fd, 'nome', 80), categoria: txt(fd, 'categoria', 60) }, q.by);
    return `${p.nome} cadastrado.`;
  });
}

// ───────────────────────────── Produtos e custos ─────────────────────────────

export async function adicionarCustoAction(slug: string, _prev: Estado | null, fd: FormData): Promise<Estado> {
  return rodar(async () => {
    const q = await quem(slug);
    const produtoId = txt(fd, 'produtoId', 40);
    let ingredientes = reais(fd, 'ingredientes');
    const custoLote = reais(fd, 'custoLote');
    let lote: { custo: number; rendimento: number } | null = null;
    if (custoLote !== null) {
      const rendimento = Number(txt(fd, 'rendimento', 10).replace(',', '.'));
      if (!(rendimento > 0)) throw new DadosError('Informe quantas porções o lote rende.');
      if (ingredientes !== null) throw new DadosError('Use o custo por unidade ou o lote com rendimento, não os dois.');
      ingredientes = Math.round(custoLote / rendimento);
      lote = { custo: custoLote, rendimento };
    }
    const inicio = dia(fd, 'inicio', hoje())!;
    if (inicio > hoje()) throw new DadosError('A data não pode ser no futuro.');
    await adicionarCustos(q.slug, [{ produtoId, ingredientes, embalagem: reais(fd, 'embalagem'), outros: reais(fd, 'outros'), lote, inicio, origem: lote ? 'calculado' : 'informado', loteId: null, nota: txt(fd, 'nota', 200), confirmadoPor: q.by }], q.by);
    await salvarPerfil(q.slug, {}, 'custos', q.by);
    return 'Custo registrado como nova versão.';
  });
}

export async function adicionarPrecoAction(slug: string, _prev: Estado | null, fd: FormData): Promise<Estado> {
  return rodar(async () => {
    const q = await quem(slug);
    const inicio = dia(fd, 'inicio', hoje())!;
    await adicionarPrecos(q.slug, [{ produtoId: txt(fd, 'produtoId', 40), canalId: txt(fd, 'canalId', 40), preco: reais(fd, 'preco', true)!, inicio, origem: 'informado', loteId: null }], q.by);
    return 'Preço registrado.';
  });
}

// ───────────────────────────── Importação ─────────────────────────────

const importSchema = z.object({ tipo: z.enum(TIPOS_LOTE), texto: z.string().max(MAX_BYTES_CSV), mapeamento: z.record(z.string(), z.number().int().min(0).max(29).nullable()).nullable(), arquivo: z.string().max(120) });

export async function previaAction(slug: string, input: unknown): Promise<{ ok: true; previa: Previa } | { ok: false; msg: string }> {
  try {
    const q = await quem(slug);
    const i = importSchema.parse(input);
    return { ok: true, previa: await previsualizar(q.slug, i.tipo, i.texto, i.mapeamento) };
  } catch (err) {
    if (err instanceof DadosError) return { ok: false, msg: err.message };
    if (err instanceof z.ZodError) return { ok: false, msg: 'Arquivo inválido.' };
    console.error('conselheiro prévia', err instanceof Error ? err.message : 'erro');
    return { ok: false, msg: 'Não foi possível ler o arquivo.' };
  }
}

export async function importarAction(slug: string, input: unknown): Promise<Estado> {
  return rodar(async () => {
    const q = await quem(slug);
    const i = importSchema.parse(input);
    const r = await importar(q.slug, { ...i, mapeamento: i.mapeamento ?? {} }, q.by);
    if (i.tipo === 'vendas') await salvarPerfil(q.slug, {}, 'vendas', q.by);
    if (i.tipo === 'custos') await salvarPerfil(q.slug, {}, 'custos', q.by);
    return `${r.importadas} linha(s) importada(s)${r.ignoradas ? `, ${r.ignoradas} ignorada(s)` : ''}.`;
  });
}

export async function desfazerLoteAction(slug: string, _prev: Estado | null, fd: FormData): Promise<Estado> {
  return rodar(async () => {
    const q = await quem(slug);
    await desfazerLote(q.slug, txt(fd, 'loteId', 40), q.by);
    return 'Lote desfeito: as vendas dele saíram das contas.';
  });
}

// ───────────────────────────── Simulações e decisões ─────────────────────────────

/** Recalcula as fontes no servidor: o que difere dos dados vigentes é marcado como hipótese. */
async function fontesServidor(slug: string, tipo: TipoSimulacao, entrada: Record<string, unknown>): Promise<{ fontes: Fonte[]; hipoteses: string[] }> {
  const hipoteses: string[] = [];
  const produtoId = typeof entrada.produtoId === 'string' ? entrada.produtoId : null;
  const canalId = typeof entrada.canalId === 'string' ? entrada.canalId : null;
  if (tipo === 'combo') return { fontes: [{ rotulo: 'Itens, preços e mix do combo', origem: 'hipotese', versao: 'simulador', data: hoje() }], hipoteses: ['Mix de clientes do combo', 'Combos vendidos no período'] };
  if (!produtoId || !canalId) return { fontes: [{ rotulo: 'Valores digitados no simulador', origem: 'hipotese', versao: 'simulador', data: hoje() }], hipoteses: ['Todos os valores foram digitados'] };
  const prep = await prepararBase(await contexto(slug), produtoId, canalId);
  const base = (tipo === 'preco' ? entrada.atual : entrada.base) as { preco?: number; custos?: { ingredientes?: number | null } } | undefined;
  if (prep.base && base) {
    if (base.preco !== prep.base.preco) hipoteses.push('Preço de hoje diferente do registrado');
    if (base.custos?.ingredientes !== prep.base.custos.ingredientes) hipoteses.push('Custo diferente do registrado');
  }
  if (entrada.volumeAtual !== prep.volumeAtual) hipoteses.push('Volume de hoje informado no simulador');
  const fontes = prep.fontes.map((f) => (f.rotulo.startsWith('Volume') && entrada.volumeAtual !== prep.volumeAtual ? { ...f, origem: 'hipotese' as const, versao: 'simulador' } : f));
  if (Array.isArray(entrada.volumes) && entrada.volumes.length) hipoteses.push('Volumes dos cenários');
  return { fontes, hipoteses };
}

const salvarSimSchema = z.object({
  tipo: z.enum(['preco', 'desconto', 'combo']),
  titulo: z.string().max(140),
  entrada: z.record(z.string(), z.unknown()),
  decisao: z.object({ recomendacao: z.string().max(1200), riscos: z.string().max(900), proximoPasso: z.string().max(400) }).nullable(),
});

export async function salvarSimulacaoAction(slug: string, input: unknown): Promise<Estado & { id?: string }> {
  let id: string | undefined;
  const r = await rodar(async () => {
    const q = await quem(slug);
    const i = salvarSimSchema.parse(input);
    const { fontes, hipoteses } = await fontesServidor(q.slug, i.tipo, i.entrada);
    const sim = await salvarSimulacao(q.slug, { tipo: i.tipo, titulo: i.titulo, entrada: i.entrada, fontes, hipoteses, origem: 'simulador', conversaId: null }, q.by);
    id = sim.id;
    if (i.decisao) {
      await criarDecisao(
        q.slug,
        {
          titulo: sim.titulo,
          pergunta: sim.titulo,
          metodo: i.tipo === 'preco' ? 'precificacao' : 'promocoes-combos',
          dadosUsados: fontes.map((f) => `${f.rotulo} (${f.origem === 'hipotese' ? 'hipótese' : f.origem}${f.data ? `, ${f.data}` : ''})`),
          faltando: [],
          hipoteses,
          calculos: '',
          recomendacao: i.decisao.recomendacao,
          riscos: i.decisao.riscos.split('\n').map((x) => x.trim()).filter(Boolean),
          proximoPasso: i.decisao.proximoPasso,
          simulacaoIds: [sim.id],
          produtos: typeof i.entrada.produtoId === 'string' ? [i.entrada.produtoId] : [],
          origem: 'simulador',
          conversaId: null,
        },
        q.by,
      );
      return 'Simulação salva e decisão criada (esperando aprovação em Decisões).';
    }
    return 'Simulação salva.';
  });
  return { ...r, id };
}

export async function mudarDecisaoAction(slug: string, _prev: Estado | null, fd: FormData): Promise<Estado> {
  return rodar(async () => {
    const q = await quem(slug);
    const para = z.enum(STATUS_DECISAO).parse(txt(fd, 'para', 20));
    if (para === 'em-teste') throw new DadosError('A decisão entra em teste quando o teste começa.');
    await mudarDecisao(q.slug, txt(fd, 'id', 40), para, txt(fd, 'motivo', 400), q.by);
    return 'Decisão atualizada.';
  });
}

// ───────────────────────────── Testes ─────────────────────────────

export async function criarTesteAction(slug: string, _prev: Estado | null, fd: FormData): Promise<Estado> {
  return rodar(async () => {
    const q = await quem(slug);
    const t = await criarTeste(
      q.slug,
      {
        nome: txt(fd, 'nome', 120),
        hipotese: txt(fd, 'hipotese'),
        produtos: fd.getAll('produto').map(String).slice(0, 10),
        canais: fd.getAll('canal').map(String).slice(0, 10),
        responsavel: txt(fd, 'responsavel', 80),
        metrica: z.enum(METRICAS).parse(txt(fd, 'metrica', 40)),
        protecao: txt(fd, 'protecao').split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 5),
        comparacao: z.enum(['antes-depois', 'controle']).parse(txt(fd, 'comparacao', 20)),
        inicio: dia(fd, 'inicio', null),
        fim: dia(fd, 'fim', null),
        premissas: txt(fd, 'premissas'),
        limites: txt(fd, 'limites'),
        decisaoId: txt(fd, 'decisaoId', 40) || null,
      },
      q.by,
    );
    return `Teste "${t.nome}" criado como rascunho.`;
  });
}

export async function mudarTesteAction(slug: string, _prev: Estado | null, fd: FormData): Promise<Estado> {
  return rodar(async () => {
    const q = await quem(slug);
    const para = z.enum(STATUS_TESTE).parse(txt(fd, 'para', 20));
    await mudarStatusTeste(q.slug, txt(fd, 'id', 40), para, { motivo: txt(fd, 'motivo', 400), decisaoFinal: txt(fd, 'decisaoFinal', 800) || undefined }, q.by);
    return 'Teste atualizado.';
  });
}

export async function resultadoManualAction(slug: string, _prev: Estado | null, fd: FormData): Promise<Estado> {
  return rodar(async () => {
    const q = await quem(slug);
    const t = (await getTestes(q.slug)).find((x) => x.id === txt(fd, 'id', 40));
    if (!t) throw new DadosError('Teste não encontrado.');
    const emDinheiro = t.metrica !== 'unidades';
    const valorTxt = txt(fd, 'valor', 30);
    const valor = emDinheiro ? parseReais(valorTxt.replace(/^-/, '')) : Number(valorTxt);
    if (valor === null || Number.isNaN(valor) || !Number.isInteger(valor)) throw new DadosError(emDinheiro ? 'Valor inválido (use 1.234,56).' : 'Informe um número inteiro.');
    const atend = txt(fd, 'atendimentos', 10);
    await registrarResultado(q.slug, t.id, { grupo: z.enum(['base', 'teste']).parse(txt(fd, 'grupo', 10)), valor: valorTxt.startsWith('-') ? -valor : valor, dias: Number(txt(fd, 'dias', 4)), atendimentos: atend ? Number(atend) : null, nota: txt(fd, 'nota', 400), origem: 'manual' }, q.by);
    return 'Resultado registrado (informado à mão).';
  });
}

export async function medirTesteAction(slug: string, id: string): Promise<{ ok: true; medicao: Medicao } | { ok: false; msg: string }> {
  try {
    const q = await quem(slug);
    const t = (await getTestes(q.slug)).find((x) => x.id === id);
    if (!t) return { ok: false, msg: 'Teste não encontrado.' };
    return { ok: true, medicao: await medirTeste(q.slug, t) };
  } catch (err) {
    if (err instanceof DadosError || err instanceof CalculoError) return { ok: false, msg: err.message };
    console.error('conselheiro medir', err instanceof Error ? err.message : 'erro');
    return { ok: false, msg: 'Não foi possível medir agora.' };
  }
}

/** Grava a medição calculada: refaz a conta no servidor (não aceita números do navegador). */
export async function registrarMedicaoAction(slug: string, _prev: Estado | null, fd: FormData): Promise<Estado> {
  return rodar(async () => {
    const q = await quem(slug);
    const t = (await getTestes(q.slug)).find((x) => x.id === txt(fd, 'id', 40));
    if (!t) throw new DadosError('Teste não encontrado.');
    const m = await medirTeste(q.slug, t);
    await registrarResultado(q.slug, t.id, { grupo: 'base', ...m.base, nota: `Calculado: ${m.base.periodo}`, origem: 'calculado' }, q.by);
    await registrarResultado(q.slug, t.id, { grupo: 'teste', ...m.teste, nota: `Calculado: ${m.teste.periodo}`, origem: 'calculado' }, q.by);
    return 'Base e teste registrados a partir das vendas.';
  });
}

// ───────────────────────────── Alertas ─────────────────────────────

export async function marcarAlertaAction(slug: string, _prev: Estado | null, fd: FormData): Promise<Estado> {
  return rodar(async () => {
    const q = await quem(slug);
    const acao = z.enum(['resolvido', 'adiado', 'dispensado']).parse(txt(fd, 'acao', 20));
    await marcarAlerta(q.slug, txt(fd, 'chave', 200), acao, txt(fd, 'motivo', 300), q.by);
    return acao === 'adiado' ? 'Alerta adiado por 7 dias.' : 'Alerta marcado.';
  });
}

// ───────────────────────────── Conversa ─────────────────────────────

export async function perguntarAction(slug: string, input: { conversaId: string | null; pergunta: string }): Promise<Resposta | { estado: 'erro-entrada'; erro: string }> {
  if (typeof slug !== 'string' || !isSlug(slug) || !input || typeof input.pergunta !== 'string') return { estado: 'erro-entrada', erro: 'Pergunta inválida.' };
  const u = await requireStoreAccess(slug, DONO);
  if (!(await take('conselheiro-ia-hora', slug, 40, hourWindow()))) return { estado: 'erro-entrada', erro: 'Muitas perguntas nesta hora. Espere um pouco.' };
  try {
    return await responder(slug, { conversaId: typeof input.conversaId === 'string' ? input.conversaId : null, pergunta: input.pergunta }, u.name || u.email);
  } catch (err) {
    return { estado: 'erro-entrada', erro: err instanceof Error && err.message.startsWith('Escreva') ? err.message : 'Não foi possível perguntar agora.' };
  }
}

/** Salva um cartão de uma resposta: lê o cartão gravado na conversa (não do navegador) e refaz a conta. */
export async function salvarCartaoAction(slug: string, input: { conversaId: string; mensagemId: string; indice: number; comoDecisao: boolean }): Promise<Estado> {
  return rodar(async () => {
    const q = await quem(slug);
    const c = await getConversa(q.slug, String(input?.conversaId ?? ''));
    const m = c?.mensagens.find((x) => x.id === input.mensagemId && x.papel === 'conselheiro');
    const cartao = m?.cartoes[Number(input.indice)];
    if (!c || !m || !cartao) throw new DadosError('Cartão não encontrado.');
    const simCards = m.cartoes.filter((x) => x.tipo === 'simulacao');
    const salvarSim = async (s: (typeof simCards)[number]) => {
      if (s.tipo !== 'simulacao') throw new Error('tipo');
      const sim = await salvarSimulacao(q.slug, { tipo: s.simulacao.tipo, titulo: s.titulo, entrada: s.simulacao.entrada, fontes: s.fontes, hipoteses: s.fontes.filter((f) => f.origem === 'hipotese').map((f) => f.rotulo), origem: 'conselheiro', conversaId: c.id }, q.by);
      return sim.id;
    };
    if (cartao.tipo === 'simulacao') {
      const id = await salvarSim(cartao);
      if (!input.comoDecisao) return 'Simulação salva.';
      await criarDecisao(q.slug, { titulo: cartao.titulo, pergunta: c.mensagens[c.mensagens.indexOf(m) - 1]?.texto.slice(0, 600) ?? '', metodo: m.metodo ?? '', dadosUsados: cartao.fontes.map((f) => f.rotulo), faltando: cartao.faltando, hipoteses: [], calculos: cartao.resumo.join('\n').slice(0, 1200), recomendacao: m.texto.slice(0, 1200), riscos: [], proximoPasso: '', simulacaoIds: [id], produtos: [], origem: 'conselheiro', conversaId: c.id }, q.by);
      return 'Simulação salva e decisão criada (esperando aprovação em Decisões).';
    }
    if (cartao.tipo === 'recomendacao') {
      const ids: string[] = [];
      for (const i of cartao.rascunho.simulacoes) if (simCards[i]) ids.push(await salvarSim(simCards[i]));
      const r = cartao.rascunho;
      await criarDecisao(q.slug, { titulo: r.titulo, pergunta: r.pergunta, metodo: r.metodo, dadosUsados: r.dadosUsados, faltando: r.faltando, hipoteses: r.hipoteses, calculos: r.calculos, recomendacao: r.recomendacao, riscos: r.riscos, proximoPasso: r.proximoPasso, simulacaoIds: ids, produtos: r.produtos, origem: 'conselheiro', conversaId: c.id }, q.by);
      return 'Recomendação salva em Decisões, esperando sua aprovação.';
    }
    throw new DadosError('Esse cartão não tem o que salvar.');
  });
}
