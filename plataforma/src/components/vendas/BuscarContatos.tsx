'use client';

import { useState, useTransition } from 'react';
import { buscarContatosAction, confirmarSugestoesAction, estimarBuscaAction } from '@/app/painel/oportunidades/vendas/actions';

type Estimativa = { contatos: number; chamadas: number; gratisRestantes: number; pagas: number; usd: number; cabe: boolean; limiteMes: number; usadasNoMes: number };

/**
 * "Buscar contatos nos sites": shows the Google cost first (one Place Details call per contact, for the site address),
 * then reads each business's own site. What it finds waits in "Achados para confirmar"; nothing is sent.
 */
export function BuscarContatos({ pendentes }: { pendentes: number }) {
  const [pending, start] = useTransition();
  const [est, setEst] = useState<Estimativa | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  const calcular = () =>
    start(async () => {
      setMsg(null);
      const r = await estimarBuscaAction();
      if (!r.ok) return setMsg({ ok: false, texto: r.error });
      setEst(r.dados);
    });
  const buscar = (n: number) =>
    start(async () => {
      setMsg(null);
      const r = await buscarContatosAction(n);
      setEst(null);
      if (!r.ok) return setMsg({ ok: false, texto: r.error });
      const d = r.dados;
      setMsg({
        ok: true,
        texto: `${d.analisados} site(s) lido(s): ${d.achados} com e-mail para confirmar, ${d.semEmail} sem e-mail (vão para outro canal)${d.adiados ? `, ${d.adiados} não responderam agora` : ''}.${d.restantes ? ` Faltam ${d.restantes}: clique de novo.` : ''}`,
      });
    });

  return (
    <div className="text-right">
      <button type="button" className="btn-ghost" disabled={pending || pendentes === 0} onClick={calcular} title={pendentes === 0 ? 'Nenhum contato com site esperando busca' : undefined}>
        {pending && !est ? 'Calculando…' : `Buscar contatos nos sites (${pendentes})`}
      </button>
      {est && (
        <div role="dialog" aria-label="Custo da busca" className="mt-2 rounded-lg border border-line bg-paper p-3 text-left text-sm">
          <p>
            Vai ler o site de <strong>{est.contatos}</strong> negócio(s). Para saber o endereço do site, faz <strong>{est.chamadas}</strong> consulta(s) ao Google (1 por
            negócio, nada é guardado do Google).
          </p>
          <p className="mt-1">
            Custo:{' '}
            {est.pagas === 0 ? (
              <strong className="text-ok">grátis</strong>
            ) : (
              <strong className="text-warn">US$ {est.usd.toFixed(2)}</strong>
            )}{' '}
            <span className="text-ink-mute">
              (ainda restam {est.gratisRestantes} consultas grátis no mês; limite do painel: {est.usadasNoMes} de {est.limiteMes} usadas)
            </span>
          </p>
          {!est.cabe && <p className="mt-1 font-semibold text-bad">O limite do mês do painel não comporta essa busca.</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn-primary min-h-9 px-3 text-[13px]" disabled={pending || !est.cabe || est.chamadas === 0} onClick={() => buscar(est.chamadas)}>
              {pending ? 'Lendo os sites…' : 'Buscar agora'}
            </button>
            <button type="button" className="btn-ghost min-h-9 px-3 text-[13px]" disabled={pending} onClick={() => setEst(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={`mt-1 text-sm font-semibold ${msg.ok ? 'text-ok' : 'text-bad'}`}>
          {msg.texto}
        </p>
      )}
    </div>
  );
}

export interface Achado {
  id: string;
  negocio?: string;
  email: string;
  fonteUrl: string;
  avisos: string[];
}

/** The suggestions found on the sites: a person looks and confirms them (all the usual rules apply on confirm). */
export function ConfirmarAchados({ achados }: { achados: Achado[] }) {
  const [pending, start] = useTransition();
  const [marcados, setMarcados] = useState<string[]>(achados.filter((a) => a.negocio).map((a) => a.id));
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  // After the last one is confirmed the list empties; the result message stays on screen.
  if (achados.length === 0)
    return msg ? (
      <p role={msg.ok ? 'status' : 'alert'} className={`mt-3 text-sm font-semibold ${msg.ok ? 'text-ok' : 'text-warn'}`}>
        {msg.texto}
      </p>
    ) : null;
  return (
    <div className="mt-3 rounded-xl border border-ok/30 bg-ok/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold">Achados nos sites: confira e confirme ({achados.length})</h3>
        <button
          type="button"
          className="btn-primary min-h-9 px-3 text-[13px]"
          disabled={pending || marcados.length === 0}
          onClick={() =>
            start(async () => {
              setMsg(null);
              const r = await confirmarSugestoesAction(marcados);
              if (!r.ok) return setMsg({ ok: false, texto: r.error });
              setMsg({
                ok: r.dados.falhas.length === 0,
                texto: `${r.dados.confirmados} contato(s) qualificado(s).${r.dados.falhas.length ? ` ${r.dados.falhas.length} não: ${r.dados.falhas.map((f) => f.erro).slice(0, 3).join(' · ')}` : ''}`,
              });
            })
          }
        >
          {pending ? 'Confirmando…' : `Confirmar selecionados (${marcados.length})`}
        </button>
      </div>
      <p className="mt-1 text-xs text-ink-mute">Confira se o e-mail é do próprio negócio (não de uma pessoa) e se o nome está certo. Sem nome, abra o contato e preencha.</p>
      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={`mt-2 text-sm font-semibold ${msg.ok ? 'text-ok' : 'text-warn'}`}>
          {msg.texto}
        </p>
      )}
      <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-card">
        {achados.map((a) => (
          <li key={a.id} className="flex gap-3 px-3 py-2 text-sm">
            <input
              type="checkbox"
              className="mt-1 size-4 shrink-0"
              aria-label={`Confirmar ${a.negocio ?? a.email}`}
              disabled={!a.negocio}
              checked={marcados.includes(a.id)}
              onChange={(e) => setMarcados((m) => (e.target.checked ? [...m, a.id] : m.filter((x) => x !== a.id)))}
            />
            <div className="min-w-0">
              <p>
                <a href={`/painel/oportunidades/vendas/${a.id}`} className="font-semibold hover:text-accent">
                  {a.negocio ?? 'Sem nome (abrir e preencher)'}
                </a>{' '}
                · <span className="break-all">{a.email}</span>
              </p>
              <a className="block truncate text-xs text-accent underline underline-offset-2" href={a.fonteUrl} target="_blank" rel="noopener noreferrer nofollow">
                {a.fonteUrl}
              </a>
              {a.avisos.length > 0 && <p className="text-xs text-warn">{a.avisos.join(' ')}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
