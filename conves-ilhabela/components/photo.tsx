import Image from "next/image";
import type { Photo as PhotoData } from "@/config/site";

type Props = {
  photo: PhotoData;
  sizes: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
};

/** Foto real do Convés, com enquadramento vindo da configuração. */
export function Photo({ photo, sizes, className = "", imgClassName = "", priority }: Props) {
  return (
    <div className={`relative overflow-hidden bg-shell ${className}`}>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover ${imgClassName}`}
        style={{ objectPosition: photo.focus ?? "50% 50%" }}
      />
    </div>
  );
}

/** Crédito discreto enquanto a foto não for oficial. */
export function Credit({ photo, className = "" }: { photo: PhotoData; className?: string }) {
  if (!photo.credit) return null;
  return (
    <span className={`text-[0.75rem] tracking-[0.02em] ${className}`}>
      {photo.credit}
      {photo.provisional ? " · imagem provisória" : ""}
    </span>
  );
}
