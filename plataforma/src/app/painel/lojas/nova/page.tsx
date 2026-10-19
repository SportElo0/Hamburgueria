import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { NewStoreForm } from './NewStoreForm';

export default async function NovaLojaPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-lg">
      <Link href="/painel" className="text-sm text-ink-mute hover:text-ink">
        ← Lojas
      </Link>
      <h1 className="mt-2 text-3xl font-bold">Nova loja</h1>
      <p className="mt-1 text-sm text-ink-mute">Depois de criar, você cadastra o cardápio ou catálogo, contatos e horários.</p>
      <NewStoreForm />
    </div>
  );
}
