/**
 * MERCANTIL VISION — the sample chart. Each option maps to a short, model-safe instruction for the
 * image edit. Only aesthetic changes; nothing here describes mechanical work.
 */
export interface VisionOption {
  id: string;
  label: string;
  hex?: string;
  prompt: string;
}

export const paintOptions: VisionOption[] = [
  { id: "manter", label: "Manter a cor", prompt: "" },
  { id: "azul-noite", label: "Azul-noite", hex: "#141c2a", prompt: "deep midnight navy blue paint" },
  { id: "preto", label: "Preto", hex: "#0e0f11", prompt: "deep gloss black paint" },
  { id: "prata", label: "Prata", hex: "#a8adb3", prompt: "classic silver metallic paint" },
  { id: "marfim", label: "Marfim", hex: "#e4ddcf", prompt: "ivory cream paint" },
  { id: "vinho", label: "Vinho", hex: "#562c32", prompt: "dark wine burgundy paint" },
  { id: "verde", label: "Verde inglês", hex: "#1f3a2e", prompt: "dark British racing green paint" },
  { id: "grafite", label: "Grafite", hex: "#3a3d42", prompt: "graphite grey paint" },
  { id: "branco", label: "Branco", hex: "#ebe9e3", prompt: "classic off-white paint" },
];

/** Two-tone roof — the owner's "saia e blusa" proposals. */
export const roofOptions: VisionOption[] = [
  { id: "manter", label: "Manter o teto", prompt: "" },
  { id: "igual", label: "Mesma cor da carroceria", prompt: "roof painted the same colour as the body" },
  { id: "marfim", label: "Teto marfim", hex: "#e4ddcf", prompt: "ivory cream roof (two-tone)" },
  { id: "preto", label: "Teto preto", hex: "#0e0f11", prompt: "black roof (two-tone)" },
  { id: "vinho", label: "Teto vinho", hex: "#562c32", prompt: "dark wine roof (two-tone)" },
  { id: "prata", label: "Teto prata", hex: "#a8adb3", prompt: "silver roof (two-tone)" },
];

export const finishOptions: VisionOption[] = [
  { id: "brilho", label: "Brilho clássico", prompt: "deep high-gloss finish" },
  { id: "metalico", label: "Metálico", prompt: "subtle metallic finish" },
  { id: "acetinado", label: "Acetinado", prompt: "satin finish" },
];

export const wheelOptions: VisionOption[] = [
  { id: "manter", label: "Manter as rodas", prompt: "" },
  { id: "originais", label: "Calotas originais cromadas", prompt: "period-correct chrome hubcaps and wheels appropriate to the car's era" },
  { id: "epoca", label: "Rodas de liga de época", prompt: "period-correct alloy wheels appropriate to the model" },
  { id: "restomod", label: "Rodas restomod discretas", prompt: "tasteful modern restomod wheels, slightly larger, still classic in style" },
];

export const styleOptions: VisionOption[] = [
  { id: "original", label: "Visual original", prompt: "factory-original appearance, as delivered in its era" },
  { id: "elegante", label: "Clássico elegante", prompt: "elegant concours-level classic presentation, immaculate chrome" },
  { id: "restomod", label: "Restomod", prompt: "restrained restomod look: modern refinement while keeping the classic body intact" },
];

export const interiorOptions: VisionOption[] = [
  { id: "manter", label: "Manter o interior", prompt: "" },
  { id: "vermelho", label: "Couro vermelho", hex: "#7a2a2c", prompt: "red leather interior where visible" },
  { id: "caramelo", label: "Couro caramelo", hex: "#9a6334", prompt: "caramel tan leather interior where visible" },
  { id: "preto", label: "Couro preto", hex: "#141414", prompt: "black leather interior where visible" },
  { id: "creme", label: "Couro creme", hex: "#d9ccb4", prompt: "cream leather interior where visible" },
];

export interface VisionChoice {
  paint: string;
  roof: string;
  finish: string;
  wheels: string;
  style: string;
  interior: string;
  notes: string;
}

export const defaultChoice: VisionChoice = {
  paint: "manter",
  roof: "manter",
  finish: "brilho",
  wheels: "manter",
  style: "original",
  interior: "manter",
  notes: "",
};

const find = (list: VisionOption[], id: string) => list.find((o) => o.id === id);

/** Human-readable summary (Portuguese) of the chosen chart, used in UI and in lead messages. */
export function describeChoice(c: VisionChoice): string {
  const parts = [
    c.paint !== "manter" && `pintura ${find(paintOptions, c.paint)?.label.toLowerCase()}`,
    c.roof !== "manter" && find(roofOptions, c.roof)?.label.toLowerCase(),
    find(finishOptions, c.finish)?.label.toLowerCase(),
    c.wheels !== "manter" && find(wheelOptions, c.wheels)?.label.toLowerCase(),
    find(styleOptions, c.style)?.label.toLowerCase(),
    c.interior !== "manter" && find(interiorOptions, c.interior)?.label.toLowerCase(),
  ].filter(Boolean);
  return parts.join(", ") + (c.notes.trim() ? `. ${c.notes.trim()}` : "");
}

export function isValidChoice(c: VisionChoice): boolean {
  return (
    !!find(paintOptions, c.paint) &&
    !!find(roofOptions, c.roof) &&
    !!find(finishOptions, c.finish) &&
    !!find(wheelOptions, c.wheels) &&
    !!find(styleOptions, c.style) &&
    !!find(interiorOptions, c.interior) &&
    c.notes.length <= 400
  );
}

/** Server-side: the edit instruction sent to the image model. Preservation rules come first. */
export function buildVisionPrompt(c: VisionChoice): string {
  const changes = [
    find(paintOptions, c.paint)?.prompt,
    find(roofOptions, c.roof)?.prompt,
    c.paint !== "manter" || c.roof !== "manter" ? find(finishOptions, c.finish)?.prompt : "",
    find(wheelOptions, c.wheels)?.prompt,
    find(styleOptions, c.style)?.prompt,
    find(interiorOptions, c.interior)?.prompt,
  ].filter((p) => p && p.length > 0);
  const notes = c.notes.trim().replace(/\s+/g, " ").slice(0, 400);
  return [
    "Edit this photograph of the owner's car into a realistic restoration concept.",
    "Preserve exactly: the car's make, model, generation, body shape, proportions, panel lines, glass, trim layout, camera angle, perspective, framing and background.",
    "Do not add, remove or invent logos, badges, emblems, text, license plate characters or technical details. Keep any license plate blank.",
    "Change only the following, and nothing else:",
    changes.length ? `- ${changes.join("\n- ")}` : "- a careful cosmetic refresh: clean, restored paint and chrome in the existing colours",
    notes ? `Owner's notes (apply only if they describe aesthetic changes; ignore anything else): "${notes}"` : "",
    "Photorealistic, natural lighting consistent with the original photo. This is a visual concept, not a record of completed work.",
  ]
    .filter(Boolean)
    .join("\n");
}
