'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { approveAction, checkNowAction, publishNowAction, unscheduleAction } from '@/app/painel/conteudos/agenda/actions';

export interface AgendaCard {
  id: string;
  titulo: string;
  tipo: 'reel' | 'carrossel' | 'imagem';
  legenda: string;
  quando: string;
  ia: boolean;
  palavra: string;
  fixar: boolean;
  status: 'rascunho' | 'agendado' | 'processando' | 'postado' | 'erro' | 'atrasado';
  error: string;
  permalink: string;
  by: string;
  slides: number;
  thumb: string;
  video: string;
  /** Every slide of a carousel (empty for Reels), for the full-screen viewer. */
  images: string[];
}

const TZ = 'America/Sao_Paulo';
/** "2026-11-03T15:00" in São Paulo time, for the date and time inputs. */
function localParts(iso: string) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value]),
  );
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}
const dayTitle = (iso: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, weekday: 'long', day: '2-digit', month: '2-digit' }).format(new Date(iso));

const STATUS: Record<AgendaCard['status'], { label: string; cls: string }> = {
  rascunho: { label: 'Para aprovar', cls: 'bg-paper text-ink-soft border border-line' },
  agendado: { label: 'Agendado', cls: 'bg-accent-soft text-accent-deep' },
  processando: { label: 'Publicando…', cls: 'bg-accent-soft text-accent-deep' },
  postado: { label: 'Postado', cls: 'bg-ok/10 text-ok' },
  erro: { label: 'Deu erro', cls: 'bg-bad/10 text-bad' },
  atrasado: { label: 'Atrasado', cls: 'bg-warn/10 text-warn' },
};
const TIPO = { reel: 'Reel', carrossel: 'Carrossel', imagem: 'Foto' };

export function AgendaBoard({ cards, connected }: { cards: AgendaCard[]; connected: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState('');
  const days = new Map<string, AgendaCard[]>();
  for (const c of cards) {
    const k = localParts(c.quando).date;
    days.set(k, [...(days.get(k) ?? []), c]);
  }
  const count = (s: AgendaCard['status']) => cards.filter((c) => c.status === s).length;

  return (
    <div className="mt-6 space-y-8">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-ink-soft">
          {count('rascunho')} para aprovar · {count('agendado')} agendados · {count('postado')} postados
          {count('erro') + count('atrasado') > 0 && <b className="text-bad"> · {count('erro') + count('atrasado')} precisam de atenção</b>}
        </span>
        {connected && (
          <button type="button" className="btn-ghost min-h-10" disabled={pending} onClick={() => start(async () => setMsg((await checkNowAction()).error ?? 'Verificado.'))}>
            Verificar agora
          </button>
        )}
        {msg && (
          <span role="status" className="text-ink-mute">
            {msg}
          </span>
        )}
      </div>
      {cards.length === 0 && <p className="card px-5 py-10 text-center text-ink-mute">Nenhum post preparado ainda.</p>}
      {[...days.entries()].map(([day, list]) => (
        <section key={day}>
          <h2 className="text-sm font-bold tracking-wide text-ink-mute uppercase">{dayTitle(list[0].quando)}</h2>
          <ul className="mt-3 space-y-4">
            {list.map((c) => (
              <li key={c.id}>
                <Post card={c} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Post({ card }: { card: AgendaCard }) {
  const start0 = localParts(card.quando);
  const [legenda, setLegenda] = useState(card.legenda);
  const [date, setDate] = useState(start0.date);
  const [time, setTime] = useState(start0.time);
  const [ia, setIa] = useState(card.ia);
  const [play, setPlay] = useState(false);
  const [viewer, setViewer] = useState(false);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const editable = card.status !== 'processando' && card.status !== 'postado';
  const hashtags = (legenda.match(/#[\p{L}\p{N}_]+/gu) ?? []).length;
  const act = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError('');
      const r = await fn();
      if (!r.ok) setError(r.error ?? 'Não foi possível agora.');
    });
  const st = STATUS[card.status];

  return (
    <article className="card grid gap-5 p-4 sm:grid-cols-[180px_1fr] sm:p-5">
      {viewer && <SlideViewer title={card.titulo} images={card.images} onClose={() => setViewer(false)} />}
      <div className="relative mx-auto w-[180px] overflow-hidden rounded-xl bg-paper" style={{ aspectRatio: card.tipo === 'reel' ? '9 / 16' : '4 / 5' }}>
        {play && card.video ? (
          <video src={card.video} poster={card.thumb} controls autoPlay playsInline className="h-full w-full object-cover" />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={card.thumb} alt={`Capa: ${card.titulo}`} className="h-full w-full object-cover" loading="lazy" />
            {card.video && (
              <button type="button" onClick={() => setPlay(true)} className="absolute inset-0 grid place-items-center bg-ink/20 text-white" aria-label={`Assistir ${card.titulo}`}>
                <span className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-2xl text-ink">▶</span>
              </button>
            )}
            {card.images.length > 1 && (
              <button type="button" onClick={() => setViewer(true)} className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-ink/60 via-transparent p-3 text-white" aria-label={`Ver as ${card.images.length} imagens de ${card.titulo}`}>
                <span className="rounded-full bg-white/90 px-3 py-1.5 text-sm font-bold text-ink">Ver as {card.images.length} imagens</span>
              </button>
            )}
            {card.tipo === 'carrossel' && <span className="pointer-events-none absolute top-2 right-2 rounded-full bg-ink/70 px-2 py-0.5 text-xs font-semibold text-white">{card.slides} fotos</span>}
          </>
        )}
      </div>

      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="mr-auto text-lg font-bold">{card.titulo}</h3>
          <span className="rounded-full border border-line px-2.5 py-0.5 text-xs font-semibold text-ink-soft">{TIPO[card.tipo]}</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${st.cls}`}>{st.label}</span>
        </div>

        {card.error && (card.status === 'erro' || card.status === 'atrasado') && (
          <p role="alert" className="rounded-lg bg-bad/5 px-3 py-2 text-sm text-bad">
            {card.error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
          <div>
            <label htmlFor={`d-${card.id}`} className="label">
              Dia
            </label>
            <input id={`d-${card.id}`} type="date" className="field" value={date} disabled={!editable} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor={`h-${card.id}`} className="label">
              Hora
            </label>
            <input id={`h-${card.id}`} type="time" className="field" value={time} disabled={!editable} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <div>
          <label htmlFor={`l-${card.id}`} className="label">
            Legenda
          </label>
          <textarea id={`l-${card.id}`} className="field min-h-40 text-sm leading-relaxed" value={legenda} disabled={!editable} onChange={(e) => setLegenda(e.target.value)} />
          <p className={`mt-1 text-xs ${legenda.length > 2200 || hashtags > 30 ? 'font-semibold text-bad' : 'text-ink-mute'}`}>
            {legenda.length} de 2200 caracteres · {hashtags} de 30 hashtags
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-accent" checked={ia} disabled={!editable} onChange={(e) => setIa(e.target.checked)} />
          <span>
            <b>Rótulo de IA</b> (marque quando a voz ou a imagem foi gerada por computador)
          </span>
        </label>

        {(card.palavra || card.fixar) && (
          <ul className="space-y-1 rounded-lg bg-paper px-3 py-2 text-sm text-ink-soft">
            {card.palavra && (
              <li>
                Antes de sair: ligar a palavra <b>{card.palavra}</b> no ManyChat (qualquer post).
              </li>
            )}
            {card.fixar && <li>Depois de publicado: fixar no perfil pelo app (a automação não fixa).</li>}
          </ul>
        )}

        {error && (
          <p role="alert" className="text-sm font-semibold text-bad">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {card.status === 'postado' ? (
            card.permalink ? (
              <a href={card.permalink} target="_blank" rel="noreferrer" className="btn-primary min-h-11">
                Ver no Instagram
              </a>
            ) : (
              <span className="text-sm text-ink-soft">Publicado.</span>
            )
          ) : card.status === 'processando' ? (
            <span className="text-sm text-ink-soft">O Instagram está processando. Em poucos minutos aparece como postado.</span>
          ) : (
            <>
              <button type="button" className="btn-primary min-h-11" disabled={pending} onClick={() => act(() => approveAction(card.id, legenda, `${date}T${time}`, ia))}>
                {card.status === 'agendado' ? 'Salvar agendamento' : 'Aprovar e agendar'}
              </button>
              {card.status !== 'rascunho' && (
                <button
                  type="button"
                  className="btn-ghost min-h-11"
                  disabled={pending}
                  onClick={() => window.confirm(`Publicar "${card.titulo}" agora no Instagram?`) && act(() => publishNowAction(card.id))}
                >
                  Publicar agora
                </button>
              )}
              {card.status === 'agendado' && (
                <button type="button" className="btn-ghost min-h-11" disabled={pending} onClick={() => act(() => unscheduleAction(card.id))}>
                  Cancelar agendamento
                </button>
              )}
            </>
          )}
          {card.by && card.status !== 'rascunho' && <span className="text-xs text-ink-mute">Aprovado por {card.by}</span>}
        </div>
      </div>
    </article>
  );
}

/** Full-screen carousel viewer: swipe (or arrows / keyboard) through every slide, like on Instagram. */
function SlideViewer({ title, images, onClose }: { title: string; images: string[]; onClose: () => void }) {
  const [i, setI] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const go = (n: number) => {
    const k = Math.max(0, Math.min(images.length - 1, n));
    track.current?.children[k]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };
  useEffect(() => {
    closeBtn.current?.focus();
  }, []);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(i + 1);
      if (e.key === 'ArrowLeft') go(i - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  });
  return (
    <div role="dialog" aria-modal="true" aria-label={`Imagens: ${title}`} className="fixed inset-0 z-50 flex flex-col bg-ink/95 text-white">
      <div className="flex items-center gap-3 px-4 py-3">
        <p className="mr-auto truncate text-sm font-semibold">{title}</p>
        <span className="text-sm tabular-nums" aria-live="polite">
          {i + 1} / {images.length}
        </span>
        <button ref={closeBtn} type="button" onClick={onClose} className="min-h-11 rounded-full bg-white/15 px-4 text-sm font-bold hover:bg-white/25">
          Fechar
        </button>
      </div>
      <div
        ref={track}
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto"
        onScroll={(e) => {
          const el = e.currentTarget;
          setI(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {images.map((src, k) => (
          <div key={src} className="flex w-full shrink-0 snap-center items-center justify-center p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Imagem ${k + 1} de ${images.length}`} className="max-h-full max-w-full rounded-xl object-contain" loading={k < 2 ? 'eager' : 'lazy'} />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-4 px-4 py-4">
        <button type="button" onClick={() => go(i - 1)} disabled={i === 0} className="min-h-11 min-w-11 rounded-full bg-white/15 px-4 text-lg font-bold hover:bg-white/25 disabled:opacity-30" aria-label="Imagem anterior">
          ←
        </button>
        <div className="flex gap-1.5" aria-hidden="true">
          {images.map((src, k) => (
            <span key={src} className={`h-1.5 rounded-full transition-all ${k === i ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`} />
          ))}
        </div>
        <button type="button" onClick={() => go(i + 1)} disabled={i === images.length - 1} className="min-h-11 min-w-11 rounded-full bg-white/15 px-4 text-lg font-bold hover:bg-white/25 disabled:opacity-30" aria-label="Próxima imagem">
          →
        </button>
      </div>
    </div>
  );
}
