// Business facts. `null` means "not supplied by the restaurant yet": the UI shows an admin placeholder
// instead of inventing anything. Fill these in (or wire them to a CMS) to go live.

export interface RestaurantInfo {
  name: string;
  tagline: string;
  /** International format without symbols, e.g. "5511999999999". Enables real WhatsApp orders. */
  whatsappNumber: string | null;
  address: string | null;
  city: string | null;
  hours: { days: string; time: string }[] | null;
  mapsUrl: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  cnpj: string | null;
}

export const restaurant: RestaurantInfo = {
  name: 'Downtown Burger',
  tagline: 'Burguer artesanal feito com qualidade.',
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, '') || null,
  address: null,
  city: null,
  hours: null,
  mapsUrl: null,
  phone: null,
  email: null,
  instagram: null,
  cnpj: null,
};
