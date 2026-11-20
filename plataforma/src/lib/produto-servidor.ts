import 'server-only';
import { redirect } from 'next/navigation';
import { getDraft } from './stores';
import { produtoDa } from './produto';

/** Telas do sistema completo: numa loja "só Conselheiro" levam para a conversa do Conselheiro; num app sob medida, para o app. */
export async function semSistemaCompleto(slug: string) {
  const draft = await getDraft(slug);
  const p = draft ? produtoDa(draft.data.store) : 'completo';
  if (p === 'conselheiro') redirect(`/loja/${slug}/dono/conselheiro/conversa`);
  if (p === 'sob-medida') redirect(`/loja/${slug}/app`);
}
