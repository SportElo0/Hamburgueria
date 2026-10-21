import { site, type DayHours, type Weekday } from "@/config/site";

/** Datas são tratadas como strings "AAAA-MM-DD" para não sofrer com fuso horário. */
export type ISODate = string;

export type Now = { date: ISODate; minutes: number };

const pad = (n: number) => String(n).padStart(2, "0");

/** Data e hora atuais no fuso da barbearia, independente do fuso do aparelho. */
export function nowInShopTimezone(at: Date = new Date()): Now {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: site.hours.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
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

export function weekdayOf(value: ISODate): Weekday {
  const p = parseISODate(value);
  if (!p) return 0;
  return new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay() as Weekday;
}

export function hoursFor(value: ISODate): DayHours {
  return site.hours.week[weekdayOf(value)];
}

export function timeToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(total: number): string {
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/** Horários de preferência sugeridos para um dia (sem nenhuma garantia de vaga). */
export function slotsFor(value: ISODate, now: Now): string[] {
  const hours = hoursFor(value);
  if (!hours) return [];
  const { slotIntervalMinutes, lastSlotBeforeCloseMinutes, minNoticeMinutes } = site.booking;
  const start = timeToMinutes(hours.open);
  const end = timeToMinutes(hours.close) - lastSlotBeforeCloseMinutes;
  const earliest = value === now.date ? now.minutes + minNoticeMinutes : -1;
  const slots: string[] = [];
  for (let t = start; t <= end; t += slotIntervalMinutes) {
    if (t >= earliest) slots.push(minutesToTime(t));
  }
  return slots;
}

export type DateStatus = "ok" | "past" | "closed" | "too-far" | "no-slots" | "invalid";

export function dateStatus(value: ISODate, now: Now): DateStatus {
  if (!parseISODate(value)) return "invalid";
  if (value < now.date) return "past";
  if (value > addDays(now.date, site.booking.daysAhead)) return "too-far";
  if (!hoursFor(value)) return "closed";
  if (slotsFor(value, now).length === 0) return "no-slots";
  return "ok";
}

export function isSlotValid(value: ISODate, time: string, now: Now): boolean {
  return dateStatus(value, now) === "ok" && slotsFor(value, now).includes(time);
}

const longDate = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

const monthLabel = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "sexta-feira, 24/10/2026" */
export function formatLongDate(value: ISODate): string {
  const p = parseISODate(value);
  if (!p) return value;
  return longDate.format(new Date(Date.UTC(p.y, p.m - 1, p.d)));
}

/** "24/10/2026" */
export function formatShortDate(value: ISODate): string {
  const p = parseISODate(value);
  if (!p) return value;
  return `${pad(p.d)}/${pad(p.m)}/${p.y}`;
}

export function formatMonth(y: number, m: number): string {
  return monthLabel.format(new Date(Date.UTC(y, m - 1, 1)));
}

/** Agrupa horários em períodos do dia. */
export function groupSlots(slots: string[]) {
  const groups = [
    { id: "manha", label: "Manhã", items: [] as string[] },
    { id: "tarde", label: "Tarde", items: [] as string[] },
    { id: "noite", label: "Noite", items: [] as string[] },
  ];
  for (const slot of slots) {
    const t = timeToMinutes(slot);
    if (t < 12 * 60) groups[0].items.push(slot);
    else if (t < 18 * 60) groups[1].items.push(slot);
    else groups[2].items.push(slot);
  }
  return groups.filter((g) => g.items.length > 0);
}
