import { timingSafeEqual } from "node:crypto";
import { purgeExpiredLeads } from "@/lib/repo";

export const runtime = "nodejs";

/** Scheduled retention cleanup. Call with `Authorization: Bearer $CRON_SECRET` (Vercel Cron sends this). */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const got = req.headers.get("authorization") ?? "";
  const want = `Bearer ${secret}`;
  if (!secret || got.length !== want.length || !timingSafeEqual(Buffer.from(got), Buffer.from(want))) {
    return new Response("Não autorizado", { status: 401 });
  }
  const removed = await purgeExpiredLeads();
  return Response.json({ removed });
}
