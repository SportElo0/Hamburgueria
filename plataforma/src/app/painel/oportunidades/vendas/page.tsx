import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { contagemPorEtapa, filaDeAprovacao, gravacaoPermitida, listarContatos } from '@/lib/vendas/dados';
import { iaLigada } from '@/lib/vendas/ia';
import { ETAPAS, ETAPA_IDS, linkWhatsAppComercial, linkWhatsAppDoLead, type Etapa } from '@/lib/vendas/regras';
import { AvisoFase1, ChipEtapa, dataHora } from '@/components/vendas/ui';
import { CopiarLink } from '@/components/vendas/CopiarLink';

export const metadata = { title: 'Vendas' };

const QUENTES: Etapa[] = ['quente', 'respondeu'];

export default async function VendasPage({ searchParams }: { searchParams: Promise<{ etapa?: string }> }) {
  await requireUser();
  const { etapa: filtroRaw } = await searchParams;
  const filtro = ETAPA_IDS.includes(filtroRaw as Etapa) ? (filtroRaw as Etapa) : undefined;
  const contatos = await listarContatos();
  const contagem = contagemPorEtapa(contatos);
  const fila = filaDeAprovacao(contatos);
  const quentes = contatos.filter((c) => QUENTES.includes(c.etapa));
  const lista = filtro ? contatos.filter((c) => c.etapa === filtro) : contatos.filter((c) => c.etapa !== 'nao-contatar');

  return (
    <>
      <Link href="/painel/oportunidades" className="text-sm text-ink-mute hover:text-ink">
        ← Oportunidades
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Vendas</h1>
          <p className="mt-1 max-w-3xl text-ink-soft">
            Abordagem por e-mail dos negócios de Oportunidades: contato com fonte, texto aprovado por uma pessoa, resposta e entrega dos interessados no WhatsApp comercial.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/painel/oportunidades/vendas/novo" className="btn-primary">
            Novo contato
          </Link>
          <Link href="/painel/oportunidades/vendas/bloqueio" className="btn-ghost">
            Lista de bloqueio
          </Link>
        </div>
      </div>
      <AvisoFase1 gravacao={gravacaoPermitida()} />
      <p className="mt-2 text-sm text-ink-mute">Rascunhos: {iaLigada() ? 'IA ligada (modelo econômico, com limite mensal)' : 'simulador, sem IA e sem custo'}.</p>

      {quentes.length > 0 && (
        <section className="mt-6" aria-labelledby="quentes">
          <h2 id="quentes" className="text-xl font-bold">
            Falar hoje <span className="text-base font-semibold text-bad">({quentes.length})</span>
          </h2>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {quentes.map((c) => {
              const ultima = c.historico.findLast((e) => e.tipo === 'resposta') ?? c.historico.at(-1);
              return (
                <li key={c.id} className="card border-bad/30 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/painel/oportunidades/vendas/${c.id}`} className="text-lg font-bold hover:text-accent">
                      {c.negocio}
                    </Link>
                    <ChipEtapa etapa={c.etapa} />
                  </div>
                  {ultima && (
                    <p className="mt-2 line-clamp-3 text-sm text-ink-soft">
                      <span className="text-ink-mute">{dataHora(ultima.em)} · </span>
                      {ultima.texto}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {c.whatsapp ? (
                      <a className="btn-primary min-h-9 px-3 text-[13px]" href={linkWhatsAppDoLead(c.whatsapp.numero)} target="_blank" rel="noopener noreferrer">
                        Abrir conversa no WhatsApp
                      </a>
                    ) : (
                      <CopiarLink url={linkWhatsAppComercial(c.negocio)} rotulo="Copiar link do nosso WhatsApp" />
                    )}
                    <Link href={`/painel/oportunidades/vendas/${c.id}`} className="btn-ghost min-h-9 px-3 text-[13px]">
                      Ver histórico
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-8" aria-labelledby="fila">
        <h2 id="fila" className="text-xl font-bold">
          Para aprovar <span className="text-base font-semibold text-ink-mute">({fila.length})</span>
        </h2>
        {fila.length === 0 ? (
          <p className="mt-2 text-sm text-ink-mute">Nenhum texto esperando aprovação.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-card">
            {fila.map(({ contato, rascunho }) => (
              <li key={rascunho.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-semibold">{contato.negocio}</p>
                  <p className="truncate text-sm text-ink-soft">
                    {rascunho.tipo === 'primeiro' ? 'Primeiro e-mail' : 'Acompanhamento'} · {rascunho.assunto}
                    {rascunho.alertas.length > 0 && <span className="text-warn"> · {rascunho.alertas.length} alerta(s)</span>}
                  </p>
                </div>
                <Link href={`/painel/oportunidades/vendas/${contato.id}`} className="btn-primary min-h-9 px-3 text-[13px]">
                  Ler e aprovar
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8" aria-labelledby="funil">
        <h2 id="funil" className="text-xl font-bold">
          Funil
        </h2>
        <nav className="mt-3 flex flex-wrap gap-2" aria-label="Filtrar por etapa">
          <Link href="/painel/oportunidades/vendas" className={`chip border px-3 py-1 ${!filtro ? 'border-accent bg-accent text-white' : 'border-line bg-white'}`}>
            Todos ativos
          </Link>
          {ETAPAS.map((e) => (
            <Link
              key={e.id}
              href={`/painel/oportunidades/vendas?etapa=${e.id}`}
              title={e.dica}
              className={`chip border px-3 py-1 ${filtro === e.id ? 'border-accent bg-accent text-white' : 'border-line bg-white'}`}
            >
              {e.nome} · {contagem[e.id]}
            </Link>
          ))}
        </nav>
        {lista.length === 0 ? (
          <p className="mt-3 text-sm text-ink-mute">
            Nenhum contato aqui. Comece em <Link href="/painel/oportunidades" className="underline">Oportunidades</Link> ou em &quot;Novo contato&quot;.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-card">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-ink-soft">
                <tr>
                  <th className="px-3 py-2 font-semibold">Negócio</th>
                  <th className="px-3 py-2 font-semibold">Etapa</th>
                  <th className="px-3 py-2 font-semibold">Cidade</th>
                  <th className="px-3 py-2 font-semibold">Último movimento</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr key={c.id} className="border-t border-line">
                    <td className="px-3 py-2">
                      <Link href={`/painel/oportunidades/vendas/${c.id}`} className="font-semibold hover:text-accent">
                        {c.negocio}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <ChipEtapa etapa={c.etapa} />
                    </td>
                    <td className="px-3 py-2">{[c.cidade, c.uf].filter(Boolean).join(' - ')}</td>
                    <td className="px-3 py-2 text-ink-soft">
                      {dataHora(c.atualizadoEm)} · {c.historico.at(-1)?.texto.slice(0, 80)}
                    </td>
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
