import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getChanges, getDraft, getPayment, listChangeMonths, listPedidos } from '@/lib/stores';
import { monthKey, usage } from '@/lib/changes';
import { changeLimit } from '@/lib/schema';
import { isSlug } from '@/lib/slug';
import { StoreEditor } from '@/components/editor/StoreEditor';
import { listOperators } from '@/lib/operators';
import { getSecrets } from '@/lib/pix';
import { orderingOf } from '@/lib/ordering';
import { getOperation } from '@/lib/orders';

const PAYMENT_HISTORY_MONTHS = 6;

function pastMonths(current: string, count: number): string[] {
  const [y, m] = current.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  });
}

export default async function LojaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mes?: string; aba?: string }>;
}) {
  await requireUser();
  const { slug } = await params;
  const { mes, aba } = await searchParams;
  if (!isSlug(slug)) notFound();
  const draft = await getDraft(slug);
  if (!draft) notFound();

  const current = monthKey();
  const month = mes && /^\d{4}-\d{2}$/.test(mes) ? mes : current;
  const historyMonths = pastMonths(current, PAYMENT_HISTORY_MONTHS);
  const [changes, currentChanges, months, pedidos, payments, operators, secrets, operation] = await Promise.all([
    getChanges(slug, month),
    getChanges(slug, current),
    listChangeMonths(slug),
    listPedidos(slug),
    Promise.all(historyMonths.map((m) => getPayment(slug, m))),
    listOperators(slug),
    getSecrets(slug),
    getOperation(slug),
  ]);
  // Stores saved before online ordering existed get its default settings in the editor.
  const record = { ...draft.data, store: { ...draft.data.store, ordering: orderingOf(draft.data.store) } };
  const paymentHistory = historyMonths.map((m, i) => ({ month: m, payment: payments[i] }));
  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`;

  return (
    <>
      <Link href="/painel" className="text-sm text-ink-mute hover:text-ink">
        ← Lojas
      </Link>
      <StoreEditor
        record={record}
        etag={draft.etag}
        month={month}
        currentMonth={current}
        months={[...new Set([current, ...months])]}
        changes={changes}
        currentUsage={usage(currentChanges, changeLimit(draft.data.store))}
        pedidos={pedidos}
        paymentHistory={paymentHistory}
        apiUrl={`${origin}/api/public/lojas/${slug}`}
        operators={operators}
        hasMercadoPago={Boolean(secrets.mercadoPagoToken)}
        ordersUrl={`/loja/${slug}`}
        webhookUrl={`${origin}/api/pagamentos/mercadopago/${slug}`}
        storeOpen={operation.open}
        initialTab={aba}
      />
    </>
  );
}
