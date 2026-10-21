export const steps = [
  { label: "Serviço" },
  { label: "Data e horário" },
  { label: "Seu nome e envio" },
] as const;

type Props = {
  current: number;
  /** Maior etapa já liberada; etapas até ela podem ser revisitadas. */
  reached: number;
  onSelect: (step: number) => void;
};

/** Três etapas numeradas com a risca champanhe marcando o progresso. */
export function Stepper({ current, reached, onSelect }: Props) {
  return (
    <nav aria-label="Etapas do agendamento">
      <ol className="grid grid-cols-3 gap-3">
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          const enabled = index <= reached && !active;
          return (
            <li key={step.label} className="min-w-0">
              <button
                type="button"
                disabled={!enabled}
                onClick={() => onSelect(index)}
                aria-current={active ? "step" : undefined}
                aria-label={`Etapa ${index + 1} de ${steps.length}: ${step.label}${done ? " (concluída)" : ""}`}
                className="group flex min-h-11 w-full flex-col justify-end gap-2.5 text-left disabled:cursor-default"
              >
                <span className="flex items-baseline gap-2">
                  <span
                    className={`serif text-xl leading-none ${active || done ? "text-ink" : "text-[#a39c90]"}`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`hidden truncate text-[0.8125rem] font-semibold tracking-[0.1em] uppercase sm:block ${
                      active ? "text-ink" : done ? "text-graphite" : "text-muted"
                    } ${enabled ? "group-hover:text-champagne-text" : ""}`}
                  >
                    {step.label}
                  </span>
                </span>
                <span aria-hidden className="relative block h-px w-full bg-line">
                  <span
                    className={`absolute inset-0 origin-left bg-ink transition-transform duration-700 ease-[var(--ease-out-expo)] ${
                      active || done ? "scale-x-100" : "scale-x-0"
                    } ${active ? "bg-champagne!" : ""}`}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-[0.9rem] font-semibold text-graphite sm:hidden">
        Etapa {current + 1} de {steps.length} · {steps[Math.min(current, steps.length - 1)].label}
      </p>
    </nav>
  );
}
