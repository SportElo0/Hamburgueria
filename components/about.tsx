import { site } from "@/config/site";
import { PhotoSlot } from "@/components/photo-slot";

export function About() {
  const { about } = site;

  return (
    <section id="sobre" aria-labelledby="sobre-title" className="bg-fade-2 py-20 sm:py-28 lg:py-36">
      <div className="mx-auto grid max-w-[90rem] gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-10">
        <figure data-reveal="cut" className="relative lg:col-span-5">
          <PhotoSlot
            photo={about.photo}
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="aspect-[4/5] w-full rounded-[3px]"
          />
          <figcaption className="mt-4 flex items-center justify-between gap-4 border-t border-line pt-4">
            <span className="text-sm font-semibold">{site.barber}</span>
            <span className="guard text-steel">LM · DESDE {site.since}</span>
          </figcaption>
        </figure>

        <div className="flex flex-col justify-center lg:col-span-6 lg:col-start-7">
          <h2
            id="sobre-title"
            data-reveal="rise"
            className="display text-[clamp(2.9rem,10vw,5rem)]"
          >
            {about.title}
          </h2>
          <div className="mt-8 flex max-w-[58ch] flex-col gap-5 text-[1.05rem] leading-relaxed text-paper/85">
            {about.paragraphs.map((paragraph) => (
              <p key={paragraph} data-reveal="rise">
                {paragraph}
              </p>
            ))}
            {about.draft && (
              <p className="guard self-start rounded-[2px] border border-dashed border-line-strong px-2 py-1.5 text-[0.62rem] text-steel">
                TEXTO PROVISÓRIO · AGUARDANDO REVISÃO DO {site.barberFirstName.toUpperCase()}
              </p>
            )}
          </div>

          <ul className="mt-10 border-t border-line">
            {about.commitments.map((item, index) => (
              <li key={item} className="flex items-center gap-4 border-b border-line py-4">
                <span aria-hidden className="flex flex-none items-end gap-[2px]">
                  {[0, 1, 2].map((s) => (
                    <span
                      key={s}
                      style={{ height: `${6 + s * 4}px` }}
                      className={`w-[3px] ${s <= index ? "bg-blue-ink" : "bg-line-strong"}`}
                    />
                  ))}
                </span>
                <span className="text-[1rem] font-semibold leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
