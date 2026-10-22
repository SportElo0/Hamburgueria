"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  dateStatus,
  formatLongDate,
  formatMonth,
  orderWindow,
  parseISODate,
  toISODate,
  type DateStatus,
  type ISODate,
} from "@/lib/dates";

const weekdayHeaders = [
  { short: "D", long: "Domingo" },
  { short: "S", long: "Segunda" },
  { short: "T", long: "Terça" },
  { short: "Q", long: "Quarta" },
  { short: "Q", long: "Quinta" },
  { short: "S", long: "Sexta" },
  { short: "S", long: "Sábado" },
];

const statusText: Record<Exclude<DateStatus, "ok">, string> = {
  past: "data passada",
  "too-soon": "muito em cima da hora",
  "too-far": "longe demais para pedir agora",
  invalid: "data inválida",
};

type Props = {
  today: ISODate;
  value: ISODate | null;
  onChange: (date: ISODate) => void;
};

/** Calendário do pedido: só bloqueia datas passadas e fora da janela; não mostra disponibilidade. */
export function Calendar({ today, value, onChange }: Props) {
  const { first, last } = orderWindow(today);
  const start = parseISODate(first)!;
  const end = parseISODate(last)!;
  const initial = value ? parseISODate(value)! : start;
  const [view, setView] = useState({ y: initial.y, m: initial.m });

  const monthIndex = (y: number, m: number) => y * 12 + (m - 1);
  const canPrev = monthIndex(view.y, view.m) > monthIndex(start.y, start.m);
  const canNext = monthIndex(view.y, view.m) < monthIndex(end.y, end.m);

  const shift = (delta: number) => {
    const index = monthIndex(view.y, view.m) + delta;
    setView({ y: Math.floor(index / 12), m: (index % 12) + 1 });
  };

  const firstWeekday = new Date(Date.UTC(view.y, view.m - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(view.y, view.m, 0)).getUTCDate();
  const cells: (ISODate | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toISODate(view.y, view.m, i + 1)),
  ];

  const navButton =
    "grid size-11 place-items-center rounded-full border border-cocoa-line text-cream transition-colors hover:border-cream hover:bg-cream hover:text-cocoa disabled:border-cocoa-line/50 disabled:text-on-cocoa-muted/40 disabled:hover:bg-transparent";

  return (
    <div className="w-full max-w-[26rem]">
      <div className="mb-3 flex items-center justify-between">
        <p aria-live="polite" className="serif text-[1.6rem] text-cream first-letter:uppercase">
          {formatMonth(view.y, view.m)}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => shift(-1)} disabled={!canPrev} aria-label="Mês anterior" className={navButton}>
            <ChevronLeft size={18} strokeWidth={1.6} />
          </button>
          <button type="button" onClick={() => shift(1)} disabled={!canNext} aria-label="Próximo mês" className={navButton}>
            <ChevronRight size={18} strokeWidth={1.6} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1" role="group" aria-label="Escolha a data desejada">
        {weekdayHeaders.map((day) => (
          <abbr
            key={day.long}
            title={day.long}
            className="pb-2 text-center text-[0.8125rem] font-semibold text-on-cocoa-muted no-underline"
          >
            {day.short}
          </abbr>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={`blank-${i}`} aria-hidden />;
          const status = dateStatus(date, today);
          const selected = value === date;
          const isToday = date === today;
          const disabled = status !== "ok";
          const day = Number(date.slice(-2));
          const label = `${formatLongDate(date)}${isToday ? ", hoje" : ""}${
            disabled ? `, indisponível para pedido: ${statusText[status as Exclude<DateStatus, "ok">]}` : ""
          }`;
          return (
            <button
              key={date}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              aria-label={label}
              onClick={() => onChange(date)}
              className={`tabular relative mx-auto grid aspect-square w-full max-w-12 min-h-10 place-items-center rounded-full text-[0.95rem] transition-colors duration-200 ${
                selected
                  ? "bg-rose font-bold text-cocoa-deep"
                  : disabled
                    ? "text-on-cocoa-muted/45"
                    : "font-semibold text-cream hover:bg-cocoa-line"
              }`}
            >
              {day}
              {isToday && (
                <span aria-hidden className="absolute bottom-1 size-1 rounded-full bg-rose" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
