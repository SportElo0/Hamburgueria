import { ArrowUpRight } from "lucide-react";
import { products, site } from "@/config/site";
import { formatShortDate } from "@/lib/dates";
import { InstagramIcon } from "@/components/brand";
import { Photo } from "@/components/photo";

const count = new Intl.NumberFormat("pt-BR");
// Recortes de detalhe, para não repetir as fotos inteiras da galeria.
const tiles = ["brigadeiros", "marinho", "morangos-rosetas", "branco-azul"]
  .map((id) => products.find((p) => p.id === id))
  .filter((p) => p !== undefined);

export function Instagram() {
  const { instagram } = site;
  return (
    <section aria-labelledby="instagram-title" className="bg-blush">
      <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-10 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-12 lg:px-12 lg:py-24">
        <div className="lg:col-span-4">
          <h2 id="instagram-title" data-reveal className="serif text-[clamp(2.1rem,3.8vw,3.1rem)] text-ink">
            Acompanhe nossas criações.
          </h2>
          <p data-reveal className="mt-4 max-w-[38ch] text-[1.0625rem] leading-relaxed text-ink/80">
            Os bolos novos aparecem primeiro no Instagram {instagram.handle}
            {instagram.posts
              ? `, que tinha ${count.format(instagram.posts.count)} publicações em ${formatShortDate(instagram.posts.checkedAt)}`
              : ""}
            .
          </p>
          <a
            href={instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-cocoa mt-8"
          >
            <InstagramIcon size={17} />
            Ver no Instagram
            <ArrowUpRight size={16} className="nudge" />
          </a>
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:col-span-8">
          {tiles.map((product, i) => (
            <li key={product.id} data-reveal style={{ "--reveal-delay": `${i * 80}ms` } as React.CSSProperties}>
              <a
                href={instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${product.name}, ver no Instagram ${instagram.handle}`}
                className="group relative block overflow-hidden rounded-[var(--radius-card)]"
              >
                <Photo
                  photo={product.photo}
                  crop="detail"
                  sizes="(min-width: 1024px) 15vw, (min-width: 640px) 23vw, 46vw"
                  className="aspect-square w-full"
                  imgClassName="transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 grid place-items-center bg-cocoa-deep/45 text-cream opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  <InstagramIcon size={26} />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
