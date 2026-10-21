import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Services } from "@/components/services";
import { Gallery } from "@/components/gallery";
import { About } from "@/components/about";
import { Booking } from "@/components/booking/booking";
import { Reviews } from "@/components/reviews";
import { Location } from "@/components/location";
import { Faq } from "@/components/faq";
import { Footer } from "@/components/footer";
import { MobileCta } from "@/components/mobile-cta";
import { RevealObserver } from "@/components/reveal-observer";

export default function Home() {
  return (
    <>
      <a
        href="#agendar"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-[3px] focus:bg-blue focus:px-4 focus:py-3 focus:font-semibold focus:text-white"
      >
        Pular para o agendamento
      </a>
      <Header />
      <main>
        <Hero />
        <Services />
        <Gallery />
        <About />
        <Booking />
        <Reviews />
        <Location />
        <Faq />
      </main>
      <Footer />
      <MobileCta />
      <RevealObserver />
    </>
  );
}
