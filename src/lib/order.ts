// Builds the plain-text order handed to the restaurant over WhatsApp.
import type { Product } from '@/content/menu';
import { cartTotals, resolveSelections, type CartLine } from './cart';
import { formatBRL } from './money';

export interface OrderMeta {
  customerName?: string;
  /** Free-form note for the whole order. */
  note?: string;
}

export function buildOrderMessage(lines: CartLine[], lookup: (id: string) => Product | undefined, meta: OrderMeta = {}): string {
  const blocks: string[] = [];
  for (const line of lines) {
    const p = lookup(line.productId);
    if (!p) continue;
    const rows = [`${line.quantity}x ${p.name} — ${formatBRL(p.price * line.quantity)}`];
    for (const { group, choice } of resolveSelections(p, line.selections)) {
      if (group.id === 'adicionais') {
        const qty = line.quantity > 1 ? ` (${line.quantity}x)` : '';
        rows.push(`Adicional: ${choice.label.toLowerCase()}${qty} — ${formatBRL(choice.priceDelta * line.quantity)}`);
      } else if (group.included) {
        rows.push(`${group.label.replace(/ incluso$/i, '')}: ${choice.label.toLowerCase()} (incluso)`);
      } else {
        rows.push(`${group.label}: ${choice.label.toLowerCase()}${choice.priceDelta ? ` — ${formatBRL(choice.priceDelta * line.quantity)}` : ''}`);
      }
    }
    if (p.includes?.length && p.id === 'little-downtown') rows.push('Acompanha: batata frita');
    if (line.notes) rows.push(`Obs.: ${line.notes}`);
    blocks.push(rows.join('\n'));
  }
  const { total } = cartTotals(lines, lookup);
  const header = 'Olá! Gostaria de fazer um pedido na Downtown Burger:';
  const footer = [`Total: ${formatBRL(total)}`];
  if (meta.customerName?.trim()) footer.push(`Nome: ${meta.customerName.trim()}`);
  if (meta.note?.trim()) footer.push(`Observações: ${meta.note.trim()}`);
  return [header, ...blocks, footer.join('\n')].join('\n\n');
}

export function whatsappUrl(number: string, message: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
