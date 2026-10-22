"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Phone } from "lucide-react";
import { site } from "@/config/site";

/** Barra fixa no celular: aparece depois da abertura e some quando a reserva está na tela. */
export function MobileCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("inicio");
    const reservation = document.getElementById("reservar");
    if (!hero || !reservation) return;
    let heroVisible = true;
    let reservationVisible = false;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === hero) heroVisible = entry.isIntersecting;
        if (entry.target === reservation) reservationVisible = entry.isIntersecting;
      }
      setVisible(!heroVisible && !reservationVisible);
    });
    observer.observe(hero);
    observer.observe(reservation);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      inert={!visible}
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-sand px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform duration-500 ease-[var(--ease-out-expo)] xl:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="mx-auto flex max-w-xl gap-2">
        <a href="#reservar" className="btn btn-gold min-h-12 flex-1">
          Solicitar reserva
          <ArrowRight size={16} className="nudge" />
        </a>
        <a href={`tel:${site.phone.e164}`} aria-label={`Ligar para o Convés, ${site.phone.display}`} className="btn btn-outline min-h-12 w-14 px-0">
          <Phone size={18} />
        </a>
      </div>
    </div>
  );
}
