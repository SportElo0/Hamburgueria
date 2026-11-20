'use server';

import { z } from 'zod';
import { DONO, requireStoreAccess } from '@/lib/auth';
import { isSlug } from '@/lib/slug';
import { getDraft } from '@/lib/stores';
import { modulosDa, produtoDa, type Modulo } from '@/lib/produto';
import { LINHA_SAIR } from '@/lib/importados';
import { MAX_FALA, MAX_FALAS, apagarPlano, conversar, savePlano, type RespostaTorpedo } from '@/lib/torpedo-servidor';

export interface Resultado {
  ok: boolean;
  error?: string;
}

/** The owner (or the team) of a store whose app has this module. */
async function exigir(slug: string, modulo: Modulo) {
  if (!isSlug(slug)) return null;
  const user = await requireStoreAccess(slug, DONO);
  const draft = await getDraft(slug);
  if (!draft || produtoDa(draft.data.store) !== 'sob-medida' || !modulosDa(draft.data.store).includes(modulo)) return null;
  return { user, store: draft.data.store };
}

const Falas = z
  .array(z.object({ quem: z.enum(['dono', 'ia']), texto: z.string().max(MAX_FALA * 2) }))
  .min(1)
  .max(MAX_FALAS * 2);

export async function conversarAction(slug: string, falas: unknown): Promise<RespostaTorpedo> {
  const ok = await exigir(slug, 'torpedo');
  if (!ok) return { ok: false, error: 'Sem acesso.' };
  const parsed = Falas.safeParse(falas);
  if (!parsed.success) return { ok: false, error: 'A conversa ficou grande demais. Toque em "Começar de novo".' };
  return conversar(slug, ok.store.name, parsed.data);
}

const Plano = z.object({
  mensagem: z.string().trim().min(10).max(700),
  dia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  quantos: z.number().int().min(5).max(200),
});

export async function salvarPlanoAction(slug: string, plano: unknown): Promise<Resultado> {
  const ok = await exigir(slug, 'torpedo');
  if (!ok) return { ok: false, error: 'Sem acesso.' };
  const parsed = Plano.safeParse(plano);
  if (!parsed.success) return { ok: false, error: 'Confira a mensagem e o dia.' };
  if (!parsed.data.mensagem.includes(LINHA_SAIR)) return { ok: false, error: `A mensagem precisa terminar com: "${LINHA_SAIR}"` };
  await savePlano(slug, { ...parsed.data, atualizadoEm: new Date().toISOString(), por: ok.user.name || ok.user.email });
  return { ok: true };
}

export async function apagarPlanoAction(slug: string): Promise<Resultado> {
  const ok = await exigir(slug, 'torpedo');
  if (!ok) return { ok: false, error: 'Sem acesso.' };
  try {
    await apagarPlano(slug);
  } catch (err) {
    console.error('apagar plano torpedo', err);
    return { ok: false, error: 'Não consegui apagar agora. Tente de novo.' };
  }
  return { ok: true };
}
