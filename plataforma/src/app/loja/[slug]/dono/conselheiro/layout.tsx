import { notFound } from 'next/navigation';
import { DONO, requireStoreAccess } from '@/lib/auth';
import { isSlug } from '@/lib/slug';
import { contexto, etapasFeitas } from '@/lib/conselheiro/dados';
import { ETAPAS } from '@/lib/conselheiro/modelo';
import { SubNav } from '@/components/conselheiro/SubNav';

export const metadata = { title: 'Conselheiro' };

/** O Conselheiro Growlift: dados do restaurante, simuladores, decisões e testes. Dono da loja ou equipe. */
export default async function ConselheiroLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  await requireStoreAccess(slug, DONO);
  const feitas = etapasFeitas(await contexto(slug));
  const faltam = ETAPAS.filter((e) => !feitas[e]).length;
  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-[13px] font-semibold tracking-wide text-accent uppercase">Conselheiro Growlift</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Antes de mudar, veja a conta</h1>
      <p className="mt-1 hidden max-w-3xl text-ink-soft sm:block">
        Preço, promoção ou combo: veja quanto sobra, os riscos e como testar. Os números saem das contas do painel com os dados que você cadastrou; nada é previsão.
      </p>
      <SubNav base={`/loja/${slug}/dono/conselheiro`} pendencias={faltam} />
      <div className="mt-6">{children}</div>
    </div>
  );
}
