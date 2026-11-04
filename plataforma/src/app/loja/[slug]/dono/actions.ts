'use server';

import { DONO, requireStoreAccess } from '@/lib/auth';
import { CustoError, salvarCustoManual } from '@/lib/dono';
import { ItemEditError, editItemByStore, getPublished } from '@/lib/stores';
import { isSlug } from '@/lib/slug';

export interface DonoResult {
  ok: boolean;
  error?: string;
}

/**
 * The owner changes an item's name and price (live on the menu right away, like the store's menu
 * screen) and/or what it costs to make. `cost` undefined: leave it; null: erase it.
 */
export async function salvarItemAction(slug: string, itemId: string, input: { name?: string; price?: number; cost?: number | null }): Promise<DonoResult> {
  if (!isSlug(slug) || typeof itemId !== 'string' || !/^[\w-]{1,40}$/.test(itemId) || !input || typeof input !== 'object') return { ok: false, error: 'Item inválido.' };
  const { name, price, cost } = input;
  if (name !== undefined && typeof name !== 'string') return { ok: false, error: 'Nome inválido.' };
  if (price !== undefined && (typeof price !== 'number' || !Number.isInteger(price))) return { ok: false, error: 'Preço inválido.' };
  if (cost !== undefined && cost !== null && (typeof cost !== 'number' || !Number.isInteger(cost))) return { ok: false, error: 'Custo inválido.' };
  const user = await requireStoreAccess(slug, DONO);
  const by = user.name || user.email;
  try {
    // Only items on the published menu: the cost sheet never fills with ids that don't exist.
    const item = (await getPublished(slug))?.store.catalog.categories.flatMap((c) => c.items).find((i) => i.id === itemId);
    if (!item) return { ok: false, error: 'Esse item não está mais no cardápio. Atualize a página.' };
    if (name !== undefined || price !== undefined) {
      const next = { name: name ?? item.name, description: item.description, price: price ?? item.price };
      if (next.price === null) return { ok: false, error: 'Informe o preço.' };
      if (next.name.trim() !== item.name || next.price !== item.price) await editItemByStore(slug, itemId, { ...next, price: next.price }, by);
    }
    if (cost !== undefined) await salvarCustoManual(slug, itemId, cost, by);
    return { ok: true };
  } catch (err) {
    if (err instanceof ItemEditError || err instanceof CustoError) return { ok: false, error: err.message };
    console.error('salvarItemAction', err);
    return { ok: false, error: 'Não foi possível salvar. Tente de novo.' };
  }
}
