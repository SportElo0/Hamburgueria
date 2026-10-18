import { safeKey, storage } from "@/lib/storage";

export const runtime = "nodejs";

/** Serves public files written by the local filesystem driver (vehicle photos uploaded in admin). */
export async function GET(_: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join("/");
  try {
    safeKey(key);
  } catch {
    return new Response("Não encontrado", { status: 404 });
  }
  if (!key.startsWith("vehicles/")) return new Response("Não encontrado", { status: 404 });
  const file = await storage().getPublicFile?.(key);
  if (!file) return new Response("Não encontrado", { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: { "content-type": file.contentType, "cache-control": "public, max-age=31536000, immutable" },
  });
}
