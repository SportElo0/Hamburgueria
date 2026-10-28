import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Revelar } from '@/components/Revelar';
import { ArquivoParaHoje } from '@/components/sobre/ArquivoParaHoje';
import { EMPRESA, HISTORIA } from '@/data/empresa';
import { PRODUTOS } from '@/data/catalogo';

export const metadata: Metadata = {
  title: 'A Bacchi',
  description: 'Fundada em 1937, a Bacchi é pioneira na produção de clips, alfinetes, pranchetas, grampos e artigos para escritório. Conheça a história e a fabricação.',
  alternates: { canonical: '/sobre' },
};

const ARQUIVO = [
  { src: '/img/historia/historica-01.webp', alt: 'Fachada antiga da fábrica Bacchi', w: 1323, h: 900 },
  { src: '/img/historia/historica-03.webp', alt: 'Máquinas antigas na fábrica Bacchi', w: 1361, h: 900 },
  { src: '/img/historia/historica-05.webp', alt: 'Máquina antiga de fabricação', w: 614, h: 900 },
  { src: '/img/historia/historica-07.webp', alt: 'Máquina antiga sobre bancada', w: 1344, h: 900 },
  { src: '/img/historia/historica-08.webp', alt: 'Salão de máquinas da fábrica Bacchi', w: 1381, h: 900 },
  { src: '/img/historia/historica-04.webp', alt: 'Prensa antiga da fábrica', w: 580, h: 900 },
];

export default function SobrePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-marinho-950 pt-36 pb-20 text-white md:pt-44 md:pb-28">
        <div aria-hidden="true" className="pointer-events-none absolute -right-[4vw] bottom-[-6vw] font-display text-[34vw] leading-none font-extrabold tracking-[-0.06em] text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,.08)]">
          1937
        </div>
        <Revelar className="container-b relative">
          <p data-revelar className="eyebrow text-azul-claro">A Bacchi</p>
          <h1 data-revelar className="mt-5 max-w-[15ch] font-display text-[clamp(2.6rem,6.4vw,5.8rem)] leading-[0.95] font-semibold">
            Desde 1937, a qualidade está nos detalhes.
          </h1>
          <p data-revelar className="mt-8 max-w-2xl text-xl leading-relaxed text-white/80">{HISTORIA.fundacao}</p>
        </Revelar>
      </section>

      <section className="bg-papel py-20 md:py-28">
        <Revelar className="container-b grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p data-revelar className="eyebrow text-azul">Tradição</p>
            <h2 data-revelar className="mt-4 font-display text-[clamp(2rem,4vw,3.4rem)] leading-[1.02] font-semibold">As primeiras instalações, em Santo André.</h2>
          </div>
          <div className="space-y-5 text-lg leading-relaxed text-tinta-2 lg:col-span-6 lg:col-start-7">
            <p data-revelar>{HISTORIA.tradicao}</p>
            <p data-revelar>{HISTORIA.hoje}</p>
            <p data-revelar>{HISTORIA.homologacao}</p>
          </div>
        </Revelar>
        <div className="container-b mt-16">
          <figure>
            <div className="relative aspect-[1452/900] overflow-hidden rounded-3xl">
              <Image src="/img/historia/historica-09.webp" alt="Prédio antigo da fábrica Bacchi" fill sizes="(min-width:1320px) 1240px, 94vw" className="object-cover" />
            </div>
            <figcaption className="mt-3 text-sm text-aco">Acervo Bacchi.</figcaption>
          </figure>
        </div>
      </section>

      <ArquivoParaHoje />

      <section aria-labelledby="titulo-arquivo" className="bg-marinho-950 py-20 text-white md:py-28">
        <div className="container-b">
          <h2 id="titulo-arquivo" className="font-display text-[clamp(1.8rem,3.4vw,2.8rem)] font-semibold">Do acervo</h2>
          <p className="mt-3 max-w-lg text-white/65">Fotografias históricas da fábrica, publicadas pela Bacchi.</p>
          <ul className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {ARQUIVO.map((f) => (
              <li key={f.src} className="mb-4 break-inside-avoid overflow-hidden rounded-2xl">
                <Image src={f.src} alt={f.alt} width={f.w} height={f.h} sizes="(min-width:1024px) 30vw, (min-width:640px) 46vw, 92vw" className="h-auto w-full grayscale-[0.2] transition-[filter] duration-500 hover:grayscale-0" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-papel py-20 md:py-28">
        <Revelar className="container-b grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="relative aspect-video overflow-hidden rounded-3xl bg-marinho">
              <video className="h-full w-full object-cover" controls preload="none" poster="/video/produtos-montagem.webp" playsInline muted>
                <source src="/video/produtos-montagem.webm" type="video/webm" />
                <source src="/video/produtos-montagem.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <p data-revelar className="eyebrow text-azul">Hoje</p>
            <h2 data-revelar className="mt-4 font-display text-[clamp(2rem,4vw,3.2rem)] leading-[1.02] font-semibold">
              {PRODUTOS.length} linhas, de clips a percevejos.
            </h2>
            <p data-revelar className="mt-5 text-lg leading-relaxed text-tinta-2">
              A Bacchi fica em {EMPRESA.endereco.cidade}, {EMPRESA.endereco.uf}, e atende distribuidores, revendedores, papelarias e corporações em todo o Brasil, com representantes comerciais nos estados.
            </p>
            <div data-revelar className="mt-8 flex flex-wrap gap-3">
              <Link href="/produtos" className="btn btn-primario">Ver o catálogo <span className="seta" aria-hidden="true">→</span></Link>
              <Link href="/representantes" className="btn btn-contorno text-tinta">Representantes</Link>
            </div>
          </div>
        </Revelar>
      </section>
    </>
  );
}
