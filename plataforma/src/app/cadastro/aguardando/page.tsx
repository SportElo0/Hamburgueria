import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { getCadastro, logoUrl } from '@/lib/cadastros';
import { homeOf } from '@/lib/session';
import { logout } from '@/app/login/actions';

export const metadata = { title: 'Cadastro recebido' };

/** What a restaurant that signed up alone sees until the team approves it. */
export default async function AguardandoPage() {
  const user = await currentUser();
  if (!user) redirect('/login');
  if (!user.pendente) redirect(homeOf(user));
  const c = await getCadastro(user.slug ?? '');
  const logo = c ? logoUrl(c.logo) : '';
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="card my-8 w-full max-w-md p-7 text-center">
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element -- the logo uploaded with the sign-up, served by the panel
          <img src={logo} alt={`Logo de ${c?.restaurante}`} className="mx-auto mb-4 h-20 w-20 rounded-xl border border-line object-contain" />
        )}
        <h1 className="text-2xl font-bold">Recebemos o cadastro{c ? ` do ${c.restaurante}` : ''}</h1>
        <p className="mt-2 text-ink-soft">
          A Growlift confere os dados e libera o seu painel. A gente fala com você pelo WhatsApp{c ? ` ${c.whatsapp.replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3')}` : ''} para
          combinar os próximos passos.
        </p>
        <p className="mt-2 text-sm text-ink-mute">Quando estiver liberado, é só entrar com o seu e-mail e a senha que você criou.</p>
        <p className="mt-4 text-xs text-ink-mute">
          <a href="/cadastro/privacidade" className="underline">
            Como a Growlift usa os seus dados
          </a>
        </p>
        <form action={logout} className="mt-4">
          <button type="submit" className="btn-ghost">
            Sair
          </button>
        </form>
      </div>
    </main>
  );
}
