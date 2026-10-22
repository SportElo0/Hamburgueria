"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, formatLongDate, formatMonth, parseISODate, toISODate, type ISODate } from "@/lib/dates";

const weekdayHeaders = [
  { short: "D", long: "Domingo" },
  { short: "S", long: "Segunda" },
  { short: "T", long: "Terça" },
  { short: "Q", long: "Quarta" },
  { short: "Q", long: "Quinta" },
  { short: "S", long: "Sexta" },
  { short: "S", long: "Sábado" },
];

type Props = {
  id?: string;
  today: ISODate;
  /** Quantos dias à frente podem ser escolhidos. */
  daysAhead: number;
  value: ISODate | null;
  onChange: (date: ISODate) => void;
  label: string;
};

/** Calendário da solicitação: só bloqueia datas passadas e muito distantes; não mostra vagas. */
export function Calendar({ id, today, daysAhead, value, onChange, label }: Props) {
  const start = parseISODate(today)!;
  const lastDate = addDays(today, daysAhead);
  const end = parseISODate(lastDate)!;
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

  const nav =
    "grid size-10 place-items-center rounded-full border border-line-strong text-deep transition-colors hover:border-deep disabled:border-line disabled:text-line-strong";

  return (
    <div id={id} tabIndex={-1} className="w-full outline-none">
      <div className="mb-2 flex items-center justify-between">
        <p aria-live="polite" className="serif text-[1.35rem] text-deep first-letter:uppercase">
          {formatMonth(view.y, view.m)}
        </p>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => shift(-1)} disabled={!canPrev} aria-label="Mês anterior" className={nav}>
            <ChevronLeft size={17} strokeWidth={1.6} />
          </button>
          <button type="button" onClick={() => shift(1)} disabled={!canNext} aria-label="Próximo mês" className={nav}>
            <ChevronRight size={17} strokeWidth={1.6} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5" role="group" aria-label={label}>
        {weekdayHeaders.map((day) => (
          <abbr key={day.long} title={day.long} className="pb-1.5 text-center text-[0.75rem] font-bold text-muted no-underline">
            {day.short}
          </abbr>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={`blank-${i}`} aria-hidden />;
          const disabled = date < today || date > lastDate;
          const selected = value === date;
          const isToday = date === today;
          return (
            <button
              key={date}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              aria-label={`${formatLongDate(date)}${isToday ? ", hoje" : ""}${disabled ? ", indisponível para solicitação" : ""}`}
              onClick={() => onChange(date)}
              className={`tabular relative mx-auto grid aspect-square w-full max-w-11 min-h-10 place-items-center rounded-full text-[0.9375rem] transition-colors ${
                selected
                  ? "bg-deep font-bold text-sand"
                  : disabled
                    ? "text-line-strong"
                    : "font-semibold text-deep hover:bg-shell"
              }`}
            >
              {Number(date.slice(-2))}
              {isToday && (
                <span aria-hidden className={`absolute bottom-1 size-1 rounded-full ${selected ? "bg-sand" : "bg-champagne"}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
