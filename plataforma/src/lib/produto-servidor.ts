import 'server-only';
import { redirect } from 'next/navigation';
import { getDraft } from './stores';
import { produtoDa } from './produto';

/** Telas do sistema completo: numa loja "só Conselheiro" levam para a conversa do Conselheiro. */
export async function semSistemaCompleto(slug: string) {
  const draft = await getDraft(slug);
  if (draft && produtoDa(draft.data.store) === 'conselheiro') redirect(`/loja/${slug}/dono/conselheiro/conversa`);
}
