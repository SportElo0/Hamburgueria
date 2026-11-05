'use server';

import { DONO, requireStoreAccess } from '@/lib/auth';
import { CustoError, salvarCustoManual } from '@/lib/dono';
import { ItemEditError, addItemByOwner, editItemByOwner, getDraft, getPublished, importItemsByOwner, setContaConfig, setTablesCount } from '@/lib/stores';
import { lerCardapio } from '@/lib/importar-cardapio';
import { isSlug } from '@/lib/slug';
import { floor } from '@/lib/mesas';
import { OperatorError, donoAdicionaLogin, donoMudaFuncao, donoNovaSenha, donoRemoveLogin } from '@/lib/operators';
import { hourWindow, take } from '@/lib/limits';

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
    const store = (await getPublished(slug))?.store ?? (await getDraft(slug))?.data.store;
    const item = store?.catalog.categories.flatMap((c) => c.items).find((i) => i.id === itemId);
    if (!item) return { ok: false, error: 'Esse item não está mais no cardápio. Atualize a página.' };
    if (name !== undefined || price !== undefined) {
      const next = { name: name ?? item.name, description: item.description, price: price ?? item.price };
      if (next.price === null) return { ok: false, error: 'Informe o preço.' };
      if (next.name.trim() !== item.name || next.price !== item.price) await editItemByOwner(slug, itemId, { ...next, price: next.price }, by);
    }
    if (cost !== undefined) await salvarCustoManual(slug, itemId, cost, by);
    return { ok: true };
  } catch (err) {
    if (err instanceof ItemEditError || err instanceof CustoError) return { ok: false, error: err.message };
    console.error('salvarItemAction', err);
    return { ok: false, error: 'Não foi possível salvar. Tente de novo.' };
  }
}

/** The owner adds an item to the menu, optionally with what it costs to make. */
export async function adicionarItemAction(slug: string, input: { name: string; price: number; category: string; cost: number | null }): Promise<DonoResult & { id?: string; aviso?: string }> {
  if (!isSlug(slug) || !input || typeof input !== 'object') return { ok: false, error: 'Dados inválidos.' };
  const { name, price, category, cost } = input;
  if (typeof name !== 'string' || typeof category !== 'string' || typeof price !== 'number' || !Number.isInteger(price)) return { ok: false, error: 'Dados inválidos.' };
  if (cost !== null && (typeof cost !== 'number' || !Number.isInteger(cost))) return { ok: false, error: 'Custo inválido.' };
  const user = await requireStoreAccess(slug, DONO);
  const by = user.name || user.email;
  try {
    const id = await addItemByOwner(slug, { name, price, category }, by);
    if (cost !== null) {
      try {
        await salvarCustoManual(slug, id, cost, by);
      } catch (err) {
        // The item exists already: say so, so the owner fixes the cost on its row instead of adding it twice.
        console.error('custo do item novo', err);
        return { ok: true, id, aviso: 'Item adicionado, mas o custo não foi salvo. Escreva o custo na linha do item.' };
      }
    }
    return { ok: true, id };
  } catch (err) {
    if (err instanceof ItemEditError || err instanceof CustoError) return { ok: false, error: err.message };
    console.error('adicionarItemAction', err);
    return { ok: false, error: 'Não foi possível adicionar. Tente de novo.' };
  }
}

/** The owner says how many tables the restaurant has. */
export async function mesasAction(slug: string, count: number): Promise<DonoResult> {
  if (!isSlug(slug) || typeof count !== 'number' || !Number.isInteger(count)) return { ok: false, error: 'Número inválido.' };
  const user = await requireStoreAccess(slug, DONO);
  try {
    const highestOpen = Math.max(0, ...(await floor(slug)).map((t) => t.number));
    await setTablesCount(slug, count, user.name || user.email, highestOpen);
    return { ok: true };
  } catch (err) {
    if (err instanceof ItemEditError) return { ok: false, error: err.message };
    console.error('mesasAction', err);
    return { ok: false, error: 'Não foi possível salvar. Tente de novo.' };
  }
}

/** The owner sets the service charge (%) and the cover charge per person (centavos). */
export async function contaConfigAction(slug: string, servico: number, couvert: number): Promise<DonoResult> {
  if (!isSlug(slug) || typeof servico !== 'number' || typeof couvert !== 'number') return { ok: false, error: 'Dados inválidos.' };
  const user = await requireStoreAccess(slug, DONO);
  try {
    await setContaConfig(slug, servico, couvert, user.name || user.email);
    return { ok: true };
  } catch (err) {
    if (err instanceof ItemEditError) return { ok: false, error: err.message };
    console.error('contaConfigAction', err);
    return { ok: false, error: 'Não foi possível salvar. Tente de novo.' };
  }
}

/** The owner imports the menu the Claude transcribed from a photo or PDF (the text is read again here). */
export async function importarCardapioAction(slug: string, texto: string): Promise<DonoResult & { adicionados?: number; repetidos?: number }> {
  if (!isSlug(slug) || typeof texto !== 'string' || texto.length > 60_000) return { ok: false, error: 'Texto inválido ou grande demais.' };
  const lido = lerCardapio(texto);
  if (!lido.total) return { ok: false, error: 'Não achei nenhum item com preço no texto. Confira o formato.' };
  const user = await requireStoreAccess(slug, DONO);
  try {
    const r = await importItemsByOwner(slug, lido.categorias, user.name || user.email);
    return { ok: true, ...r };
  } catch (err) {
    if (err instanceof ItemEditError) return { ok: false, error: err.message };
    console.error('importarCardapioAction', err);
    return { ok: false, error: 'Não foi possível importar. Tente de novo.' };
  }
}

/** Team logins (Equipe): at most 30 changes an hour per store, so a stolen owner session cannot churn logins. */
async function equipe<T>(slug: string, run: (by: string) => Promise<T>): Promise<DonoResult & { data?: T }> {
  if (!isSlug(slug)) return { ok: false, error: 'Loja inválida.' };
  const user = await requireStoreAccess(slug, DONO);
  try {
    if (!(await take('equipe-dono', slug, 30, hourWindow()))) return { ok: false, error: 'Muitas mudanças nesta hora. Espere um pouco ou fale com a Growlift.' };
    return { ok: true, data: await run(user.name ? `${user.name} (${user.email})` : user.email) };
  } catch (err) {
    if (err instanceof OperatorError) return { ok: false, error: err.message };
    console.error('equipe do dono', err);
    return { ok: false, error: 'Não foi possível salvar. Tente de novo.' };
  }
}

export async function equipeAdicionarAction(slug: string, input: { email: string; name: string; funcao: string }) {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Dados inválidos.' };
  return equipe(slug, (by) => donoAdicionaLogin(slug, input, by));
}

export async function equipeNovaSenhaAction(slug: string, email: string) {
  return equipe(slug, (by) => donoNovaSenha(slug, email, by));
}

export async function equipeFuncaoAction(slug: string, email: string, funcao: string) {
  return equipe(slug, () => donoMudaFuncao(slug, email, funcao));
}

export async function equipeRemoverAction(slug: string, email: string) {
  return equipe(slug, () => donoRemoveLogin(slug, email));
}
