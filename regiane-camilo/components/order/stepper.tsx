export const steps = [
  { id: "ocasiao", label: "Ocasião" },
  { id: "estilo", label: "Estilo" },
  { id: "detalhes", label: "Detalhes" },
  { id: "data", label: "Data e nome" },
  { id: "enviar", label: "Enviar" },
] as const;

type Props = {
  current: number;
  reached: number;
  onGo: (index: number) => void;
};

/** Etapas do pedido. Dá para voltar a qualquer etapa já visitada. */
export function Stepper({ current, reached, onGo }: Props) {
  const shown = Math.min(current, steps.length - 1);
  return (
    <nav aria-label="Etapas do pedido">
      <p className="text-[0.9375rem] text-on-cocoa-muted sm:hidden">
        Etapa {shown + 1} de {steps.length} · <span className="text-cream">{steps[shown].label}</span>
      </p>
      <ol className="hidden gap-2 sm:flex">
        {steps.map((step, i) => {
          const isCurrent = i === shown;
          const canGo = i <= reached && !isCurrent;
          return (
            <li key={step.id} className="flex-1">
              <button
                type="button"
                disabled={!canGo}
                onClick={() => onGo(i)}
                aria-current={isCurrent ? "step" : undefined}
                className="group w-full text-left disabled:cursor-default"
              >
                <span
                  aria-hidden
                  className={`block h-[3px] rounded-full transition-colors duration-500 ${
                    i <= shown ? "bg-rose" : "bg-cocoa-line"
                  }`}
                />
                <span
                  className={`mt-2.5 block text-[0.875rem] ${
                    isCurrent
                      ? "font-semibold text-cream"
                      : i <= reached
                        ? "text-on-cocoa-muted group-enabled:group-hover:text-cream"
                        : "text-on-cocoa-muted/60"
                  }`}
                >
                  <span className="tabular">{i + 1}.</span> {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div aria-hidden className="mt-3 h-[3px] rounded-full bg-cocoa-line sm:hidden">
        <div
          className="h-full rounded-full bg-rose transition-[width] duration-500 ease-[var(--ease-out-expo)]"
          style={{ width: `${((shown + 1) / steps.length) * 100}%` }}
        />
      </div>
    </nav>
  );
}
