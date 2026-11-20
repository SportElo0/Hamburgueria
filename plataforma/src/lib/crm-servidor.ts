import 'server-only';
import { storage, ConflictError } from './storage';
import { gravacaoPermitida, SomenteLeituraError } from './ambiente';
import type { ClienteCrm } from './crm';

/** The whole list in one document (a few hundred entries at most): growlift/clientes.json. Team only. */
const KEY = 'growlift/clientes.json';

export async function listarClientesCrm(): Promise<ClienteCrm[]> {
  return (await storage().readJSON<ClienteCrm[]>(KEY))?.data ?? [];
}

/** Read, change and write with the etag (retries if two people save at the same time). Returns the new list. */
export async function mudarCrm(fn: (lista: ClienteCrm[]) => ClienteCrm[]): Promise<ClienteCrm[]> {
  if (!gravacaoPermitida()) throw new SomenteLeituraError();
  for (let attempt = 0; attempt < 4; attempt++) {
    const doc = await storage().readJSON<ClienteCrm[]>(KEY);
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
