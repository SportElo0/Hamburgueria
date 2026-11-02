import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { gravacaoPermitida, listarBloqueio } from '@/lib/vendas/dados';
import { Desbloquear, NovoBloqueio } from '@/components/vendas/Bloqueio';
import { AvisoFase1, dataHora } from '@/components/vendas/ui';

export const metadata = { title: 'Lista de bloqueio · Vendas' };

const ORIGEM = { equipe: 'Equipe', descadastro: 'Link de descadastro', resposta: 'Resposta ao e-mail' } as const;
const TIPO = { email: 'E-mail', dominio: 'Domínio', lugar: 'Negócio' } as const;

export default async function BloqueioPage() {
  await requireUser();
  const lista = await listarBloqueio();
  return (
    <>
      <Link href="/painel/oportunidades/vendas" className="text-sm text-ink-mute hover:text-ink">
        ← Vendas
      </Link>
      <h1 className="mt-2 text-3xl font-bold">Lista de bloqueio</h1>
      <p className="mt-1 max-w-3xl text-ink-soft">
        Quem está aqui nunca recebe e-mail: o painel confere antes de cada rascunho, aprovação e (na fase 2) envio. O e-mail fica guardado só como código e parcialmente
        escondido. Pedido do próprio negócio (link ou resposta) não pode ser desfeito.
      </p>
      <AvisoFase1 gravacao={gravacaoPermitida()} />
      <NovoBloqueio />
      <section className="mt-6" aria-labelledby="lista">
        <h2 id="lista" className="text-xl font-bold">
          Bloqueados <span className="text-base font-semibold text-ink-mute">({lista.length})</span>
        </h2>
        {lista.length === 0 ? (
          <p className="mt-2 text-sm text-ink-mute">Ninguém bloqueado ainda.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-card">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-ink-soft">
                <tr>
                  <th className="px-3 py-2 font-semibold">Quem</th>
                  <th className="px-3 py-2 font-semibold">Tipo</th>
                  <th className="px-3 py-2 font-semibold">Motivo</th>
                  <th className="px-3 py-2 font-semibold">Origem</th>
                  <th className="px-3 py-2 font-semibold">Quando</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {lista.map((b) => (
                  <tr key={b.chave} className="border-t border-line">
                    <td className="px-3 py-2 font-semibold break-all">{b.rotulo}</td>
                    <td className="px-3 py-2">{TIPO[b.tipo]}</td>
                    <td className="px-3 py-2">{b.motivo}</td>
                    <td className="px-3 py-2">{ORIGEM[b.origem]}</td>
                    <td className="px-3 py-2 text-ink-mute">
                      {dataHora(b.em)} · {b.por}
                    </td>
                    <td className="px-3 py-2 text-right">{b.origem === 'equipe' && <Desbloquear chave={b.chave} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
