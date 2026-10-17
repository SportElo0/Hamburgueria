'use client';

import { HERO_PRODUCT_ID, SIGNATURE_IDS, productById } from '@/content/menu';
import renders from '@/content/renders.json';
import { useUi } from '../Providers';
import { BurgerStack } from '../burger/BurgerStack';
import { Price } from '../ui/primitives';
import { scrollToHash } from '../nav/NavOverlay';

/** Reduced-motion version of the story: the same five scenes as still frames in normal flow. */
export function StaticStory() {
  const ui = useUi();
  const hero = productById.get(HERO_PRODUCT_ID)!;
  const heroImg = renders.burgers[HERO_PRODUCT_ID as keyof typeof renders.burgers].hero;
  const cta = 'cond inline-flex min-h-14 items-center justify-center rounded-full bg-mustard px-8 text-lg font-bold tracking-[0.1em] text-ink uppercase';
  return (
    <section id="inicio-estatico" data-tone="dark" aria-label="Downtown Burger" className="story-static surface-dark text-on-dark">
      <div className="bg-scene-red px-5 pt-[calc(var(--header-h)+40px)] pb-16 text-center">
        <h1 className="display text-[clamp(4rem,12vw,11rem)]">Isso é Downtown.</h1>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroImg} alt={hero.imageAlt} className="mx-auto mt-4 aspect-square w-full max-w-[560px]" />
        <p className="cond text-xl font-semibold tracking-[0.14em] uppercase">Burger artesanal feito com qualidade.</p>
        <div className="mt-6 flex justify-center gap-3">
          <a href="#cardapio" onClick={(e) => (e.preventDefault(), scrollToHash('#cardapio'))} className={cta}>
            Ver cardápio
          </a>
          <button type="button" onClick={() => ui.setCartOpen(true)} className="cond min-h-14 cursor-pointer rounded-full border-2 border-on-dark/70 px-8 text-lg font-bold tracking-[0.1em] uppercase">
            Peça agora
          </button>
        </div>
      </div>
      <div className="bg-scene-orange px-5 py-20 text-center">
        <h2 className="display text-[clamp(3.4rem,9vw,8rem)]">Feito pra dar fome.</h2>
        <p className="mx-auto mt-4 max-w-[46ch] text-lg text-on-dark-mute">Blend bovino de 180 g, queijo prato derretendo sobre a carne, bacon e pão brioche.</p>
      </div>
      <div className="bg-scene-green px-5 py-20 text-center">
        <h2 className="display text-[clamp(3.4rem,9vw,8rem)]">Qualidade em cada camada.</h2>
      </div>
      <div className="bg-scene-plum px-5 py-20 text-center">
        <h2 className="display text-[clamp(3.4rem,9vw,8rem)]">Escolha seu favorito.</h2>
        <ul className="mx-auto mt-10 grid max-w-6xl grid-cols-2 gap-6 md:grid-cols-4">
          {SIGNATURE_IDS.map((id) => {
            const p = productById.get(id)!;
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
        <h2 className="display text-[clamp(3.4rem,9vw,8rem)]">Por dentro do sabor.</h2>
        <div className="mx-auto mt-16 mb-16 w-[min(80vw,520px)]">
          <BurgerStack id={HERO_PRODUCT_ID} explode={1} gap={9} labels size="auto" />
        </div>
        <a href="#cardapio" onClick={(e) => (e.preventDefault(), scrollToHash('#cardapio'))} className={cta}>
          Monte seu pedido
        </a>
      </div>
    </section>
  );
}
