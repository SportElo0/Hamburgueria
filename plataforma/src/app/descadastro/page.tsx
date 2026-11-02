import { redirect } from 'next/navigation';
import { descadastrar, gravacaoPermitida, lerToken } from '@/lib/vendas/dados';

export const metadata = { title: 'Não receber mais e-mails · Growlift', robots: { index: false, follow: false } };

/**
 * The link in the footer of every Growlift sales e-mail. Opening it only shows a button: some mail servers open links
 * to scan them, so the opt-out happens on the click (a POST), never on the visit.
 */
async function confirmar(form: FormData) {
  'use server';
  const t = String(form.get('t') ?? '');
  if (!gravacaoPermitida()) redirect(`/descadastro?t=${encodeURIComponent(t)}&r=previa`);
  const r = await descadastrar(t);
  redirect(`/descadastro?r=${r}`);
}

export default async function DescadastroPage({ searchParams }: { searchParams: Promise<{ t?: string; r?: string }> }) {
  const { t = '', r } = await searchParams;
  const valido = Boolean(lerToken(t));
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-4">
      <div className="card w-full p-7">
        <p className="text-sm font-semibold text-ink-mute">Growlift</p>
        {r === 'feito' ? (
          <>
            <h1 className="mt-1 text-2xl font-bold">Pronto, não vamos mais escrever.</h1>
            <p className="mt-2 text-ink-soft">O seu e-mail foi tirado da nossa lista de contatos comerciais. Desculpe o incômodo.</p>
          </>
        ) : r === 'invalido' || !valido ? (
          <>
            <h1 className="mt-1 text-2xl font-bold">Link incompleto</h1>
            <p className="mt-2 text-ink-soft">
              Não conseguimos ler este link. Para não receber mais, responda o e-mail com a palavra &quot;sair&quot; ou escreva para{' '}
              <a className="text-accent underline" href="mailto:contato@growlift.com.br?subject=Sair">
                contato@growlift.com.br
              </a>
              .
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-1 text-2xl font-bold">Não receber mais e-mails da Growlift</h1>
            <p className="mt-2 text-ink-soft">Toque no botão para confirmar. Depois disso, ninguém da Growlift volta a escrever para este endereço.</p>
            {r === 'previa' && <p className="mt-2 text-sm font-semibold text-warn">Esta é uma versão de prévia: nada é salvo aqui.</p>}
            <form action={confirmar} className="mt-5">
              <input type="hidden" name="t" value={t} />
              <button type="submit" className="btn-primary w-full">
                Confirmar: não quero receber
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
