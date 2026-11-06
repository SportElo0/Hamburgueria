import Link from 'next/link';
import { notFound } from 'next/navigation';
import { COZINHA, requireStoreAccess } from '@/lib/auth';
import { getDraft } from '@/lib/stores';
import { ordersOfDays } from '@/lib/orders';
import { seatingHistory } from '@/lib/mesas';
import { brl } from '@/lib/ordering';
import { isSlug } from '@/lib/slug';
import { fecharDia } from '@/lib/fechamento';
import { PrintButton } from '@/components/mesa/PrintButton';

export const metadata = { title: 'Fechamento do dia' };

const TZ = 'America/Sao_Paulo';
const diaSP = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const somaDias = (day: string, n: number) => new Date(Date.parse(`${day}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const dataLonga = (day: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${day}T12:00:00Z`));

function Linha({ rotulo, valor, sub, forte }: { rotulo: string; valor: string; sub?: string; forte?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-2 ${forte ? 'text-lg font-extrabold' : ''}`}>
      <span>
        {rotulo}
        {sub && <span className="ml-2 text-xs font-normal text-ink-mute">{sub}</span>}
      </span>
      <span className="tabular-nums">{valor}</span>
    </div>
  );
}

/** O caixa do dia: quanto entrou em Pix, cartão e dinheiro, para conferir com a maquininha e a gaveta. Dono e cozinha/caixa. */
export default async function FechamentoPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ dia?: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  const user = await requireStoreAccess(slug, COZINHA);
  const draft = await getDraft(slug);
  if (!draft) notFound();
  const hoje = diaSP(new Date());
  const pedido = (await searchParams).dia ?? '';
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(pedido) && pedido <= hoje && pedido >= somaDias(hoje, -60) ? pedido : hoje;
  const [dias, historico] = await Promise.all([ordersOfDays(slug, [dia]), seatingHistory(slug, Math.max(2, Math.round((Date.parse(hoje) - Date.parse(dia)) / 86_400_000) + 2))]);
  const mesas = historico.filter((m) => diaSP(new Date(m.closedAt)) === dia);
  const f = fecharDia(dia, dias.flatMap((d) => d.orders), mesas);
  const voltar = user.funcao === 'cozinha' ? `/loja/${slug}` : `/loja/${slug}/dono`;

  return (
    <div className="min-h-dvh pb-16">
      <header className="border-b border-line bg-paper print:hidden">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-ink-mute uppercase">Fechamento do dia</p>
            <h1 className="text-lg font-bold">{draft.data.store.name}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`?dia=${somaDias(dia, -1)}`} className="btn-ghost min-h-11">
              ← Dia anterior
            </Link>
            {dia < hoje && (
              <Link href={`?dia=${somaDias(dia, 1)}`} className="btn-ghost min-h-11">
                Próximo dia →
              </Link>
            )}
            <PrintButton />
            <Link href={voltar} className="btn-primary min-h-11">
              {user.funcao === 'cozinha' ? '← Pedidos' : '← Painel do dono'}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 pt-5">
        <h2 className="text-2xl font-extrabold first-letter:uppercase">
          {dataLonga(dia)}
          {dia === hoje && <span className="ml-2 text-sm font-semibold text-ink-mute">(hoje, até agora)</span>}
        </h2>

        <section className="card px-5 py-3" aria-labelledby="entrou">
          <h3 id="entrou" className="pt-2 text-sm font-bold tracking-wide text-ink-soft uppercase">
            O que entrou
          </h3>
          <div className="divide-y divide-line">
            <Linha rotulo="Pix" sub={`${f.porForma.pix.pedidos} pedidos`} valor={brl(f.porForma.pix.valor)} />
            <Linha rotulo="Cartão" sub={`${f.porForma.cartao.pedidos} pedidos`} valor={brl(f.porForma.cartao.valor)} />
            <Linha rotulo="Dinheiro" sub={`${f.porForma.dinheiro.pedidos} pedidos`} valor={brl(f.porForma.dinheiro.valor)} />
            {(f.servico > 0 || f.couvert > 0) && (
              <>
                <Linha rotulo="Taxa de serviço das mesas" valor={brl(f.servico)} />
                <Linha rotulo="Couvert das mesas" valor={brl(f.couvert)} />
              </>
            )}
            <Linha rotulo="Total" valor={brl(f.recebido + f.servico + f.couvert)} forte />
          </div>
          {f.sinais > 0 && <p className="pb-2 text-xs text-ink-mute">Inclui {brl(f.sinais)} de sinais de reserva pagos antes, abatidos nas contas.</p>}
          <p className="pb-2 text-xs text-ink-mute">
            Taxa de serviço e couvert entram na forma de pagamento escolhida ao fechar a mesa. Confira o cartão com a maquininha e o dinheiro com a gaveta.
          </p>
        </section>

        <section className="card px-5 py-3" aria-labelledby="canais">
          <h3 id="canais" className="pt-2 text-sm font-bold tracking-wide text-ink-soft uppercase">
            Por onde veio
          </h3>
          <div className="divide-y divide-line">
            <Linha rotulo="Mesas (QR e garçom)" sub={`${f.porCanal.mesa.pedidos} pedidos`} valor={brl(f.porCanal.mesa.valor)} />
            <Linha rotulo="Entrega" sub={`${f.porCanal.entrega.pedidos} pedidos`} valor={brl(f.porCanal.entrega.valor)} />
            <Linha rotulo="Retirada" sub={`${f.porCanal.retirada.pedidos} pedidos`} valor={brl(f.porCanal.retirada.valor)} />
          </div>
        </section>

        <section className="card px-5 py-3" aria-labelledby="conferir">
          <h3 id="conferir" className="pt-2 text-sm font-bold tracking-wide text-ink-soft uppercase">
            Para conferir
          </h3>
          <div className="divide-y divide-line">
            <Linha rotulo="Ainda não pago" sub={`${f.emAberto.pedidos} pedidos (mesa aberta ou paga na entrega)`} valor={brl(f.emAberto.valor)} />
            <Linha rotulo="Descontos de cupom" valor={brl(f.descontos)} />
            <Linha rotulo="Taxas de entrega" valor={brl(f.entregas)} />
            <Linha rotulo="Devolvidos" sub={`${f.devolvidos.pedidos} pedidos`} valor={brl(f.devolvidos.valor)} />
            <Linha rotulo="Recusados" valor={String(f.recusados)} />
          </div>
        </section>
        <p className="text-xs text-ink-mute">Só os pedidos feitos pelo sistema (site, mesa e garçom). Vendas lançadas só no caixa ou em aplicativos de entrega não aparecem aqui.</p>
      </main>
    </div>
  );
}
