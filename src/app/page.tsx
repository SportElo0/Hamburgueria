import { Portal } from "@/components/Portal";
import { Rooms } from "@/components/Rooms";
import { Amenities } from "@/components/Amenities";
import { Gallery } from "@/components/Gallery";
import { Location } from "@/components/Location";
import { CtaFooter } from "@/components/CtaFooter";

export default function Home() {
  return (
    <>
      <main>
        <Portal />
        <Rooms />
        <Amenities />
        <Gallery />
        <Location />
      </main>
      <CtaFooter />
    </>
  );
}
