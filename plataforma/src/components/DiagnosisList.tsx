'use client';

import { useState, useTransition } from 'react';
import { setDiagnosisStatusAction } from '@/app/painel/actions';
import type { DiagnosisRequest, DiagnosisStatus } from '@/lib/diagnostics';

const STATUS: { id: DiagnosisStatus; label: string; chip: string }[] = [
  { id: 'novo', label: 'Novo', chip: 'bg-accent-soft text-accent' },
  { id: 'em-andamento', label: 'Fazendo a prévia', chip: 'bg-line text-ink' },
  { id: 'enviado', label: 'Enviado', chip: 'bg-ok/10 text-ok' },
  { id: 'descartado', label: 'Descartado', chip: 'bg-line text-ink-mute' },
];

const fmtPhone = (p: string) => (p.length === 11 ? `(${p.slice(0, 2)}) ${p.slice(2, 7)}-${p.slice(7)}` : `(${p.slice(0, 2)}) ${p.slice(2, 6)}-${p.slice(6)}`);
const fmtWhen = (iso: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

export function DiagnosisList({ requests }: { requests: DiagnosisRequest[] }) {
  const [items, setItems] = useState(requests);
  const [error, setError] = useState('');
  const [, start] = useTransition();

  const change = (id: string, status: DiagnosisStatus) => {
    setItems((list) => list.map((r) => (r.id === id ? { ...r, status } : r)));
    start(async () => {
      const res = await setDiagnosisStatusAction(id, status);
      if (!res.ok) setError(res.error ?? 'Não foi possível salvar.');
    });
  };

  if (items.length === 0) return <p className="card mt-6 px-5 py-10 text-center text-ink-mute">Nenhum pedido ainda. Eles aparecem aqui assim que alguém preenche o formulário do site.</p>;

  return (
    <div className="mt-6 space-y-3">
      {error && (
        <p role="alert" className="text-sm font-semibold text-bad">
          {error}
        </p>
      )}
      {items.map((r) => {
        const status = STATUS.find((s) => s.id === r.status) ?? STATUS[0];
        return (
          <article key={r.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">
                  {r.business} <span className={`chip ml-1 align-middle ${status.chip}`}>{status.label}</span>
                </h2>
                <p className="text-sm text-ink-mute">
                  {r.segment}
                  {r.city && ` · ${r.city}`} · {fmtWhen(r.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor={`st-${r.id}`}>
                  Situação
                </label>
                <select id={`st-${r.id}`} className="field w-auto" value={r.status} onChange={(e) => change(r.id, e.target.value as DiagnosisStatus)}>
                  {STATUS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <a className="btn min-h-10 border border-ok/40 bg-ok/5 text-ok hover:bg-ok hover:text-white" href={`https://wa.me/55${r.whatsapp}`} target="_blank" rel="noreferrer">
                  WhatsApp {fmtPhone(r.whatsapp)}
                </a>
              </div>
            </div>
            <dl className="mt-3 grid gap-2 text-[15px] sm:grid-cols-2">
              <div>
                <dt className="label">Site ou Instagram</dt>
                <dd className="break-words">{r.presence || <span className="text-ink-mute">Não tem ou não informou</span>}</dd>
              </div>
              <div>
                <dt className="label">O que quer melhorar</dt>
                <dd className="whitespace-pre-line">{r.wishes || <span className="text-ink-mute">Não informou</span>}</dd>
              </div>
            </dl>
            <Analise r={r} />
          </article>
        );
      })}
    </div>
  );
}

/** The automatic first look at the site (done when the request arrives, or at 6:30). */
function Analise({ r }: { r: DiagnosisRequest }) {
  const a = r.analysis;
  if (!a) return <p className="mt-3 text-sm text-ink-mute">Análise automática do site: ainda não feita (sai no resumo das 6h30).</p>;
  return (
    <section className="mt-4 rounded-lg border border-line bg-paper p-4" aria-label="Análise automática">
      <p className="text-sm font-semibold">
        {a.tipo === 'sem-site' ? 'Não tem site: fazer a prévia' : a.tipo === 'conferir' ? 'Conferir o site à mão' : `O que melhorar em ${a.site}`}
        <span className="ml-2 font-normal text-ink-mute">análise automática da página inicial · {fmtWhen(a.em)}</span>
      </p>
      {a.pontos.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px]">
          {a.pontos.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      {a.ok.length > 0 && <p className="mt-2 text-sm text-ok">Já está bom: {a.ok.join(' ')}</p>}
    </section>
  );
}
