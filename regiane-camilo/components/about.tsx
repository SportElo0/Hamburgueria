import { ArrowUpRight } from "lucide-react";
import { site } from "@/config/site";
import { InstagramIcon, Seal } from "@/components/brand";

export function About() {
  const { about } = site;
  return (
    <section id="sobre" aria-labelledby="sobre-title" className="bg-cream">
      <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-12 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-16 lg:px-12 lg:py-28">
        <figure className="lg:col-span-5">
          <div
            data-reveal
            className="relative grid aspect-square place-items-center overflow-hidden rounded-[1.75rem] bg-blush"
          >
            <Seal size={300} className="relative w-[58%] shadow-[0_24px_50px_-28px_rgb(75_38_22/0.6)]" />
          </div>
          <figcaption className="mt-4 text-[0.875rem] text-muted">
            O selo da marca, como aparece no Instagram {site.instagram.handle}.
          </figcaption>
        </figure>

        <div className="lg:col-span-6 lg:col-start-7">
          <h2 id="sobre-title" data-reveal className="serif max-w-[16ch] text-[clamp(2.25rem,4.4vw,3.6rem)] text-ink">
            Por trás de cada criação, uma história.
          </h2>
          <div className="mt-8 flex max-w-[58ch] flex-col gap-5 text-[1.0625rem] leading-relaxed text-ink/85">
            {about.paragraphs.map((paragraph) => (
              <p key={paragraph} data-reveal>
                {paragraph}
              </p>
            ))}
          </div>
          <p className="script mt-8 text-[2.6rem] text-cocoa">{site.owner}</p>
          {about.draft && (
            <p className="mt-3 text-[0.8125rem] text-muted">
              Texto provisório, aguardando a revisão da {site.ownerFirstName}.
            </p>
          )}
          <a
            href={site.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline mt-9"
          >
            <InstagramIcon size={17} />
            Conhecer mais criações
            <ArrowUpRight size={16} className="nudge" />
          </a>
        </div>
      </div>
    </section>
  );
}
