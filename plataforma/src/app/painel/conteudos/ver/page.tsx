import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getManifest } from '@/lib/conteudos';
import { fileUrl } from '../urls';

export const metadata = { title: 'Ver imagem · Conteúdos' };

/**
 * One image of the Contents tab, inside the panel: with "Voltar", "Baixar" and the previous / next image of the same
 * group. The panel saved on the phone's home screen has no browser back button, so images never open in a new tab.
 */
export default async function VerConteudoPage({ searchParams }: { searchParams: Promise<{ arquivo?: string }> }) {
  await requireUser();
  const { arquivo } = await searchParams;
  if (!arquivo) notFound();
  const manifest = await getManifest();
  let achado: { folder: (typeof manifest.folders)[number]; files: (typeof manifest.folders)[number]['groups'][number]['files']; i: number; title: string } | null = null;
  for (const folder of manifest.folders)
    for (const g of folder.groups) {
      const i = g.files.findIndex((f) => f.path === arquivo);
      if (i >= 0) achado = { folder, files: g.files, i, title: g.title };
    }
  if (!achado) notFound();
  const { folder, files, i, title } = achado;
  const f = files[i];
  const prev = files[i - 1];
  const next = files[i + 1];
  const ver = (p: string) => `/painel/conteudos/ver?arquivo=${encodeURIComponent(p)}`;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/painel/conteudos/${folder.slug}`} className="btn-ghost min-h-11">
          ← Voltar para {folder.title}
        </Link>
        <a href={fileUrl(f, 'baixar')} className="btn-primary min-h-11">
          Baixar imagem
        </a>
      </div>
      <p className="mt-3 text-sm text-ink-mute">
        {title} · {f.name}
        {files.length > 1 && ` · ${i + 1} de ${files.length}`}
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={fileUrl(f)}
        alt={`${title}, ${f.name}`}
        width={f.width || undefined}
        height={f.height || undefined}
        className="mx-auto mt-3 block h-auto max-h-[78dvh] w-auto max-w-full rounded-xl border border-line bg-accent"
      />
      {files.length > 1 && (
        <div className="mt-4 flex justify-between gap-3">
          {prev ? (
            <Link href={ver(prev.path)} className="btn-ghost min-h-11" replace>
              ← Anterior
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={ver(next.path)} className="btn-ghost min-h-11" replace>
              Próxima →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
