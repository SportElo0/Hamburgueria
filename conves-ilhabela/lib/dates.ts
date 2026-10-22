import { site } from "@/config/site";

/** Datas como "AAAA-MM-DD" para não depender do fuso do aparelho. */
export type ISODate = string;

const pad = (n: number) => String(n).padStart(2, "0");

/** Data de hoje no fuso de Ilhabela. */
export function todayInShop(at: Date = new Date()): ISODate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: site.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "01";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function parseISODate(value: ISODate): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) {
    return null;
  }
  return { y, m, d };
}

export function toISODate(y: number, m: number, d: number): ISODate {
  const date = new Date(Date.UTC(y, m - 1, d));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function addDays(value: ISODate, days: number): ISODate {
  const p = parseISODate(value);
  if (!p) return value;
  return toISODate(p.y, p.m, p.d + days);
}

/** Janela de datas aceitas no pedido. Não diz nada sobre disponibilidade real. */
export function orderWindow(today: ISODate) {
  return {
    first: addDays(today, 0),
    last: addDays(today, site.reservation.maxDaysAhead),
  };
}

export type DateStatus = "ok" | "past" | "too-soon" | "too-far" | "invalid";

export function dateStatus(value: ISODate, today: ISODate): DateStatus {
  if (!parseISODate(value)) return "invalid";
  if (value < today) return "past";
  const { first, last } = orderWindow(today);
  if (value < first) return "too-soon";
  if (value > last) return "too-far";
  return "ok";
}

const longDate = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const monthLabel = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "sábado, 15 de novembro de 2026" */
export function formatLongDate(value: ISODate): string {
  const p = parseISODate(value);
  if (!p) return value;
  return longDate.format(new Date(Date.UTC(p.y, p.m - 1, p.d)));
}

/** "15/11/2026" */
export function formatShortDate(value: ISODate): string {
  const p = parseISODate(value);
  if (!p) return value;
  return `${pad(p.d)}/${pad(p.m)}/${p.y}`;
}

export function formatMonth(y: number, m: number): string {
  return monthLabel.format(new Date(Date.UTC(y, m - 1, 1)));
}

/** Minutos desde a meia-noite no fuso do restaurante. */
export function nowMinutesInShop(at: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: site.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return get("hour") * 60 + get("minute");
}

export function timeToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

/** "19:30" → "19h30"; "19:00" → "19h". */
export function formatTime(value: string): string {
  const [h, m] = value.split(":");
  return m === "00" ? `${Number(h)}h` : `${Number(h)}h${m}`;
}
