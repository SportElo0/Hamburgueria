"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { requestBooking } from "@/lib/booking-store";
import { greetingLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/brand";

/** Barra fixa no celular: aparece depois da abertura e some quando o agendamento está na tela. */
export function MobileCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("inicio");
    const booking = document.getElementById("agendar");
    if (!hero || !booking) return;
    let heroVisible = true;
    let bookingVisible = false;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === hero) heroVisible = entry.isIntersecting;
        if (entry.target === booking) bookingVisible = entry.isIntersecting;
      }
      setVisible(!heroVisible && !bookingVisible);
    });
    observer.observe(hero);
    observer.observe(booking);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      inert={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ground px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform duration-500 ease-[var(--ease-out-expo)] lg:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => requestBooking()}
          className="btn btn-solid min-h-12 flex-1"
        >
          Agendar horário
          <ArrowRight size={16} className="nudge" />
        </button>
        <a
          href={greetingLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Falar no WhatsApp"
          className="btn btn-outline min-h-12 px-4"
        >
          <WhatsAppIcon size={19} />
        </a>
      </div>
    </div>
  );
}
