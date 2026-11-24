'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { CadastroError, aprovarCadastro, recusarCadastro } from '@/lib/cadastros';
import { isSlug } from '@/lib/slug';

export interface CadastroResult {
  ok: boolean;
  error?: string;
}

export async function aprovarCadastroAction(slug: string): Promise<CadastroResult> {
  const user = await requireUser();
  if (!isSlug(slug)) return { ok: false, error: 'Cadastro inválido.' };
  try {
    await aprovarCadastro(slug, user.name || user.email);
    revalidatePath('/painel/cadastros');
    revalidatePath('/painel');
    return { ok: true };
  } catch (err) {
    if (err instanceof CadastroError) return { ok: false, error: err.message };
    console.error('aprovarCadastro', err);
    return { ok: false, error: 'Não foi possível aprovar. Tente de novo.' };
  }
}

export async function recusarCadastroAction(slug: string): Promise<CadastroResult> {
  await requireUser();
  if (!isSlug(slug)) return { ok: false, error: 'Cadastro inválido.' };
  try {
    await recusarCadastro(slug);
    revalidatePath('/painel/cadastros');
    revalidatePath('/painel');
    return { ok: true };
  } catch (err) {
    if (err instanceof CadastroError) return { ok: false, error: err.message };
    console.error('recusarCadastro', err);
    return { ok: false, error: 'Não foi possível recusar. Tente de novo.' };
  }
}
