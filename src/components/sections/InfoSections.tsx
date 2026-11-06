import { restaurant } from '@/content/restaurant';
import { Badge, Star } from '../brand/Brand';

function Marquee() {
  const words = ['Burgers', 'Steaks', 'Fries', 'Shakes'];
  const run = (
    <span className="flex shrink-0 items-center">
      {[...words, ...words].map((w, i) => (
        <span key={i} className="flex items-center">
          <span className={`display px-6 text-[clamp(3.4rem,9vw,8rem)] md:px-10 ${i % 2 ? 'ghost-word [-webkit-text-stroke-color:var(--color-on-dark)]' : ''}`}>{w}</span>
          <Star size={34} className="text-mustard" />
        </span>
      ))}
    </span>
  );
  return (
    <div aria-hidden="true" className="flex overflow-hidden border-y-2 border-on-dark/15 py-5">
      <div className="flex motion-safe:animate-[marquee_38s_linear_infinite]">
        {run}
        {run}
      </div>
    </div>
  );
}

export function StorySection() {
  return (
    <section id="historia" data-tone="dark" aria-labelledby="historia-title" className="surface-dark relative overflow-hidden bg-ink text-on-dark outline-none">
      <Marquee />
      <div className="mx-auto grid max-w-[1360px] gap-14 px-5 py-24 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-20 md:px-10 md:py-36">
        <div className="relative">
          <Badge className="w-[min(78vw,460px)] text-cream md:w-full" />
        </div>
        <div className="flex flex-col justify-center">
          <h2 id="historia-title" className="display text-[clamp(3.6rem,8.6vw,8.2rem)]">
            Americano no jeito. <span className="text-mustard">Artesanal</span> no preparo.
          </h2>
          <div className="mt-10 grid max-w-[64ch] gap-5 text-[1.12rem] leading-[1.7] text-on-dark-mute md:grid-cols-2 md:gap-8">
            <p>
              A Downtown Burger é inspirada nas burger houses americanas: a chapa quente, o balcão, o letreiro e o ritmo de cidade grande que estão até no nosso
              selo.
            </p>
            <p>
              No cardápio, a promessa é simples e está escrita com todas as letras: burguer artesanal feito com qualidade. Blend bovino, pão brioche ou
              australiano e combinações que viraram assinatura da casa.
            </p>
          </div>
          <p className="display mt-12 flex items-center gap-4 text-[clamp(1.8rem,3.4vw,2.8rem)] text-mustard">
            <Star size={20} />
            Burguer artesanal feito com qualidade.
          </p>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  const cols = [
    {
      title: 'Navegação',
      links: [
        ['#inicio', 'Início'],
        ['#cardapio', 'Cardápio'],
        ['#historia', 'Nossa História'],
        ['#localizacao', 'Localização'],
      ],
    },
    {
      title: 'Cardápio',
      links: [
        ['#cat-burgers', 'Burgers'],
        ['#cat-entradas', 'Entradas'],
        ['#cat-bebidas', 'Bebidas'],
        ['#cat-sobremesas', 'Sobremesas'],
      ],
    },
  ];
  return (
    <footer data-tone="dark" className="surface-dark bg-ink pt-20 pb-[calc(env(safe-area-inset-bottom)+110px)] text-on-dark md:pb-12">
      <div className="mx-auto max-w-[1360px] px-5 md:px-10">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="flex items-start gap-5">
            <Badge className="w-28 shrink-0 text-cream md:w-36" />
            <p className="cond mt-2 max-w-[22ch] text-xl font-bold tracking-[0.08em] uppercase">{restaurant.tagline}</p>
          </div>
          {cols.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <p className="cond text-sm font-bold tracking-[0.2em] text-mustard uppercase">{c.title}</p>
              <ul className="mt-4 space-y-1">
                {c.links.map(([href, label]) => (
                  <li key={href}>
                    <a href={href} className="inline-flex min-h-10 items-center text-lg text-on-dark-mute transition-colors hover:text-on-dark">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p aria-hidden="true" className="display mt-20 text-center text-[17.4vw] leading-[0.8] text-on-dark md:text-[15.6vw] xl:text-[15.2rem]">
          Downtown
        </p>
        <div className="double-rule mt-6 text-on-dark/40" />
        <div className="mt-6 flex flex-col gap-3 text-sm text-on-dark-mute md:flex-row md:justify-between">
          <p>© {year} Downtown Burger. Imagens meramente ilustrativas.</p>
          <p>Venda de bebidas alcoólicas proibida para menores de 18 anos.</p>
        </div>
      </div>
    </footer>
  );
}
