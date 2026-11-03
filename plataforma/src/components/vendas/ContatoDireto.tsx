'use client';

import { useState, useTransition } from 'react';
import { telefoneAction } from '@/app/painel/oportunidades/vendas/actions';
import type { Canal, TextosDiretos } from '@/lib/vendas/regras';
import { CopiarLink } from './CopiarLink';

/**
 * For businesses without a business e-mail: a ready text for one Instagram direct, one WhatsApp message or a call,
 * sent by a person. The phone comes live from Google when asked (one call to the Lead Finder's monthly cap), never stored.
 */
export function ContatoDireto({ id, canal, textos, temLugar, mapsUrl }: { id: string; canal: Canal; textos: TextosDiretos; temLugar: boolean; mapsUrl?: string }) {
  const [pending, start] = useTransition();
  const [tel, setTel] = useState<{ telefone: string; whatsapp: string; site: string } | null>(null);
  const [erro, setErro] = useState('');

  return (
    <section className="card mt-6 p-5" aria-labelledby="direto">
      <h2 id="direto" className="text-lg font-bold">
        Sem e-mail? Contato direto
      </h2>
      <p className="mt-1 text-sm text-ink-soft">
        {canal === 'instagram'
          ? 'Este negócio só aparece pelo Instagram: mande um direct pelo perfil da Growlift, com o texto abaixo.'
          : 'Este negócio não tem site: ligue ou mande uma mensagem de WhatsApp, uma pessoa por vez, com o texto abaixo.'}{' '}
        Nada sai sozinho. Depois, registre em &quot;Anotação&quot; o que aconteceu; se pedirem para não receber, toque em &quot;Bloquear contato&quot;.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className={canal === 'instagram' ? 'lg:order-first' : ''}>
          <h3 className="text-sm font-bold">Direct no Instagram</h3>
          <p className="mt-1 rounded-lg bg-paper p-3 text-sm whitespace-pre-wrap">{textos.instagram}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <CopiarLink url={textos.instagram} rotulo="Copiar texto" />
            {mapsUrl && (
              <a className="btn-ghost min-h-9 px-3 text-[13px]" href={mapsUrl} target="_blank" rel="noopener noreferrer">
                Achar o Instagram pelo Maps
              </a>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold">WhatsApp (uma mensagem, mandada por vocês)</h3>
          <p className="mt-1 rounded-lg bg-paper p-3 text-sm whitespace-pre-wrap">{textos.whatsapp}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <CopiarLink url={textos.whatsapp} rotulo="Copiar texto" />
            {temLugar && !tel && (
              <button
                type="button"
                className="btn-ghost min-h-9 px-3 text-[13px]"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    setErro('');
                    const r = await telefoneAction(id);
                    if (!r.ok) return setErro(r.error);
                    if (!r.dados.liberado) return setErro('Mostrar telefone está desligado no painel (LEADS_MOSTRAR_TELEFONE). Abra o negócio no Maps para ver o número.');
                    setTel({ telefone: r.dados.telefone, whatsapp: r.dados.whatsapp, site: r.dados.site });
                  })
                }
              >
                {pending ? 'Consultando…' : 'Ver telefone agora (1 consulta ao Google)'}
              </button>
            )}
          </div>
          {tel && (
            <div className="mt-2 rounded-lg border border-line p-3 text-sm">
              {tel.telefone ? (
                <>
                  <p>
                    Telefone: <a className="font-semibold text-accent underline" href={`tel:${tel.telefone.replace(/\D/g, '')}`}>{tel.telefone}</a>{' '}
                    <span className="text-xs text-ink-mute">(do Google, só na tela; não fica guardado)</span>
                  </p>
                  {tel.whatsapp ? (
                    <a className="btn-primary mt-2 min-h-9 px-3 text-[13px]" href={`${tel.whatsapp}?text=${encodeURIComponent(textos.whatsapp)}`} target="_blank" rel="noopener noreferrer">
                      Abrir conversa com o texto
                    </a>
                  ) : (
                    <p className="mt-1 text-xs text-ink-mute">É telefone fixo: ligue (roteiro abaixo).</p>
                  )}
                </>
              ) : (
                <p className="text-ink-mute">O Google não mostra telefone para este negócio.</p>
              )}
            </div>
          )}
          {erro && (
            <p role="alert" className="mt-2 text-sm font-semibold text-bad">
              {erro}
            </p>
          )}
        </div>
      </div>
      <h3 className="mt-4 text-sm font-bold">Roteiro de ligação</h3>
      <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
        {textos.ligacao.split('\n').map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ol>
    </section>
  );
}
