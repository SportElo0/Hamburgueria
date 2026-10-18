import "server-only";
import sharp from "sharp";

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function maxUploadBytes(): number {
  return Math.max(1, Number(process.env.VISION_MAX_UPLOAD_MB ?? 8)) * 1024 * 1024;
}

/** Magic-byte sniffing; the declared MIME type alone is never trusted. */
export function sniffImageType(buf: Buffer): (typeof ACCEPTED_TYPES)[number] | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

export class ImageError extends Error {}

/**
 * Validates an uploaded image and re-encodes it: EXIF (including GPS) stripped, orientation applied,
 * longest side capped. Returns a normalised buffer.
 */
export async function normaliseImage(
  buf: Buffer,
  opts: { maxSide: number; format: "png" | "webp" | "jpeg"; quality?: number },
): Promise<{ data: Buffer; width: number; height: number; contentType: string }> {
  if (buf.length > maxUploadBytes()) {
    throw new ImageError(`A imagem excede ${process.env.VISION_MAX_UPLOAD_MB ?? 8} MB.`);
  }
  if (!sniffImageType(buf)) throw new ImageError("Formato não aceito. Envie JPG, PNG ou WEBP.");
  let img = sharp(buf, { failOn: "error", limitInputPixels: 50_000_000 }).rotate();
  const meta = await img.metadata().catch(() => null);
  if (!meta?.width || !meta.height) throw new ImageError("Não foi possível ler a imagem enviada.");
  if (Math.min(meta.width, meta.height) < 320) throw new ImageError("A imagem é pequena demais. Envie uma foto com pelo menos 320 px no menor lado.");
  img = img.resize({ width: opts.maxSide, height: opts.maxSide, fit: "inside", withoutEnlargement: true });
  const q = opts.quality ?? 86;
  const out =
    opts.format === "png" ? img.png({ compressionLevel: 8 }) : opts.format === "webp" ? img.webp({ quality: q }) : img.jpeg({ quality: q, mozjpeg: true });
  const { data, info } = await out.toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, contentType: `image/${opts.format}` };
}

export function dataUrlToBuffer(dataUrl: string): Buffer | null {
  const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  return m ? Buffer.from(m[2], "base64") : null;
}
