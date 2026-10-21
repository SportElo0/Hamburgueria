"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { nav, site } from "@/config/site";
import { requestBooking } from "@/lib/booking-store";
import { InstagramIcon, Wordmark, WhatsAppIcon } from "@/components/brand";
import { greetingLink } from "@/lib/whatsapp";

const bandTones = ["bg-fade-5", "bg-fade-4", "bg-fade-3", "bg-fade-2", "bg-fade-1"];
const guards = ["#3", "#2", "#1½", "#1", "#½"];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("#inicio");
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Destaca a seção visível no menu.
  useEffect(() => {
    const ids = [...nav.map((item) => item.href), "#agendar"];
    const sections = ids
      .map((id) => document.querySelector<HTMLElement>(id))
      .filter((el): el is HTMLElement => Boolean(el));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        }
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

  const solid = scrolled || open;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
          solid
            ? "border-b border-line bg-fade-0/92 backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-6 px-4 sm:px-6 lg:h-[4.5rem] lg:px-10">
          <a href="#inicio" aria-label={`${site.name}, voltar ao início`} className="rounded-sm">
            <Wordmark />
          </a>

          <nav aria-label="Principal" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {nav.map((item) => {
                const current = active === item.href;
                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      aria-current={current ? "location" : undefined}
                      className={`relative block px-3.5 py-2 text-[0.92rem] font-semibold transition-colors ${
                        current ? "text-paper" : "text-steel hover:text-paper"
                      }`}
                    >
                      {item.label}
                      <span
                        aria-hidden
                        className={`absolute inset-x-3.5 -bottom-0.5 h-px origin-left bg-blue-ink transition-transform duration-300 ${
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
              onClick={() => requestBooking()}
              className="btn btn-primary hidden min-h-11 px-5 text-[0.9rem] sm:inline-flex"
            >
              Agendar horário
              <ArrowRight size={17} className="nudge" />
            </button>
            <button
              ref={toggleRef}
              type="button"
              aria-expanded={open}
              aria-controls="menu-mobile"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              onClick={() => setOpen((value) => !value)}
              className="grid size-11 place-items-center rounded-[3px] border border-line-strong text-paper transition-colors hover:bg-fade-3 lg:hidden"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Fora do <header>: o backdrop-filter dele prenderia um filho fixed à sua própria altura. */}
      {open && (
        <div
          ref={sheetRef}
          id="menu-mobile"
          className="animate-sheet fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col overflow-y-auto bg-fade-0 lg:hidden"
        >
          <nav aria-label="Menu" className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col">
              {nav.map((item, index) => (
                <li key={item.href} className={`flex flex-1 ${bandTones[index]}`}>
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active === item.href ? "location" : undefined}
                    className="group flex min-h-16 flex-1 items-center justify-between px-4 sm:px-6"
                  >
                    <span className="display text-[2.6rem] text-paper group-aria-[current=location]:text-blue-ink">
                      {item.label}
                    </span>
                    <span className="guard text-steel">{guards[index]}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex flex-col gap-3 border-t border-line bg-fade-0 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                requestBooking();
              }}
              className="btn btn-primary w-full"
            >
              Agendar meu horário
              <ArrowRight size={18} className="nudge" />
            </button>
            <div className="grid grid-cols-2 gap-3">
              <a
                href={greetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
              >
                <WhatsAppIcon size={18} />
                WhatsApp
              </a>
              <a
                href={site.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
              >
                <InstagramIcon size={18} />
                Instagram
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
