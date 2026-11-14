import type { Metadata } from 'next';
import { isSlug } from '@/lib/slug';
import { getPublished } from '@/lib/stores';
import { orderingOf, sellerReady } from '@/lib/ordering';
import { sellerOf } from '@/lib/vendedor';

export const metadata: Metadata = { title: 'Aviso de privacidade das reservas' };

/** LGPD art. 9º: what is collected for a booking, why, with whom it is shared, for how long, and the customer's rights. */
export default async function PrivacidadeReservas({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const record = isSlug(slug) ? await getPublished(slug) : null;
  if (!record || !sellerReady(orderingOf(record.store).reservations)) {
    return (
      <main className="mx-auto max-w-xl px-5 py-16">
        <h1 className="text-2xl font-bold">Aviso indisponível</h1>
      </main>
    );
  }
  const s = sellerOf(record.store);
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-5 py-10 text-[15px] leading-relaxed">
      <p className="text-xs font-semibold tracking-wide text-ink-mute uppercase">Reservas · {record.store.name}</p>
      <h1 className="text-2xl font-bold">Aviso de privacidade das reservas</h1>
      <section>
        <h2 className="font-bold">Quem é o responsável</h2>
        <p>
          {s.name}, CNPJ {s.cnpj}, {s.address}, é o controlador dos dados da sua reserva. A Growlift fornece o sistema de reservas e guarda os dados em nome do restaurante, seguindo as instruções dele.
        </p>
      </section>
      <section>
        <h2 className="font-bold">Que dados e para quê</h2>
        <p>Nome, telefone, e-mail (quando informado), dia, horário e número de pessoas. Usamos só para fazer, confirmar e cuidar da sua reserva e do sinal, e para falar com você sobre ela. Não usamos para propaganda. A base é a execução do contrato da reserva (LGPD, art. 7º, V).</p>
      </section>
      <section>
        <h2 className="font-bold">Com quem compartilhamos</h2>
        <p>Para gerar o Pix do sinal, seu nome e e-mail vão ao Mercado Pago, que trata os dados do pagamento por conta própria. Os dados ficam guardados nos serviços de hospedagem e banco de dados usados pela Growlift (Vercel e Supabase), que podem ficar fora do Brasil, com proteção contratual.</p>
      </section>
      <section>
        <h2 className="font-bold">Por quanto tempo</h2>
        <p>
          Nome, telefone e e-mail são apagados {s.keepMonths} {s.keepMonths === 1 ? 'mês' : 'meses'} depois da data da reserva. O registro do valor pago, sem seus dados pessoais, pode ser guardado pelo prazo exigido pela lei fiscal.
        </p>
      </section>
      <section>
        <h2 className="font-bold">Seus direitos</h2>
        <p>Você pode pedir para ver, corrigir ou apagar seus dados, ou saber com quem foram compartilhados (LGPD, art. 18), falando com o restaurante: {s.privacyContact}.</p>
      </section>
      <p>
        <a href={`/reservar/${slug}`} className="underline">
          Voltar para a reserva
        </a>
      </p>
    </main>
  );
}
