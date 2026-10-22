"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { requestOrder } from "@/lib/order-store";
import { greetingLink } from "@/lib/order";
import { WhatsAppIcon } from "@/components/brand";

/** Barra fixa no celular: aparece depois da abertura e some quando o pedido está na tela. */
export function MobileCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("inicio");
    const order = document.getElementById("personalize");
    if (!hero || !order) return;
    let heroVisible = true;
    let orderVisible = false;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === hero) heroVisible = entry.isIntersecting;
        if (entry.target === order) orderVisible = entry.isIntersecting;
      }
      setVisible(!heroVisible && !orderVisible);
    });
    observer.observe(hero);
    observer.observe(order);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      inert={!visible}
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-[2px] transition-transform duration-500 ease-[var(--ease-out-expo)] xl:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="mx-auto flex max-w-xl gap-2">
        <button type="button" onClick={() => requestOrder()} className="btn btn-cocoa min-h-12 flex-1">
          Fazer encomenda
          <ArrowRight size={16} className="nudge" />
        </button>
        <a
          href={greetingLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Falar no WhatsApp"
          className="btn btn-outline min-h-12 w-14 px-0"
        >
          <WhatsAppIcon size={20} />
        </a>
      </div>
    </div>
  );
}
