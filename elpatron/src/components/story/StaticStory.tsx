'use client';

import { HERO_PRODUCT_ID, SIGNATURE_IDS } from '@/content/menu';
import { useCatalog } from '@/content/live';
import photos from '@/content/photos.json';
import { useUi } from '../Providers';
import { BurgerStack } from '../burger/BurgerStack';
import { Price } from '../ui/primitives';
import { scrollToHash } from '../nav/NavOverlay';

/** Reduced-motion version of the story: the same five scenes as still frames in normal flow. */
export function StaticStory() {
  const ui = useUi();
  const catalog = useCatalog();
  const hero = catalog.byId.get(HERO_PRODUCT_ID)!;
  const heroImg = photos.items[HERO_PRODUCT_ID].src;
  const cta = 'cond inline-flex min-h-14 items-center justify-center rounded-full bg-mustard px-8 text-lg font-bold tracking-[0.1em] text-on-dark uppercase';
  return (
    <section id="inicio-estatico" data-tone="dark" aria-label="El Patron Burger" className="story-static surface-dark text-ink">
      <div className="bg-scene-red px-5 pt-[calc(var(--header-h)+40px)] pb-16 text-center">
        <h1 className="display gold-foil text-[clamp(3rem,10vw,9rem)]">O chefão voltou.</h1>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroImg} alt={hero.imageAlt} className="mx-auto mt-4 aspect-square w-full max-w-[560px]" />
        <p className="cond text-xl font-semibold tracking-[0.14em] uppercase">El Burger Del Mal · Osasco</p>
        <div className="mt-6 flex justify-center gap-3">
          <a href="#cardapio" onClick={(e) => (e.preventDefault(), scrollToHash('#cardapio'))} className={cta}>
            Ver cardápio
          </a>
          <button type="button" onClick={() => ui.setCartOpen(true)} className="cond min-h-14 cursor-pointer rounded-full border-2 border-ink/70 px-8 text-lg font-bold tracking-[0.1em] uppercase">
            Peça agora
          </button>
        </div>
      </div>
      <div className="bg-scene-orange px-5 py-20 text-center">
        <h2 className="display text-[clamp(2.6rem,7vw,6.4rem)]">Feito pra dar fome.</h2>
        <p className="mx-auto mt-4 max-w-[46ch] text-lg text-ink-soft">Dois hambúrgueres de 180 g recheados com cheddar, queijo mussarela, longas tiras de bacon e molho barbecue.</p>
      </div>
      <div className="bg-scene-green px-5 py-20 text-center">
        <h2 className="display text-[clamp(2.6rem,7vw,6.4rem)]">Respeito em cada camada.</h2>
      </div>
      <div className="bg-scene-plum px-5 py-20 text-center">
        <h2 className="display text-[clamp(2.6rem,7vw,6.4rem)]">Escolha seu chefão.</h2>
        <ul className="mx-auto mt-10 grid max-w-6xl grid-cols-2 gap-6 md:grid-cols-4">
          {SIGNATURE_IDS.map((id) => {
            const p = catalog.byId.get(id)!;
            return (
              <li key={id}>
                <button type="button" onClick={() => ui.openProduct({ productId: id })} className="w-full cursor-pointer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" loading="lazy" className="aspect-square w-full" />
                  <span className="display block text-[1.8rem]">{p.name}</span>
                  <Price cents={p.price} size="sm" className="text-mustard" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="bg-scene-teal px-5 py-20 text-center">
        <h2 className="display text-[clamp(2.6rem,7vw,6.4rem)]">Por dentro do chefão.</h2>
        <div className="mx-auto mt-16 mb-16 w-[min(80vw,520px)]">
          <BurgerStack id={HERO_PRODUCT_ID} explode={1} gap={9} labels size="auto" />
        </div>
        <p className="cond -mt-8 mb-10 text-xs font-semibold tracking-[0.14em] text-ink-soft uppercase">Ilustração das camadas</p>
        <a href="#cardapio" onClick={(e) => (e.preventDefault(), scrollToHash('#cardapio'))} className={cta}>
          Monte seu pedido
        </a>
      </div>
    </section>
  );
}
