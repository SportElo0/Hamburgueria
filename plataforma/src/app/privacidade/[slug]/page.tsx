import type { Metadata } from 'next';
import { isSlug } from '@/lib/slug';
import { getPublished } from '@/lib/stores';
import { orderingOf, sellerReady } from '@/lib/ordering';
import { sellerOf } from '@/lib/vendedor';

export const metadata: Metadata = { title: 'Aviso de privacidade' };

/**
 * LGPD art. 9º for the restaurant's own tools: waiting list, paying at the table and online orders (with the POS, when
 * on). Only the parts the store has switched on are shown. Bookings keep their own notice (/reservar/<loja>/privacidade).
 */
export default async function PrivacidadeLoja({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const record = isSlug(slug) ? await getPublished(slug) : null;
  const o = record ? orderingOf(record.store) : null;
  if (!record || !o || !sellerReady(o.reservations)) {
    return (
      <main className="mx-auto max-w-xl px-5 py-16">
        <h1 className="text-2xl font-bold">Aviso indisponível</h1>
      </main>
    );
  }
  const s = sellerOf(record.store);
  const fila = o.tables.enabled && o.waitlist.enabled;
  const mesa = o.tables.enabled && o.tablePay;
  const tem3d = o.tables.enabled && record.store.catalog.categories.some((c) => c.items.some((i) => i.modelo3d));
  const pdv = o.pdv.provider === 'saipos' && Boolean(o.pdv.codStore);
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-5 py-10 text-[15px] leading-relaxed">
      <p className="text-xs font-semibold tracking-wide text-ink-mute uppercase">{record.store.name}</p>
      <h1 className="text-2xl font-bold">Aviso de privacidade</h1>
      <section>
        <h2 className="font-bold">Quem é o responsável</h2>
        <p>
          {s.name}, CNPJ {s.cnpj}, {s.address}, é o controlador dos seus dados. A Growlift fornece o sistema e guarda os dados em nome do restaurante, seguindo as instruções dele.
        </p>
      </section>
      {fila && (
        <section>
          <h2 className="font-bold">Fila de espera</h2>
          <p>
            Seu nome, o número de pessoas e, se você informar, o telefone. Usamos só para chamar você nesta fila (o telefone é opcional: sem ele você é chamado pela página). Não usamos para propaganda. Base: o atendimento que você pediu (LGPD, art. 7º, V). O telefone é apagado assim que você sai da fila (sentou, saiu ou não veio), e a lista inteira é apagada em até 2 dias.
          </p>
        </section>
      )}
      {mesa && (
        <section>
          <h2 className="font-bold">Pagar a conta pelo celular</h2>
          <p>
            O Pix é gerado pelo Mercado Pago e o dinheiro vai direto para a conta do restaurante. Quando o Mercado Pago pede, seu e-mail é enviado a ele para processar o pagamento; ele trata os dados do pagamento por conta própria. Não pedimos CPF. Se você pagar a mais, ou se a mesa já estiver fechada, o valor é devolvido pelo Mercado Pago na conta de onde saiu o Pix.
          </p>
        </section>
      )}
      {tem3d && (
        <section>
          <h2 className="font-bold">Pratos em 3D no cardápio da mesa</h2>
          <p>
            Contamos quantas vezes cada prato foi aberto em 3D, só como um número por prato e por mês, sem ligar a você. Para evitar abuso, guardamos uma marca embaralhada do seu acesso, que muda a cada hora e não permite saber quem você é. A câmera é aberta pelo seu próprio celular (Apple ou Google): nós não recebemos imagens dela. No Android, o visualizador do Google recebe o endereço do arquivo 3D do prato.
          </p>
        </section>
      )}
      <section>
        <h2 className="font-bold">Pedidos pelo site</h2>
        <p>
          Nome, telefone, endereço (na entrega) e o que você pediu, usados para preparar, entregar e falar com você sobre o pedido. Base: a execução da compra (LGPD, art. 7º, V). Observações que você escrever no pedido (por exemplo, uma alergia) também vão para a cozinha: escreva só o necessário para o preparo.
          {pdv && ' Para preparar e entregar, esses dados também vão para o sistema de gestão do restaurante (Saipos). Nunca enviamos CPF.'}
        </p>
      </section>
      <section>
        <h2 className="font-bold">Onde ficam</h2>
        <p>Nos serviços de hospedagem e banco de dados usados pela Growlift (Vercel e Supabase), que podem ficar fora do Brasil, com proteção contratual.</p>
      </section>
      <section>
        <h2 className="font-bold">Seus direitos</h2>
        <p>Você pode pedir para ver, corrigir ou apagar seus dados, ou saber com quem foram compartilhados (LGPD, art. 18), falando com o restaurante: {s.privacyContact}.</p>
      </section>
    </main>
  );
}
