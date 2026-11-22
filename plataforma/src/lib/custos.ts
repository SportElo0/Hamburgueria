/**
 * Growlift's own costs ("Caixa" tab of the team panel): subscriptions, taxes, material, ads… typed in by the team,
 * monthly, yearly or one-off, with the day they are charged. Together with the sales of the "Clientes" tab it shows
 * the month: what came in, what went out and what is left to spend. Pure functions only.
 */
import type { ClienteCrm } from './crm';

export const CATEGORIAS = ['assinatura', 'imposto', 'material', 'anuncio', 'ferramenta', 'outro'] as const;
export type Categoria = (typeof CATEGORIAS)[number];
export const NOME_CATEGORIA: Record<Categoria, string> = {
  assinatura: 'Assinatura',
  imposto: 'Imposto',
  material: 'Material (ex.: plaquinhas)',
  anuncio: 'Anúncio',
  ferramenta: 'Ferramenta / sistema',
  outro: 'Outro',
};

export const FREQUENCIAS = ['mensal', 'anual', 'unica'] as const;
export type Frequencia = (typeof FREQUENCIAS)[number];
export const NOME_FREQUENCIA: Record<Frequencia, string> = { mensal: 'Todo mês', anual: 'Uma vez por ano', unica: 'Uma vez só' };

export interface Custo {
  id: string;
  nome: string;
  categoria: Categoria;
  /** Centavos (per charge: per month, per year or once). */
  valor: number;
  frequencia: Frequencia;
  /** YYYY-MM-DD: first charge (monthly: from this month on, on this day; yearly: renews every year on this date; one-off: the day). */
  data: string;
  /** YYYY-MM-DD when it was cancelled (no more charges after it), or null. */
  fim: string | null;
  nota: string;
  criadoEm: string;
}

export const MAX_CUSTOS = 500;

const ym = (d: string) => d.slice(0, 7);
const lastDay = (mes: string) => {
  const [y, m] = mes.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};
const pad = (n: number) => String(n).padStart(2, '0');

/** The day a cost is charged in a month ('YYYY-MM'), or null when it is not charged that month. */
export function cobrancaNoMes(c: Custo, mes: string): string | null {
  if (c.fim && ym(c.fim) < mes) return null;
  const dia = Number(c.data.slice(8, 10));
  const noMes = `${mes}-${pad(Math.min(dia, lastDay(mes)))}`;
  if (c.frequencia === 'unica') return ym(c.data) === mes ? c.data : null;
  if (mes < ym(c.data)) return null;
  if (c.fim && noMes > c.fim) return null;
  if (c.frequencia === 'mensal') return noMes;
  return c.data.slice(5, 7) === mes.slice(5, 7) ? noMes : null; // anual
}

/** What has to be covered every month on average (monthly + yearly ÷ 12), counting only active costs. */
export function custoFixoMensal(custos: readonly Custo[], hoje: string) {
  return custos
    .filter((c) => c.frequencia !== 'unica' && (!c.fim || c.fim >= hoje) && c.data <= hoje.slice(0, 7) + '-31')
    .reduce((s, c) => s + (c.frequencia === 'mensal' ? c.valor : Math.round(c.valor / 12)), 0);
}

export interface Mes {
  mes: string;
  entrou: number;
  aReceber: number;
  saiu: number;
  sobra: number;
  saidas: { custo: Custo; dia: string }[];
}

/** One month: sales of the month (paid and to receive) and the costs charged that month. */
export function resumoDoMes(custos: readonly Custo[], clientes: readonly ClienteCrm[], mes: string): Mes {
  let entrou = 0, aReceber = 0;
  for (const c of clientes)
    for (const v of c.vendas) {
      if (v.data.startsWith(mes)) {
        if (v.pago) entrou += v.valor;
        else aReceber += v.valor;
      } else if (v.mensal && c.situacao === 'cliente' && ym(v.data) < mes) {
        // a monthly fee in a later month: the CRM has one "paid" mark per sale, so it counts as expected
        aReceber += v.valor;
      }
    }
  const saidas = custos
    .map((custo) => ({ custo, dia: cobrancaNoMes(custo, mes) }))
    .filter((x): x is { custo: Custo; dia: string } => Boolean(x.dia))
    .sort((a, b) => a.dia.localeCompare(b.dia));
  const saiu = saidas.reduce((s, x) => s + x.custo.valor, 0);
  return { mes, entrou, aReceber, saiu, sobra: entrou + aReceber - saiu, saidas };
}

/** Charges in the next `dias` days (from today), soonest first. */
export function proximos(custos: readonly Custo[], hoje: string, dias = 30) {
  const out: { custo: Custo; dia: string }[] = [];
  const fim = new Date(`${hoje}T12:00:00Z`);
  fim.setUTCDate(fim.getUTCDate() + dias);
  const ate = fim.toISOString().slice(0, 10);
  for (const mes of [ym(hoje), ym(ate)].filter((m, i, a) => a.indexOf(m) === i))
    for (const c of custos) {
      const d = cobrancaNoMes(c, mes);
      if (d && d >= hoje && d <= ate) out.push({ custo: c, dia: d });
    }
  return out.sort((a, b) => a.dia.localeCompare(b.dia));
}

export const nomeMes = (mes: string) => {
  const s = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(new Date(`${mes}-15T12:00:00Z`));
  return s.charAt(0).toUpperCase() + s.slice(1);
};
export const mesAnterior = (mes: string) => {
  const [y, m] = mes.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${pad(m - 1)}`;
};
export const mesSeguinte = (mes: string) => {
  const [y, m] = mes.split('-').map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1)}`;
};
