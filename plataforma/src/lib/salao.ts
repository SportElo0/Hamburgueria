import type { SeatingRecord } from './mesas';

/**
 * The floor's numbers, as pure functions (no storage): how busy the room is now, and how long people
 * stay. A bill left open for hours (forgotten) or closed in a minute (mistake) would skew the averages,
 * so those are set aside and counted separately.
 */

export const MIN_STAY = 5;
export const MAX_STAY = 6 * 60;
/** Below this many bills an average is shown but marked as not reliable yet. */
export const RELIABLE = 10;

export type Level = 'tranquilo' | 'movimentado' | 'cheio';
export const LEVEL_LABEL: Record<Level, string> = { tranquilo: 'Tranquilo', movimentado: 'Movimentado', cheio: 'Cheio' };

/** Busy = tables with people now + tables held for bookings arriving soon. */
export function occupancy(total: number, seated: number, heldForBookings: number) {
  const busy = Math.min(total, seated + heldForBookings);
  const free = Math.max(0, total - busy);
  const ratio = total ? busy / total : 0;
  const level: Level = ratio >= 0.85 || free === 0 ? 'cheio' : ratio >= 0.5 ? 'movimentado' : 'tranquilo';
  return { total, busy, free, level };
}

export interface StayGroup {
  count: number;
  avgMinutes: number;
  avgTicket: number;
}

function group(list: SeatingRecord[]): StayGroup {
  if (!list.length) return { count: 0, avgMinutes: 0, avgTicket: 0 };
  return {
    count: list.length,
    avgMinutes: Math.round(list.reduce((s, r) => s + r.minutes, 0) / list.length),
    avgTicket: Math.round(list.reduce((s, r) => s + r.total, 0) / list.length),
  };
}

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const TZ = 'America/Sao_Paulo';
const EN_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekdayOf = (iso: string) => EN_DAYS.indexOf(new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(new Date(iso)));
const hourOf = (iso: string) => Number(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' }).format(new Date(iso)));

export function stayStats(records: SeatingRecord[]) {
  const valid = records.filter((r) => r.minutes >= MIN_STAY && r.minutes <= MAX_STAY);
  const sorted = valid.map((r) => r.minutes).sort((a, b) => a - b);
  const median = sorted.length ? (sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)) : 0;
  const withPeople = valid.filter((r) => r.people);
  return {
    ignored: records.length - valid.length,
    reliable: valid.length >= RELIABLE,
    ...group(valid),
    median,
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
    /** Tables that ordered at least one drink vs. none. */
    drinks: group(valid.filter((r) => r.drinks > 0)),
    noDrinks: group(valid.filter((r) => r.drinks === 0)),
    /** Per person, only where the waiter noted how many sat. */
    ticketPerPerson: withPeople.length ? Math.round(withPeople.reduce((s, r) => s + r.total / (r.people ?? 1), 0) / withPeople.length) : 0,
    reserved: group(valid.filter((r) => r.reserved)),
    byWeekday: WEEKDAYS.map((name, i) => ({ name, ...group(valid.filter((r) => weekdayOf(r.openedAt) === i)) })).filter((d) => d.count),
    byHour: Array.from({ length: 24 }, (_, h) => ({ hour: h, ...group(valid.filter((r) => hourOf(r.openedAt) === h)) })).filter((h) => h.count),
    byTable: [...new Set(valid.map((r) => r.number))].sort((a, b) => a - b).map((n) => ({ number: n, ...group(valid.filter((r) => r.number === n)) })),
  };
}
export type StayStats = ReturnType<typeof stayStats>;

/** "1 h 25 min" / "40 min". */
export function duration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`;
}
