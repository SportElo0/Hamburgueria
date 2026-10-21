import { groupSlots } from "@/lib/schedule";

type Props = {
  slots: string[];
  value: string | null;
  onChange: (time: string) => void;
};

export function TimePicker({ slots, value, onChange }: Props) {
  const groups = groupSlots(slots);

  return (
    <div className="flex flex-col gap-7">
      {groups.map((group) => (
        <fieldset key={group.id}>
          <legend className="mb-3 flex w-full items-center gap-3 text-sm font-semibold text-steel">
            {group.label}
            <span aria-hidden className="h-px flex-1 bg-line" />
          </legend>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 sm:gap-2">
            {group.items.map((slot) => {
              const selected = value === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  aria-pressed={selected}
                  aria-label={`Preferência às ${slot}`}
                  onClick={() => onChange(slot)}
                  className={`tabular min-h-12 rounded-[3px] text-[0.95rem] font-semibold transition-colors duration-200 ${
                    selected ? "bg-blue text-white" : "bg-fade-3 text-paper hover:bg-fade-5"
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
