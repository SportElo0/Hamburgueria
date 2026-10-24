"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { nav, site } from "@/config/site";
import { Signature } from "@/components/brand";

export function Header() {
  const pathname = usePathname();
  const home = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("");
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

  // Na página inicial, destaca a seção visível; nas internas, a área ativa vem do caminho.
  useEffect(() => {
    if (!home) return;
    const sections = document.querySelectorAll<HTMLElement>("main section[id]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.id;
          setActive(nav.some((item) => item.id === id) ? id : "");
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [home]);

  const current = home ? active : pathname.startsWith("/areas") ? "areas" : pathname.startsWith("/conteudos") ? "conteudos" : "";

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
        if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
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

  // Fecha o menu ao trocar de página.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <>
      <header
        ref={headerRef}
        className={`sticky top-0 z-50 bg-navy transition-shadow duration-500 ${
          scrolled || open ? "shadow-[0_1px_0_var(--color-blue-line)]" : ""
        }`}
      >
        <div
          className={`mx-auto flex max-w-[90rem] items-center justify-between gap-6 px-5 transition-[height] duration-500 ease-[var(--ease-out-expo)] sm:px-8 lg:px-12 ${
            scrolled ? "h-[4.25rem] lg:h-[4.75rem]" : "h-[4.75rem] lg:h-[6rem]"
          }`}
        >
          <Link href="/" aria-label={`${site.name}, página inicial`} className="shrink-0">
            <Signature priority />
          </Link>

          <nav aria-label="Principal" className="hidden xl:block">
            <ul className="flex items-center gap-1 rounded-[3px] border border-blue-line/80 px-2">
              {nav.map((item) => {
                const isCurrent = current === item.id;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      aria-current={isCurrent ? (home ? "location" : "page") : undefined}
                      className={`relative block px-3 py-3.5 text-[0.875rem] font-medium transition-colors ${
                        isCurrent ? "text-ivory" : "text-on-navy-muted hover:text-ivory"
                      }`}
                    >
                      {item.label}
                      <span
                        aria-hidden
                        className={`absolute inset-x-3 bottom-2 h-px origin-left bg-gold transition-transform duration-500 ease-[var(--ease-out-expo)] ${
                          isCurrent ? "scale-x-100" : "scale-x-0"
                        }`}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/#contato" className="btn btn-line-light hidden min-h-11 px-5 sm:inline-flex">
              Entrar em contato
            </Link>
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
              className="grid size-11 place-items-center rounded-[3px] text-ivory hover:text-gold xl:hidden"
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
          className="animate-sheet fixed inset-x-0 bottom-0 z-40 flex flex-col overflow-y-auto bg-navy px-5 sm:px-8 xl:hidden"
        >
          <nav aria-label="Menu" className="pt-2">
            <ul>
              {nav.map((item) => (
                <li key={item.id} className="border-b border-blue-line">
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={current === item.id ? "location" : undefined}
                    className="display flex min-h-15 items-center justify-between py-3 text-[1.85rem] text-ivory aria-[current=location]:text-gold"
                  >
                    {item.label}
                    <ArrowRight size={20} strokeWidth={1.3} className="text-gold" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <Link href="/#contato" onClick={() => setOpen(false)} className="btn btn-gold w-full">
              Entrar em contato
              <ArrowRight size={16} className="nudge" />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
