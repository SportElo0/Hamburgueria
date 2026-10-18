import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { storage } from "./storage";

/** Client IP from proxy headers, hashed so raw addresses are never stored. */
export async function clientKey(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${ip}|${process.env.SESSION_SECRET ?? "mercantil"}`).digest("hex").slice(0, 24);
}

const memory = new Map<string, number[]>();

/** Sliding-window limiter held in memory (per instance). Good enough for bursts and form spam. */
export function burstLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (memory.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    memory.set(key, hits);
    return false;
  }
  hits.push(now);
  memory.set(key, hits);
  if (memory.size > 5000) memory.clear();
  return true;
}

const today = () => new Date().toISOString().slice(0, 10);

interface DailyUsage {
  total: number;
  byClient: Record<string, number>;
}

/**
 * Persistent daily counters for AI generation: per-client quota and a global budget that caps spend
 * across all instances. Returns remaining generations for the client.
 */
export async function readVisionUsage(client: string) {
  const usage = (await storage().getJSON<DailyUsage>(`usage/vision-${today()}.json`).catch(() => null)) ?? { total: 0, byClient: {} };
  const perClient = Number(process.env.VISION_PER_IP_DAILY ?? 3);
  const budget = Number(process.env.VISION_DAILY_BUDGET ?? 60);
  const used = usage.byClient[client] ?? 0;
  return {
    usage,
    perClient,
    budget,
    remaining: Math.max(0, Math.min(perClient - used, budget - usage.total)),
    budgetExhausted: usage.total >= budget,
  };
}

export async function recordVisionUse(client: string): Promise<void> {
  const key = `usage/vision-${today()}.json`;
  const usage = (await storage().getJSON<DailyUsage>(key).catch(() => null)) ?? { total: 0, byClient: {} };
  usage.total += 1;
  usage.byClient[client] = (usage.byClient[client] ?? 0) + 1;
  await storage().putJSON(key, usage);
}
