import Image from "next/image";
import Link from "next/link";
import { ROOM_TYPES, whatsappLink } from "@/lib/site";
import { Reveal } from "./Reveal";

export function Rooms() {
  return (
    <section id="quartos" className="bg-ink py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <Reveal>
          <p className="eyebrow text-accent">Acomodações</p>
          <h2 className="font-display mt-4 max-w-xl text-4xl leading-tight text-paper sm:text-5xl">Quartos feitos para ficar</h2>
        </Reveal>
      </div>
      <div className="mt-14 flex flex-col gap-16 sm:gap-24">
        {ROOM_TYPES.map((room, i) => (
          <Reveal key={room.id} delay={i * 0.06}>
            <div className={`mx-auto grid max-w-6xl items-center gap-8 px-6 sm:px-10 md:grid-cols-2 md:gap-14 ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}>
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image src={room.photo} alt={room.name} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
              </div>
              <div>
                <span className="font-display text-sm text-paper-mute">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-display mt-3 text-3xl leading-snug text-paper">{room.name}</h3>
                <p className="mt-3 text-sm font-medium text-accent">{room.capacity}</p>
                <p className="mt-1 text-sm text-paper-mute">{room.bed}</p>
                <ul className="mt-6 space-y-2 text-sm text-paper-mute">
                  {room.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2">
                      <span className="h-1 w-1 shrink-0 rounded-full bg-accent" />
                      {h}
                    </li>
                  ))}
                </ul>
                <Link
                  href={whatsappLink(`Olá! Gostaria de consultar disponibilidade para o ${room.name}.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-7 inline-flex items-center gap-1 text-sm font-medium text-paper underline decoration-accent decoration-2 underline-offset-4"
                >
                  Consultar disponibilidade →
                </Link>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      <p className="mx-auto mt-16 max-w-6xl px-6 text-xs text-paper-mute sm:px-10">Preços e disponibilidade variam por data — confirme direto pelo WhatsApp.</p>
    </section>
  );
}
