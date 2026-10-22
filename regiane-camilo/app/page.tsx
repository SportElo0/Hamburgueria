import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Styles } from "@/components/styles";
import { Gallery } from "@/components/gallery";
import { Order } from "@/components/order/order";
import { About } from "@/components/about";
import { Instagram } from "@/components/instagram";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";
import { MobileCta } from "@/components/mobile-cta";
import { RevealObserver } from "@/components/reveal-observer";

export default function Home() {
  return (
    <>
      <a
        href="#personalize"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-cocoa focus:px-5 focus:py-3 focus:font-semibold focus:text-cream"
      >
        Pular para a encomenda
      </a>
      <Header />
      <main>
        <Hero />
        <Styles />
        <Gallery />
        <Order />
        <About />
        <Instagram />
        <Contact />
      </main>
      <Footer />
      <MobileCta />
      <RevealObserver />
    </>
  );
}
