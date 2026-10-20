// Builds the plain-text order handed to the restaurant over WhatsApp.
import type { Product } from '@/content/menu';
import { cartTotals, resolveSelections, type CartLine } from './cart';
import { formatBRL } from './money';

export type OrderMode = 'entrega' | 'retirada';

export interface OrderMeta {
  mode?: OrderMode;
  /** Delivery address, used when mode is "entrega". */
  address?: string;
  customerName?: string;
  /** Free-form note for the whole order. */
  note?: string;
}

export function buildOrderMessage(lines: CartLine[], lookup: (id: string) => Product | undefined, meta: OrderMeta = {}): string {
  const blocks: string[] = [];
  for (const line of lines) {
    const p = lookup(line.productId);
    if (!p) continue;
    const picked = resolveSelections(p, line.selections);
    // A portion size changes the item's own price; add-ons stay listed with their own.
    const base = picked.reduce((sum, { group, choice }) => sum + (group.variant ? choice.priceDelta : 0), p.price);
    const rows = [`${line.quantity}x ${p.name} — ${formatBRL(base * line.quantity)}`];
    for (const { group, choice } of picked) {
      if (group.id === 'adicionais') {
        const qty = line.quantity > 1 ? ` (${line.quantity}x)` : '';
        rows.push(`Adicional: ${choice.label.toLowerCase()}${qty} — ${formatBRL(choice.priceDelta * line.quantity)}`);
      } else if (group.variant) {
        rows.push(`${group.label}: ${choice.label.toLowerCase()}`);
      } else if (group.included) {
        rows.push(`${group.label.replace(/ incluso$/i, '')}: ${choice.label.toLowerCase()} (incluso)`);
      } else {
        rows.push(`${group.label}: ${choice.label.toLowerCase()}${choice.priceDelta ? ` — ${formatBRL(choice.priceDelta * line.quantity)}` : ''}`);
      }
    }
    if (line.notes) rows.push(`Obs.: ${line.notes}`);
    blocks.push(rows.join('\n'));
  }
  const { total } = cartTotals(lines, lookup);
  const header = 'Olá! Gostaria de fazer um pedido no El Patron:';
  const footer = [`Total: ${formatBRL(total)}`];
  if (meta.mode === 'retirada') footer.push('Retirada no local');
  if (meta.mode === 'entrega') footer.push(`Entrega: ${meta.address?.trim() || 'endereço a combinar'}`);
  if (meta.customerName?.trim()) footer.push(`Nome: ${meta.customerName.trim()}`);
  if (meta.note?.trim()) footer.push(`Observações: ${meta.note.trim()}`);
  return [header, ...blocks, footer.join('\n')].join('\n\n');
}

export function whatsappUrl(number: string, message: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
