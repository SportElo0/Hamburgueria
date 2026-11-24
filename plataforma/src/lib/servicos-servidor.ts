import 'server-only';
import { storage, ConflictError } from './storage';
import { gravacaoPermitida, SomenteLeituraError } from './ambiente';
import { SERVICOS_ADICIONADOS, SERVICOS_INICIAIS, comAdicionados, type Servico } from './servicos';

/** Growlift's services in one document: growlift/servicos.json. Until the first edit, the starting list. Team only. */
const KEY = 'growlift/servicos.json';
/** Ids of the added cards already merged into the saved list (so a deleted one stays deleted). */
const ENTREGUES = 'growlift/servicos-adicionados.json';

async function entregues(): Promise<string[]> {
  const d = (await storage().readJSON<string[]>(ENTREGUES))?.data;
  return Array.isArray(d) ? d : [];
}

export async function listarServicos(): Promise<Servico[]> {
  const doc = await storage().readJSON<Servico[]>(KEY);
  return doc ? comAdicionados(doc.data, await entregues()) : structuredClone(SERVICOS_INICIAIS);
}

export async function mudarServicos(fn: (lista: Servico[]) => Servico[]): Promise<Servico[]> {
  if (!gravacaoPermitida()) throw new SomenteLeituraError();
  for (let attempt = 0; attempt < 4; attempt++) {
    const doc = await storage().readJSON<Servico[]>(KEY);
    const nova = fn(doc ? comAdicionados(structuredClone(doc.data), await entregues()) : structuredClone(SERVICOS_INICIAIS));
    try {
      await storage().writeJSON(KEY, nova, doc ? doc.etag : null);
      // From now on the added cards live in the saved list; deleting one later must not bring it back.
      await storage().writeJSON(ENTREGUES, SERVICOS_ADICIONADOS.map((a) => a.id));
      return nova;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 3) throw err;
    }
  }
  throw new Error('unreachable');
}
