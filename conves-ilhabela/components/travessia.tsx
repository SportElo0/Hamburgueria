import { photos } from "@/config/site";
import { Credit, Photo } from "@/components/photo";

const steps = [
  { title: "A varanda coberta", text: "Forro de madeira, pilares de pedra e uma árvore que atravessa o deck." },
  { title: "O gramado e as árvores", text: "Mesas ao ar livre entre bananeiras, sombra e o caminho de pedra." },
  { title: "A água logo ali", text: "O canal de Ilhabela e as montanhas do continente no horizonte." },
];

/**
 * A travessia: a cena fica presa enquanto o scroll leva da varanda até a água.
 * Sem JS ou com movimento reduzido, as duas fotos aparecem lado a lado, estáticas.
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

      <div data-travessia-stage className="relative h-[calc(100svh-4.25rem)] min-h-[28rem] overflow-hidden lg:h-[calc(100svh-4.75rem)]">
        <div data-travessia-under className="absolute inset-0 will-change-transform">
          <Photo photo={photos.varanda} sizes="100vw" className="absolute! inset-0" />
        </div>
        {/* A abertura: começa como uma janela entre os pilares e se abre até a água. */}
        <div
          data-travessia-over
          className="absolute inset-0 [clip-path:inset(0_0_0_50%)] will-change-[clip-path]"
        >
          <div data-travessia-over-img className="absolute inset-0 will-change-transform">
            <Photo photo={photos.gramado} sizes="100vw" className="absolute! inset-0" />
          </div>
        </div>
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-deep-2/85 to-transparent" />

        <ol data-steps className="absolute inset-x-0 bottom-0 mx-auto grid max-w-[90rem] grid-cols-1 gap-4 px-5 pb-28 sm:grid-cols-3 sm:px-8 lg:px-12 xl:pb-12">
          {steps.map((step) => (
            <li key={step.title} data-travessia-step className="max-w-[24rem]">
              <p className="serif text-[1.6rem] leading-tight">{step.title}</p>
              <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-sand/85">{step.text}</p>
            </li>
          ))}
        </ol>
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1 lg:top-5 lg:right-5">
          <Credit photo={photos.varanda} className="rounded-[2px] bg-deep-2/55 px-2 py-0.5 text-sand/90" />
          <Credit photo={photos.gramado} className="rounded-[2px] bg-deep-2/55 px-2 py-0.5 text-sand/90" />
        </div>
      </div>
    </section>
  );
}
