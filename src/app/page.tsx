import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Chapters } from "@/components/Chapters";
import { Rooms } from "@/components/Rooms";
import { Amenities } from "@/components/Amenities";
import { Gallery } from "@/components/Gallery";
import { Location } from "@/components/Location";
import { CtaFooter } from "@/components/CtaFooter";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Chapters />
        <Rooms />
        <Amenities />
        <Gallery />
        <Location />
      </main>
      <CtaFooter />
    </>
  );
}
