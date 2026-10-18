import "server-only";
import type { EditRequest, EditResult, ImageEditProvider } from "./provider";
import { ProviderError } from "./provider";

/** Picks the output canvas closest to the uploaded photo's orientation. */
function sizeFor(w: number, h: number): string {
  const r = w / h;
  if (r > 1.15) return "1536x1024";
  if (r < 0.87) return "1024x1536";
  return "1024x1024";
}

/**
 * OpenAI Images API (edits endpoint). Requires an API key with API credits — a ChatGPT
 * subscription does not include API usage. The key is read server-side only.
 */
export function openAIProvider(): ImageEditProvider {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
  return {
    name: "openai",
    configured: () => !!key && key.startsWith("sk-"),
    async edit(req: EditRequest): Promise<EditResult> {
      if (!key) throw new ProviderError("Provedor de IA não configurado.", 503, "config");
      const form = new FormData();
      const ext = req.mime.split("/")[1];
      form.append("model", model);
      form.append("image", new Blob([new Uint8Array(req.image)], { type: req.mime }), `carro.${ext}`);
      form.append("prompt", req.prompt);
      form.append("n", "1");
      form.append("size", sizeFor(req.width, req.height));
      form.append("quality", process.env.OPENAI_IMAGE_QUALITY || "medium");
      form.append("output_format", "webp");
      if (process.env.OPENAI_INPUT_FIDELITY) form.append("input_fidelity", process.env.OPENAI_INPUT_FIDELITY);

      let res: Response;
      try {
        res = await fetch("https://api.openai.com/v1/images/edits", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: form,
          signal: req.signal,
        });
      } catch (err) {
        if ((err as Error).name === "AbortError" || (err as Error).name === "TimeoutError") {
          throw new ProviderError("A geração demorou mais que o esperado.", 504, "timeout");
        }
        throw new ProviderError("Não foi possível contatar o provedor de IA.", 502, "upstream");
      }

      const body = (await res.json().catch(() => null)) as
        | { data?: { b64_json?: string }[]; error?: { message?: string; code?: string; type?: string } }
        | null;

      if (!res.ok) {
        const code = body?.error?.code ?? "";
        console.error("[vision/openai]", res.status, code, body?.error?.message);
        if (res.status === 401 || res.status === 403) throw new ProviderError("Credencial do provedor de IA inválida.", 503, "config");
        if (res.status === 429 || code === "insufficient_quota" || code === "billing_hard_limit_reached") {
          throw new ProviderError("Limite do provedor de IA atingido no momento.", 503, "quota");
        }
        if (res.status === 400 && (code === "moderation_blocked" || /safety|moderation/i.test(body?.error?.message ?? ""))) {
          throw new ProviderError("A imagem ou o pedido não pôde ser processado pelas regras de segurança do provedor.", 422, "rejected");
        }
        throw new ProviderError("O provedor de IA não conseguiu gerar a imagem.", 502, "upstream");
      }

      const b64 = body?.data?.[0]?.b64_json;
      if (!b64) throw new ProviderError("O provedor de IA não retornou imagem.", 502, "upstream");
      return { data: Buffer.from(b64, "base64"), mime: "image/webp", model };
    },
  };
}
