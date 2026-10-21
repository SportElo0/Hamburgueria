import Image from "next/image";
import { Camera } from "lucide-react";
import type { Photo } from "@/config/site";

type Props = {
  photo: Photo;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Mostra a etiqueta de placeholder (desligue em miniaturas muito pequenas). */
  label?: boolean;
  /** Degraus no placeholder; desligue quando o contexto já desenha as faixas. */
  bands?: boolean;
  fit?: "cover" | "contain";
  /** Desloca os degraus do placeholder (0–3) para variar o tom entre fotos vizinhas. */
  shade?: number;
};

const placeholderTones = ["bg-fade-1", "bg-fade-2", "bg-fade-3", "bg-fade-4", "bg-fade-5"];

/**
 * Foto real quando `photo.src` existe; caso contrário, um placeholder em degraus
 * claramente marcado como temporário.
 */
export function PhotoSlot({
  photo,
  sizes,
  priority = false,
  className = "",
  label = true,
  bands = true,
  fit = "cover",
  shade = 0,
}: Props) {
  if (photo.src) {
    return (
      <div className={`relative overflow-hidden bg-fade-3 ${className}`}>
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={sizes}
          priority={priority}
          className={fit === "cover" ? "object-cover" : "object-contain"}
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={`Foto temporária: ${photo.alt}`}
      className={`relative overflow-hidden bg-fade-2 ${className}`}
    >
      {bands && (
        <div aria-hidden className="absolute inset-0 flex flex-col">
          {[3, 2, 1, 0].map((step, i) => (
            <span
              key={step}
              className={`${i === 0 ? "flex-[3]" : "flex-[2]"} ${
                placeholderTones[Math.min(step + shade, placeholderTones.length - 1)]
              }`}
            />
          ))}
        </div>
      )}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(115deg,#f5f2ed_0_1px,transparent_1px_9px)]"
      />
      {label && (
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3 sm:p-4"
        >
          <span className="flex min-w-0 items-center gap-2 text-steel">
            <Camera size={15} strokeWidth={1.8} className="flex-none" />
            <span className="truncate text-xs font-semibold">{photo.caption}</span>
          </span>
          <span className="guard flex-none rounded-[2px] border border-line-strong px-1.5 py-1 text-[0.62rem] text-steel">
            FOTO TEMPORÁRIA
          </span>
        </div>
      )}
    </div>
  );
}
