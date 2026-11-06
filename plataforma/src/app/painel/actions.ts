'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ZodError } from 'zod';
import { requireUser } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { newId, storeSchema, type Modelo3d, type PedidoEntry, type Store } from '@/lib/schema';
import { ImageUtils } from '@gltf-transform/core';
import { MAX_BYTES as MAX_MODELO, MAX_TRIANGULOS, Modelo3dError, assentar, cabecalhoGlb, io as glbIo, triangulos } from '@/lib/modelo3d';
import { count as countHits, dayWindow } from '@/lib/limits';
import { isSlug } from '@/lib/slug';
import {
  ConflictError,
  addPedido,
  createStore,
  getDraft,
  logChange,
  publish,
  removeChange,
  resolvePedido,
  saveDraft,
  setPayment,
} from '@/lib/stores';
import { createReferral, updateReferral, type ReferralPatch } from '@/lib/referrals';
import { seedStores } from '@/lib/seeds';
import { migrateFromBlob, migrationPending } from '@/lib/migracao';
import { setMercadoPagoToken } from '@/lib/pix';
import { pushOrder, recentSends } from '@/lib/pdv';
import { getOrder } from '@/lib/orders';
import { OperatorError, removeOperator, setOperatorFuncao, upsertOperator } from '@/lib/operators';
import { TestDataError, clearTestData, fillTestData } from '@/lib/inteligencia/dados';
import type { Funcao } from '@/lib/session';
import { DiagnosisError, setDiagnosisStatus, type DiagnosisStatus } from '@/lib/diagnostics';
import { ContentError, setContentStatus, type ContentStatus } from '@/lib/conteudos';

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
  // Our own errors carry a message for people; database and network errors carry a `code` and internals.
  if (err instanceof Error && !('code' in err)) return err.message;
  console.error('painel', err);
  return 'Algo deu errado. Tente de novo.';
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

/**
 * The team sends a dish in 3D (already lightened in the browser) and its real width. The server scales the
 * file to that width itself, so the size the table shows is always the one checked here.
 */
export async function uploadModelo3dAction(slug: string, formData: FormData): Promise<ActionResult & { modelo?: Modelo3d }> {
  const user = await requireUser();
  if (!isSlug(slug)) return BAD_SLUG;
  const file = formData.get('arquivo');
  const larguraCm = Number(formData.get('larguraCm'));
  const origem = formData.get('origemMedida');
  if (origem !== 'equipe' && origem !== 'dono') return { ok: false, error: 'Diga quem mediu o prato com a régua.' };
  if (!(file instanceof File)) return { ok: false, error: 'Nenhum arquivo enviado.' };
  if (file.size > MAX_MODELO) return { ok: false, error: 'O 3D passa de 4 MB. Exporte com menos detalhe e tente de novo.' };
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!cabecalhoGlb(bytes)) return { ok: false, error: 'Envie um arquivo .glb válido.' };
  if (!(await getDraft(slug))) return { ok: false, error: 'Loja não encontrada.' };
  try {
    let doc;
    try {
      // No decoders here: compressed meshes and outside files are refused (the browser step removes both).
      doc = await glbIo().readBinary(bytes);
    } catch {
      return { ok: false, error: 'Não deu para ler o arquivo 3D. Escolha o arquivo de novo.' };
    }
    if (triangulos(doc) > MAX_TRIANGULOS * 1.1) return { ok: false, error: 'O 3D tem detalhe demais. Escolha o arquivo de novo para ele ser reduzido.' };
    for (const t of doc.getRoot().listTextures()) {
      const image = t.getImage();
      const size = image && ImageUtils.getSize(image, t.getMimeType());
      if (!size || size[0] > 2048 || size[1] > 2048) return { ok: false, error: 'As imagens do 3D precisam estar dentro do arquivo e ter até 2048 px.' };
    }
    const medidas = assentar(doc, larguraCm);
    const out = await glbIo().writeBinary(doc);
    if (out.byteLength > MAX_MODELO + 64 * 1024) return { ok: false, error: 'O 3D passa de 4 MB. Exporte com menos detalhe e tente de novo.' };
    const key = `midia/${slug}/${newId()}.glb`;
    await storage().writeFile(key, Buffer.from(out), 'model/gltf-binary');
    return { ok: true, modelo: { src: key, ...medidas, medidoPor: user.name || user.email, medidoEm: new Date().toISOString(), origemMedida: origem } };
  } catch (err) {
    if (err instanceof Modelo3dError) return { ok: false, error: err.message };
    console.error('uploadModelo3d', err);
    return { ok: false, error: 'Não deu para salvar o 3D. Escolha o arquivo de novo.' };
  }
}

/** How many times this month each dish was opened in 3D and on the table (camera), counted without any personal data. */
export async function contagem3dAction(slug: string, itemIds: string[]): Promise<Record<string, { tela: number; mesa: number }>> {
  await requireUser();
  if (!isSlug(slug) || !Array.isArray(itemIds)) return {};
  const mes = dayWindow().slice(0, 7);
  const out: Record<string, { tela: number; mesa: number }> = {};
  for (const id of itemIds.slice(0, 50)) {
    if (typeof id !== 'string' || !/^[\w-]{1,40}$/.test(id)) continue;
    const [tela, mesa] = await Promise.all([countHits(`ver3d-${slug}`, `${id}:tela`, mes), countHits(`ver3d-${slug}`, `${id}:mesa`, mes)]);
    out[id] = { tela, mesa };
  }
  return out;
}

export async function addPedidoAction(slug: string, texto: string, canal: PedidoEntry['canal']): Promise<ActionResult> {
  const user = await requireUser();
  if (!isSlug(slug)) return BAD_SLUG;
  if (!texto.trim()) return { ok: false, error: 'Descreva o que foi pedido.' };
  try {
    await addPedido(slug, { texto, canal }, user.email);
    revalidatePath(`/painel/lojas/${slug}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: message(err) };
  }
}

export async function resolvePedidoAction(slug: string, id: string, status: 'feito' | 'descartado'): Promise<ActionResult> {
  const user = await requireUser();
  if (!isSlug(slug)) return BAD_SLUG;
  try {
    await resolvePedido(slug, id, status, user.email);
    revalidatePath(`/painel/lojas/${slug}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: message(err) };
  }
}

export async function setPaymentAction(slug: string, month: string, input: { paid: boolean; note: string }): Promise<ActionResult> {
  const user = await requireUser();
  if (!isSlug(slug)) return BAD_SLUG;
  if (!/^\d{4}-\d{2}$/.test(month)) return { ok: false, error: 'Mês inválido.' };
  try {
    await setPayment(slug, month, input, user.email);
    revalidatePath('/painel');
    revalidatePath(`/painel/lojas/${slug}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: message(err) };
  }
}

export async function createReferralAction(input: { nome: string; segmento: Store['segment']; indicadoPor: string }): Promise<ActionResult> {
  await requireUser();
  if (!input.nome.trim()) return { ok: false, error: 'Informe o nome do negócio indicado.' };
  if (!input.indicadoPor.trim()) return { ok: false, error: 'Informe quem indicou.' };
  try {
    await createReferral(input);
    revalidatePath('/painel/indicacoes');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: message(err) };
  }
}

export async function updateReferralAction(id: string, patch: ReferralPatch): Promise<ActionResult> {
  await requireUser();
  try {
    await updateReferral(id, patch);
    revalidatePath('/painel/indicacoes');
    return { ok: true };
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

/** Copies the old Vercel Blob data into Postgres. Safe to click again: it never overwrites. */
export async function migrateBlobAction(): Promise<ActionResult & { copied?: number; skipped?: number; finished?: boolean }> {
  const user = await requireUser();
  if (!(await migrationPending())) return { ok: true, copied: 0, finished: true };
  try {
    const res = await migrateFromBlob(user.email);
    revalidatePath('/painel');
    if (res.failed.length > 0 && res.copied === 0) {
      return { ok: false, error: `Não consegui ler o armazenamento antigo (${res.failed.length} itens). Ele pode ainda estar bloqueado pela Vercel.` };
    }
    return { ok: true, copied: res.copied, skipped: res.skipped, finished: res.finished };
  } catch (err) {
    console.error('migracao', err);
    return { ok: false, error: 'Não consegui ler o armazenamento antigo. Ele pode ainda estar bloqueado pela Vercel; tente de novo mais tarde.' };
  }
}

// ───────────── Online ordering: payment token and store logins ─────────────

export async function saveMercadoPagoTokenAction(slug: string, token: string): Promise<ActionResult> {
  await requireUser();
  if (!isSlug(slug)) return BAD_SLUG;
  const t = token.trim();
  if (t && !/^(APP_USR|TEST)-[\w-]{20,200}$/.test(t)) return { ok: false, error: 'Esse não parece um access token do Mercado Pago (começa com APP_USR- ou TEST-).' };
  await setMercadoPagoToken(slug, t);
  return { ok: true };
}

export async function createOperatorAction(slug: string, email: string, name: string, funcao: Funcao): Promise<ActionResult & { password?: string }> {
  const user = await requireUser();
  if (!isSlug(slug)) return BAD_SLUG;
  try {
    const password = await upsertOperator(slug, { email, name, funcao }, user.email);
    return { ok: true, password };
  } catch (err) {
    return { ok: false, error: err instanceof OperatorError ? err.message : message(err) };
  }
}

export async function setOperatorFuncaoAction(slug: string, email: string, funcao: Funcao): Promise<ActionResult> {
  await requireUser();
  if (!isSlug(slug) || typeof email !== 'string') return BAD_SLUG;
  try {
    await setOperatorFuncao(slug, email, funcao);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof OperatorError ? err.message : message(err) };
  }
}

export async function removeOperatorAction(slug: string, email: string): Promise<ActionResult> {
  await requireUser();
  if (!isSlug(slug)) return BAD_SLUG;
  await removeOperator(slug, email);
  return { ok: true };
}

export async function setDiagnosisStatusAction(id: string, status: DiagnosisStatus): Promise<ActionResult> {
  await requireUser();
  try {
    await setDiagnosisStatus(id, status);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof DiagnosisError ? err.message : 'Não foi possível salvar.' };
  }
}

export async function setContentStatusAction(key: string, status: ContentStatus): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await setContentStatus(key, status, user.name || user.email);
    revalidatePath('/painel/conteudos', 'layout');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof ContentError ? err.message : 'Não foi possível salvar. Recarregue a página e tente de novo.' };
  }
}

/** Resends one order to the store's POS (Saipos). Team only. */
export async function resendToPdvAction(slug: string, orderId: string): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSlug(slug) || !/^[\w-]{1,40}$/.test(orderId)) return { ok: false, error: 'Pedido inválido.' };
  const order = await getOrder(slug, orderId);
  if (!order) return { ok: false, error: 'Pedido não encontrado (pedidos com mais de alguns dias saem da lista).' };
  await pushOrder(slug, order, { force: true });
  const last = (await recentSends(slug, 300)).find((e) => e.orderId === orderId);
  return last?.status === 'enviado' ? { ok: true } : { ok: false, error: last?.error || 'Não foi enviado.' };
}

// ───────────── Dados de teste (loja que nunca foi ao ar) ─────────────

export async function encherTesteAction(slug: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!isSlug(slug)) return BAD_SLUG;
  try {
    await fillTestData(slug, user.name || user.email);
    revalidatePath(`/painel/lojas/${slug}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof TestDataError) return { ok: false, error: err.message };
    console.error('encherTesteAction', err);
    return { ok: false, error: 'Não foi possível gerar os dados de teste.' };
  }
}

export async function limparTesteAction(slug: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!isSlug(slug)) return BAD_SLUG;
  try {
    await clearTestData(slug, user.name || user.email);
    revalidatePath(`/painel/lojas/${slug}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof TestDataError) return { ok: false, error: err.message };
    console.error('limparTesteAction', err);
    return { ok: false, error: 'Não foi possível apagar os dados de teste.' };
  }
}
