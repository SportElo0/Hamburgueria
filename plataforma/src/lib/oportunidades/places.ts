import 'server-only';
import { PLACE_ID } from './regras';

/**
 * Google Places API (New), server side only: the key lives in GOOGLE_MAPS_API_KEY and never reaches the browser.
 * Text Search: developers.google.com/maps/documentation/places/web-service/text-search
 * Place Details: developers.google.com/maps/documentation/places/web-service/place-details
 * Use of this code is subject to the Google Maps Platform Terms of Service: https://cloud.google.com/maps-platform/terms
 */

const BASE = 'https://places.googleapis.com/v1';

export class PlacesError extends Error {}

/** A place as Google returned it. Shown on screen and then dropped: the terms forbid saving names, addresses and the rest. */
export interface LugarAoVivo {
  id: string;
  nome: string;
  endereco: string;
  site?: string;
  telefone?: string;
  mapsUrl?: string;
  fechado: boolean;
}

/** Only what the classification needs. websiteUri and the phone are Enterprise fields; the rest come with them at no extra cost. */
const CAMPOS = ['id', 'displayName', 'formattedAddress', 'websiteUri', 'businessStatus', 'googleMapsUri'];
const TELEFONE = 'nationalPhoneNumber';

export const mascaraBusca = (telefone: boolean) => [...CAMPOS.map((c) => `places.${c}`), ...(telefone ? [`places.${TELEFONE}`] : []), 'nextPageToken'].join(',');
export const mascaraDetalhes = (telefone: boolean) => [...CAMPOS, ...(telefone ? [TELEFONE] : [])].join(',');

function chave() {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new PlacesError('A chave GOOGLE_MAPS_API_KEY não está configurada na Vercel. Veja plataforma/LEAD-FINDER.md.');
  return key;
}

interface PlaceApi {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  googleMapsUri?: string;
  businessStatus?: string;
}

const lugar = (p: PlaceApi): LugarAoVivo => ({
  id: p.id ?? '',
  nome: p.displayName?.text ?? '',
  endereco: p.formattedAddress ?? '',
  site: p.websiteUri,
  telefone: p.nationalPhoneNumber,
  mapsUrl: p.googleMapsUri,
  fechado: p.businessStatus === 'CLOSED_PERMANENTLY',
});

/** Google's own error message, never the request (which carries the key). */
async function falha(res: Response, oQue: string): Promise<never> {
  let detalhe = '';
  try {
    const body = (await res.json()) as { error?: { message?: string; status?: string } };
    detalhe = body.error?.status ?? body.error?.message ?? '';
  } catch {}
  throw new PlacesError(`O Google recusou ${oQue} (erro ${res.status}${detalhe ? `, ${detalhe.slice(0, 120)}` : ''}).`);
}

export interface PedidoBusca {
  textQuery: string;
  includedType?: string;
  pageToken?: string;
}

/** One page (up to 20 places) of a Text Search. One call = one billable request. */
export async function buscarTexto(pedido: PedidoBusca, telefone: boolean): Promise<{ lugares: LugarAoVivo[]; proxima?: string }> {
  const res = await fetch(`${BASE}/places:searchText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': chave(), 'X-Goog-FieldMask': mascaraBusca(telefone) },
    // With a pageToken every other field must match the first call, so the body is built the same way each time.
    body: JSON.stringify({
      textQuery: pedido.textQuery,
      ...(pedido.includedType ? { includedType: pedido.includedType } : {}),
      languageCode: 'pt-BR',
      regionCode: 'BR',
      pageSize: 20,
      ...(pedido.pageToken ? { pageToken: pedido.pageToken } : {}),
    }),
    signal: AbortSignal.timeout(20_000),
    cache: 'no-store',
  });
  if (!res.ok) await falha(res, 'a busca');
  const body = (await res.json()) as { places?: PlaceApi[]; nextPageToken?: string };
  return { lugares: (body.places ?? []).map(lugar).filter((l) => l.id), proxima: body.nextPageToken || undefined };
}

/** One place by ID, for the review screen. One call = one billable request. */
export async function detalhesDoLugar(placeId: string, telefone: boolean): Promise<LugarAoVivo> {
  if (!PLACE_ID.test(placeId)) throw new PlacesError('Identificador de lugar inválido.');
  const res = await fetch(`${BASE}/places/${encodeURIComponent(placeId)}?languageCode=pt-BR&regionCode=BR`, {
    headers: { 'X-Goog-Api-Key': chave(), 'X-Goog-FieldMask': mascaraDetalhes(telefone) },
    signal: AbortSignal.timeout(20_000),
    cache: 'no-store',
  });
  if (!res.ok) await falha(res, 'a consulta do lugar');
  return lugar((await res.json()) as PlaceApi);
}
