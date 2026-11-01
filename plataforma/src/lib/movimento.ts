import 'server-only';
import { getPublished } from './stores';
import { openSeatings } from './mesas';
import { heldNow, reservationsOfDay } from './reservas';
import { waitingCount } from './fila';
import { orderingOf, type TableSpot } from './ordering';
import { occupancy } from './salao';

const TZ = 'America/Sao_Paulo';
const today = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

/** Where each table goes on the map: the team's layout, or rows of six in number order. */
export function layoutOf(spots: TableSpot[], count: number): TableSpot[] {
  const placed = spots.filter((s) => s.number <= count);
  const missing = Array.from({ length: count }, (_, i) => i + 1).filter((n) => !placed.some((s) => s.number === n));
  const rows = Math.max(0, ...placed.map((s) => s.y + 1));
  return [...placed, ...missing.map((n, i) => ({ number: n, x: (i % 6) * 2, y: Math.min(7, rows + Math.floor(i / 6)), seats: 4 }))];
}

/** The room as the public may see it: taken or free per table, and the overall level. */
export async function publicFloor(slug: string, now = new Date()) {
  const record = await getPublished(slug);
  if (!record) return null;
  const ordering = orderingOf(record.store);
  if (!ordering.enabled || !ordering.tables.enabled) return null;
  const [seatings, bookings, waiting] = await Promise.all([
    openSeatings(slug),
    ordering.reservations.enabled ? reservationsOfDay(slug, today(now), now) : Promise.resolve([]),
    ordering.waitlist.enabled ? waitingCount(slug, now) : Promise.resolve(0),
  ]);
  const taken = new Set(seatings.filter((s) => s.confirmed || s.devices.length).map((s) => s.number));
  const held = heldNow(bookings, now);
  return {
    store: record.store.name,
    ...occupancy(ordering.tables.count, taken.size, held),
    tables: layoutOf(ordering.salao.layout, ordering.tables.count).map((s) => ({ number: s.number, x: s.x, y: s.y, seats: s.seats, taken: taken.has(s.number) })),
    reservations: ordering.reservations.enabled,
    waitlist: ordering.waitlist.enabled,
    waiting,
    updatedAt: now.toISOString(),
  };
}
export type PublicFloor = NonNullable<Awaited<ReturnType<typeof publicFloor>>>;
