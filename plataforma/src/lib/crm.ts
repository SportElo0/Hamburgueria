/**
 * Growlift's own customer list ("Clientes" tab of the team panel): customers and possible customers, typed in by the
 * team, with what each one bought, how much, whether it is paid, the monthly fees and notes. Pure functions only.
 * No CPF is ever stored (project rule): any text that looks like one is refused.
 */

export const PRODUTOS = ['plaquinha-nfc', 'google', 'site', 'cardapio-3d', 'app', 'conteudo', 'outro'] as const;
export type ProdutoCrm = (typeof PRODUTOS)[number];
export const NOME_PRODUTO_CRM: Record<ProdutoCrm, string> = {
  'plaquinha-nfc': 'Plaquinha NFC',
  google: 'Perfil no Google',
  site: 'Site',
  'cardapio-3d': 'Cardápio 3D',
  app: 'App sob medida',
  conteudo: 'Conteúdo / redes',
  outro: 'Outro',
};

export const SITUACOES = ['possivel', 'cliente', 'perdido'] as const;
export type Situacao = (typeof SITUACOES)[number];
export const NOME_SITUACAO: Record<Situacao, string> = { possivel: 'Possível cliente', cliente: 'Cliente', perdido: 'Não fechou' };

export interface Venda {
  id: string;
  produto: ProdutoCrm;
  descricao: string;
  /** Centavos. */
  valor: number;
  /** YYYY-MM-DD */
  data: string;
  pago: boolean;
  /** A monthly fee (the value is per month). */
  mensal: boolean;
  /** Day of the month the fee is due (1–28), only for monthly ones. */
  vencimento: number | null;
}

export interface Nota {
  em: string;
  por: string;
  texto: string;
}

export interface ClienteCrm {
  id: string;
  negocio: string;
  contato: string;
  /** Digits only (DDD + number), or empty. */
  whatsapp: string;
  cidade: string;
  situacao: Situacao;
  vendas: Venda[];
  notas: Nota[];
  criadoEm: string;
  atualizadoEm: string;
}

export const MAX_CLIENTES = 2000;

/** Text that carries a CPF (written as 000.000.000-00, or right after the word CPF): never stored here. */
export const pareceCpf = (s: string) => /\d{3}\.\d{3}\.\d{3}-\d{2}/.test(s) || /cpf\D{0,5}\d{3}\D?\d{3}\D?\d{3}\D?\d{2}/i.test(s);

export const limparTexto = (s: unknown, max: number) =>
  String(s ?? '')
    .replace(/[\u0000-\u001f<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);

/** Mobile or landline with DDD, digits only (drops a leading 55). */
export function soDigitosFone(raw: string) {
  let d = String(raw ?? '').replace(/\D/g, '');
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2);
  return /^[1-9]{2}\d{8,9}$/.test(d) ? d : '';
}

export const brl = (centavos: number) => (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** "80", "80,00", "1.200,50", "R$ 147" → centavos; NaN when it is not a price. */
export function centavosDe(texto: string) {
  const t = String(texto ?? '').replace(/[R$\s]/g, '');
  if (!/^\d{1,3}(\.?\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(t)) return NaN;
  const [inteiro, dec = ''] = t.replace(/\./g, '').split(',');
  return Number(inteiro) * 100 + Number((dec + '00').slice(0, 2));
}

export interface Totais {
  clientes: number;
  possiveis: number;
  /** Sold in the month (one-off sales dated in the month + monthly fees of active customers). */
  vendidoNoMes: number;
  /** Everything sold, ever (one-off sales; monthly fees count once per sale entry). */
  totalVendido: number;
  aReceber: number;
  recorrente: number;
}

/** Numbers for the top of the tab. mes = 'YYYY-MM' (São Paulo). */
export function totais(lista: readonly ClienteCrm[], mes: string): Totais {
  let vendidoNoMes = 0, totalVendido = 0, aReceber = 0, recorrente = 0;
  for (const c of lista) {
    for (const v of c.vendas) {
      totalVendido += v.valor;
      if (!v.pago) aReceber += v.valor;
      if (v.mensal && c.situacao === 'cliente') recorrente += v.valor;
      if (v.data.startsWith(mes) || (v.mensal && c.situacao === 'cliente' && v.data.slice(0, 7) < mes)) vendidoNoMes += v.valor;
    }
  }
  return {
    clientes: lista.filter((c) => c.situacao === 'cliente').length,
    possiveis: lista.filter((c) => c.situacao === 'possivel').length,
    vendidoNoMes,
    totalVendido,
    aReceber,
    recorrente,
  };
}

/** Spreadsheet-safe CSV (";" for Excel in Portuguese, BOM, no formulas). One line per sale, or per customer without sales. */
export function csvDoCrm(lista: readonly ClienteCrm[]) {
  const cell = (v: string | number) => {
    let s = String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = ['Negócio', 'Contato', 'WhatsApp', 'Cidade', 'Situação', 'Produto', 'Descrição', 'Valor', 'Data', 'Pago', 'Mensal', 'Vence dia'];
  const rows: (string | number)[][] = [];
  for (const c of lista) {
    const base = [c.negocio, c.contato, c.whatsapp, c.cidade, NOME_SITUACAO[c.situacao]];
    if (!c.vendas.length) rows.push([...base, '', '', '', '', '', '', '']);
    for (const v of c.vendas)
      rows.push([...base, NOME_PRODUTO_CRM[v.produto], v.descricao, (v.valor / 100).toFixed(2).replace('.', ','), v.data, v.pago ? 'sim' : 'não', v.mensal ? 'sim' : 'não', v.vencimento ?? '']);
  }
  return `﻿${[head.join(';'), ...rows.map((r) => r.map(cell).join(';'))].join('\r\n')}\r\n`;
}
