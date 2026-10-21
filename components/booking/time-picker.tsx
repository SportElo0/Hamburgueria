import { groupSlots } from "@/lib/schedule";

type Props = {
  slots: string[];
  value: string | null;
  onChange: (time: string) => void;
};

export function TimePicker({ slots, value, onChange }: Props) {
  const groups = groupSlots(slots);

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <fieldset key={group.id}>
          <legend className="mb-3 flex w-full items-center gap-3 text-[0.8125rem] font-semibold tracking-[0.12em] text-muted uppercase">
            {group.label}
            <span aria-hidden className="h-px flex-1 bg-line" />
          </legend>
          <div className="grid grid-cols-4 gap-2">
            {group.items.map((slot) => {
              const selected = value === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  aria-pressed={selected}
                  aria-label={`Preferência às ${slot}`}
                  onClick={() => onChange(slot)}
                  className={`tabular min-h-11 border text-[0.95rem] font-semibold transition-colors duration-200 ${
                    selected
                      ? "border-ink bg-ink text-ground"
                      : "border-line bg-paper text-ink hover:border-ink"
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
