import Link from "next/link";
import { whatsappLink } from "@/lib/site";

/** Fixed bottom bar, mobile only, present on every scroll position per the brief. */
export function MobileWhatsappBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 p-3 backdrop-blur sm:hidden">
      <Link
        href={whatsappLink("Olá! Gostaria de saber sobre disponibilidade na Villa Verano.")}
        target="_blank"
        rel="noreferrer"
        className="btn-cta w-full justify-center"
      >
        Reservar pelo WhatsApp
      </Link>
    </div>
  );
}
