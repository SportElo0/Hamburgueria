'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ZodError } from 'zod';
import { requireUser } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { newId, storeSchema } from '@/lib/schema';
import { isSlug } from '@/lib/slug';
import { ConflictError, createStore, getDraft, logChange, publish, removeChange, saveDraft } from '@/lib/stores';
import { seedStores } from '@/lib/seeds';

export interface ActionResult {
  ok: boolean;
  error?: string;
  etag?: string;
}

const BAD_SLUG: ActionResult = { ok: false, error: 'Loja inválida.' };

function message(err: unknown): string {
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    return `Campo inválido (${issue.path.join(' › ') || 'loja'}): ${issue.message}`;
  }
  if (err instanceof ConflictError) return err.message;
  return err instanceof Error ? err.message : 'Algo deu errado. Tente de novo.';
}

export async function createStoreAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const name = String(formData.get('nome') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim();
  const segment = String(formData.get('segmento') ?? 'restaurante') as 'restaurante';
  try {
    storeSchema.shape.slug.parse(slug);
    if (!name) return { ok: false, error: 'Informe o nome da loja.' };
    if (await getDraft(slug)) return { ok: false, error: 'Já existe uma loja com esse endereço (slug).' };
    await createStore({ slug, name, segment }, user.email);
  } catch (err) {
    return { ok: false, error: message(err) };
  }
  revalidatePath('/painel');
  redirect(`/painel/lojas/${slug}`);
}

export async function saveStoreAction(slug: string, etag: string, store: unknown): Promise<ActionResult> {
  const user = await requireUser();
  if (!isSlug(slug)) return BAD_SLUG;
  try {
    const out = await saveDraft(slug, store, etag, user.email);
    revalidatePath(`/painel/lojas/${slug}`);
    return { ok: true, etag: out.etag };
  } catch (err) {
    return { ok: false, error: message(err) };
  }
}

export async function publishAction(
  slug: string,
  input: { description: string; counted: boolean; reason: string },
): Promise<ActionResult & { extra?: boolean }> {
  const user = await requireUser();
  if (!isSlug(slug)) return BAD_SLUG;
  try {
    const out = await publish(slug, input, user.email);
    const draft = await getDraft(slug);
    revalidatePath('/painel');
    revalidatePath(`/painel/lojas/${slug}`);
    return { ok: true, etag: draft?.etag, extra: out.entry?.extra };
  } catch (err) {
    return { ok: false, error: message(err) };
  }
}

export async function logChangeAction(slug: string, input: { description: string; counted: boolean; reason: string }): Promise<ActionResult> {
  const user = await requireUser();
  if (!isSlug(slug)) return BAD_SLUG;
  if (!input.description.trim()) return { ok: false, error: 'Descreva o que foi pedido.' };
  try {
    await logChange(slug, input, user.email);
    revalidatePath('/painel');
    revalidatePath(`/painel/lojas/${slug}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: message(err) };
  }
}

export async function removeChangeAction(slug: string, month: string, id: string): Promise<ActionResult> {
  await requireUser();
  if (!isSlug(slug)) return BAD_SLUG;
  if (!/^\d{4}-\d{2}$/.test(month)) return { ok: false, error: 'Mês inválido.' };
  try {
    await removeChange(slug, month, id);
    revalidatePath('/painel');
    revalidatePath(`/painel/lojas/${slug}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: message(err) };
  }
}

const IMAGE_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };
const MAX_IMAGE = 5 * 1024 * 1024;

export async function uploadImageAction(slug: string, formData: FormData): Promise<ActionResult & { key?: string }> {
  await requireUser();
  if (!isSlug(slug)) return BAD_SLUG;
  const file = formData.get('arquivo');
  if (!(file instanceof File)) return { ok: false, error: 'Nenhum arquivo enviado.' };
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return { ok: false, error: 'Use uma imagem JPG, PNG, WebP ou AVIF.' };
  if (file.size > MAX_IMAGE) return { ok: false, error: 'A imagem passa de 5 MB. Reduza e tente de novo.' };
  if (!(await getDraft(slug))) return { ok: false, error: 'Loja não encontrada.' };
  const key = `midia/${slug}/${newId()}.${ext}`;
  try {
    await storage().writeFile(key, Buffer.from(await file.arrayBuffer()), file.type);
    return { ok: true, key };
  } catch (err) {
    return { ok: false, error: message(err) };
  }
}

/** Creates the stores we already sold, with the menus taken from their sites. Skips any that exist. */
export async function importSeedsAction(): Promise<ActionResult & { created?: string[] }> {
  const user = await requireUser();
  const created: string[] = [];
  try {
    for (const store of seedStores()) {
      if (await getDraft(store.slug)) continue;
      await createStore({ slug: store.slug, name: store.name, segment: store.segment }, user.email);
      const fresh = await getDraft(store.slug);
      await saveDraft(store.slug, store, fresh!.etag, user.email);
      created.push(store.name);
    }
  } catch (err) {
    return { ok: false, error: message(err), created };
  }
  revalidatePath('/painel');
  return { ok: true, created };
}
