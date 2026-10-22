import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { About } from "@/components/about";
import { Highlights } from "@/components/highlights";
import { Menu } from "@/components/menu";
import { Travessia } from "@/components/travessia";
import { Gallery } from "@/components/gallery";
import { Reservation } from "@/components/reservation/reservation";
import { Events } from "@/components/events";
import { Social } from "@/components/social";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";
import { MobileCta } from "@/components/mobile-cta";
import { RevealObserver } from "@/components/reveal-observer";
import { ScrollScenes } from "@/components/scroll-scenes";

export default function Home() {
  return (
    <>
      <a
        href="#reservar"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-deep focus:px-5 focus:py-3 focus:font-semibold focus:text-sand"
      >
        Pular para a reserva
      </a>
      <Header />
      <main>
        <Hero />
        <About />
        <section id="cardapio" aria-labelledby="cardapio-title">
          <Highlights />
          <Menu />
        </section>
        <Travessia />
        <Gallery />
        <Reservation />
        <Events />
        <Social />
        <Contact />
      </main>
      <Footer />
      <MobileCta />
      <RevealObserver />
      <ScrollScenes />
    </>
  );
}
