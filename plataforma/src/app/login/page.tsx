import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { teamUsers } from '@/lib/session';
import { LoginForm } from './LoginForm';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ volta?: string }> }) {
  if (await currentUser()) redirect('/painel');
  const { volta } = await searchParams;
  const configured = teamUsers().length > 0 && Boolean(process.env.SESSION_SECRET);
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="card w-full max-w-sm p-7">
        <h1 className="text-2xl font-bold">Painel das lojas</h1>
        <p className="mt-1 text-sm text-ink-mute">Entre com a conta da equipe.</p>
        {configured ? (
          <LoginForm volta={volta ?? ''} />
        ) : (
          <p className="mt-6 rounded-lg bg-accent-soft p-3 text-sm">
            Nenhuma conta configurada. Defina <code>ADMIN_USERS</code> e <code>SESSION_SECRET</code> nas variáveis de ambiente.
          </p>
        )}
      </div>
    </main>
  );
}
