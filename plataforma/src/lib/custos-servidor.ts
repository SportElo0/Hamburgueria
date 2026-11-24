import 'server-only';
import { storage, ConflictError } from './storage';
import { gravacaoPermitida, SomenteLeituraError } from './ambiente';
import type { Custo } from './custos';

/** Growlift's costs in one document: growlift/custos.json. Team only. */
const KEY = 'growlift/custos.json';

export async function listarCustos(): Promise<Custo[]> {
  return (await storage().readJSON<Custo[]>(KEY))?.data ?? [];
}

export async function mudarCustos(fn: (lista: Custo[]) => Custo[]): Promise<Custo[]> {
  if (!gravacaoPermitida()) throw new SomenteLeituraError();
  for (let attempt = 0; attempt < 4; attempt++) {
    const doc = await storage().readJSON<Custo[]>(KEY);
    const nova = fn(structuredClone(doc?.data ?? []));
    try {
      await storage().writeJSON(KEY, nova, doc ? doc.etag : null);
      return nova;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 3) throw err;
    }
  }
  throw new Error('unreachable');
}
