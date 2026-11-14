'use client';
// Brazil as a tile map: one square per state, placed roughly where it sits on the map. Light enough for a
// phone, readable by screen readers (each tile is a button with the state's name and count), and the same
// data as the list. The selected state is highlighted; the parent decides what selecting does.
import { ESTADOS, REPRESENTANTES } from '@/data/representantes';

// [uf, column, row] on an 8 × 9 grid
export const POSICOES: [string, number, number][] = [
  ['RR', 2, 0], ['AP', 4, 0],
  ['AM', 1, 1], ['PA', 3, 1], ['MA', 4, 1], ['CE', 5, 1], ['RN', 6, 1],
  ['AC', 0, 2], ['RO', 1, 2], ['MT', 2, 2], ['TO', 3, 2], ['PI', 4, 2], ['PE', 5, 2], ['PB', 6, 2],
  ['MS', 2, 3], ['GO', 3, 3], ['BA', 4, 3], ['SE', 5, 3], ['AL', 6, 3],
  ['DF', 3, 4], ['MG', 4, 4], ['ES', 5, 4],
  ['PR', 2, 5], ['SP', 3, 5], ['RJ', 4, 5],
  ['SC', 2, 6],
  ['RS', 2, 7],
];

export function MapaBrasil({ selecionado, aoEscolher, escuro = false }: { selecionado?: string; aoEscolher: (uf: string) => void; escuro?: boolean }) {
  const contagem = (uf: string) => REPRESENTANTES.filter((r) => r.uf === uf).length;
  return (
    <div className="grid aspect-[8/8.2] w-full grid-cols-8 grid-rows-8 gap-1.5 sm:gap-2" role="group" aria-label="Mapa dos estados com representante Bacchi">
      {POSICOES.map(([uf, c, r]) => {
        const n = contagem(uf);
        const ativo = selecionado === uf;
        return (
          <button
            key={uf}
            type="button"
            onClick={() => aoEscolher(uf)}
            aria-pressed={ativo}
            aria-label={`${ESTADOS[uf]}: ${n} ${n === 1 ? 'representação' : 'representações'}`}
            style={{ gridColumn: c + 1, gridRow: r + 1 }}
            className={`group relative grid place-items-center rounded-md text-[0.7rem] font-bold tracking-wide transition-[background-color,color,transform] duration-300 ease-[var(--ease-saida)] hover:-translate-y-0.5 sm:rounded-lg sm:text-xs ${
              ativo
                ? 'bg-azul text-white shadow-[0_10px_24px_-8px_rgba(0,123,196,.7)]'
                : escuro
                  ? 'bg-white/8 text-white/80 hover:bg-white/16'
                  : 'bg-white text-tinta-2 shadow-[inset_0_0_0_1px_var(--color-linha)] hover:bg-papel-2'
            }`}
          >
            {uf}
            {n > 1 && <span className={`absolute top-1 right-1 h-1.5 w-1.5 rounded-full ${ativo ? 'bg-white' : 'bg-azul-claro'}`} aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}
