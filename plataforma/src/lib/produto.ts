import type { Store } from './schema';

/**
 * O que o restaurante contratou. "completo": o sistema inteiro (pedidos, mesas, salão, Conselheiro).
 * "conselheiro": só o Conselheiro e a sobremesa em 3D, para quem já usa outro sistema de pedidos e mesas;
 * o painel do dono esconde o resto. "sob-medida": um app só com as partes (módulos) feitas para a dor
 * daquela loja, em /loja/<slug>/app. Guardado em `store.extra.produto` e `store.extra.modulos`; sem nada, vale "completo".
 */
export const PRODUTOS = ['completo', 'conselheiro', 'sob-medida'] as const;
export type Produto = (typeof PRODUTOS)[number];
export const NOME_PRODUTO: Record<Produto, string> = {
  completo: 'Sistema completo (pedidos, mesas, salão e Conselheiro)',
  conselheiro: 'Só Conselheiro + sobremesa 3D',
  'sob-medida': 'App sob medida (só os módulos marcados)',
};

export const produtoDa = (store: Pick<Store, 'extra'>): Produto =>
  store.extra.produto === 'conselheiro' ? 'conselheiro' : store.extra.produto === 'sob-medida' ? 'sob-medida' : 'completo';

/** The parts an "App sob medida" can have. Each store gets only what solves its problem; new ones are added here. */
export const MODULOS = ['clientes', 'torpedo'] as const;
export type Modulo = (typeof MODULOS)[number];
export const NOME_MODULO: Record<Modulo, string> = {
  clientes: 'Clientes (lista do Anota Aí, busca e exportar)',
  torpedo: 'Torpedo (planejar a mensagem com IA e enviar pelo WhatsApp)',
};
export const isModulo = (v: unknown): v is Modulo => typeof v === 'string' && (MODULOS as readonly string[]).includes(v);

export const modulosDa = (store: Pick<Store, 'extra'>): Modulo[] => {
  const m = store.extra.modulos;
  return Array.isArray(m) ? MODULOS.filter((x) => m.includes(x)) : [];
};
