import { notFound } from 'next/navigation';
import { semSistemaCompleto } from '@/lib/produto-servidor';
import { DONO, requireStoreAccess } from '@/lib/auth';
import { getDraft } from '@/lib/stores';
import { listOperators } from '@/lib/operators';
import { isSlug } from '@/lib/slug';
import { EquipeBoard } from '@/components/dono/EquipeBoard';

export const metadata = { title: 'Equipe' };

export default async function EquipeDonoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  const user = await requireStoreAccess(slug, DONO);
  await semSistemaCompleto(slug);
  if (!(await getDraft(slug))) notFound();
  const logins = (await listOperators(slug)).map(({ email, name, funcao }) => ({ email, name, funcao }));
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-extrabold tracking-tight">Equipe</h1>
      <p className="mt-1 text-ink-soft">Crie o login de cada garçom e de quem fica na cozinha. Quando alguém sair, remova no mesmo dia.</p>
      <div className="mt-6">
        <EquipeBoard slug={slug} logins={logins} eu={user.email} />
      </div>
    </div>
  );
}
