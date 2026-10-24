import { About } from "@/components/about";
import { Approach } from "@/components/approach";
import { Contact } from "@/components/contact";
import { Contents } from "@/components/contents";
import { Faq } from "@/components/faq";
import { Hero } from "@/components/hero";
import { ScrollScenes } from "@/components/scroll-scenes";

export default function Home() {
  return (
    <main>
      <Hero />
      <About />
      <Approach />
      <Contents />
      <Faq />
      <Contact />
      <ScrollScenes />
    </main>
  );
}
