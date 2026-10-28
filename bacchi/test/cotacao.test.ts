import { describe, expect, it } from 'vitest';
import { idDoItem, linhaDoItem, linkEmailPedido, linkWhatsAppPedido, pedidoSchema, textoDoPedido } from '@/lib/cotacao';

const contato = { nome: 'Ana Souza', empresa: 'Papelaria Exemplo', email: 'ana@exemplo.com.br', telefone: '(11) 4000-0000', cidade: 'Campinas', uf: 'SP' as const, aceite: true as const };
const item = { slug: 'clips', modelo: '2/0 (00)', acabamento: 'niquelado' as const, embalagem: 'Caixa grande · 720 un.', quantidade: 12 };

describe('mensagem da cotação', () => {
  it('leva todas as referências de cada item', () => {
    expect(linhaDoItem(item, 1)).toBe('1. Clips · Clips nº 2/0 (00) · Acabamento: Niquelado · Embalagem: Caixa grande · 720 un. · Quantidade: 12 embalagens');
    const t = textoDoPedido([item, { slug: 'grampos', modelo: '26/6', acabamento: 'cobreado', embalagem: 'Caixa com · 5.000 un.', quantidade: 1, observacao: 'Entrega em março' }], contato);
    expect(t).toContain('2. Grampos para grampeadores · Grampo 26/6 · Acabamento: Tipo cobreado · Embalagem: Caixa com · 5.000 un. · Quantidade: 1 embalagem · Obs.: Entrega em março');
    expect(t).toContain('Empresa: Papelaria Exemplo');
    expect(t).toContain('Local: Campinas – SP');
  });

  it('mesma escolha soma no mesmo item; outra embalagem é outro item', () => {
    expect(idDoItem(item)).toBe(idDoItem({ ...item }));
    expect(idDoItem(item)).not.toBe(idDoItem({ ...item, embalagem: 'Caixa pequena · 100 un.' }));
  });

  it('links de WhatsApp e e-mail levam o texto inteiro', () => {
    const t = textoDoPedido([item], contato);
    expect(linkWhatsAppPedido(t)).toMatch(/^https:\/\/wa\.me\/5511950892731\?text=/);
    expect(decodeURIComponent(linkWhatsAppPedido(t).split('text=')[1])).toBe(t);
    expect(linkEmailPedido(t)).toMatch(/^mailto:bacchivendas@uol\.com\.br\?subject=/);
  });
});

describe('validação do pedido no servidor', () => {
  const ok = { itens: [item], contato, site: '', tempo: 9000 };
  it('aceita um pedido completo', () => {
    expect(pedidoSchema.safeParse(ok).success).toBe(true);
  });
  it('recusa produto, acabamento ou embalagem fora do catálogo', () => {
    expect(pedidoSchema.safeParse({ ...ok, itens: [{ ...item, modelo: '99/0' }] }).success).toBe(false);
    expect(pedidoSchema.safeParse({ ...ok, itens: [{ ...item, modelo: '4', acabamento: 'latonado', embalagem: 'Caixa pequena · 100 un.' }] }).success).toBe(false);
    expect(pedidoSchema.safeParse({ ...ok, itens: [{ ...item, embalagem: 'Caixa gigante · 1 un.' }] }).success).toBe(false);
  });
  it('barra robôs: campo escondido preenchido ou envio rápido demais', () => {
    expect(pedidoSchema.safeParse({ ...ok, site: 'http://spam' }).success).toBe(false);
    expect(pedidoSchema.safeParse({ ...ok, tempo: 500 }).success).toBe(false);
  });
  it('exige autorização, e-mail válido e telefone com DDD', () => {
    expect(pedidoSchema.safeParse({ ...ok, contato: { ...contato, aceite: false } }).success).toBe(false);
    expect(pedidoSchema.safeParse({ ...ok, contato: { ...contato, email: 'ana' } }).success).toBe(false);
    expect(pedidoSchema.safeParse({ ...ok, contato: { ...contato, telefone: '4000-0000' } }).success).toBe(false);
  });
});
