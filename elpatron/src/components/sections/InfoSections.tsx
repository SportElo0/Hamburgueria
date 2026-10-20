import { categories } from '@/content/menu';
import { restaurant } from '@/content/restaurant';
import { Logo, Star } from '../brand/Brand';

function Marquee() {
  const words = ['El Burger Del Mal', 'El Patron', 'O chefão voltou'];
  const run = (
    <span className="flex shrink-0 items-center">
      {[...words, ...words].map((w, i) => (
        <span key={i} className="flex items-center">
          <span className={`display px-6 text-[clamp(2.6rem,6.4vw,5.6rem)] whitespace-nowrap md:px-10 ${i % 2 ? 'ghost-word [-webkit-text-stroke-color:var(--color-brand)]' : 'gold-foil'}`}>
            {w}
          </span>
          <Star size={26} className="text-brand" />
        </span>
      ))}
    </span>
  );
  return (
    <div aria-hidden="true" className="flex overflow-hidden border-y border-brand/30 py-5">
      <div className="flex motion-safe:animate-[marquee_46s_linear_infinite]">
        {run}
        {run}
      </div>
    </div>
  );
}

const STEPS = [
  { n: '01', title: 'Escolha', text: 'Navegue pelo cardápio e toque no burger, na porção ou na bebida que quiser.' },
  { n: '02', title: 'Personalize', text: 'Adicione bacon, cheddar, molhos ou mais um hambúrguer, e deixe uma observação.' },
  { n: '03', title: 'Envie', text: 'Diga se é entrega ou retirada. O pedido pronto abre no WhatsApp do El Patron.' },
];

export function StorySection() {
  return (
    <section id="como-pedir" aria-labelledby="como-pedir-title" className="relative overflow-hidden bg-paper text-ink outline-none">
      <Marquee />
      <div className="mx-auto max-w-[1360px] px-5 py-24 md:px-10 md:py-32">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 id="como-pedir-title" className="display gold-foil text-[clamp(3rem,7.4vw,6.4rem)]">
            Como pedir
          </h2>
          <p className="max-w-[40ch] text-lg text-ink-soft md:pb-3 md:text-right">Sem app e sem cadastro. Você monta o pedido aqui e conversa direto com a casa.</p>
        </div>
        <ol className="mt-12 grid border-t border-brand/40 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="border-b border-brand/20 py-8 md:border-b-0 md:border-l md:px-8 md:py-10 md:first:border-l-0 md:first:pl-0">
              <p className="display text-[3.4rem] leading-none text-brand/45">{s.n}</p>
              <h3 className="display mt-4 text-[2rem]">{s.title}</h3>
              <p className="mt-3 max-w-[34ch] text-[1.05rem] leading-relaxed text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>
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
        ['#cat-chefoes', 'Os Chefões'],
        ['#cardapio', 'Cardápio'],
        ['#como-pedir', 'Como pedir'],
        ['#localizacao', 'Contato'],
      ],
    },
    { title: 'Cardápio', links: categories.map((c) => [`#cat-${c.id}`, c.label]) },
  ];
  return (
    <footer className="bg-cream pt-20 pb-[calc(env(safe-area-inset-bottom)+110px)] text-ink md:pb-12">
      <div className="mx-auto max-w-[1360px] px-5 md:px-10">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo className="h-auto w-56 md:w-72" />
            <p className="cond mt-6 max-w-[26ch] text-xl font-bold tracking-[0.08em] text-ink-soft uppercase">{restaurant.tagline}</p>
          </div>
          {cols.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <p className="cond text-sm font-bold tracking-[0.2em] text-brand uppercase">{c.title}</p>
              <ul className="mt-4 space-y-1">
                {c.links.map(([href, label]) => (
                  <li key={href}>
                    <a href={href} className="inline-flex min-h-10 items-center text-lg text-ink-soft transition-colors hover:text-mustard">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="double-rule mt-16 text-brand/40" />
        <div className="mt-6 flex flex-col gap-3 text-sm text-ink-mute md:flex-row md:justify-between">
          <p>© {year} El Patron Burger · Osasco, SP. Imagens meramente ilustrativas.</p>
          <p>Preços sujeitos a alteração sem aviso.</p>
        </div>
      </div>
    </footer>
  );
}
