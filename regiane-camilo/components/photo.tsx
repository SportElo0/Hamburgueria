import Image from "next/image";
import type { Photo as PhotoData } from "@/config/site";

type Props = {
  photo: PhotoData;
  sizes: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  /** "detail" usa o recorte ampliado definido na configuração da foto. */
  crop?: "full" | "detail";
};

/** Foto real da confeitaria, sempre com enquadramento vindo da configuração. */
export function Photo({ photo, sizes, className = "", imgClassName = "", priority, crop = "full" }: Props) {
  const detail = crop === "detail" ? photo.detail : undefined;
  return (
    <div className={`relative overflow-hidden bg-blush ${className}`}>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover ${imgClassName}`}
        style={{
          objectPosition: detail?.focus ?? photo.focus ?? "50% 50%",
          // transform (e não scale) para somar com o zoom de hover das classes.
          ...(detail ? { transform: `scale(${detail.zoom})`, transformOrigin: detail.focus } : {}),
        }}
      />
    </div>
  );
}
