"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { nav, site } from "@/config/site";
import { requestOrder } from "@/lib/order-store";
import { greetingLink } from "@/lib/order";
import { InstagramIcon, Wordmark, WhatsAppIcon } from "@/components/brand";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("#inicio");
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  // O painel começa logo abaixo do header, que fica mais baixo enquanto a linha superior aparece.
  const [sheetTop, setSheetTop] = useState(72);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Destaca a seção visível na navegação.
  useEffect(() => {
    const sections = nav
      .map((item) => document.querySelector<HTMLElement>(item.href))
      .filter((el): el is HTMLElement => Boolean(el));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(`#${entry.target.id}`);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheetRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (event.key === "Tab" && sheetRef.current) {
        const focusables = sheetRef.current.querySelectorAll<HTMLElement>("a, button");
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          toggleRef.current?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          toggleRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <aside aria-label="Mensagem da confeitaria" className="bg-cocoa text-cream">
        <p className="mx-auto flex min-h-9 max-w-[90rem] items-center justify-center gap-3 px-4 py-2 text-center text-[0.8125rem] tracking-[0.04em]">
          <span aria-hidden className="dot hidden sm:inline-block" />
          {site.tagline}
          <span aria-hidden className="dot hidden sm:inline-block" />
        </p>
      </aside>

      <header
        ref={headerRef}
        className={`sticky top-0 z-50 bg-cream/95 backdrop-blur-[2px] transition-shadow duration-300 ${
          scrolled || open ? "shadow-[0_1px_0_var(--color-line)]" : ""
        }`}
      >
        <div className="mx-auto flex h-[4.75rem] max-w-[90rem] items-center justify-between gap-6 px-5 sm:px-8 lg:h-[6rem] lg:px-12">
          <a href="#inicio" aria-label={`${site.name}, voltar ao início`} className="-mt-1">
            <Wordmark />
          </a>

          <nav aria-label="Principal" className="hidden xl:block">
            <ul className="flex items-center gap-9">
              {nav.map((item) => {
                const current = active === item.href;
                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      aria-current={current ? "location" : undefined}
                      className={`relative block py-3 text-[0.95rem] font-medium transition-colors ${
                        current ? "text-cocoa" : "text-ink/80 hover:text-cocoa"
                      }`}
                    >
                      {item.label}
                      <span
                        aria-hidden
                        className={`absolute inset-x-1 bottom-1.5 h-[2px] origin-center rounded-full bg-rose transition-transform duration-500 ease-[var(--ease-out-expo)] ${
                          current ? "scale-x-100" : "scale-x-0"
                        }`}
                      />
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => requestOrder()}
              className="btn btn-cocoa min-h-11 px-4 text-[0.75rem] sm:px-6 lg:min-h-12"
            >
              <span className="sm:hidden">Encomendar</span>
              <span className="hidden sm:inline">Fazer encomenda</span>
            </button>
            <button
              ref={toggleRef}
              type="button"
              aria-expanded={open}
              aria-controls="menu-mobile"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              onClick={() => {
                setSheetTop(headerRef.current?.getBoundingClientRect().bottom ?? 72);
                setOpen((value) => !value);
              }}
              className="grid size-11 place-items-center rounded-full text-cocoa hover:bg-blush/60 xl:hidden"
            >
              {open ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div
          ref={sheetRef}
          id="menu-mobile"
          style={{ top: sheetTop }}
          className="animate-sheet fixed inset-x-0 bottom-0 z-40 flex flex-col overflow-y-auto bg-cream px-5 sm:px-8 xl:hidden"
        >
          <nav aria-label="Menu" className="pt-2">
            <ul>
              {nav.map((item) => (
                <li key={item.href} className="border-b border-line">
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active === item.href ? "location" : undefined}
                    className="serif flex min-h-16 items-center justify-between py-3 text-[2rem] text-ink aria-[current=location]:text-cocoa aria-[current=location]:underline aria-[current=location]:decoration-rose aria-[current=location]:decoration-2 aria-[current=location]:underline-offset-8"
                  >
                    {item.label}
                    <ArrowRight size={20} strokeWidth={1.4} className="text-rose" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto flex flex-col gap-3 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                requestOrder();
              }}
              className="btn btn-cocoa w-full"
            >
              Fazer encomenda
              <ArrowRight size={16} className="nudge" />
            </button>
            <div className="grid grid-cols-2 gap-3">
              <a
                href={greetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline px-3"
              >
                <WhatsAppIcon size={17} />
                WhatsApp
              </a>
              <a
                href={site.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline px-3"
              >
                <InstagramIcon size={17} />
                Instagram
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
