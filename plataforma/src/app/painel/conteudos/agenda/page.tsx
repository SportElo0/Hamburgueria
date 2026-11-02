import Link from 'next/link';
import { headers } from 'next/headers';
import { after } from 'next/server';
import { requireUser } from '@/lib/auth';
import { agendaView, runAgenda } from '@/lib/agenda';
import { publicOrigin } from '@/lib/origem';
import { account, instagramConfigured, publishingUsage } from '@/lib/instagram';
import { AgendaBoard, type AgendaCard } from '@/components/agenda/AgendaBoard';
import { fileUrl } from '../urls';

export const metadata = { title: 'Agenda do Instagram' };
export const dynamic = 'force-dynamic';

export default async function AgendaPage() {
  await requireUser();
  // Opening the agenda also moves the publisher along (useful while the 5-minute pinger isn't set up yet).
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const origin = publicOrigin(`${h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')}://${host}`);
  after(() => runAgenda(origin).catch((err) => console.error('agenda: ao abrir', err)));
  const items = await agendaView();
  const connected = instagramConfigured();
  let username = '';
  let usage: { used: number; total: number } | null = null;
  let connectError = '';
  if (connected) {
    try {
      username = (await account()).username;
      usage = await publishingUsage().catch(() => null);
    } catch (err) {
      connectError = err instanceof Error ? err.message : 'Não foi possível falar com o Instagram.';
    }
  }
  const cards: AgendaCard[] = items.map((it) => ({
    id: it.id,
    titulo: it.titulo,
    tipo: it.tipo,
    legenda: it.legenda,
    quando: it.quando,
    ia: it.ia,
    palavra: it.palavra ?? '',
    fixar: Boolean(it.fixar),
    status: it.status,
    error: it.state?.error ?? '',
    permalink: it.state?.permalink ?? '',
    by: it.state?.by ?? '',
    slides: it.arquivos.length,
    thumb: it.capa ? fileUrl({ path: it.capa, thumb: it.capa }) : fileUrl({ path: it.arquivos[0], thumb: it.arquivos[0] }),
    video: it.tipo === 'reel' ? fileUrl({ path: it.arquivos[0], thumb: it.arquivos[0] }) : '',
    images: it.tipo === 'reel' ? [] : it.arquivos.map((p) => fileUrl({ path: p, thumb: p })),
  }));

  return (
    <>
      <p className="text-sm">
        <Link href="/painel/conteudos" className="text-ink-mute hover:text-ink">
          ← Conteúdos
        </Link>
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Agenda do Instagram</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-mute">
            Os posts da semana, prontos. Confira o vídeo e a legenda e toque em <b>Aprovar e agendar</b>: no dia e na hora marcados o painel publica sozinho no Instagram. Nada sai sem aprovação.
          </p>
        </div>
        <div className="card px-4 py-3 text-sm">
          {!connected ? (
            <p className="font-semibold text-warn">Instagram ainda não conectado</p>
          ) : connectError ? (
            <p className="font-semibold text-bad">Erro na conexão: {connectError}</p>
          ) : (
            <p>
              Conectado como <b>@{username || 'growlift.ai'}</b>
              {usage && (
                <span className="text-ink-mute">
                  {' '}
                  · {usage.used} de {usage.total} posts nas últimas 24 h
                </span>
              )}
            </p>
          )}
        </div>
      </div>
      {!connected && (
        <div className="card mt-4 space-y-2 p-5 text-sm text-ink-soft">
          <p className="font-semibold text-ink">Para o painel publicar, falta conectar o Instagram (uma vez só):</p>
          <p>
            Siga o passo a passo em <b>Conteúdos → Planejamento → Agenda automática</b>. Até lá vocês já podem aprovar e agendar: os posts esperam aqui e saem quando a conexão estiver feita (se o horário já tiver passado há mais de 3 horas, ficam como “Atrasado” para vocês decidirem).
          </p>
        </div>
      )}
      <AgendaBoard cards={cards} connected={connected && !connectError} />
    </>
  );
}
