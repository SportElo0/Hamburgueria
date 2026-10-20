import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { listStores, getChanges, getDraft, getPayment, listPedidos } from '@/lib/stores';
import { monthKey, monthLabel, usage } from '@/lib/changes';
import { changeLimit, partnerStatus, PLAN_LABEL, type PartnerStatus } from '@/lib/schema';
import { UsageBadge } from '@/components/UsageBadge';
import { ImportSeeds } from '@/components/ImportSeeds';
import { seedStores } from '@/lib/seeds';

const SEGMENT_LABEL = { restaurante: 'Restaurante', loja: 'Loja', servico: 'Serviço' } as const;
const PARTNER_CHIP: Partial<Record<PartnerStatus, { label: string; tone: string }>> = {
  vencido: { label: 'Parceria vencida', tone: 'bg-bad/10 text-bad' },
  vencendo: { label: 'Parceria vencendo', tone: 'bg-warn/10 text-warn' },
};

export default async function PainelPage() {
  await requireUser();
  const month = monthKey();
  const stores = await listStores();
  const rows = await Promise.all(
    stores.map(async (s) => {
      const [changes, draft, pedidos, payment] = await Promise.all([getChanges(s.slug, month), getDraft(s.slug), listPedidos(s.slug), getPayment(s.slug, month)]);
      return {
        ...s,
        usage: usage(changes, draft ? changeLimit(draft.data.store) : 0),
        pending: Boolean(draft?.data.publishedAt && draft.data.updatedAt > draft.data.publishedAt),
        partner: draft ? partnerStatus(draft.data.store) : 'sem-prazo',
        pedidosAbertos: pedidos.filter((p) => p.status === 'pendente').length,
        monthlyFee: draft?.data.store.account.monthlyFee ?? null,
        payment,
      };
    }),
  );
  const extras = rows.reduce((n, r) => n + r.usage.extras, 0);
  const missingSeeds = seedStores().filter((s) => !stores.some((x) => x.slug === s.slug)).map((s) => s.name);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Lojas</h1>
          <p className="mt-1 text-sm text-ink-mute">
            Mudanças de {monthLabel(month)} · {rows.length} {rows.length === 1 ? 'loja' : 'lojas'}
            {extras > 0 && <span className="font-semibold text-warn"> · {extras} mudança(s) extra(s) para cobrar</span>}
          </p>
        </div>
        <Link href="/painel/lojas/nova" className="btn-primary">
          + Nova loja
        </Link>
      </div>

      {missingSeeds.length > 0 && <ImportSeeds names={missingSeeds} />}

      {rows.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <p className="font-semibold">Nenhuma loja cadastrada ainda.</p>
          <p className="mt-1 text-sm text-ink-mute">Cadastre a primeira para começar a editar o cardápio ou catálogo.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {rows.map((r) => (
            <li key={r.slug}>
              <Link href={`/painel/lojas/${r.slug}`} className="card block p-5 transition-colors hover:border-ink">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold">{r.name}</p>
                    <p className="text-sm text-ink-mute">
                      {SEGMENT_LABEL[r.segment]} · {PLAN_LABEL[r.plan]}
                    </p>
                  </div>
                  <UsageBadge usage={r.usage} />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PARTNER_CHIP[r.partner] && <span className={`chip ${PARTNER_CHIP[r.partner]!.tone}`}>{PARTNER_CHIP[r.partner]!.label}</span>}
                  {r.pedidosAbertos > 0 && (
                    <span className="chip bg-warn/10 text-warn">
                      {r.pedidosAbertos} pedido{r.pedidosAbertos > 1 ? 's' : ''} pendente{r.pedidosAbertos > 1 ? 's' : ''}
                    </span>
                  )}
                  {r.monthlyFee !== null && !r.payment.paid && <span className="chip bg-ink/5 text-ink-soft">Mensalidade pendente</span>}
                </div>
                <p className="mt-3 text-xs text-ink-mute">
                  {r.publishedAt ? `Publicado em ${new Date(r.publishedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}` : 'Ainda não publicado'}
                  {r.pending && <span className="font-semibold text-warn"> · rascunho com alterações não publicadas</span>}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
