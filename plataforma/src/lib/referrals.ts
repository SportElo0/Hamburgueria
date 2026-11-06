import 'server-only';
import { storage, ConflictError } from './storage';
import { emptyReferral, referralSchema, type Referral, type ReferralStatus, type Store } from './schema';

export { ConflictError };

/**
 * All referrals in one doc: the "indique e ganhe" pipeline is small (tens, not thousands
 * of leads) and read as a single list on the one page that shows it.
 */
const KEY = 'indicacoes.json';

export async function listReferrals(): Promise<Referral[]> {
  const doc = await storage().readJSON<Referral[]>(KEY);
  return (doc?.data ?? []).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

export async function createReferral(input: { nome: string; segmento: Store['segment']; indicadoPor: string }): Promise<Referral> {
  const referral = referralSchema.parse(emptyReferral(input));
  for (let attempt = 0; attempt < 4; attempt++) {
    const doc = await storage().readJSON<Referral[]>(KEY);
    const entries = doc?.data ?? [];
    try {
      await storage().writeJSON(KEY, [...entries, referral], doc ? doc.etag : null);
      return referral;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 3) throw err;
    }
  }
  throw new ConflictError();
}

export interface ReferralPatch {
  status?: ReferralStatus;
  contato?: string;
  storeSlug?: string | null;
  comissao?: number | null;
  comissaoPaga?: boolean;
  notas?: string;
}

export async function updateReferral(id: string, patch: ReferralPatch): Promise<Referral> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const doc = await storage().readJSON<Referral[]>(KEY);
    const entries = doc?.data ?? [];
    const current = entries.find((r) => r.id === id);
    if (!current) throw new Error('Indicação não encontrada.');
    const updated = referralSchema.parse({ ...current, ...patch, atualizadoEm: new Date().toISOString() });
    const next = entries.map((r) => (r.id === id ? updated : r));
    try {
      await storage().writeJSON(KEY, next, doc ? doc.etag : null);
      return updated;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 3) throw err;
    }
  }
  throw new ConflictError();
}
