import type { Categoria } from '@/lib/oportunidades/regras';

export const CHIP_CATEGORIA: Record<Categoria, string> = {
  'sem-site': 'bg-accent-soft text-accent',
  'so-rede-social': 'bg-warn/10 text-warn',
  'site-com-problemas': 'bg-bad/10 text-bad',
  'site-proprio': 'bg-ok/10 text-ok',
  incerta: 'bg-line text-ink-soft',
};

export const dataCurta = (iso?: string) => (iso ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso)) : '');

/** Only plain web links from Google's data become clickable. */
export const linkSeguro = (url?: string) => (url && /^https?:\/\//i.test(url) ? url : undefined);

export const usd = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'USD' });

/** Google Maps text attribution, required wherever Places content is shown without a Google map. */
export function AtribuicaoGoogle() {
  return <p className="text-xs text-ink-mute">Dados de lugares: <span className="font-semibold text-ink-soft">Google Maps</span></p>;
}
