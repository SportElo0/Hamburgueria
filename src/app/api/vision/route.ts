import { buildVisionPrompt, defaultChoice, isValidChoice, type VisionChoice } from "@/content/vision-options";
import { ImageError, maxUploadBytes, normaliseImage } from "@/lib/images";
import { burstLimit, clientKey, readVisionUsage, recordVisionUse } from "@/lib/rate-limit";
import { json, sameOrigin } from "@/lib/request-guard";
import { storageConfigured } from "@/lib/storage";
import { ProviderError, visionAvailability, visionProvider } from "@/lib/vision/provider";

export const runtime = "nodejs";
export const maxDuration = 120;

const reasonText = {
  disabled: "A geração de imagens está pausada pela Mercantil.",
  "not-configured": "A geração de imagens ainda não foi ativada neste site.",
  budget: "O limite diário de simulações do site foi atingido. Volte amanhã.",
  quota: "Você atingiu o limite de simulações de hoje.",
} as const;

/** Availability + the caller's remaining quota. Never reveals configuration details. */
export async function GET() {
  const avail = visionAvailability();
  const client = await clientKey();
  const usage = await readVisionUsage(client).catch(() => null);
  const maxMb = Math.round(maxUploadBytes() / 1024 / 1024);
  const leadsEnabled = storageConfigured();
  if (!avail.available) return json({ available: false, reason: avail.reason, message: reasonText[avail.reason], maxMb, leadsEnabled });
  if (usage?.budgetExhausted) return json({ available: false, reason: "budget", message: reasonText.budget, maxMb, leadsEnabled });
  return json({ available: true, remaining: usage?.remaining ?? 0, perClient: usage?.perClient ?? 0, maxMb, leadsEnabled });
}

/**
 * Generates a concept from the visitor's photo. The photo is validated (magic bytes, size,
 * dimensions), re-encoded without metadata, sent to the provider and never stored here.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Origem não autorizada." }, 403);

  const avail = visionAvailability();
  if (!avail.available) return json({ error: reasonText[avail.reason], reason: avail.reason }, 503);

  const client = await clientKey();
  if (!burstLimit(`vision:${client}`, 2, 60_000)) {
    return json({ error: "Aguarde um minuto antes de gerar outra simulação." }, 429);
  }
  const usage = await readVisionUsage(client);
  if (usage.budgetExhausted) return json({ error: reasonText.budget, reason: "budget" }, 429);
  if (usage.remaining <= 0) return json({ error: reasonText.quota, reason: "quota" }, 429);

  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > maxUploadBytes() + 64 * 1024) return json({ error: "A imagem é grande demais." }, 413);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ error: "Não foi possível ler o envio." }, 400);
  }
  if (form.get("company")) return json({ error: "Envio inválido." }, 400); // honeypot

  const file = form.get("image");
  if (!(file instanceof File)) return json({ error: "Envie a fotografia do carro." }, 422);

  let choice: VisionChoice;
  try {
    choice = { ...defaultChoice, ...JSON.parse(String(form.get("choice") ?? "{}")) };
  } catch {
    return json({ error: "Preferências inválidas." }, 422);
  }
  if (!isValidChoice(choice)) return json({ error: "Preferências inválidas." }, 422);

  try {
    const img = await normaliseImage(Buffer.from(await file.arrayBuffer()), { maxSide: 1536, format: "png" });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 110_000);
    const started = Date.now();
    const result = await visionProvider()
      .edit({ image: img.data, mime: "image/png", width: img.width, height: img.height, prompt: buildVisionPrompt(choice), signal: controller.signal })
      .finally(() => clearTimeout(timer));
    await recordVisionUse(client);
    return json({
      image: `data:${result.mime};base64,${result.data.toString("base64")}`,
      remaining: Math.max(0, usage.remaining - 1),
      seconds: Math.round((Date.now() - started) / 1000),
    });
  } catch (err) {
    if (err instanceof ImageError) return json({ error: err.message }, 422);
    if (err instanceof ProviderError) return json({ error: err.message, reason: err.code }, err.status);
    console.error("[vision] failed", err);
    return json({ error: "Não foi possível gerar a simulação agora. Tente novamente." }, 500);
  }
}
