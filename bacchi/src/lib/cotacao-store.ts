'use client';
// The quote list lives in the browser (localStorage), so a buyer can browse, leave and come back.
// useSyncExternalStore keeps every component in sync, including other tabs, without hydration mismatches.
import { useSyncExternalStore } from 'react';
import { idDoItem, ITENS_MAX, QUANTIDADE_MAX, type ItemCotacao } from './cotacao';

const CHAVE = 'bacchi-cotacao-v1';
const ouvintes = new Set<() => void>();
let cache: ItemCotacao[] | null = null;
const VAZIO: ItemCotacao[] = [];

function ler(): ItemCotacao[] {
  if (cache) return cache;
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE) ?? '[]');
    cache = Array.isArray(bruto) ? bruto.filter((i) => i && typeof i.slug === 'string' && Number.isInteger(i.quantidade)) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function gravar(itens: ItemCotacao[]) {
  cache = itens;
  try {
    localStorage.setItem(CHAVE, JSON.stringify(itens));
  } catch {
    // private mode or full storage: the list still works for this visit
  }
  ouvintes.forEach((f) => f());
}

function assinar(f: () => void) {
  ouvintes.add(f);
  const outraAba = (e: StorageEvent) => {
    if (e.key === CHAVE) {
      cache = null;
      f();
    }
  };
  window.addEventListener('storage', outraAba);
  return () => {
    ouvintes.delete(f);
    window.removeEventListener('storage', outraAba);
  };
}

export const useCotacao = () => useSyncExternalStore(assinar, ler, () => VAZIO);

const limitar = (n: number) => Math.max(1, Math.min(QUANTIDADE_MAX, Math.round(n) || 1));

export const cotacao = {
  adicionar(item: Omit<ItemCotacao, 'id'>) {
    const id = idDoItem(item);
    const atual = ler();
    const existe = atual.find((i) => i.id === id);
    if (existe) return gravar(atual.map((i) => (i.id === id ? { ...i, quantidade: limitar(i.quantidade + item.quantidade) } : i)));
    if (atual.length >= ITENS_MAX) return;
    gravar([...atual, { ...item, id, quantidade: limitar(item.quantidade) }]);
  },
  quantidade(id: string, quantidade: number) {
    gravar(ler().map((i) => (i.id === id ? { ...i, quantidade: limitar(quantidade) } : i)));
  },
  observacao(id: string, observacao: string) {
    gravar(ler().map((i) => (i.id === id ? { ...i, observacao: observacao.slice(0, 200) || undefined } : i)));
  },
  remover(id: string) {
    gravar(ler().filter((i) => i.id !== id));
  },
  limpar() {
    gravar([]);
  },
};
