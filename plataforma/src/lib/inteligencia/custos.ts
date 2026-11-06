import { z } from 'zod';

/**
 * Custos de uma loja, informados pela equipe ou pelo dono: insumos, ficha técnica
 * por produto (ou custo unitário direto), embalagem e taxa de cada forma de pagamento.
 * Valores em centavos (inteiros); quantidades em decimais da unidade do insumo.
 * Sem custo informado, o produto fica "sem custo" e não entra nas contas de margem.
 */

const id = z.string().min(1).max(40);
const text = (max: number) => z.string().trim().max(max);

export const INGREDIENT_UNITS = ['kg', 'g', 'l', 'ml', 'un'] as const;
export type IngredientUnit = (typeof INGREDIENT_UNITS)[number];

export const ingredientSchema = z.object({
  id,
  name: text(80).min(1),
  unit: z.enum(INGREDIENT_UNITS),
  /** Centavos por 1 unidade (1 kg, 1 l, 1 un…). */
  costPerUnit: z.number().int().min(0).max(100_000_00),
});
export type Ingredient = z.infer<typeof ingredientSchema>;

export const recipeLineSchema = z.object({
  ingredientId: id,
  /** Quanto do insumo vai em 1 unidade do produto, na unidade do insumo (ex.: 0,15 kg). */
  quantity: z.number().min(0).max(1000),
});

export const productCostSchema = z.object({
  /** "ficha": soma da ficha técnica; "manual": custo unitário digitado. */
  mode: z.enum(['ficha', 'manual']),
  /** Centavos, usado no modo manual. */
  unitCost: z.number().int().min(0).max(10_000_000).nullable(),
  recipe: z.array(recipeLineSchema).max(40),
  /** Centavos de embalagem por unidade; `null` usa a embalagem padrão. */
  packaging: z.number().int().min(0).max(1_000_000).nullable(),
});
export type ProductCost = z.infer<typeof productCostSchema>;

/** Taxa em pontos-base (100 = 1%) cobrada pelo meio de pagamento, não pela Growlift. */
const bps = z.number().int().min(0).max(5000);

export const costSheetSchema = z.object({
  fees: z.object({ pix: bps, cartao: bps, dinheiro: bps }),
  /** A loja confirmou as taxas (sem isso o painel avisa que a margem está sem taxas). */
  feesConfirmed: z.boolean(),
  /** Centavos de embalagem por unidade quando o produto não define a sua. */
  packagingDefault: z.number().int().min(0).max(1_000_000),
  ingredients: z.array(ingredientSchema).max(300),
  products: z.record(id, productCostSchema),
});
export type CostSheet = z.infer<typeof costSheetSchema>;

export const EMPTY_COST_SHEET: CostSheet = {
  fees: { pix: 0, cartao: 0, dinheiro: 0 },
  feesConfirmed: false,
  packagingDefault: 0,
  ingredients: [],
  products: {},
};

/** Custo direto de 1 unidade (insumos ou manual + embalagem), ou `null` se não informado. */
export function unitCostOf(sheet: CostSheet, productId: string): number | null {
  const p = sheet.products[productId];
  if (!p) return null;
  let base: number | null;
  if (p.mode === 'manual') {
    base = p.unitCost;
  } else if (p.recipe.length === 0) {
    base = null;
  } else {
    let sum = 0;
    for (const line of p.recipe) {
      const ing = sheet.ingredients.find((i) => i.id === line.ingredientId);
      if (!ing) return null;
      sum += ing.costPerUnit * line.quantity;
    }
    base = Math.round(sum);
  }
  if (base === null) return null;
  return base + (p.packaging ?? sheet.packagingDefault);
}
