import { z } from 'zod';
import { simularCombo, simularDesconto, simularPreco, type ResultadoCombo, type ResultadoDesconto, type ResultadoPreco } from './calculos';
import { fonteSchema, idSchema, type TipoSimulacao } from './modelo';

/**
 * Entradas de cada simulação, validadas igual no servidor, nas ferramentas da IA e na tela. A simulação
 * salva guarda a entrada inteira (com as versões dos dados usados) e o resultado: mudar um custo depois
 * não muda uma decisão já tomada.
 */

const c = z.number().int().min(0).max(100_000_000);
const p = z.number().int().min(0).max(10_000);
const vol = z.number().int().min(0).max(10_000_000);

export const unidadeSchema = z.object({
  preco: c,
  desconto: c,
  custos: z.object({ ingredientes: c.nullable(), embalagem: c.nullable(), outros: c.nullable() }),
  taxas: z.object({ comissaoBps: p.nullable(), comissaoBase: z.enum(['liquido', 'bruto']), pagamentoBps: p.nullable(), tributosBps: p.nullable() }),
});

const comum = {
  produtoId: idSchema.nullable(),
  canalId: idSchema.nullable(),
  /** Período de onde veio o volume de hoje (texto para o dono), ou "informado". */
  origemVolume: z.string().max(120),
};

export const entradaPrecoSchema = z.object({ ...comum, atual: unidadeSchema, proposto: unidadeSchema, volumeAtual: vol.nullable(), volumes: z.array(vol).max(12) });
export const entradaDescontoSchema = z.object({ ...comum, base: unidadeSchema, descontoBps: p, volumeAtual: vol.nullable(), volumes: z.array(vol).max(12), capacidade: vol.nullable() });
export const entradaComboSchema = z.object({
  canalId: idSchema.nullable(),
  origemVolume: z.string().max(120),
  itens: z
    .array(z.object({ id: z.string().max(40), nome: z.string().max(80), quantidade: z.number().int().min(1).max(20), precoAvulso: c, custoUnitario: c.nullable() }))
    .min(2)
    .max(8),
  principalId: z.string().max(40),
  precoCombo: c,
  taxas: unidadeSchema.shape.taxas,
  embalagem: c.nullable(),
  vendasCombo: vol,
  mix: z.object({ jaCompravamBps: p, soPrincipalBps: p, novosBps: p }),
});

export type EntradaPreco = z.infer<typeof entradaPrecoSchema>;
export type EntradaDesconto = z.infer<typeof entradaDescontoSchema>;
export type EntradaCombo = z.infer<typeof entradaComboSchema>;

export type Simulacao =
  | { tipo: 'preco'; entrada: EntradaPreco; resultado: ResultadoPreco }
  | { tipo: 'desconto'; entrada: EntradaDesconto; resultado: ResultadoDesconto }
  | { tipo: 'combo'; entrada: EntradaCombo; resultado: ResultadoCombo };

/** Valida a entrada e roda a conta. Lança CalculoError ou ZodError com entrada ruim. */
export function executar(tipo: TipoSimulacao, entrada: unknown): Simulacao {
  if (tipo === 'preco') {
    const e = entradaPrecoSchema.parse(entrada);
    return { tipo, entrada: e, resultado: simularPreco(e) };
  }
  if (tipo === 'desconto') {
    const e = entradaDescontoSchema.parse(entrada);
    return { tipo, entrada: e, resultado: simularDesconto(e) };
  }
  if (tipo === 'combo') {
    const e = entradaComboSchema.parse(entrada);
    return { tipo, entrada: e, resultado: simularCombo(e) };
  }
  throw new Error('Tipo de simulação inválido.');
}

export const simulacaoSalvaSchema = z.object({
  id: idSchema,
  tipo: z.enum(['preco', 'desconto', 'combo']),
  titulo: z.string().trim().min(1).max(140),
  entrada: z.unknown(),
  resultado: z.unknown(),
  fontes: z.array(fonteSchema).max(30),
  hipoteses: z.array(z.string().max(200)).max(20),
  origem: z.enum(['simulador', 'conselheiro']),
  conversaId: idSchema.nullable(),
  criadaEm: z.string().max(40),
  criadaPor: z.string().max(120),
});
export type SimulacaoSalva = Omit<z.infer<typeof simulacaoSalvaSchema>, 'entrada' | 'resultado'> & Simulacao;
