import 'server-only';
import type { Store } from './schema';
import { orderingOf } from './ordering';

const fone = (p: string) => {
  const d = p.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length === 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : p;
};

/** The seller block for the booking pages: the restaurant's legal data and its contacts. */
export function sellerOf(store: Store) {
  const s = orderingOf(store).reservations.seller;
  const contacts = [store.contact.whatsapp && `WhatsApp ${fone(store.contact.whatsapp)}`, store.contact.phone && `telefone ${store.contact.phone}`, store.contact.email].filter(Boolean);
  return {
    name: s.name,
    cnpj: s.cnpj,
    address: s.address,
    contact: contacts.length ? contacts.join(' · ') : s.privacyContact,
    privacyContact: s.privacyContact,
    keepMonths: s.keepMonths,
  };
}
