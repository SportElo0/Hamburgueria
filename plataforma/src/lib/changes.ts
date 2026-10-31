import type { ChangeEntry } from './schema';

/** Months are counted on the clients' clock (Brazil), not the server's UTC. */
export function monthKey(date: Date = new Date(), timeZone = 'America/Sao_Paulo'): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit' }).formatToParts(date);
  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value;
  return `${y}-${m}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const name = new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, 1)));
  return `${name} de ${y}`;
}

export interface Usage {
  used: number;
  limit: number;
  remaining: number;
  extras: number;
  /** ok: room left · last: this was the last free one · over: extras this month */
  state: 'ok' | 'last' | 'over';
}

export function usage(entries: ChangeEntry[], limit: number): Usage {
  const used = entries.filter((e) => e.counted).length;
  const extras = entries.filter((e) => e.counted && e.extra).length;
  const remaining = Math.max(0, limit - used);
  return { used, limit, remaining, extras, state: used > limit ? 'over' : used === limit ? 'last' : 'ok' };
}

/** Whether the next counted change is beyond the allowance (and so billable). */
export function nextIsExtra(entries: ChangeEntry[], limit: number): boolean {
  return entries.filter((e) => e.counted).length >= limit;
}

export const NOT_COUNTED_REASONS = ['Horário de feriado', 'Correção de erro nosso', 'Cortesia'] as const;
