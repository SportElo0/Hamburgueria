import { NextResponse, type NextRequest } from 'next/server';
import { storeAccess } from '@/lib/auth';
import { getOperation, listOrders } from '@/lib/orders';
import { isSlug } from '@/lib/slug';
import type { Order } from '@/lib/ordering';

export type StaffOrder = Omit<Order, 'tokenHash' | 'payment'> & { payment: Omit<Order['payment'], 'pix'> & { pixProvider: string | null } };

/** The store's order screen polls this. Team or that store's staff only. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug) || !(await storeAccess(slug))) return NextResponse.json({ error: 'Sem acesso.' }, { status: 401 });
  const [orders, operation] = await Promise.all([listOrders(slug), getOperation(slug)]);
  const staff: StaffOrder[] = orders.map((order) => {
    const { tokenHash, payment, ...rest } = order;
    void tokenHash;
    const { pix, ...pay } = payment;
    return { ...rest, payment: { ...pay, pixProvider: pix?.provider ?? null } };
  });
  return NextResponse.json({ orders: staff, operation, now: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
}
