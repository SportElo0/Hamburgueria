import { photos, type Photo as PhotoData } from "@/config/site";
import { Credit, Photo } from "@/components/photo";

const steps = [
  { title: "A varanda coberta", text: "Forro de madeira, pilares de pedra e uma árvore que atravessa o deck." },
  { title: "O gramado e as árvores", text: "Mesas ao ar livre entre bananeiras, sombra e o caminho de pedra." },
  { title: "A água logo ali", text: "O canal de Ilhabela e as montanhas do continente no horizonte." },
];

function Caption({ step }: { step: (typeof steps)[number] }) {
  return (
    <>
      <p className="serif text-[1.6rem] leading-tight">{step.title}</p>
      <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-sand/85">{step.text}</p>
    </>
  );
}

function CreditTag({ photo }: { photo: PhotoData }) {
  return (
    <Credit
      photo={photo}
      className="absolute top-3 right-3 rounded-[2px] bg-deep-2/55 px-2 py-0.5 text-sand/90 lg:top-5 lg:right-5"
    />
  );
}

/**
 * A travessia: a cena fica presa enquanto o scroll leva da varanda até a água,
 * abrindo pela faixa entre o telhado e o deck. Sem JS ou com movimento reduzido,
 * as duas fotos aparecem lado a lado, cada uma com a própria legenda.
 * As classes `in-[.is-scene]:` valem só quando a cena está armada.
 */
export function Travessia() {
  return (
    <section id="experiencia" aria-labelledby="experiencia-title" data-travessia className="bg-deep text-sand">
      <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-6 px-5 pt-20 pb-12 sm:px-8 lg:grid-cols-12 lg:items-end lg:px-12 lg:pt-28">
        <h2
          id="experiencia-title"
          data-reveal
          className="serif max-w-[18ch] text-[clamp(2.3rem,4.6vw,4rem)] lg:col-span-7"
        >
          Um lugar para apreciar cada momento.
        </h2>
        <p data-reveal className="max-w-[44ch] text-[1.0625rem] leading-relaxed text-on-deep-muted lg:col-span-4 lg:col-start-9">
          A experiência começa antes do prato: da sombra da varanda até a beira da água.
        </p>
      </div>

      <div
        data-travessia-stage
        className="mx-auto grid max-w-[90rem] grid-cols-1 gap-3 px-5 pb-20 sm:grid-cols-2 sm:px-8 lg:px-12 in-[.is-scene]:relative in-[.is-scene]:block in-[.is-scene]:h-[calc(100svh-4.25rem)] in-[.is-scene]:min-h-[28rem] in-[.is-scene]:max-w-none in-[.is-scene]:overflow-hidden in-[.is-scene]:p-0 lg:in-[.is-scene]:h-[calc(100svh-4.75rem)]"
      >
        <figure className="relative aspect-[4/3] overflow-hidden in-[.is-scene]:absolute in-[.is-scene]:inset-0 in-[.is-scene]:aspect-auto">
          <div data-travessia-under className="absolute inset-0 will-change-transform">
            <Photo photo={photos.varanda} sizes="(min-width: 640px) 50vw, 100vw" className="absolute! inset-0" />
          </div>
          <CreditTag photo={photos.varanda} />
          <figcaption className="absolute inset-x-0 bottom-0 bg-linear-to-t from-deep-2/85 to-transparent px-5 pt-16 pb-5 in-[.is-scene]:hidden">
            <Caption step={steps[0]} />
          </figcaption>
        </figure>

        {/* A abertura: começa como a faixa de água entre o telhado e o deck e se abre até tudo. */}
        <figure data-travessia-over className="relative aspect-[4/3] overflow-hidden in-[.is-scene]:absolute in-[.is-scene]:inset-0 in-[.is-scene]:aspect-auto">
          <div data-travessia-over-img className="absolute inset-0 will-change-transform">
            <Photo photo={photos.gramado} sizes="(min-width: 640px) 50vw, 100vw" className="absolute! inset-0" />
          </div>
          <CreditTag photo={photos.gramado} />
          <figcaption className="absolute inset-x-0 bottom-0 flex flex-col gap-4 bg-linear-to-t from-deep-2/85 to-transparent px-5 pt-16 pb-5 in-[.is-scene]:hidden">
            <div>
              <Caption step={steps[1]} />
            </div>
            <div>
              <Caption step={steps[2]} />
            </div>
          </figcaption>
        </figure>

        {/* Legendas da cena: uma de cada vez, sobre as duas camadas. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-2/5 bg-linear-to-t from-deep-2/85 to-transparent in-[.is-scene]:block" />
        <ol className="absolute inset-x-0 bottom-0 mx-auto hidden max-w-[90rem] grid-cols-1 px-5 pb-28 sm:px-8 lg:px-12 xl:pb-12 in-[.is-scene]:grid">
          {steps.map((step) => (
            <li key={step.title} data-travessia-step className="col-start-1 row-start-1 max-w-[24rem]">
              <Caption step={step} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
