import type { Metadata, Viewport } from 'next';
import { isSlug } from '@/lib/slug';
import { getPublished } from '@/lib/stores';
import { getOperation } from '@/lib/orders';
import { brl, orderingOf, withSoldOut } from '@/lib/ordering';
import { FotoPrato } from '@/components/cardapio/Ver3d';

export const dynamic = 'force-dynamic';
export const viewport: Viewport = { themeColor: '#F4F6FA' };

const media = (src: string) => (!src || /^https?:\/\//.test(src) ? src : `/api/midia/${src.replace(/^midia\//, '')}`);
const soDigitos = (s: string) => s.replace(/\D/g, '');

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const record = isSlug(slug) ? await getPublished(slug) : null;
  // The restaurant's own site is the page for search engines; this one is for the QR in the restaurant.
  return { title: record ? `Cardápio · ${record.store.name}` : 'Cardápio', robots: { index: false, follow: false } };
}

/**
 * The menu only, for a QR on the table, the counter or the door: no table to open, nothing to order.
 * Read on every visit from the published menu and the kitchen's sold-out marks, so it changes as the store changes.
 */
export default async function CardapioPublico({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const record = isSlug(slug) ? await getPublished(slug) : null;
  if (!record) {
    return (
      <main className="flex min-h-dvh flex-col justify-center bg-[#F4F6FA] px-6 text-[#121826]">
        <h1 className="text-3xl font-black tracking-tight uppercase">Cardápio indisponível</h1>
        <p className="mt-3 text-base leading-relaxed text-[#4A5568]">Peça o cardápio ao atendente.</p>
      </main>
    );
  }
  const operation = await getOperation(slug);
  const store = withSoldOut(record.store, operation.soldOut);
  const categorias = store.catalog.categories.filter((c) => c.items.length);
  const logo = typeof store.extra.logo === 'string' && store.extra.logo.startsWith('/api/midia/') ? store.extra.logo : '';
  const whats = soDigitos(store.units[0]?.whatsapp || store.contact.whatsapp);
  const insta = store.contact.instagram.replace(/^@/, '').trim();
  const o = orderingOf(store);
  // Charges on top of the items must be known before ordering (CDC art. 31); shown only when the store has them.
  const taxas = o.tables.enabled
    ? [o.conta.servico > 0 ? `taxa de serviço de ${o.conta.servico}% (opcional)` : '', o.conta.couvert > 0 ? `couvert de ${brl(o.conta.couvert)} por pessoa` : ''].filter(Boolean)
    : [];
  // The add-ons list prices the "adicionais" choices, as on the table menu.
  const adicionais = new Map(store.catalog.categories.find((c) => c.id === 'adicionais')?.items.map((i) => [i.id, i]) ?? []);

  return (
    <div className="min-h-dvh bg-[#F4F6FA] pb-12 text-[#121826]">
      <header className="bg-[#FFFFFF] px-4 pt-6 pb-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          {logo && (
            // eslint-disable-next-line @next/next/no-img-element -- the restaurant's own logo, served by the panel
            <img src={logo} alt="" className="h-14 w-14 shrink-0 rounded-2xl bg-white object-contain p-1 shadow-sm" />
          )}
          <div className="min-w-0">
            <p className="text-[12px] font-bold tracking-[0.14em] text-[#0865FE] uppercase">Cardápio</p>
            <h1 className="text-2xl leading-tight font-black tracking-tight">{store.name}</h1>
          </div>
        </div>
        {store.notice.active && store.notice.text && <p className="mx-auto mt-4 max-w-2xl rounded-xl bg-[#0865FE]/10 px-4 py-3 text-sm text-[#0652D1]">{store.notice.text}</p>}
        {taxas.length > 0 && (
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[#4A5568]">
            Na conta da mesa: {taxas.join(' e ')}.
          </p>
        )}
      </header>

      {categorias.length > 1 && (
        <nav aria-label="Categorias" className="sticky top-0 z-10 border-b border-[#E6EBF2] bg-[#F4F6FA]/95 backdrop-blur">
          <div className="mx-auto flex max-w-2xl gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none]">
            {categorias.map((c) => (
              <a key={c.id} href={`#cat-${c.id}`} className="flex min-h-10 shrink-0 items-center rounded-full border border-[#DCE2EC] bg-[#FFFFFF] px-4 text-sm font-semibold text-[#4A5568] no-underline">
                {c.name}
              </a>
            ))}
          </div>
        </nav>
      )}

      <main className="mx-auto max-w-2xl px-4">
        {categorias.length === 0 && <p className="mt-8 text-[#4A5568]">O cardápio está sendo atualizado. Peça ao atendente.</p>}
        {categorias.map((c) => (
          <section key={c.id} id={`cat-${c.id}`} aria-labelledby={`h-${c.id}`} className="scroll-mt-20 pt-6">
            <h2 id={`h-${c.id}`} className="text-[13px] font-bold tracking-[0.12em] text-[#4A5568] uppercase">
              {c.name}
            </h2>
            {c.description && <p className="mt-1 text-sm text-[#6A7385]">{c.description}</p>}
            <ul className="mt-3 space-y-3">
              {c.items.map((i) => {
                const image = media(i.image);
                const preco = i.price !== null ? brl(i.price) : i.priceLabel || 'Pergunte ao atendente';
                return (
                  <li key={i.id} className={`flex gap-3 rounded-[20px] border border-[#E6EBF2] bg-[#FFFFFF] p-3 ${i.available ? '' : 'opacity-55'}`}>
                    <FotoPrato
                      image={image}
                      alt={i.imageAlt || i.name}
                      item={i.modelo3d ? { id: i.id, name: i.name, image, imageAlt: i.imageAlt || i.name, modelo3d: { src: media(i.modelo3d.src), larguraCm: i.modelo3d.larguraCm, alturaCm: i.modelo3d.alturaCm } } : null}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-base leading-tight font-bold">{i.name}</p>
                      {i.description && <p className="mt-1 text-[13px] leading-snug text-[#4A5568]">{i.description}</p>}
                      {i.tags.length > 0 && (
                        <p className="mt-1.5 flex flex-wrap gap-1">
                          {i.tags.map((t) => (
                            <span key={t} className="rounded-full bg-[#F4F6FA] px-2 py-0.5 text-[11px] font-semibold text-[#4A5568]">
                              {t}
                            </span>
                          ))}
                        </p>
                      )}
                      {i.options.map((g) => (
                        <p key={g.id} className="mt-1 text-[12px] leading-snug text-[#6A7385]">
                          <span className="font-semibold text-[#4A5568]">{g.name}:</span>{' '}
                          {g.choices
                            .map((ch) => {
                              const ligado = g.id === 'adicionais' ? adicionais.get(ch.id) : undefined;
                              const valor = ligado ? (ligado.price ?? 0) : ch.priceDelta;
                              return `${ligado?.name || ch.label}${valor ? ` +${brl(valor)}` : ''}`;
                            })
                            .join(', ')}
                        </p>
                      ))}
                      <p className="mt-1.5 text-[15px] font-extrabold text-[#0865FE] tabular-nums">{i.available ? preco : 'Esgotado hoje'}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {(store.units.length > 0 || whats || insta) && (
          <footer className="mt-10 space-y-4 border-t border-[#DCE2EC] pt-6 text-sm text-[#4A5568]">
            {store.units.map((u) => (
              <div key={u.id}>
                {store.units.length > 1 && <p className="font-bold text-[#121826]">{u.name}</p>}
                {u.address && (
                  <p>
                    {u.mapsUrl ? (
                      <a href={u.mapsUrl} target="_blank" rel="noreferrer" className="underline">
                        {u.address}
                      </a>
                    ) : (
                      u.address
                    )}
                  </p>
                )}
                {u.hours.map((h, n) => (
                  <p key={n} className="tabular-nums">
                    {h.days}: {h.time}
                  </p>
                ))}
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              {whats.length >= 10 && (
                <a href={`https://wa.me/${whats.length <= 11 ? `55${whats}` : whats}`} target="_blank" rel="noreferrer" className="flex min-h-11 items-center rounded-full bg-[#121826] px-5 font-bold text-[#FFFFFF]">
                  WhatsApp
                </a>
              )}
              {insta && /^[\w.]{1,30}$/.test(insta) && (
                <a href={`https://instagram.com/${insta}`} target="_blank" rel="noreferrer" className="flex min-h-11 items-center rounded-full border border-[#DCE2EC] bg-[#FFFFFF] px-5 font-bold text-[#121826]">
                  @{insta}
                </a>
              )}
            </div>
          </footer>
        )}
        <p className="mt-6 text-xs leading-relaxed text-[#6A7385]">
          Preços e disponibilidade atualizados pelo restaurante. Na dúvida, confirme com o atendente. Fotos ilustrativas. Avise o atendente sobre qualquer alergia ou restrição alimentar.
        </p>
      </main>
    </div>
  );
}
