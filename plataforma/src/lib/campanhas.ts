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
}

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  { id: 'saudade', label: 'Cliente que sumiu', month: null, opening: (s) => `Faz tempo que você não pede com a gente! Aqui é do ${s}.` },
  { id: 'novidade', label: 'Novidade no cardápio', month: null, opening: (s) => `Tem novidade no ${s}: [escreva aqui o prato novo].`, hint: 'Troque o texto entre colchetes pelo prato novo.' },
  { id: 'jogo', label: 'Dia de jogo', month: null, opening: (s) => `Dia de jogo pede comida boa. Aqui é do ${s}.` },
  { id: 'aniversario', label: 'Aniversário da casa', month: null, opening: (s) => `O ${s} está fazendo aniversário e quem ganha presente é você.`, hint: 'Use só no mês do aniversário de verdade e com um cupom.' },
  { id: 'consumidor', label: 'Dia do Consumidor (15/3)', month: 3, opening: (s) => `Hoje é Dia do Consumidor e o ${s} preparou um mimo para você.`, hint: 'Precisa de um cupom.' },
  { id: 'maes', label: 'Dia das Mães', month: 5, opening: (s) => `Dia das Mães é dia de ninguém ir para a cozinha. Deixa com o ${s}.` },
  { id: 'namorados', label: 'Dia dos Namorados', month: 6, opening: (s) => `Jantar a dois sem sair de casa? O ${s} leva até você.` },
  { id: 'ferias', label: 'Férias de julho', month: 7, opening: (s) => `Férias combinam com pedir comida e não lavar louça. Aqui é do ${s}.` },
  { id: 'pais', label: 'Dia dos Pais', month: 8, opening: (s) => `Dia dos Pais pede um almoço caprichado. O ${s} cuida disso.` },
  { id: 'criancas', label: 'Dia das Crianças', month: 10, opening: (s) => `Dia das Crianças é dia de pedir o que a criançada gosta. Aqui é do ${s}.` },
  { id: 'black-friday', label: 'Black Friday', month: 11, opening: (s) => `Black Friday no ${s}.`, hint: 'Só com desconto de verdade sobre o preço de sempre (o Procon fiscaliza).' },
  { id: 'fim-de-ano', label: 'Fim de ano', month: 12, opening: (s) => `Obrigado por pedir com a gente este ano! Aqui é do ${s}.` },
];

/** The template that fits this month best, or "cliente que sumiu" when no date applies. */
export function suggestedTemplate(month = new Date().getMonth() + 1): CampaignTemplate {
  return CAMPAIGN_TEMPLATES.find((t) => t.month === month) ?? CAMPAIGN_TEMPLATES[0];
}

export function campaignMessage(template: CampaignTemplate, store: string, offer: string, siteUrl: string): string {
  const link = siteUrl ? ` Peça pelo site: ${siteUrl}` : '';
  return `${template.opening(store)}${offer ? ` ${offer}` : ''}${link}\n\nPara não receber mais promoções, responda SAIR.`;
}
