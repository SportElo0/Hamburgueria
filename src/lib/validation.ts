import { z } from "zod";

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[^\d+]/g, ""))
  .refine((v) => v.replace(/\D/g, "").length >= 10 && v.replace(/\D/g, "").length <= 15, {
    message: "Informe um WhatsApp com DDD, por exemplo (11) 91234-5678.",
  });

export const leadSchema = z
  .object({
    journey: z.enum(["compra", "restauracao", "vision"]),
    name: z.string().trim().min(2, "Informe seu nome.").max(80),
    whatsapp: phone,
    email: z.union([z.literal(""), z.string().trim().email("E-mail inválido.").max(120)]).optional(),
    vehicleSlug: z.string().max(80).optional(),
    carMake: z.string().trim().max(60).optional(),
    carModel: z.string().trim().max(80).optional(),
    carYear: z.string().trim().max(20).optional(),
    services: z.array(z.string().max(60)).max(8).optional(),
    message: z.string().trim().max(1500).default(""),
    visionBrief: z.string().max(600).optional(),
    consentContact: z.literal(true, { message: "É preciso autorizar o contato para enviar." }),
    consentImages: z.boolean().default(false),
    /** Honeypot: humans never fill it; the route answers bots with a silent success. */
    company: z.string().max(200).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.journey !== "compra" && !v.carModel) {
      ctx.addIssue({ code: "custom", path: ["carModel"], message: "Informe o modelo do carro." });
    }
  });

export type LeadInput = z.infer<typeof leadSchema>;

export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const k = String(issue.path[0] ?? "form");
    if (!out[k]) out[k] = issue.message;
  }
  return out;
}
