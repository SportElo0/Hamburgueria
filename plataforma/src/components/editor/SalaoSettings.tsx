'use client';

import { useState } from 'react';
import { DEFAULT_RESERVATIONS, brl, type Ordering, type ReservationSettings, type TableSpot } from '@/lib/ordering';

/**
 * The team's settings for the floor: where each table sits on the map (12 × 8 grid), which categories are
 * drinks (for the time-at-table analysis), and the booking rules. Saved with the store; publish to apply.
 */

const COLS = 12;
const ROWS = 8;
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function autoLayout(spots: TableSpot[], count: number): TableSpot[] {
  const placed = spots.filter((s) => s.number <= count);
  const missing = Array.from({ length: count }, (_, i) => i + 1).filter((n) => !placed.some((s) => s.number === n));
  const rows = Math.max(0, ...placed.map((s) => s.y + 1));
  return [...placed, ...missing.map((n, i) => ({ number: n, x: (i % 6) * 2, y: Math.min(ROWS - 1, rows + Math.floor(i / 6)), seats: 4 }))];
}

export function SalaoSettings(props: {
  o: Ordering;
  categories: { id: string; name: string }[];
  setSalao: (v: Ordering['salao']) => void;
  setReservations: (v: ReservationSettings) => void;
  hasMercadoPago: boolean;
}) {
  const { o } = props;
  const layout = autoLayout(o.salao.layout, o.tables.count);
  const [picked, setPicked] = useState<number | null>(null);
  const r = { ...DEFAULT_RESERVATIONS, ...o.reservations };
  const setR = <K extends keyof ReservationSettings>(k: K, v: ReservationSettings[K]) => props.setReservations({ ...r, [k]: v });
  const at = (x: number, y: number) => layout.find((s) => s.x === x && s.y === y);
  const spot = picked ? layout.find((s) => s.number === picked) : undefined;
  const save = (next: TableSpot[]) => props.setSalao({ ...o.salao, layout: next });

  const clickCell = (x: number, y: number) => {
    const here = at(x, y);
    if (here) return setPicked(here.number === picked ? null : here.number);
    if (picked) save(layout.map((s) => (s.number === picked ? { ...s, x, y } : s)));
  };
  const num = (v: string, min: number, max: number) => Math.max(min, Math.min(max, Number(v.replace(/\D/g, '')) || min));

  return (
    <section className="card space-y-6 p-5 lg:col-span-2">
      <div>
        <h2 className="text-lg font-bold">Mapa do salão</h2>
        <p className="text-sm text-ink-mute">Toque numa mesa e depois num espaço vazio para mudar de lugar. Fica igual ao salão de verdade no mapa do dono e na página pública de movimento.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_14rem]">
        <div className="grid gap-1 rounded-xl border border-line p-2" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }} role="grid" aria-label="Posição das mesas">
          {Array.from({ length: ROWS }, (_, y) =>
            Array.from({ length: COLS }, (_, x) => {
              const s = at(x, y);
              return (
                <button
                  key={`${x}-${y}`}
                  type="button"
                  onClick={() => clickCell(x, y)}
                  aria-label={s ? `Mesa ${s.number}` : `Espaço vazio, linha ${y + 1}, coluna ${x + 1}`}
                  aria-pressed={s ? s.number === picked : undefined}
                  className={`aspect-square rounded-md text-xs font-bold tabular-nums ${s ? (s.number === picked ? 'bg-accent text-white' : 'bg-ink text-white') : 'border border-dashed border-line hover:border-ink'}`}
                >
                  {s?.number ?? ''}
                </button>
              );
            }),
          )}
        </div>
        <div className="space-y-3">
          {spot ? (
            <>
              <p className="font-semibold">Mesa {spot.number}</p>
              <div>
                <label htmlFor="lugares" className="label">
                  Lugares
                </label>
                <input id="lugares" className="field w-24" inputMode="numeric" value={spot.seats} onChange={(e) => save(layout.map((s) => (s.number === spot.number ? { ...s, seats: num(e.target.value, 1, 20) } : s)))} />
              </div>
              <p className="text-xs text-ink-mute">Agora toque num espaço vazio para mover.</p>
            </>
          ) : (
            <p className="text-sm text-ink-mute">Escolha uma mesa no quadro.</p>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-bold">Quais categorias são bebida</h3>
        <p className="text-sm text-ink-mute">Usado na análise &quot;quem pede drink fica mais&quot;. Sem marcar nenhuma, vale o nome da categoria (bebidas, drinks, chopp, cerveja, vinho…).</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {props.categories.map((c) => {
            const on = o.salao.drinkCategories.includes(c.id);
            return (
              <label key={c.id} className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm ${on ? 'border-ink bg-ink text-white' : 'border-line bg-white'}`}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={on}
                  onChange={(e) => props.setSalao({ ...o.salao, drinkCategories: e.target.checked ? [...o.salao.drinkCategories, c.id] : o.salao.drinkCategories.filter((x) => x !== c.id) })}
                />
                {c.name}
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 border-t border-line pt-5">
        <div>
          <h3 className="font-bold">Reservas pelo site</h3>
          <p className="text-sm text-ink-mute">O cliente reserva em /reservar e paga um sinal pelo Pix, descontado da conta. As regras aparecem antes de pagar e ficam gravadas em cada reserva.</p>
        </div>
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-ink" checked={r.enabled} onChange={(e) => setR('enabled', e.target.checked)} />
          <span className="text-[15px] font-semibold">Receber reservas pelo site</span>
        </label>
        {r.enabled && o.pixMode === 'mercadopago' && !props.hasMercadoPago && <p className="text-sm font-semibold text-warn">O Pix real está ligado, mas falta o token do Mercado Pago: o sinal não vai funcionar.</p>}
        {r.enabled && o.pixMode === 'demo' && r.depositPerPerson > 0 && <p className="text-sm text-ink-mute">Pix em modo demonstração: o sinal é de mentira, nada é cobrado.</p>}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="sinal" className="label">
              Sinal por pessoa (R$)
            </label>
            <input id="sinal" className="field" inputMode="decimal" defaultValue={(r.depositPerPerson / 100).toFixed(2).replace('.', ',')} onBlur={(e) => setR('depositPerPerson', Math.max(0, Math.min(100_000, Math.round(Number(e.target.value.replace(/[^\d,]/g, '').replace(',', '.')) * 100) || 0)))} />
            <p className="mt-1 text-xs text-ink-mute">Hoje: {r.depositPerPerson ? brl(r.depositPerPerson) : 'sem sinal'}.</p>
          </div>
          <div>
            <label htmlFor="por-horario" className="label">
              Reservas por horário
            </label>
            <input id="por-horario" className="field" inputMode="numeric" value={r.perSlot} onChange={(e) => setR('perSlot', num(e.target.value, 1, 50))} />
          </div>
          <div>
            <label htmlFor="max-pessoas" className="label">
              Máximo de pessoas por reserva
            </label>
            <input id="max-pessoas" className="field" inputMode="numeric" value={r.maxPeople} onChange={(e) => setR('maxPeople', num(e.target.value, 1, 30))} />
          </div>
          <div>
            <label htmlFor="das" className="label">
              Das
            </label>
            <input id="das" type="time" className="field" value={r.from} onChange={(e) => e.target.value && setR('from', e.target.value)} />
          </div>
          <div>
            <label htmlFor="ate" className="label">
              Até (último horário)
            </label>
            <input id="ate" type="time" className="field" value={r.to} onChange={(e) => e.target.value && setR('to', e.target.value)} />
          </div>
          <div>
            <label htmlFor="intervalo" className="label">
              De quanto em quanto
            </label>
            <select id="intervalo" className="field" value={r.slotMinutes} onChange={(e) => setR('slotMinutes', Number(e.target.value) === 60 ? 60 : 30)}>
              <option value={30}>30 minutos</option>
              <option value={60}>1 hora</option>
            </select>
          </div>
          <div>
            <label htmlFor="cancela" className="label">
              Devolve o sinal se cancelar até (horas antes)
            </label>
            <input id="cancela" className="field" inputMode="numeric" value={r.cancelHours} onChange={(e) => setR('cancelHours', num(e.target.value, 0, 72))} />
          </div>
          <div>
            <label htmlFor="tolerancia" className="label">
              Tolerância de atraso (minutos)
            </label>
            <input id="tolerancia" className="field" inputMode="numeric" value={r.toleranceMinutes} onChange={(e) => setR('toleranceMinutes', num(e.target.value, 5, 60))} />
          </div>
          <div>
            <label htmlFor="antecedencia" className="label">
              Aceita reservas para os próximos (dias)
            </label>
            <input id="antecedencia" className="field" inputMode="numeric" value={r.daysAhead} onChange={(e) => setR('daysAhead', num(e.target.value, 1, 60))} />
          </div>
        </div>
        <fieldset>
          <legend className="label">Dias com reserva</legend>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((d, i) => {
              const on = r.days.includes(i);
              return (
                <label key={d} className={`flex min-h-10 cursor-pointer items-center rounded-lg border px-3 text-sm font-semibold ${on ? 'border-ink bg-ink text-white' : 'border-line bg-white'}`}>
                  <input type="checkbox" className="sr-only" checked={on} onChange={(e) => setR('days', e.target.checked ? [...r.days, i].sort() : r.days.filter((x) => x !== i))} />
                  {d}
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>
    </section>
  );
}
