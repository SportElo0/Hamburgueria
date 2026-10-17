const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Formats integer centavos as "R$ 44,90" (regular space, safe for plain-text messages). */
export function formatBRL(cents: number): string {
  if (!Number.isInteger(cents)) throw new Error(`Price must be integer centavos, got ${cents}`);
  return brl.format(cents / 100).replace(/ /g, ' ');
}

/** Splits a price for typographic display: { currency: "R$", whole: "44", fraction: "90" }. */
export function priceParts(cents: number) {
  const whole = Math.floor(cents / 100);
  const fraction = String(cents % 100).padStart(2, '0');
  return { currency: 'R$', whole: whole.toLocaleString('pt-BR'), fraction };
}
