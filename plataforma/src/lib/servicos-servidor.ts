import 'server-only';
import { storage, ConflictError } from './storage';
import { gravacaoPermitida, SomenteLeituraError } from './ambiente';
import { SERVICOS_INICIAIS, type Servico } from './servicos';

/** Growlift's services in one document: growlift/servicos.json. Until the first edit, the starting list. Team only. */
const KEY = 'growlift/servicos.json';

export async function listarServicos(): Promise<Servico[]> {
  return (await storage().readJSON<Servico[]>(KEY))?.data ?? structuredClone(SERVICOS_INICIAIS);
}

export async function mudarServicos(fn: (lista: Servico[]) => Servico[]): Promise<Servico[]> {
  if (!gravacaoPermitida()) throw new SomenteLeituraError();
  for (let attempt = 0; attempt < 4; attempt++) {
    const doc = await storage().readJSON<Servico[]>(KEY);
    const nova = fn(structuredClone(doc?.data ?? SERVICOS_INICIAIS));
    try {
      await storage().writeJSON(KEY, nova, doc ? doc.etag : null);
      return nova;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 3) throw err;
    }
  }
  throw new Error('unreachable');
}
