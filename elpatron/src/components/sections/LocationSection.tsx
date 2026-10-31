'use client';

import { useCatalog } from '@/content/live';
import { Logo } from '../brand/Brand';
import { ChatIcon, ClockIcon, CameraIcon, PinIcon } from '../ui/Icons';

const isDev = process.env.NODE_ENV === 'development';

/** 5511937014347 → (11) 93701-4347 */
function formatPhone(n: string) {
  const m = n.replace(/^55/, '').match(/^(\d{2})(\d{4,5})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : n;
}

function Pending({ what }: { what: string }) {
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span className="cond inline-flex items-center gap-2 rounded-full border-2 border-dashed border-ink/35 px-3 py-1 text-sm font-bold tracking-[0.1em] text-ink-soft uppercase">
        Em breve
      </span>
      <span className="text-sm text-ink-mute">{what}</span>
      {isDev && <span className="font-mono text-xs text-brand">admin: preencher no painel das lojas</span>}
    </span>
  );
}

/** Address, hours and contacts: whatever the store panel has published, else the static facts. */
export function LocationSection() {
  const r = useCatalog().restaurant;
  const rows = [
    {
      icon: <PinIcon size={22} />,
      label: 'Endereço',
      value: r.address ? (
        <>
          {r.address}
          {r.city && <span className="block text-ink-soft">{r.city}</span>}
        </>
      ) : (
        <>
          {r.city && <span className="block">{r.city}</span>}
          <Pending what="O endereço completo ainda não foi informado pelo restaurante." />
        </>
      ),
    },
    {
      icon: <ClockIcon size={22} />,
      label: 'Horário',
      value: r.hours ? (
        <ul>
          {r.hours.map((h) => (
            <li key={h.days} className="flex gap-3">
              <span className="w-28">{h.days}</span>
              <span className="tabular">{h.time}</span>
            </li>
          ))}
        </ul>
      ) : (
        <Pending what="Os horários de funcionamento serão publicados aqui." />
      ),
    },
    {
      icon: <ChatIcon size={22} />,
      label: 'Contato',
      value:
        r.whatsappNumber || r.phone || r.email ? (
          <ul className="space-y-1">
            {r.whatsappNumber && (
              <li>
                <a className="underline" href={`https://wa.me/${r.whatsappNumber}`} target="_blank" rel="noopener noreferrer">
                  WhatsApp {formatPhone(r.whatsappNumber)}
                </a>
              </li>
            )}
            {r.phone && (
              <li>
                <a className="underline" href={`tel:${r.phone}`}>
                  {r.phone}
                </a>
              </li>
            )}
            {r.email && (
              <li>
                <a className="underline" href={`mailto:${r.email}`}>
                  {r.email}
                </a>
              </li>
            )}
          </ul>
        ) : (
          <Pending what="Telefone e WhatsApp oficiais a confirmar." />
        ),
    },
    {
      icon: <CameraIcon size={22} />,
      label: 'Instagram',
      value: r.instagram ? (
        <a className="underline" href={`https://instagram.com/${r.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
          @{r.instagram.replace('@', '')}
        </a>
      ) : (
        <Pending what="Perfil oficial a confirmar." />
      ),
    },
  ];

  return (
    <section id="localizacao" aria-labelledby="local-title" className="bg-cream text-ink outline-none">
      <div className="mx-auto max-w-[1360px] px-5 pt-16 md:px-10 md:pt-24">
        <div className="double-rule text-brand/50" />
      </div>
      <div className="mx-auto grid max-w-[1360px] gap-14 px-5 pt-14 pb-24 md:grid-cols-2 md:gap-20 md:px-10 md:pt-20 md:pb-36">
        <div>
          <h2 id="local-title" className="display text-[clamp(2.3rem,5.4vw,5.4rem)]">
            Onde encontrar o El Patron.
          </h2>
          <dl className="mt-12 border-t border-brand/50">
            {rows.map((row) => (
              <div key={row.label} className="grid gap-x-5 gap-y-1 border-b border-ink/15 py-6 sm:grid-cols-[calc(22px+1.25rem+9rem)_1fr]">
                <dt className="cond flex items-start gap-5 text-lg font-bold tracking-[0.1em] uppercase">
                  <span aria-hidden="true" className="mt-0.5 text-brand">{row.icon}</span>
                  {row.label}
                </dt>
                <dd className="pl-[calc(22px+1.25rem)] text-[1.05rem] sm:pl-0">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <figure className="relative flex flex-col">
          <div className="relative flex flex-1 items-center justify-center border border-brand/50 p-2">
            <div className="relative flex h-full min-h-[360px] w-full flex-col items-center justify-center gap-8 overflow-hidden border border-brand/25 bg-paper p-8">
              <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgb(217_174_88/0.16),transparent_65%)]" />
              <Logo className="relative h-auto w-[min(70vw,360px)]" />
              <p className="cond relative max-w-[30ch] text-center text-lg font-semibold tracking-[0.08em] text-ink-soft uppercase">
                {r.mapsUrl ? (
                  <a href={r.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-mustard underline">
                    Abrir no mapa
                  </a>
                ) : (
                  'O mapa aparece aqui assim que o endereço oficial for cadastrado.'
                )}
              </p>
            </div>
          </div>
          <figcaption className="mt-4 text-sm text-ink-mute">Nenhum endereço, horário ou contato é exibido antes de ser confirmado pelo restaurante.</figcaption>
        </figure>
      </div>
    </section>
  );
}
