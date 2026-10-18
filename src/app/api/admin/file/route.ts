import { isAdmin } from "@/lib/auth";
import { safeKey, storage } from "@/lib/storage";

export const runtime = "nodejs";

/** Private files (visitor uploads) are only readable by an authenticated admin. */
export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("Não autorizado", { status: 401 });
  const key = new URL(req.url).searchParams.get("key") ?? "";
  try {
    safeKey(key);
  } catch {
    return new Response("Chave inválida", { status: 400 });
  }
  if (!key.startsWith("vision/")) return new Response("Não encontrado", { status: 404 });
  const file = await storage().getPrivateFile(key);
  if (!file) return new Response("Não encontrado", { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: { "content-type": file.contentType, "cache-control": "private, no-store", "x-robots-tag": "noindex" },
  });
}
