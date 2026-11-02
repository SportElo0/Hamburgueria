import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { publicOrigin } from '@/lib/origem';
import { linkMaps, nomeCategoria } from '@/lib/oportunidades/regras';
import { contatoPorId, gravacaoPermitida, tokenDescadastro } from '@/lib/vendas/dados';
import { ETAPAS_ENCERRADAS, linkWhatsAppComercial, linkWhatsAppDoLead, nomeFonte, rodape } from '@/lib/vendas/regras';
import { AcoesContato } from '@/components/vendas/AcoesContato';
import { CopiarLink } from '@/components/vendas/CopiarLink';
import { Rascunhos } from '@/components/vendas/Rascunhos';
import { AvisoFase1, ChipEtapa, dataHora } from '@/components/vendas/ui';

export const metadata = { title: 'Contato · Vendas' };

const TIPO_EVENTO: Record<string, string> = {
  cadastro: 'Cadastro',
  etapa: 'Etapa',
  rascunho: 'Rascunho',
  aprovacao: 'Aprovação',
  descarte: 'Descarte',
  nota: 'Anotação',
  resposta: 'Resposta do cliente',
  bloqueio: 'Bloqueio',
  whatsapp: 'WhatsApp',
};

export default async function ContatoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const c = await contatoPorId(id);
  if (!c) notFound();
  const h = await headers();
  const origem = publicOrigin(`https://${h.get('host') ?? 'localhost'}`);
  let linkSair = `${origem}/descadastro?t=…`;
  try {
    linkSair = `${origem}/descadastro?t=${tokenDescadastro(c.id)}`;
  } catch {
    // Without SESSION_SECRET (local runs) the footer shows a placeholder; sending (phase 2) refuses in that case.
  }
  const encerrado = ETAPAS_ENCERRADAS.includes(c.etapa);
  const primeiroAprovado = c.rascunhos.some((r) => r.tipo === 'primeiro' && r.status === 'aprovado');
  const quente = ['respondeu', 'quente', 'morno'].includes(c.etapa);

  return (
    <>
      <Link href="/painel/oportunidades/vendas" className="text-sm text-ink-mute hover:text-ink">
        ← Vendas
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">{c.negocio}</h1>
        <ChipEtapa etapa={c.etapa} />
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-ink-mute">E-mail</dt>
        <dd className="font-semibold break-all">{c.email}</dd>
        <dt className="text-ink-mute">Fonte do e-mail</dt>
        <dd>
          {nomeFonte(c.fonte.tipo)} ·{' '}
          <a className="break-all text-accent underline underline-offset-2" href={c.fonte.url} target="_blank" rel="noopener noreferrer nofollow">
            {c.fonte.url}
          </a>
        </dd>
        {(c.cidade || c.uf) && (
          <>
            <dt className="text-ink-mute">Cidade</dt>
            <dd>{[c.cidade, c.uf].filter(Boolean).join(' - ')}</dd>
          </>
        )}
        {c.categoria && (
          <>
            <dt className="text-ink-mute">Presença digital</dt>
            <dd>
              {nomeCategoria(c.categoria)}
              {c.sinais.length > 0 && ` · ${c.sinais.join(', ')}`}
            </dd>
          </>
        )}
        {c.placeId && (
          <>
            <dt className="text-ink-mute">Oportunidade</dt>
            <dd>
              <a className="text-accent underline underline-offset-2" href={linkMaps(c.placeId)} target="_blank" rel="noopener noreferrer">
                Abrir no Google Maps
              </a>
            </dd>
          </>
        )}
        <dt className="text-ink-mute">Cadastro</dt>
        <dd>
          {dataHora(c.criadoEm)} · {c.criadoPor}
        </dd>
      </dl>
      {c.observacoes && <p className="mt-3 max-w-3xl text-sm whitespace-pre-wrap text-ink-soft">{c.observacoes}</p>}
      <AvisoFase1 gravacao={gravacaoPermitida()} />

      {quente && (
        <section className="card mt-6 border-bad/30 p-5" aria-labelledby="whats">
          <h2 id="whats" className="text-lg font-bold">
            WhatsApp comercial
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            O painel não manda mensagem. Ou o cliente abre a conversa com o nosso número (link para colar na resposta), ou, se ele pediu por escrito, uma pessoa abre a
            conversa com o número dele.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {c.whatsapp && (
              <a className="btn-primary" href={linkWhatsAppDoLead(c.whatsapp.numero)} target="_blank" rel="noopener noreferrer">
                Abrir conversa com {c.negocio}
              </a>
            )}
            <CopiarLink url={linkWhatsAppComercial(c.negocio)} rotulo="Copiar link do nosso WhatsApp" />
          </div>
          {c.whatsapp && (
            <p className="mt-2 text-xs text-ink-mute">
              Pedido em {dataHora(c.whatsapp.pedidoEm)}: {c.whatsapp.como}
            </p>
          )}
        </section>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Rascunhos id={c.id} rascunhos={c.rascunhos} rodape={rodape(linkSair, c.negocio, nomeFonte(c.fonte.tipo))} encerrado={encerrado} podeAcompanhar={primeiroAprovado && ['aprovado', 'enviado'].includes(c.etapa)} />
        <div className="space-y-6">
          <AcoesContato id={c.id} etapa={c.etapa} podeWhatsapp={quente || c.etapa === 'cliente'} />
          <section className="card p-5" aria-labelledby="historico">
            <h2 id="historico" className="text-lg font-bold">
              Histórico
            </h2>
            <ol className="mt-3 space-y-3">
              {c.historico.toReversed().map((e, i) => (
                <li key={`${e.em}-${i}`} className="border-l-2 border-line pl-3 text-sm">
                  <p className="text-ink-mute">
                    <span className="font-semibold text-ink-soft">{TIPO_EVENTO[e.tipo] ?? e.tipo}</span> · {dataHora(e.em)} · {e.por}
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap">{e.texto}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}
