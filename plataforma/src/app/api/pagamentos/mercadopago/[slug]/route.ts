import { NextResponse, type NextRequest } from 'next/server';
import { settleFromMercadoPago } from '@/lib/orders';
import { isSlug } from '@/lib/slug';

/**
 * Mercado Pago payment notifications for one store. The body is only a hint: the payment is looked
 * up with the store's own token before any order changes, so a forged call cannot mark anything paid.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) return new NextResponse(null, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { type?: string; data?: { id?: string | number } };
  const q = request.nextUrl.searchParams;
  const type = body.type ?? q.get('type') ?? q.get('topic');
  const paymentId = String(body.data?.id ?? q.get('data.id') ?? q.get('id') ?? '');
  if (type === 'payment' && paymentId) {
    try {
      await settleFromMercadoPago(slug, paymentId);
    } catch (err) {
      // Answer with an error so Mercado Pago retries later.
      console.error('mercadopago webhook', err);
      return new NextResponse(null, { status: 500 });
    }
  }
  return new NextResponse(null, { status: 200 });
}
