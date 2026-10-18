import { randomUUID } from "node:crypto";
import { createLead, getVehicle } from "@/lib/repo";
import { ImageError, dataUrlToBuffer, normaliseImage } from "@/lib/images";
import { burstLimit, clientKey } from "@/lib/rate-limit";
import { json, sameOrigin } from "@/lib/request-guard";
import { STORAGE_PENDING_NOTE, storage, storageConfigured } from "@/lib/storage";
import { fieldErrors, leadSchema } from "@/lib/validation";
import { vehicleLabel } from "@/lib/whatsapp";

export const runtime = "nodejs";

/**
 * Interest and evaluation requests. Contact data is stored only with explicit consent; images
 * (Vision original + concept) only with a separate, explicit image consent, and they expire per
 * VISION_RETENTION_DAYS.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Origem não autorizada." }, 403);
  if (!storageConfigured()) return json({ error: STORAGE_PENDING_NOTE, reason: "storage" }, 503);
  const client = await clientKey();
  if (!burstLimit(`lead:${client}`, 5, 10 * 60_000)) {
    return json({ error: "Muitas solicitações em sequência. Tente novamente em alguns minutos." }, 429);
  }

  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 16 * 1024 * 1024) return json({ error: "Solicitação grande demais." }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Não foi possível ler a solicitação." }, 400);
  }

  if (typeof body.company === "string" && body.company.length > 0) return json({ ok: true }); // honeypot: store nothing
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Revise os campos destacados.", fields: fieldErrors(parsed.error) }, 422);
  const input = parsed.data;

  const vehicle = input.vehicleSlug ? await getVehicle(input.vehicleSlug) : null;
  const retentionDays = Math.max(1, Number(process.env.VISION_RETENTION_DAYS ?? 90));
  const images: { original?: string; concept?: string } = {};

  try {
    if (input.journey === "vision" && input.consentImages) {
      const folder = `vision/${randomUUID()}`;
      for (const kind of ["original", "concept"] as const) {
        const src = typeof body[`${kind}Image`] === "string" ? dataUrlToBuffer(body[`${kind}Image`] as string) : null;
        if (!src) continue;
        const img = await normaliseImage(src, { maxSide: 1600, format: "webp", quality: 84 });
        const key = `${folder}/${kind}.webp`;
        await storage().putPrivateFile(key, img.data, img.contentType);
        images[kind] = key;
      }
    }

    const lead = await createLead({
      journey: input.journey,
      name: input.name,
      whatsapp: input.whatsapp,
      email: input.email || undefined,
      vehicleSlug: vehicle?.slug,
      vehicleLabel: vehicle ? vehicleLabel(vehicle) : undefined,
      carMake: input.carMake,
      carModel: input.carModel,
      carYear: input.carYear,
      services: input.services,
      message: input.message,
      visionBrief: input.visionBrief,
      consent: { contact: true, images: !!input.consentImages, at: new Date().toISOString() },
      images: Object.keys(images).length ? images : undefined,
      expiresAt: new Date(Date.now() + retentionDays * 86_400_000).toISOString(),
    });
    return json({ ok: true, id: lead.id });
  } catch (err) {
    if (err instanceof ImageError) return json({ error: err.message }, 422);
    console.error("[leads] failed", err);
    return json({ error: "Não foi possível registrar agora. Tente novamente ou fale pelo WhatsApp." }, 500);
  }
}
