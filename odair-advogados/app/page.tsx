import { About } from "@/components/about";
import { Approach } from "@/components/approach";
import { Areas } from "@/components/areas";
import { Contact } from "@/components/contact";
import { Contents } from "@/components/contents";
import { Faq } from "@/components/faq";
import { Hero } from "@/components/hero";

export default function Home() {
  return (
    <main>
      <Hero />
      <About />
      <Areas />
      <Approach />
      <Contents />
      <Faq />
      <Contact />
    </main>
  );
}
