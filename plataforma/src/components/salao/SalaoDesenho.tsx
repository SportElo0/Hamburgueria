'use client';

import { useEffect, useRef } from 'react';

/**
 * The floor drawn in perspective (isometric), with real little tables, chairs and people: the same picture
 * on the owner's map (tap a table to change it) and on the restaurant's site (read-only, updates by itself).
 * Pure SVG, no images: it scales to any width and stays sharp.
 */

export type DesenhoState = 'livre' | 'ocupada' | 'conta' | 'aguardando';

export interface DesenhoMesa {
  number: number;
  /** Grid cell (12 × 8), the same layout the team sets in Configurar. */
  x: number;
  y: number;
  seats: number;
  state: DesenhoState;
  /** Shown under the number when there is room (e.g. "40 min"). */
  note?: string;
}

const TW = 72; // one grid cell, screen width
const TH = 36; // one grid cell, screen height
const iso = (gx: number, gy: number, z = 0) => ({ x: (gx - gy) * (TW / 2), y: (gx + gy) * (TH / 2) - z });
const pts = (list: { x: number; y: number }[]) => list.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

/** A flat rectangle on the floor plane at height z, centred on (cx, cy), half sizes in grid units. */
function quad(cx: number, cy: number, hx: number, hy: number, z: number) {
  return [iso(cx - hx, cy - hy, z), iso(cx + hx, cy - hy, z), iso(cx + hx, cy + hy, z), iso(cx - hx, cy + hy, z)];
}

const SKIN = ['#F2C8A0', '#D9A273', '#A86F4C', '#7A4E33', '#F5D6BA'];
const SHIRT = ['#0865FE', '#22A06B', '#E8590C', '#7048E8', '#D6336C', '#1098AD', '#F59F00'];

const TOP: Record<DesenhoState, { fill: string; edge: string; side: string }> = {
  livre: { fill: '#FFFFFF', edge: '#C9D3E1', side: '#DCE2EC' },
  ocupada: { fill: '#E7F0FF', edge: '#0865FE', side: '#B9D0FA' },
  conta: { fill: '#FFF4DE', edge: '#D08700', side: '#F2D7A6' },
  aguardando: { fill: '#FFFFFF', edge: '#0865FE', side: '#DCE2EC' },
};

/** Where the chairs go around a table, in grid units from its centre. */
function chairSpots(seats: number, hx: number, hy: number) {
  const gap = 0.2;
  const out: { dx: number; dy: number; face: 'n' | 's' | 'e' | 'w' }[] = [];
  if (seats <= 2) return [{ dx: 0, dy: -hy - gap, face: 'n' as const }, { dx: 0, dy: hy + gap, face: 's' as const }].slice(0, Math.max(1, seats));
  const perLong = Math.ceil((seats - (seats >= 6 ? 2 : 0)) / 2);
  for (let i = 0; i < perLong; i++) {
    const t = perLong === 1 ? 0 : -hx + ((i + 0.5) * (2 * hx)) / perLong;
    out.push({ dx: t, dy: -hy - gap, face: 'n' });
    if (out.length < seats) out.push({ dx: t, dy: hy + gap, face: 's' });
  }
  if (seats >= 6) {
    out.push({ dx: -hx - gap, dy: 0, face: 'w' });
    if (out.length < seats) out.push({ dx: hx + gap, dy: 0, face: 'e' });
  }
  return out.slice(0, seats);
}

function Chair({ cx, cy, person, tone }: { cx: number; cy: number; person: boolean; tone: number }) {
  const seat = quad(cx, cy, 0.11, 0.11, 7);
  const base = iso(cx, cy, 0);
  const top = iso(cx, cy, 7);
  return (
    <g>
      <ellipse cx={base.x} cy={base.y} rx={9} ry={4.5} fill="#121826" opacity={0.08} />
      <line x1={base.x} y1={base.y} x2={top.x} y2={top.y} stroke="#AAB6C8" strokeWidth={2} />
      <polygon points={pts(seat)} fill="#E9EEF5" stroke="#AAB6C8" strokeWidth={1} />
      {person && (
        <g className="salao-pessoa">
          <rect x={top.x - 7} y={top.y - 21} width={14} height={18} rx={6} fill={SHIRT[tone % SHIRT.length]} />
          <circle cx={top.x} cy={top.y - 26} r={6} fill={SKIN[tone % SKIN.length]} />
        </g>
      )}
    </g>
  );
}

function Mesa({ m, selected, onSelect }: { m: DesenhoMesa; selected: boolean; onSelect?: (n: number) => void }) {
  const cx = m.x + 0.5;
  const cy = m.y + 0.5;
  const long = m.seats >= 6;
  const hx = long ? Math.min(0.62, 0.22 + m.seats * 0.05) : m.seats <= 2 ? 0.24 : 0.3;
  const hy = m.seats <= 2 ? 0.24 : 0.3;
  const z = 15;
  const c = TOP[m.state];
  const occupied = m.state === 'ocupada' || m.state === 'conta';
  const chairs = chairSpots(m.seats, hx, hy).map((p, i) => ({ ...p, i, depth: p.dx + p.dy }));
  const behind = chairs.filter((p) => p.depth < 0 || (p.depth === 0 && p.face === 'n'));
  const front = chairs.filter((p) => !behind.includes(p));
  const top = quad(cx, cy, hx, hy, z);
  // The two visible sides (front-left and front-right) give the table its thickness.
  const sideR = [top[1], top[2], { x: top[2].x, y: top[2].y + 5 }, { x: top[1].x, y: top[1].y + 5 }];
  const sideL = [top[3], top[2], { x: top[2].x, y: top[2].y + 5 }, { x: top[3].x, y: top[3].y + 5 }];
  const floorC = iso(cx, cy, 0);
  const label = iso(cx, cy, z);
  const name = `Mesa ${m.number}, ${m.seats} lugares: ${m.state === 'livre' ? 'livre' : m.state === 'conta' ? 'pediu a conta' : m.state === 'aguardando' ? 'esperando o garçom' : 'ocupada'}${m.note ? `, ${m.note}` : ''}`;
  const interactive = Boolean(onSelect);

  return (
    <g
      className={`salao-mesa${interactive ? ' cursor-pointer' : ''}`}
      role={interactive ? 'button' : 'img'}
      tabIndex={interactive ? 0 : undefined}
      aria-label={name}
      aria-pressed={interactive ? selected : undefined}
      onClick={interactive ? () => onSelect!(m.number) : undefined}
      onKeyDown={interactive ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect!(m.number)) : undefined}
    >
      {/* Generous invisible hit area so a finger finds the table easily. */}
      {interactive && <polygon points={pts(quad(cx, cy, hx + 0.32, hy + 0.32, 0))} fill="transparent" />}
      {selected && <polygon points={pts(quad(cx, cy, hx + 0.36, hy + 0.36, 0))} fill="#0865FE" opacity={0.12} stroke="#0865FE" strokeWidth={1.5} />}
      <ellipse cx={floorC.x} cy={floorC.y + 2} rx={(hx + hy) * TW * 0.62} ry={(hx + hy) * TH * 0.62} fill="#121826" opacity={0.07} />
      {behind.map((p) => (
        <Chair key={p.i} cx={cx + p.dx} cy={cy + p.dy} person={occupied && p.i < m.seats} tone={m.number * 3 + p.i} />
      ))}
      <line x1={floorC.x} y1={floorC.y} x2={label.x} y2={label.y} stroke="#AAB6C8" strokeWidth={3} />
      <polygon points={pts(sideL)} fill={c.side} />
      <polygon points={pts(sideR)} fill={c.side} opacity={0.85} />
      <polygon className="salao-tampo" points={pts(top)} fill={c.fill} stroke={c.edge} strokeWidth={m.state === 'livre' ? 1.2 : 2} strokeDasharray={m.state === 'aguardando' ? '5 4' : undefined} />
      {front.map((p) => (
        <Chair key={p.i} cx={cx + p.dx} cy={cy + p.dy} person={occupied && p.i < m.seats} tone={m.number * 3 + p.i} />
      ))}
      {/* Number plate floating above the table, with the state as a coloured dot. */}
      <g transform={`translate(${label.x}, ${label.y - (occupied ? (m.note ? 52 : 40) : 14)})`}>
        <rect x={m.note ? -27 : -17} y={-11} width={m.note ? 54 : 34} height={m.note ? 34 : 22} rx={11} fill="#FFFFFF" stroke="#DCE2EC" />
        <circle cx={-8} cy={0} r={3.5} fill={m.state === 'livre' ? '#22A06B' : m.state === 'conta' ? '#D08700' : '#0865FE'} />
        <text x={4} y={4.5} textAnchor="middle" fontSize={12} fontWeight={800} fill="#121826" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {m.number}
        </text>
        {m.note && (
          <text x={0} y={18} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#4A5568">
            {m.note}
          </text>
        )}
      </g>
    </g>
  );
}

function Planta({ gx, gy }: { gx: number; gy: number }) {
  const b = iso(gx, gy, 0);
  return (
    <g aria-hidden="true">
      <ellipse cx={b.x} cy={b.y} rx={10} ry={5} fill="#121826" opacity={0.08} />
      <path d={`M${b.x - 7},${b.y - 2} L${b.x + 7},${b.y - 2} L${b.x + 5},${b.y - 14} L${b.x - 5},${b.y - 14} Z`} fill="#D9CBB8" />
      <circle cx={b.x - 5} cy={b.y - 22} r={7} fill="#3FA672" />
      <circle cx={b.x + 5} cy={b.y - 24} r={7} fill="#2F8F5F" />
      <circle cx={b.x} cy={b.y - 31} r={7} fill="#4CBB80" />
    </g>
  );
}

export function SalaoDesenho({ mesas, onSelect, selected, label, legend = true, minWidth = 600 }: { mesas: DesenhoMesa[]; onSelect?: (n: number) => void; selected?: number | null; label: string; legend?: boolean; minWidth?: number }) {
  const scroller = useRef<HTMLDivElement>(null);
  // On a narrow screen the room is wider than the frame: start with its middle in view.
  useEffect(() => {
    const el = scroller.current;
    if (el && el.scrollWidth > el.clientWidth) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, []);
  const minX = Math.min(0, ...mesas.map((m) => m.x)) - 0.4;
  const minY = Math.min(0, ...mesas.map((m) => m.y)) - 0.4;
  const maxX = Math.max(3, ...mesas.map((m) => m.x + 1)) + 0.4;
  const maxY = Math.max(2, ...mesas.map((m) => m.y + 1)) + 0.4;
  const floor = [iso(minX, minY), iso(maxX, minY), iso(maxX, maxY), iso(minX, maxY)];
  const wallH = 46;
  const wallBackL = [iso(minX, maxY), iso(minX, minY), { x: iso(minX, minY).x, y: iso(minX, minY).y - wallH }, { x: iso(minX, maxY).x, y: iso(minX, maxY).y - wallH }];
  const wallBackR = [iso(minX, minY), iso(maxX, minY), { x: iso(maxX, minY).x, y: iso(maxX, minY).y - wallH }, { x: iso(minX, minY).x, y: iso(minX, minY).y - wallH }];
  const xs = floor.map((p) => p.x);
  const vbX = Math.min(...xs) - 24;
  const vbW = Math.max(...xs) - Math.min(...xs) + 48;
  const vbY = floor[0].y - wallH - 50;
  const vbH = floor[2].y - vbY + 30;
  const sorted = [...mesas].sort((a, b) => a.x + a.y - (b.x + b.y) || a.x - b.x);
  const door = iso((minX + maxX) / 2, maxY, 0);
  // Floor boards along one axis, so the room reads as a real floor and not a chart.
  const boards = [] as { a: { x: number; y: number }; b: { x: number; y: number } }[];
  for (let gx = Math.ceil(minX); gx < maxX; gx += 0.5) boards.push({ a: iso(gx, minY), b: iso(gx, maxY) });

  return (
    <figure className="salao-desenho m-0">
      {/* On a phone the room keeps a readable size and scrolls sideways inside its frame (never the page). */}
      <div ref={scroller} className="-mx-1 overflow-x-auto overscroll-x-contain px-1 [scrollbar-width:thin]">
      <svg viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`} role="group" aria-label={label} className="block h-auto w-full select-none" style={{ touchAction: 'pan-x pan-y', minWidth: `${minWidth}px` }}>
        <defs>
          <linearGradient id="salao-chao" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FBF6EE" />
            <stop offset="1" stopColor="#F1E6D6" />
          </linearGradient>
          <linearGradient id="salao-parede-l" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#EEF3FA" />
            <stop offset="1" stopColor="#E2E9F3" />
          </linearGradient>
          <linearGradient id="salao-parede-r" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F6F9FD" />
            <stop offset="1" stopColor="#EAF0F7" />
          </linearGradient>
        </defs>
        <polygon points={pts(wallBackL)} fill="url(#salao-parede-l)" stroke="#DCE2EC" />
        <polygon points={pts(wallBackR)} fill="url(#salao-parede-r)" stroke="#DCE2EC" />
        {/* A long window on the back wall and a pendant lamp line: details that make it a place. */}
        <polygon
          points={pts([iso(minX + 1, minY, 16), iso(maxX - 1, minY, 16), iso(maxX - 1, minY, 36), iso(minX + 1, minY, 36)])}
          fill="#DCEBFF"
          stroke="#C9D3E1"
          opacity={0.9}
        />
        <polygon points={pts(floor)} fill="url(#salao-chao)" stroke="#E3D5C2" />
        {boards.map((l, i) => (
          <line key={i} x1={l.a.x} y1={l.a.y} x2={l.b.x} y2={l.b.y} stroke="#E8DCCB" strokeWidth={1} />
        ))}
        <Planta gx={minX + 0.35} gy={minY + 0.35} />
        <Planta gx={maxX - 0.35} gy={minY + 0.35} />
        {sorted.map((m) => (
          <Mesa key={m.number} m={m} selected={selected === m.number} onSelect={onSelect} />
        ))}
        <g transform={`translate(${door.x}, ${door.y + 16})`} aria-hidden="true">
          <rect x={-34} y={-10} width={68} height={20} rx={10} fill="#FFFFFF" stroke="#DCE2EC" />
          <text x={0} y={4} textAnchor="middle" fontSize={10} fontWeight={700} fill="#6A7385" letterSpacing={1}>
            ENTRADA
          </text>
        </g>
      </svg>
      </div>
      {legend && (
        <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#4A5568]">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[#22A06B]" /> Livre
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[#0865FE]" /> Ocupada
          </span>
          {mesas.some((m) => m.state === 'conta') && (
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[#D08700]" /> Pediu a conta
            </span>
          )}
        </figcaption>
      )}
      <style>{`
        .salao-tampo { transition: fill .35s ease, stroke .35s ease; }
        .salao-pessoa { transform-box: fill-box; transform-origin: 50% 100%; animation: salao-senta .45s cubic-bezier(.2,.8,.2,1) both; }
        .salao-mesa, .salao-mesa:focus { outline: none; }
        .salao-mesa:focus-visible .salao-tampo { stroke: #0865FE; stroke-width: 3; }
        @keyframes salao-senta { from { opacity: 0; transform: translateY(6px) scale(.85); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .salao-pessoa { animation: none; } .salao-tampo { transition: none; } }
      `}</style>
    </figure>
  );
}
