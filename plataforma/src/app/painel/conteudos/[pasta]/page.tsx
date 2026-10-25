import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getManifest, getStatuses, sectionKey, type ContentFile } from '@/lib/conteudos';
import { ContentStatusControl } from '@/components/conteudos/ContentStatusControl';
import { DocBody } from '@/components/conteudos/DocBody';
import { fileUrl } from '../urls';

export async function generateMetadata({ params }: { params: Promise<{ pasta: string }> }) {
  const { pasta } = await params;
  const folder = (await getManifest()).folders.find((f) => f.slug === pasta);
  return { title: folder ? `${folder.title} · Conteúdos` : 'Conteúdos' };
}

const kb = (n: number) => (n > 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace('.', ',')} MB` : `${Math.round(n / 1000)} KB`);
const cols = (f: ContentFile) => (f.height > f.width * 1.5 ? 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4');

export default async function PastaPage({ params }: { params: Promise<{ pasta: string }> }) {
  await requireUser();
  const { pasta } = await params;
  const [manifest, statuses] = await Promise.all([getManifest(), getStatuses()]);
  const folder = manifest.folders.find((f) => f.slug === pasta);
  if (!folder) notFound();

  return (
    <>
      <Link href="/painel/conteudos" className="text-sm text-ink-mute hover:text-ink">
        ← Conteúdos
      </Link>
      <div className="mt-2">
        <h1 className="text-3xl font-bold">{folder.title}</h1>
        {folder.blurb && <p className="mt-1 text-sm text-ink-mute">{folder.blurb}</p>}
      </div>

      {folder.groups.length > 0 && (
        <div className="mt-6 space-y-4">
          {folder.groups.map((g) => {
            const s = statuses[g.id];
            const first = g.files[0];
            return (
              <section key={g.id} className="card p-5" aria-labelledby={`g-${g.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 id={`g-${g.id}`} className="text-lg font-bold">
                      {g.title}
                    </h2>
                    <p className="text-sm text-ink-mute">
                      {g.files.length} {g.files.length === 1 ? 'imagem' : 'imagens'}
                      {first.format && ` · ${first.format}`}
                      {g.files.length > 1 && (g.id.includes('/capas/') ? ' · uma para cada destaque' : ' · postar na ordem dos números')}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-start gap-2">
                    {g.files.length > 1 && (
                      <a href={`/painel/conteudos/zip?grupo=${encodeURIComponent(g.id)}`} className="btn-ghost min-h-10">
                        Baixar tudo (.zip)
                      </a>
                    )}
                    <ContentStatusControl statusKey={g.id} status={s?.status ?? 'rascunho'} by={s?.by} label={g.title} />
                  </div>
                </div>
                <ul className={`mt-4 grid gap-3 ${cols(first)}`}>
                  {g.files.map((f) => (
                    <li key={f.path}>
                      <a href={fileUrl(f)} target="_blank" rel="noreferrer" className="group relative block overflow-hidden rounded-lg border border-line bg-ink">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={fileUrl(f, 'mini')}
                          alt={`${g.title}, ${f.name}`}
                          width={f.width || undefined}
                          height={f.height || undefined}
                          loading="lazy"
                          className="h-auto w-full transition-opacity group-hover:opacity-90"
                        />
                        {f.doNotPublish && <span className="chip absolute top-2 left-2 bg-bad text-white">Não publicar</span>}
                      </a>
                      <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
                        <span className="truncate text-ink-mute" title={`${f.name} · ${kb(f.size)}`}>
                          {f.name}
                        </span>
                        <a href={fileUrl(f, 'baixar')} className="shrink-0 font-semibold text-ink underline-offset-2 hover:underline">
                          Baixar
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {folder.docs.map((d) => (
        <div key={d.file} className="mt-10">
          <h2 className="text-2xl font-bold">{d.title}</h2>
          {d.intro && (
            <div className="mt-2 max-w-3xl">
              <DocBody html={d.intro} />
            </div>
          )}
          <div className="mt-4 space-y-4">
            {d.sections.map((sec) => {
              const key = sectionKey(d, sec.id);
              const s = statuses[key];
              return (
                <section key={sec.id} id={sec.id} className="card p-5" aria-labelledby={`s-${sec.id}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 id={`s-${sec.id}`} className="text-lg font-bold">
                      {sec.title}
                    </h3>
                    {folder.sectionStatus && <ContentStatusControl statusKey={key} status={s?.status ?? 'rascunho'} by={s?.by} label={sec.title} />}
                  </div>
                  <div className="mt-2 max-w-3xl">
                    <DocBody html={sec.html} />
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
