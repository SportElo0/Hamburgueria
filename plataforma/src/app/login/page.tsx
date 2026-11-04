import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { homeOf, teamUsers } from '@/lib/session';
import { LoginForm } from './LoginForm';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ volta?: string }> }) {
  const user = await currentUser();
  if (user) redirect(homeOf(user));
  const { volta } = await searchParams;
  const configured = teamUsers().length > 0 && Boolean(process.env.SESSION_SECRET);
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="card my-8 w-full max-w-sm p-7">
        <h1 className="text-2xl font-bold">Entrar</h1>
        <p className="mt-1 text-sm text-ink-mute">Painel do restaurante e da equipe Growlift.</p>
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
