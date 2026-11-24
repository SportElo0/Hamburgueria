import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { listarCadastros, logoUrl } from '@/lib/cadastros';
import { DecidirCadastro } from './DecidirCadastro';

export const metadata = { title: 'Cadastros novos' };

const quando = (iso: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

export default async function CadastrosPage() {
  await requireUser();
  const todos = await listarCadastros();
  const pendentes = todos.filter((c) => c.status === 'pendente');
  const aprovados = todos.filter((c) => c.status === 'aprovado').slice(0, 20);
  return (
    <>
      <h1 className="text-3xl font-bold">Cadastros novos</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-mute">
        Restaurantes que criaram conta sozinhos em &quot;Sou restaurante › Sou novo&quot;. Fale com o dono pelo WhatsApp antes de aprovar. Aprovar cria a loja (sem
        publicar nada) e libera o painel do dono; recusar apaga o cadastro, a senha e a logo.
      </p>
      {pendentes.length === 0 ? (
        <p className="card mt-6 px-5 py-8 text-center text-ink-mute">Nenhum cadastro esperando.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {pendentes.map((c) => {
            const logo = logoUrl(c.logo);
            const wa = `https://wa.me/55${c.whatsapp}`;
            return (
              <li key={c.slug} className="card flex flex-wrap items-center gap-4 p-5">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- private upload served by the panel
                  <img src={logo} alt="" className="h-16 w-16 shrink-0 rounded-lg border border-line object-contain" />
                ) : (
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-dashed border-line text-xs text-ink-mute">sem logo</div>
                )}
                <div className="min-w-0 flex-1 basis-64">
                  <p className="text-lg font-bold">{c.restaurante}</p>
                  <p className="text-sm text-ink-soft">
                    {c.dono} · {c.email} ·{' '}
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline">
                      WhatsApp
                    </a>
                  </p>
                  <p className="text-xs text-ink-mute">
                    Endereço da loja: /loja/{c.slug} · enviado em {quando(c.criadoEm)}
                  </p>
                </div>
                <DecidirCadastro slug={c.slug} nome={c.restaurante} />
              </li>
            );
          })}
        </ul>
      )}
      {aprovados.length > 0 && (
        <>
          <h2 className="mt-10 text-lg font-bold">Aprovados</h2>
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-card">
            {aprovados.map((c) => (
              <li key={c.slug} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>
                  <strong>{c.restaurante}</strong> <span className="text-ink-mute">· {c.dono} · aprovado {c.decididoEm ? quando(c.decididoEm) : ''} por {c.decididoPor}</span>
                </span>
                <Link href={`/painel/lojas/${c.slug}`} className="font-semibold text-accent underline">
                  Abrir loja
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
