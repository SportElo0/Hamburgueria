import { notFound } from 'next/navigation';
import { semSistemaCompleto } from '@/lib/produto-servidor';
import { DONO, requireStoreAccess } from '@/lib/auth';
import { getDraft, getPublished } from '@/lib/stores';
import { listCustomers } from '@/lib/customers';
import { isReviewUrl, orderingOf, todaySP } from '@/lib/ordering';
import { isSlug } from '@/lib/slug';
import { CustomersBoard } from '@/components/customers/CustomersBoard';

export const metadata = { title: 'Clientes e avaliações' };

export default async function ClientesDonoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  await requireStoreAccess(slug, DONO);
  await semSistemaCompleto(slug);
  const draft = await getDraft(slug);
  if (!draft) notFound();
  const store = draft.data.store;
  const today = todaySP();
  const coupons = orderingOf(store).coupons.filter((c) => c.active && (!c.until || c.until >= today));
  // The review button the customer sees comes from the published menu.
  const published = await getPublished(slug);
  const reviewUrl = orderingOf(published?.store ?? store).reviewUrl;
  const review = isReviewUrl(reviewUrl) ? reviewUrl : '';
  const tables = orderingOf(store).tables.enabled;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-extrabold tracking-tight">Clientes e avaliações</h1>
      <p className="mt-1 text-ink-soft">Quem pediu pelo site nos últimos 90 dias, campanhas no WhatsApp para quem aceitou e o pedido de avaliação no Google.</p>

      <section className="card mt-6 p-5" aria-labelledby="avaliacoes">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <h2 id="avaliacoes" className="text-lg font-bold">
              Avaliações no Google
            </h2>
            {review ? (
              <p className="mt-1 text-sm text-ink-soft">
                <span className="chip mr-1 bg-ok/10 text-ok">Ligado</span> No fim de cada pedido pelo site{tables ? ' e quando a conta da mesa fecha' : ''}, o cliente vê o botão para avaliar a loja no Google. Vai para
                todo cliente, sem prêmio e sem escolher só quem gostou: é a regra do Google, e assim as notas valem mais.
              </p>
            ) : (
              <p className="mt-1 text-sm text-ink-soft">
                <span className="chip mr-1 bg-line text-ink-mute">Desligado</span> Falta o link de avaliação do Google (no Perfil da Empresa: “Pedir avaliações”). Mande o link para a Growlift colocar: depois disso,
                todo cliente recebe o pedido de avaliação no fim do pedido.
              </p>
            )}
          </div>
          {review && (
            <a href={review} target="_blank" rel="noreferrer" className="btn-ghost min-h-11">
              Abrir minha página de avaliação
            </a>
          )}
        </div>
        <details className="mt-4 rounded-lg border border-line bg-white px-4 py-3 text-sm">
          <summary className="cursor-pointer font-semibold">Como responder as avaliações</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-soft">
            <li>Responda todas, as boas e as ruins, de preferência no mesmo dia.</li>
            <li>Na ruim: agradeça, peça desculpas pelo que deu errado e chame para conversar no privado. Não discuta em público.</li>
            <li>Nunca escreva telefone, endereço ou detalhes do pedido do cliente na resposta.</li>
            <li>Não ofereça desconto em troca de mudar a nota.</li>
          </ul>
        </details>
      </section>

      <div className="mt-4">
        <CustomersBoard embedded slug={slug} storeName={store.name} siteUrl={store.siteUrl} coupons={coupons} customers={await listCustomers(slug)} />
      </div>
    </div>
  );
}
