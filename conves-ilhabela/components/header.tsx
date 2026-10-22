"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Menu, Phone, X } from "lucide-react";
import { nav, site } from "@/config/site";
import { InstagramIcon, Wordmark } from "@/components/brand";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("#inicio");
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [sheetTop, setSheetTop] = useState(72);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
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
      <header
        ref={headerRef}
        className={`sticky top-0 z-50 transition-[background-color,box-shadow] duration-500 ${
          scrolled || open
            ? "bg-sand/95 shadow-[0_1px_0_var(--color-line)] backdrop-blur-[3px]"
            : "bg-sand"
        }`}
      >
        <div
          className={`mx-auto flex max-w-[90rem] items-center justify-between gap-6 px-5 transition-[height] duration-500 ease-[var(--ease-out-expo)] sm:px-8 lg:px-12 ${
            scrolled ? "h-[4.25rem] lg:h-[4.75rem]" : "h-[4.75rem] lg:h-[6rem]"
          }`}
        >
          <a href="#inicio" aria-label={`${site.name}, voltar ao início`}>
            <Wordmark />
          </a>

          <nav aria-label="Principal" className="hidden xl:block">
            <ul className="flex items-center gap-8">
              {nav.map((item) => {
                const current = active === item.href;
                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      aria-current={current ? "location" : undefined}
                      className={`label relative block py-3 transition-colors ${
                        current ? "text-deep" : "text-ink/75 hover:text-deep"
                      }`}
                    >
                      {item.label}
                      <span
                        aria-hidden
                        className={`absolute inset-x-0 bottom-1 h-px origin-left bg-champagne transition-transform duration-500 ease-[var(--ease-out-expo)] ${
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
            <a href="#reservar" className="btn btn-gold min-h-11 px-4 sm:px-6">
              <span className="sm:hidden">Reservar</span>
              <span className="hidden sm:inline">Solicitar reserva</span>
            </a>
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
              className="grid size-11 place-items-center text-deep xl:hidden"
            >
              {open ? <X size={24} strokeWidth={1.4} /> : <Menu size={24} strokeWidth={1.4} />}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div
          ref={sheetRef}
          id="menu-mobile"
          style={{ top: sheetTop }}
          className="animate-sheet fixed inset-x-0 bottom-0 z-40 flex flex-col overflow-y-auto bg-sand px-5 sm:px-8 xl:hidden"
        >
          <nav aria-label="Menu" className="pt-2">
            <ul>
              {nav.map((item) => (
                <li key={item.href} className="border-b border-line">
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active === item.href ? "location" : undefined}
                    className="serif flex min-h-15 items-center justify-between py-3 text-[1.9rem] text-deep aria-[current=location]:text-champagne-deep"
                  >
                    {item.label}
                    <ArrowRight size={20} strokeWidth={1.3} className="text-champagne" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto flex flex-col gap-3 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <a href="#reservar" onClick={() => setOpen(false)} className="btn btn-gold w-full">
              Solicitar reserva
              <ArrowRight size={16} className="nudge" />
            </a>
            <div className="grid grid-cols-2 gap-3">
              <a href={`tel:${site.phone.e164}`} className="btn btn-outline px-3">
                <Phone size={16} />
                Ligar
              </a>
              <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline px-3">
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
