import Link from "next/link";
import { ROOM_TYPES, whatsappLink } from "@/lib/site";
import { Reveal } from "./Reveal";

export function Rooms() {
  return (
    <section id="quartos" className="bg-paper-deep py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <Reveal>
          <p className="eyebrow text-terracotta">Acomodações</p>
          <h2 className="font-display mt-4 max-w-xl text-4xl leading-tight text-ink sm:text-5xl">Quartos feitos para ficar</h2>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {ROOM_TYPES.map((room, i) => (
            <Reveal key={room.id} delay={i * 0.08}>
              <div className="flex h-full flex-col justify-between rounded-sm border border-line bg-paper p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-terracotta/40 hover:shadow-xl hover:shadow-terracotta/5">
                <div>
                  <span className="font-display text-sm text-ink-mute">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="font-display mt-3 text-2xl leading-snug text-ink">{room.name}</h3>
                  <p className="mt-3 text-sm font-medium text-terracotta">{room.capacity}</p>
                  <p className="mt-1 text-sm text-ink-mute">{room.bed}</p>
                  <ul className="mt-6 space-y-2 text-sm text-ink-soft">
                    {room.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2">
                        <span className="h-1 w-1 shrink-0 rounded-full bg-terracotta" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href={whatsappLink(`Olá! Gostaria de consultar disponibilidade para o ${room.name}.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-8 inline-flex items-center gap-1 text-sm font-medium text-ink underline decoration-terracotta decoration-2 underline-offset-4"
                >
                  Consultar disponibilidade →
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-8 text-xs text-ink-mute">Preços e disponibilidade variam por data — confirme direto pelo WhatsApp.</p>
      </div>
    </section>
  );
}
