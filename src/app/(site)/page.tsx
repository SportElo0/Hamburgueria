import { AtelierPreview } from "@/components/home/atelier-preview";
import { CollectionPreview } from "@/components/home/collection-preview";
import { Discover } from "@/components/home/discover";
import { Hero } from "@/components/home/hero";
import { Journeys } from "@/components/home/journeys";
import { RestorationPreview } from "@/components/home/restoration-preview";
import { Trajectory } from "@/components/home/trajectory";
import { VisionTeaser } from "@/components/home/vision-teaser";
import { getServices, getVehicles } from "@/lib/repo";

export const revalidate = 300;

export default async function Home() {
  const [vehicles, services] = await Promise.all([getVehicles(), getServices()]);
  const charuto = vehicles.find((v) => v.chassis === "W111") ?? vehicles[0];
  return (
    <>
      <Hero />
      <Discover />
      {charuto && <Trajectory vehicle={charuto} />}
      <CollectionPreview vehicles={vehicles} />
      <RestorationPreview services={services} />
      <VisionTeaser />
      <AtelierPreview />
      <Journeys />
    </>
  );
}
