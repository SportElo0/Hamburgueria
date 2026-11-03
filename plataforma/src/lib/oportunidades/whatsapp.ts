import 'server-only';
import { LeadError, limites, listarLeads, telefoneLiberado, usoDoMes, verAoVivo } from './dados';
import { estimar, linkMaps, linkWhatsApp, type Lead } from './regras';
import { gravacaoPermitida } from '../ambiente';
import { take } from '../limits';
import { textosContatoDireto } from '../vendas/regras';

/**
 * "Mandar WhatsApp": the simple way to reach the businesses from Oportunidades. A page of up to 10 at a time, with the
 * name and phone live from Google (one Place Details each, shown and never stored) and a ready message. A person taps,
 * WhatsApp opens with the text, the person sends. Each business is contacted once; "Não quer" marks it "Não contatar".
 */

export const POR_PAGINA = 10;
/** Businesses without a working site first: they are the ones the offer is for. */
const ORDEM: Record<string, number> = { 'sem-site': 0, 'so-rede-social': 1, 'site-com-problemas': 2, incerta: 3 };

export const naFila = (l: Lead) => !l.contatado && l.situacao !== 'descartada' && l.situacao !== 'nao-contatar' && l.categoria !== 'site-proprio';

export function filaWhatsapp(leads: Lead[]) {
  return leads.filter(naFila).sort((a, b) => (ORDEM[a.categoria] ?? 9) - (ORDEM[b.categoria] ?? 9) || a.criadoEm.localeCompare(b.criadoEm));
}

export async function estimarPagina(now = new Date()) {
  const fila = filaWhatsapp(await listarLeads());
  const uso = await usoDoMes(now);
  return { fila: fila.length, ...estimar('detalhes', Math.min(POR_PAGINA, fila.length), uso.detalhes, limites().detalhes) };
}

export interface LinhaWhatsapp {
  placeId: string;
  nome: string;
  telefone: string;
  /** wa.me link with the message, only for mobile numbers. */
  whatsapp: string;
  maps: string;
  categoria: string;
}

/** The next page, live from Google. Nothing of it is stored. */
/** Pages per person per hour: reloading the page cannot burn the month's Google calls. */
export const PAGINAS_POR_HORA = 6;

export async function paginaWhatsapp(pular: string[], por: string, now = new Date(), ver = (id: string) => verAoVivo(id, now, true)): Promise<LinhaWhatsapp[]> {
  // A preview cannot count calls (read-only storage), so it makes none.
  if (!gravacaoPermitida()) throw new LeadError('Esta é uma versão de prévia: a lista só funciona no painel oficial.');
  if (!telefoneLiberado()) throw new LeadError('Para mostrar o WhatsApp dos negócios, ligue LEADS_MOSTRAR_TELEFONE=sim na Vercel.');
  if (!(await take('whatsapp-pagina', por, PAGINAS_POR_HORA, now.toISOString().slice(0, 13))))
    throw new LeadError(`Limite de ${PAGINAS_POR_HORA} páginas por hora (cada uma consulta o Google). Mande as mensagens desta lista e volte daqui a pouco.`);
  const fora = new Set(pular);
  const alvo = filaWhatsapp(await listarLeads())
    .filter((l) => !fora.has(l.placeId))
    .slice(0, POR_PAGINA);
  // One business Google cannot return (deleted, or the month's cap reached midway) must not hide the others.
  const linhas = await Promise.allSettled(
    alvo.map(async (l) => {
      const g = await ver(l.placeId);
      const texto = textosContatoDireto({ negocio: g.nome, segmento: l.segmento, categoria: l.categoria, cidade: l.cidade }).whatsapp;
      const wa = linkWhatsApp(g.telefone);
      return { placeId: l.placeId, nome: g.nome, telefone: g.telefone ?? '', whatsapp: wa ? `${wa}?text=${encodeURIComponent(texto)}` : '', maps: linkMaps(l.placeId), categoria: l.categoria };
    }),
  );
  const ok = linhas.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
  const falha = linhas.find((r) => r.status === 'rejected');
  if (!ok.length && falha) throw falha.reason;
  return ok;
}
