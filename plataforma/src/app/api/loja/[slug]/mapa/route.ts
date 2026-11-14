import { NextResponse, type NextRequest } from 'next/server';
import { SALAO, storeAccess } from '@/lib/auth';
import { floor } from '@/lib/mesas';
import { reservationsOfDay } from '@/lib/reservas';
import { queueOfDay } from '@/lib/fila';
import { refundsToDo } from '@/lib/mesa-pagamento';
import { getDraft } from '@/lib/stores';
import { orderingOf } from '@/lib/ordering';
import { layoutOf } from '@/lib/movimento';
import { isSlug } from '@/lib/slug';

const TZ = 'America/Sao_Paulo';
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

/** The owner's floor map: every table's state and the day's bookings. Team or that store's staff only. */
async function mapForStaff(slug: string, date: string) {
  const draft = await getDraft(slug);
  const ordering = draft ? orderingOf(draft.data.store) : null;
  const [tables, bookings, queue, refunds] = await Promise.all([floor(slug), reservationsOfDay(slug, date), queueOfDay(slug), refundsToDo(slug)]);
  return {
    count: ordering?.tables.count ?? 0,
    layout: layoutOf(ordering?.salao.layout ?? [], ordering?.tables.count ?? 0),
    tables: tables.map((t) => ({
      number: t.number,
      openedAt: t.openedAt,
      confirmed: t.confirmed,
      people: t.people ?? null,
      phones: t.devices,
      calls: t.calls.map((c) => c.kind),
      orders: t.orders.filter((o) => o.status !== 'recusado').length,
      total: t.total,
      credit: t.credit ?? 0,
      reservationId: t.reservationId ?? null,
    })),
    bookings: bookings.map((r) => ({
      id: r.id,
      time: r.time,
      people: r.people,
      name: r.name,
      phone: r.phone,
      status: r.status,
      deposit: r.deposit,
      paid: Boolean(r.paidAt),
      demo: r.pix?.provider === 'demo',
      refunded: r.refunded,
      table: r.table,
      toleranceMinutes: r.rules.toleranceMinutes,
      date: r.date,
    })),
    queue: queue
      .filter((q) => q.status === 'aguardando' || q.status === 'chamado')
      .map((q) => ({ id: q.id, name: q.name, phone: q.phone, people: q.people, status: q.status, createdAt: q.createdAt, calledAt: q.calledAt })),
    queueOn: Boolean(ordering?.waitlist.enabled),
    /** Pix the provider would not give back: the till pays these and ticks them off. */
    refunds,
    storeName: draft?.data.store.name ?? '',
    reservationsOn: Boolean(ordering?.reservations.enabled),
    date,
    now: new Date().toISOString(),
  };
}
export type MapForStaff = Awaited<ReturnType<typeof mapForStaff>>;

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug) || !(await storeAccess(slug, SALAO))) return NextResponse.json({ error: 'Sem acesso.' }, { status: 401 });
  const asked = request.nextUrl.searchParams.get('data') ?? '';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(asked) ? asked : today();
  return NextResponse.json(await mapForStaff(slug, date), { headers: { 'Cache-Control': 'no-store' } });
}
