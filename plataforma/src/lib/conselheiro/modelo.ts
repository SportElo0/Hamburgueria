import { z } from 'zod';

/**
 * Modelo de dados do Conselheiro. Tudo de uma loja fica em `conselheiro/<slug>/...` no armazenamento de
 * documentos do painel (Postgres em produção, arquivos nos testes), e toda leitura e gravação recebe o
 * slug já conferido pela sessão. Ver CONSELHEIRO.md.
 *
 * Dinheiro em centavos inteiros, percentuais em pontos-base (100 = 1%), datas em AAAA-MM-DD (São Paulo).
 */

const texto = (max: number) => z.string().trim().max(max);
/** Ids do Conselheiro e do cardápio (que aceita letras, números, _ e -). */
export const idSchema = z.string().regex(/^[A-Za-z0-9][\w-]{0,39}$/);
export const diaSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const centavos = z.number().int().min(0).max(100_000_000);
const pontos = z.number().int().min(0).max(10_000);

/**
 * De onde veio um dado. "cardapio": preço do cardápio do painel; "ficha": ficha técnica da Inteligência
 * (montada pela equipe); "calculado": conta do painel a partir de outros dados.
 */
export const ORIGENS = ['informado', 'importado', 'cardapio', 'ficha', 'calculado'] as const;
export type Origem = (typeof ORIGENS)[number];
export const NOME_ORIGEM: Record<Origem, string> = {
  informado: 'informado pelo dono',
  importado: 'importado de planilha',
  cardapio: 'cardápio do painel',
  ficha: 'ficha técnica da Growlift',
  calculado: 'calculado pelo painel',
};

// ───────────────────────────── Perfil e canais ─────────────────────────────

export const TIPOS_CANAL = ['salao', 'delivery-proprio', 'retirada', 'app', 'outro'] as const;
export const NOME_TIPO_CANAL: Record<(typeof TIPOS_CANAL)[number], string> = {
  salao: 'Salão',
  'delivery-proprio': 'Delivery próprio',
  retirada: 'Retirada',
  app: 'App de delivery',
  outro: 'Outro',
};

/** O canal "painel" representa os pedidos que já passam pelo painel da Growlift (site e mesa). */
export const CANAL_PAINEL = 'painel';

export const canalSchema = z.object({
  id: idSchema,
  nome: texto(60).min(1),
  tipo: z.enum(TIPOS_CANAL),
  /** null = não informado. */
  comissaoBps: pontos.nullable(),
  comissaoBase: z.enum(['liquido', 'bruto']),
  pagamentoBps: pontos.nullable(),
  /** Tributo variável só entra na conta depois que o dono confirma o percentual (o painel não deduz regime). */
  tributosBps: pontos.nullable(),
  tributosConfirmado: z.boolean(),
  /** Usa embalagem (delivery, retirada). */
  embalagem: z.boolean(),
  ativo: z.boolean(),
  atualizadoEm: z.string().max(40),
  atualizadoPor: texto(120),
});
export type Canal = z.infer<typeof canalSchema>;

export const ETAPAS = ['negocio', 'canais', 'produtos', 'custos', 'vendas'] as const;
export type Etapa = (typeof ETAPAS)[number];
export const NOME_ETAPA: Record<Etapa, string> = {
  negocio: 'O negócio',
  canais: 'Canais de venda',
  produtos: 'Produtos prioritários',
  custos: 'Custos',
  vendas: 'Vendas',
};

export const perfilSchema = z.object({
  segmento: texto(80),
  unidade: texto(80),
  horarios: texto(300),
  publico: texto(300),
  objetivos: texto(600),
  restricoes: texto(600),
  sistemaAtual: texto(120),
  canais: z.array(canalSchema).max(12),
  /** Até 15 produtos para começar. */
  prioritarios: z.array(idSchema).max(15),
  /** Meta mínima de contribuição sobre o preço, definida pelo cliente (null = sem meta). */
  metaContribuicaoBps: pontos.nullable(),
  /** Depois de quantos dias um custo conta como desatualizado. */
  custoValidadeDias: z.number().int().min(7).max(365),
  etapas: z.record(z.string(), z.boolean()),
  atualizadoEm: z.string().max(40),
  atualizadoPor: texto(120),
});
export type Perfil = z.infer<typeof perfilSchema>;

export const PERFIL_VAZIO: Perfil = {
  segmento: '',
  unidade: '',
  horarios: '',
  publico: '',
  objetivos: '',
  restricoes: '',
  sistemaAtual: '',
  canais: [],
  prioritarios: [],
  metaContribuicaoBps: null,
  custoValidadeDias: 90,
  etapas: {},
  atualizadoEm: '',
  atualizadoPor: '',
};

// ───────────────────────────── Produtos, preços e custos ─────────────────────────────

/** Produto cadastrado no Conselheiro (para quem não usa o cardápio do painel). Ids começam com "p-". */
export const produtoSchema = z.object({
  id: idSchema,
  nome: texto(80).min(1),
  categoria: texto(60),
  ativo: z.boolean(),
  origem: z.enum(['informado', 'importado']),
  loteId: idSchema.nullable(),
  criadoEm: z.string().max(40),
  criadoPor: texto(120),
});
export type ProdutoCadastrado = z.infer<typeof produtoSchema>;

/** Preço de um produto num canal a partir de uma data. O mais recente que já começou vale. */
export const precoSchema = z.object({
  id: idSchema,
  produtoId: idSchema,
  canalId: idSchema,
  preco: centavos,
  inicio: diaSchema,
  origem: z.enum(['informado', 'importado']),
  loteId: idSchema.nullable(),
  registradoEm: z.string().max(40),
  registradoPor: texto(120),
});
export type PrecoCanal = z.infer<typeof precoSchema>;

/**
 * Uma versão do custo de 1 unidade. Nunca é editada: um custo novo é uma versão nova, e as simulações
 * guardam a versão que usaram.
 */
export const custoSchema = z.object({
  id: idSchema,
  produtoId: idSchema,
  ingredientes: centavos.nullable(),
  embalagem: centavos.nullable(),
  outros: centavos.nullable(),
  /** Quando veio de lote ÷ rendimento: o cálculo fica registrado. */
  lote: z.object({ custo: centavos, rendimento: z.number().positive().max(100_000) }).nullable(),
  inicio: diaSchema,
  origem: z.enum(['informado', 'importado', 'calculado']),
  loteId: idSchema.nullable(),
  nota: texto(200),
  registradoEm: z.string().max(40),
  registradoPor: texto(120),
  /** Quem conferiu o valor. Dado extraído de texto ou planilha só vale depois de confirmado. */
  confirmadoPor: texto(120),
});
export type CustoVersao = z.infer<typeof custoSchema>;

/** Vendas agregadas de um produto num canal num período (importadas ou informadas). */
export const vendaSchema = z.object({
  produtoId: idSchema,
  canalId: idSchema,
  inicio: diaSchema,
  fim: diaSchema,
  quantidade: z.number().int().min(0).max(10_000_000),
  /** Receita depois dos descontos, em centavos. */
  receita: z.number().int().min(0).max(100_000_000_000),
  desconto: z.number().int().min(0).max(100_000_000_000).nullable(),
  /** Unidades canceladas ou devolvidas no período (já fora da quantidade). */
  canceladas: z.number().int().min(0).max(10_000_000),
});
export type Venda = z.infer<typeof vendaSchema>;

export const TIPOS_LOTE = ['produtos', 'custos', 'precos', 'vendas'] as const;
export type TipoLote = (typeof TIPOS_LOTE)[number];

export const loteSchema = z.object({
  id: idSchema,
  tipo: z.enum(TIPOS_LOTE),
  arquivo: texto(120),
  /** SHA-256 do conteúdo: o mesmo arquivo não entra duas vezes. */
  hash: z.string().regex(/^[a-f0-9]{64}$/),
  linhas: z.number().int().min(0),
  importadas: z.number().int().min(0),
  ignoradas: z.number().int().min(0),
  periodo: z.object({ inicio: diaSchema, fim: diaSchema }).nullable(),
  em: z.string().max(40),
  por: texto(120),
  desfeitoEm: z.string().max(40).nullable(),
});
export type Lote = z.infer<typeof loteSchema>;

// ───────────────────────────── Simulações, decisões e testes ─────────────────────────────

export const TIPOS_SIMULACAO = ['preco', 'desconto', 'combo'] as const;
export type TipoSimulacao = (typeof TIPOS_SIMULACAO)[number];
export const NOME_SIMULACAO: Record<TipoSimulacao, string> = { preco: 'Mudança de preço', desconto: 'Promoção com desconto', combo: 'Combo' };

/** Referência a um dado usado numa conta: de onde veio e qual versão. */
export const fonteSchema = z.object({
  rotulo: texto(160),
  origem: z.enum(ORIGENS).or(z.literal('hipotese')),
  versao: texto(60),
  data: texto(40),
});
export type Fonte = z.infer<typeof fonteSchema>;

export const STATUS_DECISAO = ['proposta', 'aprovada', 'em-teste', 'concluida', 'descartada'] as const;
export type StatusDecisao = (typeof STATUS_DECISAO)[number];
export const NOME_STATUS_DECISAO: Record<StatusDecisao, string> = {
  proposta: 'Esperando o dono',
  aprovada: 'Aprovada',
  'em-teste': 'Em teste',
  concluida: 'Concluída',
  descartada: 'Descartada',
};

export const eventoSchema = z.object({ em: z.string().max(40), por: texto(120), de: texto(30), para: texto(30), motivo: texto(400) });
export type Evento = z.infer<typeof eventoSchema>;

export const decisaoSchema = z.object({
  id: idSchema,
  titulo: texto(140).min(1),
  pergunta: texto(600),
  metodo: texto(40),
  dadosUsados: z.array(texto(200)).max(20),
  faltando: z.array(texto(200)).max(20),
  hipoteses: z.array(texto(200)).max(20),
  calculos: texto(1200),
  recomendacao: texto(1200),
  riscos: z.array(texto(300)).max(10),
  proximoPasso: texto(400),
  simulacaoIds: z.array(idSchema).max(10),
  produtos: z.array(idSchema).max(10),
  status: z.enum(STATUS_DECISAO),
  origem: z.enum(['conselheiro', 'simulador', 'manual']),
  conversaId: idSchema.nullable(),
  testeId: idSchema.nullable(),
  historico: z.array(eventoSchema).max(50),
  criadaEm: z.string().max(40),
  criadaPor: texto(120),
});
export type Decisao = z.infer<typeof decisaoSchema>;

export const STATUS_TESTE = ['rascunho', 'aprovado', 'em-andamento', 'concluido', 'interrompido', 'inconclusivo'] as const;
export type StatusTeste = (typeof STATUS_TESTE)[number];
export const NOME_STATUS_TESTE: Record<StatusTeste, string> = {
  rascunho: 'Rascunho',
  aprovado: 'Aprovado',
  'em-andamento': 'Em andamento',
  concluido: 'Concluído',
  interrompido: 'Interrompido',
  inconclusivo: 'Inconclusivo',
};
/** Para onde cada estado pode ir. Os três últimos são finais. */
export const PROXIMOS_TESTE: Record<StatusTeste, StatusTeste[]> = {
  rascunho: ['aprovado', 'interrompido'],
  aprovado: ['em-andamento', 'interrompido'],
  'em-andamento': ['concluido', 'inconclusivo', 'interrompido'],
  concluido: [],
  interrompido: [],
  inconclusivo: [],
};

export const METRICAS = ['contribuicao-total', 'contribuicao-por-atendimento', 'unidades', 'receita'] as const;
export type Metrica = (typeof METRICAS)[number];
export const NOME_METRICA: Record<Metrica, string> = {
  'contribuicao-total': 'Contribuição total',
  'contribuicao-por-atendimento': 'Contribuição por atendimento elegível',
  unidades: 'Unidades vendidas',
  receita: 'Receita depois dos descontos',
};
/** Métricas em centavos (as outras são contagens). */
export const METRICA_EM_DINHEIRO: Record<Metrica, boolean> = { 'contribuicao-total': true, 'contribuicao-por-atendimento': true, unidades: false, receita: true };

export const resultadoSchema = z.object({
  id: idSchema,
  grupo: z.enum(['base', 'teste']),
  /** "manual": digitado pelo dono; "calculado": somado pelo painel a partir das vendas. */
  origem: z.enum(['manual', 'calculado']),
  valor: z.number().int().min(-100_000_000_000).max(100_000_000_000),
  dias: z.number().int().min(1).max(366),
  atendimentos: z.number().int().min(0).max(10_000_000).nullable(),
  nota: texto(400),
  em: z.string().max(40),
  por: texto(120),
});
export type ResultadoTeste = z.infer<typeof resultadoSchema>;

export const testeSchema = z.object({
  id: idSchema,
  nome: texto(120).min(1),
  hipotese: texto(600).min(1),
  produtos: z.array(idSchema).max(10),
  canais: z.array(idSchema).max(10),
  responsavel: texto(80),
  metrica: z.enum(METRICAS),
  protecao: z.array(texto(120)).max(5),
  comparacao: z.enum(['antes-depois', 'controle']),
  inicio: diaSchema.nullable(),
  fim: diaSchema.nullable(),
  premissas: texto(600),
  limites: texto(600),
  status: z.enum(STATUS_TESTE),
  resultados: z.array(resultadoSchema).max(40),
  decisaoFinal: texto(800),
  decisaoId: idSchema.nullable(),
  historico: z.array(eventoSchema).max(50),
  criadoEm: z.string().max(40),
  criadoPor: texto(120),
});
export type Teste = z.infer<typeof testeSchema>;

// ───────────────────────────── Alertas e uso da IA ─────────────────────────────

export const estadoAlertaSchema = z.object({
  acao: z.enum(['resolvido', 'adiado', 'dispensado']),
  ate: diaSchema.nullable(),
  motivo: texto(300),
  em: z.string().max(40),
  por: texto(120),
});
export type EstadoAlerta = z.infer<typeof estadoAlertaSchema>;

export interface UsoMes {
  chamadas: number;
  erros: number;
  tokensEntrada: number;
  tokensSaida: number;
  tokensCache: number;
  latenciaMs: number;
  /** Custo estimado em milionésimos de dólar, pela tabela em ia.ts. */
  custoMicroUsd: number;
}
export const USO_VAZIO: UsoMes = { chamadas: 0, erros: 0, tokensEntrada: 0, tokensSaida: 0, tokensCache: 0, latenciaMs: 0, custoMicroUsd: 0 };
