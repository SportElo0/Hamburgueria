import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { getManifest, getStatuses, sectionKey } from '@/lib/conteudos';
import { fileUrl } from './urls';

export const metadata = { title: 'Conteúdos' };

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

export default async function ConteudosPage() {
  await requireUser();
  const [manifest, statuses] = await Promise.all([getManifest(), getStatuses()]);

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold">Conteúdos</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-mute">
          Tudo o que foi feito para o Instagram e o WhatsApp da Growlift: stories, carrosséis, roteiros de Reels, textos prontos para copiar e prompts. Nada daqui é
          publicado sozinho: vocês aprovam, postam e marcam aqui.
          {manifest.generatedAt && <> Atualizado em {fmtDate(manifest.generatedAt)}.</>}
        </p>
      </div>

      {manifest.folders.length === 0 ? (
        <p className="card mt-6 px-5 py-10 text-center text-ink-mute">Nenhum conteúdo nesta versão do painel.</p>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {manifest.folders.map((f) => {
            const images = f.groups.reduce((n, g) => n + g.files.length, 0);
            const keys = [...f.groups.map((g) => g.id), ...(f.sectionStatus ? f.docs.flatMap((d) => d.sections.map((s) => sectionKey(d, s.id))) : [])];
            const approved = keys.filter((k) => statuses[k]?.status === 'aprovado').length;
            const posted = keys.filter((k) => statuses[k]?.status === 'postado').length;
            const preview = f.groups.flatMap((g) => g.files.filter((x) => !x.doNotPublish)).slice(0, 3);
            return (
              <li key={f.slug}>
                <Link href={`/painel/conteudos/${f.slug}`} className="card flex h-full flex-col p-5 transition-colors hover:border-ink">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-bold">{f.title}</h2>
                    {preview.length > 0 && (
                      <div className="flex shrink-0 -space-x-3" aria-hidden="true">
                        {preview.map((p) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={p.path} src={fileUrl(p, 'mini')} alt="" className="h-12 w-auto rounded-md border-2 border-white bg-ink shadow-sm" loading="lazy" />
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-ink-mute">{f.blurb}</p>
                  <p className="mt-auto pt-4 text-[13px] text-ink-soft">
                    {[images > 0 && `${images} ${images === 1 ? 'imagem' : 'imagens'}`, f.docs.length > 0 && `${f.docs.length} ${f.docs.length === 1 ? 'texto' : 'textos'}`]
                      .filter(Boolean)
                      .join(' · ')}
                    {keys.length > 0 && (
                      <span className="text-ink-mute">
                        {' '}
                        · {approved} de {keys.length} aprovados{posted > 0 && ` · ${posted} postados`}
                      </span>
                    )}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
