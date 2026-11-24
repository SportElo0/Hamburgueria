import { z } from 'zod';
import { brl } from '../ordering';
import { MENU_CLASS_LABEL, simulatePrice, type Analysis, type ProductRow } from './analise';

/**
 * Recomendações geradas por regras fixas a partir da análise (sem IA). Cada uma diz o que
 * os números mostram, sugere um TESTE e diz o que medir depois. Nada é aplicado sozinho:
 * a Growlift revisa, o dono aprova, e só então alguém executa.
 */

export type Confidence = 'baixa' | 'media' | 'alta';

export const CONFIDENCE_LABEL: Record<Confidence, string> = { baixa: 'Confiança baixa', media: 'Confiança média', alta: 'Confiança alta' };

export interface Recommendation {
  /** Estável entre períodos (regra + produto), para a decisão continuar valendo. */
  id: string;
  rule: string;
  title: string;
  evidence: string[];
  suggestion: string;
  measure: string;
  confidence: Confidence;
  /** Ordem de importância (maior primeiro). */
  weight: number;
}

const MIN_ORDERS = 30;

const pct = (x: number, digits = 0) => `${(x * 100).toFixed(digits).replace('.', ',')}%`;

function confidenceFor(quantity: number, orders: number): Confidence {
  if (quantity >= 50 && orders >= 100) return 'alta';
  if (quantity >= 15 && orders >= MIN_ORDERS) return 'media';
  return 'baixa';
}

export function recommend(a: Analysis): Recommendation[] {
  const out: Recommendation[] = [];
  const orders = a.current.orders;
  if (orders === 0) return out;

  if (a.costCoverage < 0.8) {
    const missing = a.products.filter((p) => p.unitCost === null).sort((x, y) => y.revenue - x.revenue);
    out.push({
      id: 'custos-faltando',
      rule: 'custos',
      title: 'Completar os custos dos itens mais vendidos',
      evidence: [
        `Só ${pct(a.costCoverage)} da receita de itens tem custo informado.`,
        `Sem custo: ${missing.slice(0, 5).map((p) => p.name).join(', ')}${missing.length > 5 ? ` e mais ${missing.length - 5}` : ''}.`,
      ],
      suggestion: 'Preencher a ficha técnica (ou o custo unitário) desses itens antes de mexer em preço ou cardápio.',
      measure: 'Cobertura de custos acima de 80% da receita.',
      confidence: 'alta',
      weight: 100,
    });
  }

  else {
    const missing = a.products.filter((p) => p.unitCost === null && p.revenue > 0).sort((x, y) => y.revenue - x.revenue);
    if (missing.length) {
      out.push({
        id: 'custos-faltando',
        rule: 'custos',
        title: `Informar o custo de ${missing.length === 1 ? missing[0].name : `${missing.length} itens`}`,
        evidence: [`Sem custo: ${missing.map((p) => p.name).join(', ')} (${pct(1 - a.costCoverage)} da receita de itens). Eles ficam fora da matriz.`],
        suggestion: 'Preencher a ficha técnica ou o custo unitário desses itens.',
        measure: 'Todos os itens vendidos com custo.',
        confidence: 'alta',
        weight: 40,
      });
    }
  }

  if (!a.feesConfirmed) {
    out.push({
      id: 'taxas-nao-confirmadas',
      rule: 'taxas',
      title: 'Confirmar as taxas de Pix e cartão',
      evidence: ['As margens estão sendo calculadas sem as taxas do meio de pagamento, que a loja ainda não confirmou.'],
      suggestion: 'Pegar no extrato da maquininha e da conta do Pix a taxa cobrada de cada forma de pagamento.',
      measure: 'Taxas confirmadas na tela de custos.',
      confidence: 'alta',
      weight: 90,
    });
  }

  const byClass = (c: ProductRow['menuClass']) => a.products.filter((p) => p.menuClass === c);
  const groupOf = (p: ProductRow) => a.matrix.find((g) => g.category === p.category);

  for (const p of byClass('quebra-cabeca')
    .sort((x, y) => (y.unitContribution ?? 0) - (x.unitContribution ?? 0))
    .slice(0, 2)) {
    out.push({
      id: `destaque:${p.productId}`,
      rule: 'quebra-cabeca',
      title: `Testar dar mais destaque a ${p.name}`,
      evidence: [
        `${MENU_CLASS_LABEL['quebra-cabeca']} em ${p.category}: deixa ${brl(p.unitContribution ?? 0)} por unidade (média da categoria: ${brl(groupOf(p)?.marginThreshold ?? 0)}).`,
        `Vendeu ${p.quantity} no período (${pct(p.mixShare ?? 0, 1)} das unidades de ${p.category}).`,
      ],
      suggestion: 'Colocar como destaque no topo do cardápio, com foto boa e descrição curta, por 30 dias.',
      measure: `Unidades vendidas de ${p.name} nos 30 dias seguintes, comparadas a estes ${a.current.days} dias.`,
      confidence: confidenceFor(p.quantity, orders),
      weight: 60 + Math.min(20, (p.unitContribution ?? 0) / 100),
    });
  }

  for (const p of byClass('cavalo-de-batalha')
    .sort((x, y) => y.quantity - x.quantity)
    .slice(0, 2)) {
    const lowRate = (p.marginRate ?? 0) < (a.contributionRate ?? 0);
    const evidence = [
      `${MENU_CLASS_LABEL['cavalo-de-batalha']} em ${p.category}: vendeu ${p.quantity} (${pct(p.mixShare ?? 0, 1)} das unidades da categoria), mas deixa ${brl(p.unitContribution ?? 0)} por unidade (média da categoria: ${brl(groupOf(p)?.marginThreshold ?? 0)}).`,
      `Margem sobre a venda: ${pct(p.marginRate ?? 0)} (média da loja: ${pct(a.contributionRate ?? 0)}).`,
    ];
    if (lowRate) {
      const plus = Math.ceil((p.averagePrice * 1.05) / 50) * 50;
      const sim = simulatePrice(p, plus);
      if (sim?.volumeTolerance !== null && sim?.volumeTolerance !== undefined) {
        evidence.push(
          `Simulação: a ${brl(plus)} (hoje ${brl(p.averagePrice)} em média), a margem total se mantém mesmo vendendo até ${pct(-sim.volumeTolerance)} menos.`,
        );
      }
      out.push({
        id: `revisar:${p.productId}`,
        rule: 'cavalo-de-batalha',
        title: `Revisar custo ou preço de ${p.name}`,
        evidence,
        suggestion: 'Primeiro conferir porção e fornecedor dos insumos. Se o custo estiver certo, testar um reajuste pequeno e acompanhar as vendas.',
        measure: `Margem por unidade e quantidade vendida de ${p.name} no mês seguinte.`,
        confidence: confidenceFor(p.quantity, orders),
        weight: 55 + Math.min(20, p.quantity / 10),
      });
    } else {
      out.push({
        id: `combo:${p.productId}`,
        rule: 'cavalo-de-batalha',
        title: `Usar ${p.name} para puxar itens de margem maior`,
        evidence,
        suggestion: `${p.name} já tem boa margem sobre o preço, só que em reais deixa pouco por unidade. Testar um combo com um item que deixa mais, sem mexer no preço de ${p.name}.`,
        measure: 'Venda do item do combo e ticket médio das próximas 4 semanas.',
        confidence: confidenceFor(p.quantity, orders),
        weight: 45 + Math.min(15, p.quantity / 20),
      });
    }
  }

  for (const p of byClass('abacaxi')
    .sort((x, y) => x.quantity - y.quantity)
    .slice(0, 1)) {
    out.push({
      id: `abacaxi:${p.productId}`,
      rule: 'abacaxi',
      title: `Avaliar reformular ou tirar ${p.name}`,
      evidence: [
        `${MENU_CLASS_LABEL.abacaxi} em ${p.category}: vendeu ${p.quantity} e deixa ${brl(p.unitContribution ?? 0)} por unidade, abaixo da média da categoria (${brl(groupOf(p)?.marginThreshold ?? 0)}).`,
      ],
      suggestion: 'Conversar com a cozinha: dá para mudar a receita, combinar com outro item ou retirar do cardápio para simplificar?',
      measure: 'Decisão registrada e, se mudar, vendas do item ou do substituto.',
      confidence: confidenceFor(p.quantity, orders),
      weight: 35,
    });
  }

  if (a.comparison.reliable && a.comparison.average !== null && a.comparison.average <= -0.08) {
    out.push({
      id: 'ticket-caiu',
      rule: 'ticket',
      title: 'Entender a queda do ticket médio',
      evidence: [
        `Ticket médio de ${brl(a.current.average)}, ${pct(-a.comparison.average)} abaixo dos ${a.previous.days} dias anteriores (${brl(a.previous.average)}).`,
        `${a.current.orders} pedidos agora e ${a.previous.orders} antes.`,
      ],
      suggestion: 'Ver se caiu a venda de bebidas e adicionais, ou se entrou um cupom; testar sugerir um adicional no carrinho.',
      measure: 'Ticket médio das próximas 4 semanas.',
      confidence: a.current.orders >= 100 ? 'alta' : 'media',
      weight: 70,
    });
  }

  if (a.current.revenue && a.current.discounts / (a.current.revenue + a.current.discounts) > 0.08) {
    out.push({
      id: 'cupons-pesando',
      rule: 'cupons',
      title: 'Rever o peso dos cupons',
      evidence: [`Os cupons deram ${brl(a.current.discounts)} de desconto, ${pct(a.current.discounts / (a.current.revenue + a.current.discounts))} do que seria vendido sem eles.`],
      suggestion: 'Ver quais cupons trazem cliente novo e quais só dão desconto a quem já compraria; manter os que trazem gente nova.',
      measure: 'Desconto sobre a venda e clientes novos por cupom.',
      confidence: a.current.orders >= 100 ? 'media' : 'baixa',
      weight: 50,
    });
  }

  return out.sort((x, y) => y.weight - x.weight);
}

export const DECISION_STATUSES = ['aprovada', 'em-teste', 'concluida', 'descartada'] as const;
export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export const DECISION_LABEL: Record<DecisionStatus, string> = {
  aprovada: 'Aprovada pelo dono',
  'em-teste': 'Em teste',
  concluida: 'Concluída',
  descartada: 'Descartada',
};

export const decisionSchema = z.object({
  status: z.enum(DECISION_STATUSES),
  note: z.string().trim().max(500),
  by: z.string().max(120),
  at: z.string(),
});
export type Decision = z.infer<typeof decisionSchema>;
