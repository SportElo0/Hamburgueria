export const steps = [
  { label: "Serviço", guard: "#0" },
  { label: "Data", guard: "#½" },
  { label: "Horário", guard: "#1" },
  { label: "Nome", guard: "#1½" },
  { label: "Revisão", guard: "#2" },
  { label: "WhatsApp", guard: "#3" },
] as const;

type Props = {
  current: number;
  /** Maior etapa já liberada; etapas até ela podem ser revisitadas. */
  reached: number;
  onSelect: (step: number) => void;
};

/** Régua de progresso em degraus: cada etapa sobe um pente. */
export function Stepper({ current, reached, onSelect }: Props) {
  return (
    <nav aria-label="Etapas do agendamento">
      <ol className="grid grid-cols-6 items-end gap-1.5 sm:gap-2">
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          const enabled = index <= reached && index !== current && index < 5;
          return (
            <li key={step.label} className="min-w-0">
              <button
                type="button"
                disabled={!enabled}
                onClick={() => onSelect(index)}
                aria-current={active ? "step" : undefined}
                aria-label={`Etapa ${index + 1} de ${steps.length}: ${step.label}${done ? " (concluída)" : ""}`}
                className="group flex min-h-11 w-full flex-col justify-end gap-2 text-left disabled:cursor-default"
              >
                <span
                  aria-hidden
                  style={{ height: `${10 + index * 5}px` }}
                  className={`block w-full rounded-[1px] transition-colors duration-500 ${
                    active ? "bg-blue" : done ? "bg-blue-ink/70" : "bg-fade-5"
                  } ${enabled ? "group-hover:bg-blue-ink" : ""}`}
                />
                <span
                  className={`hidden truncate text-xs font-semibold sm:block ${
                    active ? "text-paper" : done ? "text-paper/75" : "text-steel-dim"
                  }`}
                >
                  <span className="guard mr-1 hidden text-[0.65rem] sm:inline">{step.guard}</span>
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-xs font-semibold text-steel sm:hidden">
        <span className="guard mr-1.5 text-paper">{steps[current].guard}</span>
        Etapa {current + 1} de {steps.length} ·{" "}
        <span className="text-paper">{steps[current].label}</span>
      </p>
    </nav>
  );
}
