/**
 * Ready-made WhatsApp campaign openings, one per occasion, so a monthly campaign takes minutes instead of hours.
 * Honest by design: no fake prizes, no invented scarcity; the offer comes from a real coupon and every message
 * ends with how to stop receiving them. `[...]` marks text the store must fill in before sending.
 */
export interface CampaignTemplate {
  id: string;
  label: string;
  /** Month (1-12) the template fits best; null = any time. */
  month: number | null;
  opening: (store: string) => string;
  /** A note for whoever sends it. */
  hint?: string;
  /** Days of `month` it fits (inclusive); outside them it isn't suggested. */
  days?: [number, number];
  /** The text promises something, so it can't go out without a real coupon. */
  needsCoupon?: boolean;
}

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  { id: 'saudade', label: 'Cliente que sumiu', month: null, opening: (s) => `Faz tempo que você não pede com a gente! Aqui é do ${s}.` },
  { id: 'novidade', label: 'Novidade no cardápio', month: null, opening: (s) => `Tem novidade no ${s}: [escreva aqui o prato novo].`, hint: 'Troque o texto entre colchetes pelo prato novo.' },
  { id: 'jogo', label: 'Dia de jogo', month: null, opening: (s) => `Dia de jogo pede comida boa. Aqui é do ${s}.` },
  { id: 'aniversario', label: 'Aniversário da casa', month: null, needsCoupon: true, opening: (s) => `O ${s} está fazendo aniversário e comemora com uma condição especial para você.`, hint: 'Só no mês do aniversário de verdade. Precisa de um cupom, de preferência com validade.' },
  { id: 'consumidor', label: 'Dia do Consumidor (15/3)', month: 3, days: [1, 15], needsCoupon: true, opening: (s) => `No Dia do Consumidor, o ${s} preparou uma condição especial para você.`, hint: 'Precisa de um cupom, de preferência com validade.' },
  { id: 'maes', label: 'Dia das Mães', month: 5, days: [1, 14], opening: (s) => `Dia das Mães é dia de ninguém ir para a cozinha. Deixa com o ${s}.` },
  { id: 'namorados', label: 'Dia dos Namorados', month: 6, days: [1, 12], opening: (s) => `Jantar a dois sem sair de casa? O ${s} leva até você.` },
  { id: 'ferias', label: 'Férias de julho', month: 7, opening: (s) => `Férias combinam com pedir comida e não lavar louça. Aqui é do ${s}.` },
  { id: 'pais', label: 'Dia dos Pais', month: 8, days: [1, 14], opening: (s) => `Dia dos Pais pede um almoço caprichado. O ${s} cuida disso.` },
  { id: 'criancas', label: 'Dia das Crianças', month: 10, days: [1, 12], opening: (s) => `Dia das Crianças é dia de pedir o que a criançada gosta. Aqui é do ${s}.` },
  { id: 'black-friday', label: 'Black Friday', month: 11, needsCoupon: true, opening: (s) => `Black Friday no ${s}.`, hint: 'Só com cupom de desconto de verdade sobre o preço de sempre, com validade (o Procon fiscaliza).' },
  { id: 'fim-de-ano', label: 'Fim de ano', month: 12, opening: (s) => `Obrigado por pedir com a gente este ano! Aqui é do ${s}.` },
];

/** The template whose date is near, or "cliente que sumiu" when none applies (a date that already passed doesn't count). */
export function suggestedTemplate(date = new Date()): CampaignTemplate {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return CAMPAIGN_TEMPLATES.find((t) => t.month === month && (!t.days || (day >= t.days[0] && day <= t.days[1]))) ?? CAMPAIGN_TEMPLATES[0];
}

/** Why this message can't be sent yet, or '' when it can. */
export function campaignProblem(template: CampaignTemplate, message: string, hasCoupon: boolean): string {
  if (template.needsCoupon && !hasCoupon) return 'Este modelo promete uma condição especial: escolha um cupom antes de enviar.';
  if (/\[[^\]]*\]/.test(message)) return 'Troque o texto entre colchetes antes de enviar.';
  if (!/responda SAIR/i.test(message)) return 'Deixe a linha "Para não receber mais promoções, responda SAIR." na mensagem.';
  return '';
}

export function campaignMessage(template: CampaignTemplate, store: string, offer: string, siteUrl: string): string {
  const link = siteUrl ? ` Peça pelo site: ${siteUrl}` : '';
  return `${template.opening(store)}${offer ? ` ${offer}` : ''}${link}\n\nPara não receber mais promoções, responda SAIR.`;
}
