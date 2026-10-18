import "server-only";
import { openAIProvider } from "./openai";

/**
 * Image-edit provider contract. The UI and API only talk to this interface, so another provider
 * can be connected by adding a file here and switching VISION_PROVIDER — no UI rebuild.
 */
export interface EditRequest {
  image: Buffer;
  mime: "image/png" | "image/jpeg" | "image/webp";
  width: number;
  height: number;
  prompt: string;
  signal?: AbortSignal;
}

export interface EditResult {
  data: Buffer;
  mime: string;
  model: string;
}

export interface ImageEditProvider {
  name: string;
  configured(): boolean;
  edit(req: EditRequest): Promise<EditResult>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: "config" | "quota" | "rejected" | "timeout" | "upstream",
  ) {
    super(message);
  }
}

export function visionProvider(): ImageEditProvider {
  switch ((process.env.VISION_PROVIDER ?? "openai").toLowerCase()) {
    case "openai":
    default:
      return openAIProvider();
  }
}

export type VisionAvailability =
  | { available: true }
  | { available: false; reason: "disabled" | "not-configured" | "budget" | "quota" };

export function visionAvailability(): VisionAvailability {
  if ((process.env.VISION_ENABLED ?? "true").toLowerCase() === "false") return { available: false, reason: "disabled" };
  if (!visionProvider().configured()) return { available: false, reason: "not-configured" };
  return { available: true };
}
