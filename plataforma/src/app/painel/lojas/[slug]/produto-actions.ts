'use server';

import { refresh } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { isSlug } from '@/lib/slug';
import { PRODUTOS, isModulo, type Produto } from '@/lib/produto';
import { setProdutoContratado } from '@/lib/stores';

/** Só a equipe (requireUser) escolhe o produto contratado da loja. */
export async function produtoContratadoAction(slug: string, fd: FormData) {
  const user = await requireUser();
  const produto = String(fd.get('produto') ?? '');
  if (!isSlug(slug) || !(PRODUTOS as readonly string[]).includes(produto)) return;
  const modulos = fd.getAll('modulos').filter(isModulo);
  await setProdutoContratado(slug, produto as Produto, user.name || user.email, produto === 'sob-medida' ? [...new Set(modulos)] : []);
  refresh();
}
