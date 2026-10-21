"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { site } from "@/config/site";
import {
  addDays,
  dateStatus,
  formatLongDate,
  formatMonth,
  parseISODate,
  toISODate,
  type DateStatus,
  type ISODate,
  type Now,
} from "@/lib/schedule";

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
  closed: "barbearia fechada",
  "too-far": "fora do período de agendamento",
  "no-slots": "sem horários restantes hoje",
  invalid: "data inválida",
};

type Props = {
  now: Now;
  value: ISODate | null;
  onChange: (date: ISODate) => void;
};

export function Calendar({ now, value, onChange }: Props) {
  const today = parseISODate(now.date)!;
  const last = parseISODate(addDays(now.date, site.booking.daysAhead))!;
  const initial = value ? parseISODate(value)! : today;
  const [view, setView] = useState({ y: initial.y, m: initial.m });

  const monthIndex = (y: number, m: number) => y * 12 + (m - 1);
  const canPrev = monthIndex(view.y, view.m) > monthIndex(today.y, today.m);
  const canNext = monthIndex(view.y, view.m) < monthIndex(last.y, last.m);

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

  return (
    <div className="w-full max-w-md">
      <div className="mb-4 flex items-center justify-between">
        <p aria-live="polite" className="display text-[1.9rem] first-letter:uppercase">
          {formatMonth(view.y, view.m)}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => shift(-1)}
            disabled={!canPrev}
            aria-label="Mês anterior"
            className="grid size-11 place-items-center rounded-[3px] border border-line-strong text-paper transition-colors hover:bg-fade-4 disabled:border-line disabled:text-steel-dim disabled:hover:bg-transparent"
          >
            <ChevronLeft size={19} />
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            disabled={!canNext}
            aria-label="Próximo mês"
            className="grid size-11 place-items-center rounded-[3px] border border-line-strong text-paper transition-colors hover:bg-fade-4 disabled:border-line disabled:text-steel-dim disabled:hover:bg-transparent"
          >
            <ChevronRight size={19} />
          </button>
        </div>
      </div>

      <div
        className="grid grid-cols-7 gap-1 sm:gap-1.5"
        role="group"
        aria-label="Escolha a data desejada"
      >
        {weekdayHeaders.map((day) => (
          <abbr
            key={day.long}
            title={day.long}
            className="guard pb-2 text-center text-steel-dim no-underline"
          >
            {day.short}
          </abbr>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={`blank-${i}`} aria-hidden />;
          const status = dateStatus(date, now);
          const selected = value === date;
          const isToday = date === now.date;
          const disabled = status !== "ok";
          const day = Number(date.slice(-2));
          const label = `${formatLongDate(date)}${isToday ? ", hoje" : ""}${
            disabled ? `, indisponível: ${statusText[status as Exclude<DateStatus, "ok">]}` : ""
          }`;
          return (
            <button
              key={date}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              aria-label={label}
              onClick={() => onChange(date)}
              className={`tabular relative grid aspect-square min-h-11 place-items-center rounded-[3px] text-[0.95rem] font-semibold transition-colors duration-200 ${
                selected
                  ? "bg-blue text-white"
                  : disabled
                    ? status === "closed"
                      ? "text-steel-dim/60 line-through decoration-steel-dim/60"
                      : "text-steel-dim/45"
                    : "bg-fade-3 text-paper hover:bg-fade-5"
              }`}
            >
              {day}
              {isToday && (
                <span
                  aria-hidden
                  className={`absolute bottom-1.5 h-[2px] w-3 ${selected ? "bg-white" : "bg-blue-ink"}`}
                />
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-steel">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="h-[2px] w-3 bg-blue-ink" /> Hoje
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="text-steel-dim line-through">
            12
          </span>{" "}
          Fechado
        </span>
      </p>
    </div>
  );
}
