/** The floor map: tables placed on a grid, each painted by its state. Used by the public page and the staff map. */

export type SpotState = 'livre' | 'ocupada' | 'conta' | 'reservada' | 'aguardando';

export interface Spot {
  number: number;
  x: number;
  y: number;
  seats: number;
  state: SpotState;
  /** Small line under the number (e.g. "45 min"). */
  note?: string;
}

const STYLE: Record<SpotState, string> = {
  livre: 'border-line bg-white text-ink',
  ocupada: 'border-accent bg-accent text-white',
  conta: 'border-warn bg-warn text-white',
  reservada: 'border-accent bg-accent-soft text-accent',
  aguardando: 'border-accent border-dashed bg-white text-accent',
};

export const STATE_LABEL: Record<SpotState, string> = {
  livre: 'Livre',
  ocupada: 'Ocupada',
  conta: 'Pediu a conta',
  reservada: 'Reservada',
  aguardando: 'Esperando o garçom',
};

export function FloorGrid({ spots, onSelect, selected, label }: { spots: Spot[]; onSelect?: (n: number) => void; selected?: number | null; label: string }) {
  const cols = Math.max(4, ...spots.map((s) => s.x + 1));
  const rows = Math.max(1, ...spots.map((s) => s.y + 1));
  return (
    <div
      role="group"
      aria-label={label}
      className="grid gap-1.5 rounded-2xl border border-line bg-[repeating-linear-gradient(0deg,transparent,transparent_23px,#e9eef5_23px,#e9eef5_24px)] p-2 sm:gap-2 sm:p-3"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, auto)` }}
    >
      {spots.map((s) => {
        const body = (
          <>
            <span className="text-base leading-none font-black tabular-nums sm:text-lg">{s.number}</span>
            {s.note && <span className="mt-0.5 hidden text-[10px] leading-none font-semibold opacity-90 sm:block">{s.note}</span>}
          </>
        );
        const cls = `flex aspect-square w-full min-w-0 flex-col items-center justify-center rounded-lg border-2 sm:rounded-xl ${STYLE[s.state]} ${selected === s.number ? 'ring-4 ring-accent/40' : ''}`;
        const style = { gridColumnStart: s.x + 1, gridRowStart: s.y + 1 };
        const name = `Mesa ${s.number}, ${s.seats} lugares: ${STATE_LABEL[s.state]}${s.note ? `, ${s.note}` : ''}`;
        return onSelect ? (
          <button key={s.number} type="button" style={style} className={`${cls} cursor-pointer`} onClick={() => onSelect(s.number)} aria-label={name} aria-pressed={selected === s.number}>
            {body}
          </button>
        ) : (
          <div key={s.number} style={style} className={cls} role="img" aria-label={name}>
            {body}
          </div>
        );
      })}
    </div>
  );
}

export function Legend({ states }: { states: SpotState[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
      {states.map((s) => (
        <li key={s} className="flex items-center gap-1.5">
          <span aria-hidden="true" className={`inline-block h-3 w-3 rounded border-2 ${STYLE[s]}`} />
          {STATE_LABEL[s]}
        </li>
      ))}
    </ul>
  );
}
