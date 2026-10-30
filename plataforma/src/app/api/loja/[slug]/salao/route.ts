import { NextResponse, type NextRequest } from 'next/server';
import { storeAccess } from '@/lib/auth';
import { floor } from '@/lib/mesas';
import { isSlug } from '@/lib/slug';

export type FloorForStaff = Awaited<ReturnType<typeof floorForStaff>>;

/** What the waiter's screen needs: open tables with their orders, without customer tokens. */
async function floorForStaff(slug: string) {
  return (await floor(slug)).map((t) => ({
    ...t,
    orders: t.orders.map((o) => ({ id: o.id, number: o.number, createdAt: o.createdAt, status: o.status, lines: o.lines, total: o.total, reason: o.reason })),
  }));
}

/** The waiter's floor screen polls this. Team or that store's staff only. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug) || !(await storeAccess(slug))) return NextResponse.json({ error: 'Sem acesso.' }, { status: 401 });
  return NextResponse.json({ tables: await floorForStaff(slug), now: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
}
