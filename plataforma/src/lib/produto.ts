import type { Store } from './schema';

/**
 * O que o restaurante contratou. "completo": o sistema inteiro (pedidos, mesas, salão, Conselheiro).
 * "conselheiro": só o Conselheiro e a sobremesa em 3D, para quem já usa outro sistema de pedidos e mesas;
 * o painel do dono esconde o resto. Guardado em `store.extra.produto`; sem nada, vale "completo".
 */
export const PRODUTOS = ['completo', 'conselheiro'] as const;
export type Produto = (typeof PRODUTOS)[number];
export const NOME_PRODUTO: Record<Produto, string> = {
  completo: 'Sistema completo (pedidos, mesas, salão e Conselheiro)',
  conselheiro: 'Só Conselheiro + sobremesa 3D',
};

export const produtoDa = (store: Pick<Store, 'extra'>): Produto => (store.extra.produto === 'conselheiro' ? 'conselheiro' : 'completo');
