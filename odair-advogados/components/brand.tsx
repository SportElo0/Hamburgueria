import Image from "next/image";
import { brand, site } from "@/config/site";

type Tone = "gold" | "navy";

/** Monograma recortado do logotipo enviado (sem redesenho). */
export function Monogram({ tone = "gold", className = "", priority = false, sizes = "64px" }: { tone?: Tone; className?: string; priority?: boolean; sizes?: string }) {
  return (
    <Image
      src={brand.monogram[tone]}
      width={brand.monogram.width}
      height={brand.monogram.height}
      alt=""
      sizes={sizes}
      priority={priority}
      className={`h-auto ${className}`}
    />
  );
}

/** Monograma + nome, como no logotipo, em tamanho de cabeçalho. */
export function Signature({ tone = "gold", compact = false, priority = false }: { tone?: Tone; compact?: boolean; priority?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <Monogram tone={tone} priority={priority} className="w-[2.35rem] sm:w-[2.6rem]" sizes="48px" />
      <Image
        src={brand.name[tone]}
        width={brand.name.width}
        height={brand.name.height}
        alt={site.name}
        sizes="220px"
        priority={priority}
        className={`h-auto ${compact ? "w-[9.5rem]" : "w-[10.5rem] sm:w-[12.75rem]"}`}
      />
    </span>
  );
}

/** Assinatura completa do logotipo (rodapé e páginas internas). */
export function Lockup({ tone = "gold", className = "" }: { tone?: Tone; className?: string }) {
  return (
    <Image
      src={brand.lockup[tone]}
      width={brand.lockup.width}
      height={brand.lockup.height}
      alt={site.name}
      sizes="(min-width: 1024px) 420px, 80vw"
      className={`h-auto ${className}`}
    />
  );
}
