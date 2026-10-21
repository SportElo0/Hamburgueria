import Image from "next/image";
import { Camera } from "lucide-react";
import type { Photo } from "@/config/site";

type Props = {
  photo: Photo;
  sizes: string;
  priority?: boolean;
  /** Classes do contêiner (posição, proporção, cantos). */
  className?: string;
  /** Classes da imagem (ex.: zoom no hover do grupo). */
  imgClassName?: string;
  fit?: "cover" | "contain";
};

/**
 * Foto real quando `photo.src` existe. Sem arquivo, mostra um espaço neutro
 * identificado como temporário, para nunca parecer imagem quebrada.
 */
export function PhotoSlot({
  photo,
  sizes,
  priority = false,
  className = "",
  imgClassName = "",
  fit = "cover",
}: Props) {
  if (photo.src) {
    return (
      <div className={`relative overflow-hidden bg-sand ${className}`}>
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={85}
          style={{ objectPosition: photo.focus ?? "50% 50%" }}
          className={`${fit === "cover" ? "object-cover" : "object-contain"} ${imgClassName}`}
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={`Foto temporária: ${photo.alt}`}
      className={`relative grid place-items-center overflow-hidden border border-line bg-sand ${className}`}
    >
      <span className="flex flex-col items-center gap-2 px-4 text-center text-muted">
        <Camera size={22} strokeWidth={1.25} className="text-champagne" />
        <span className="text-sm">{photo.caption}</span>
        <span className="text-xs tracking-[0.12em] uppercase">Foto em breve</span>
      </span>
    </div>
  );
}
