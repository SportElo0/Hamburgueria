/**
 * Customers brought from another ordering system (first one: Anota Aí's "Clientes inativos / ativos" export) and the
 * monthly pick of who is worth a WhatsApp message. Pure functions only (used in the browser and on the server).
 *
 * The pick is a score, not a black box: many orders + stopped for a while, but not so long that they forgot the store
 * (the best window is 30 to 120 days). Each pick comes with the reason in plain words.
 * Only customers the store declared as having accepted offers are imported; anyone who asked to stop ("SAIR") and
 * anyone already messaged in the last 30 days is left out.
 */

export interface Importado {
  phone: string;
  name: string;
  orders: number;
  /** Days without ordering on the day of the export. */
  inactiveDays: number;
}

export interface Escolhido extends Importado {
  /** Days without ordering today (export days + days since the import). */
  diasParado: number;
  score: number;
  motivo: string;
}

export const MAX_IMPORTADOS = 5000;
export const ESCOLHA_PADRAO = 50;
/** No one gets two campaigns in less than this. */
export const DIAS_ENTRE_ENVIOS = 30;

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/** Brazilian mobile in 11 digits (DDD + 9 + 8), from anything with or without +55, spaces or dashes. */
export function celularBR(raw: string): string {
  let d = String(raw ?? '').replace(/\D/g, '');
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2);
  if (d.length === 10 && /^[1-9]{2}[6-9]/.test(d)) d = `${d.slice(0, 2)}9${d.slice(2)}`; // old mobile without the 9
  return /^[1-9]{2}9\d{8}$/.test(d) ? d : '';
}

export interface Colunas {
  nome: number;
  telefone: number;
  whatsapp: number;
  pedidos: number;
  dias: number;
}

/** Finds the columns by their header (Anota Aí: "Nome do Cliente", "Número Telefone", "Número Whatsapp", "Quantidade de Pedidos", "Dias de Inatividade"). */
export function acharColunas(header: string[]): Colunas | null {
  const h = header.map(norm);
  const find = (...keys: string[]) => h.findIndex((x) => keys.some((k) => x.includes(k)));
  const c: Colunas = {
    nome: find('nome'),
    whatsapp: find('whatsapp', 'whats'),
    telefone: h.findIndex((x) => (x.includes('telefone') || x.includes('celular') || x.includes('fone')) && !x.includes('whats')),
    pedidos: find('quantidade de pedidos', 'pedidos', 'compras'),
    dias: find('dias de inatividade', 'inatividade', 'dias sem', 'dias parado'),
  };
  if (c.pedidos < 0 || (c.telefone < 0 && c.whatsapp < 0)) return null;
  return c;
}

export interface Leitura {
  clientes: Importado[];
  semCelular: number;
  linhas: number;
}

/** Rows (first one = header) to customers with a valid mobile; repeated phones keep the one with more orders. */
export function lerClientes(rows: string[][]): Leitura {
  if (!rows.length) throw new Error('A planilha está vazia.');
  const cols = acharColunas(rows[0]);
  if (!cols) throw new Error('Não achei as colunas de telefone e de quantidade de pedidos. Use a exportação de clientes do Anota Aí.');
  const byPhone = new Map<string, Importado>();
  let semCelular = 0;
  const body = rows.slice(1).filter((r) => r.some((x) => x));
  for (const r of body) {
    const phone = celularBR(r[cols.whatsapp] ?? '') || celularBR(r[cols.telefone] ?? '');
    if (!phone) {
      semCelular++;
      continue;
    }
    const orders = Math.max(0, Math.floor(Number(String(r[cols.pedidos] ?? '').replace(',', '.')) || 0));
    const inactiveDays = cols.dias >= 0 ? Math.max(0, Math.floor(Number(r[cols.dias]) || 0)) : 0;
    const name = String(r[cols.nome] ?? '')
      .replace(/[\u0000-\u001f<>]/g, '')
      .trim()
      .slice(0, 60) || 'Cliente';
    const prev = byPhone.get(phone);
    if (!prev || orders > prev.orders) byPhone.set(phone, { phone, name, orders, inactiveDays });
  }
  const clientes = [...byPhone.values()];
  if (clientes.length > MAX_IMPORTADOS) throw new Error(`A planilha tem ${clientes.length} clientes; o limite é ${MAX_IMPORTADOS}.`);
  return { clientes, semCelular, linhas: body.length };
}

/** 0..1: how worth it a message is. Orders weigh 60%, the time stopped 40% (best between 30 and 120 days). */
export function pontuar(orders: number, diasParado: number) {
  const freq = Math.min(orders, 15) / 15;
  let tempo: number;
  if (diasParado < 21) tempo = 0.15; // still a regular customer: no need to "bring back"
  else if (diasParado <= 120) tempo = 1;
  else if (diasParado <= 365) tempo = 1 - ((diasParado - 120) / 245) * 0.7;
  else tempo = 0.2;
  return Math.round((freq * 0.6 + tempo * 0.4) * 1000) / 1000;
}

export function motivoDe(orders: number, diasParado: number) {
  const pedidos = `${orders} ${orders === 1 ? 'pedido' : 'pedidos'}`;
  if (diasParado < 21) return `${pedidos}, pediu há ${diasParado} dias (cliente em dia)`;
  const tempo = diasParado < 60 ? `${diasParado} dias` : diasParado < 365 ? `uns ${Math.round(diasParado / 30)} meses` : 'mais de 1 ano';
  return `${pedidos}, sem pedir há ${tempo}`;
}

export interface Filtro {
  importadoEm: string;
  agora?: Date;
  optOuts?: readonly string[];
  /** phone → last time a campaign link was opened for them (ISO). */
  enviados?: Readonly<Record<string, string>>;
  limite?: number;
}

const dias = (from: string, to: Date) => Math.max(0, Math.floor((to.getTime() - new Date(from).getTime()) / 86_400_000));

/** The best customers to message now, best first. */
export function escolher(clientes: readonly Importado[], f: Filtro): Escolhido[] {
  const agora = f.agora ?? new Date();
  const desde = dias(f.importadoEm, agora);
  const fora = new Set(f.optOuts ?? []);
  const enviados = f.enviados ?? {};
  return clientes
    .filter((c) => c.orders > 0 && !fora.has(c.phone) && !(enviados[c.phone] && dias(enviados[c.phone], agora) < DIAS_ENTRE_ENVIOS))
    .map((c) => {
      const diasParado = c.inactiveDays + desde;
      return { ...c, diasParado, score: pontuar(c.orders, diasParado), motivo: motivoDe(c.orders, diasParado) };
    })
    .sort((a, b) => b.score - a.score || b.orders - a.orders || a.diasParado - b.diasParado)
    .slice(0, f.limite ?? ESCOLHA_PADRAO);
}

/** The line every campaign message must end with. */
export const LINHA_SAIR = 'Para não receber mais promoções, responda SAIR.';

/** A message without AI: the store's own offer, honest, with the stop line. */
export function mensagemModelo(loja: string, oferta: string) {
  const o = oferta.trim().replace(/\s+/g, ' ');
  return `Oi! Aqui é do ${loja}. Faz tempo que você não pede com a gente${o ? `: ${o.charAt(0).toLowerCase()}${o.slice(1).replace(/[.!]?$/, '.')}` : '. Bateu saudade? Estamos te esperando!'}\n\n${LINHA_SAIR}`;
}

/** Makes sure the stop line is there (and only once). */
export function comLinhaSair(texto: string) {
  const sem = texto.replace(/\n*\s*para n[aã]o receber mais[^\n]*$/i, '').trim();
  return `${sem}\n\n${LINHA_SAIR}`;
}
