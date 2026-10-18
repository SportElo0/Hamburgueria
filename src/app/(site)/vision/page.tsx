import type { Metadata } from "next";
import { VisionStudio } from "@/components/vision/vision-studio";
import { paintOptions, roofOptions } from "@/content/vision-options";

export const metadata: Metadata = {
  title: "Mercantil Vision",
  description: "Envie a foto do seu clássico e visualize, com inteligência artificial, um conceito de restauração ou personalização. Simulação conceitual, sem cadastro.",
};

type Search = { pintura?: string; teto?: string };

export default async function VisionPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const initial = {
    ...(paintOptions.some((o) => o.id === sp.pintura) ? { paint: sp.pintura } : {}),
    ...(roofOptions.some((o) => o.id === sp.teto) ? { roof: sp.teto } : {}),
  };
  return (
    <div className="bg-navy-deep">
      <section className="pt-[calc(var(--nav-h)+4rem)] pb-14">
        <div className="wrap grid gap-10 lg:grid-cols-12 lg:items-end">
          <h1 className="h-page lg:col-span-7">
            Mercantil <span className="text-silver">Vision</span>
          </h1>
          <div className="lg:col-span-5">
            <p className="h-sub font-display">Imagine o próximo capítulo do seu clássico.</p>
            <p className="mt-4 text-silver">
              Envie uma foto, escolha na cartela de cores e veja um conceito gerado por inteligência artificial — sem cadastro.
              A IA preserva o modelo e altera apenas o que você pedir.
            </p>
          </div>
        </div>
      </section>
      <section aria-label="Estúdio de visualização" className="pb-32">
        <div className="wrap">
          <VisionStudio initial={initial} />
        </div>
      </section>
    </div>
  );
}
