import "server-only";
import { randomUUID } from "node:crypto";
import { seedServices, seedSettings } from "@/content/site";
import type { Service, SiteSettings, Vehicle } from "@/content/types";
import { seedVehicles } from "@/content/vehicles";
import { storage } from "./storage";

/**
 * Data access. Seed content is the fallback; anything the owner saves in the admin panel
 * is read from storage first. A storage failure never takes the public site down.
 */
async function safeGet<T>(key: string): Promise<T | null> {
  try {
    return await storage().getJSON<T>(key);
  } catch (err) {
    console.error(`[repo] read failed for ${key}`, err);
    return null;
  }
}

export async function getVehicles(): Promise<Vehicle[]> {
  const stored = await safeGet<Vehicle[]>("vehicles.json");
  return [...(stored ?? seedVehicles)].sort((a, b) => a.order - b.order);
}

export async function getVehicle(slug: string): Promise<Vehicle | null> {
  return (await getVehicles()).find((v) => v.slug === slug) ?? null;
}

export async function saveVehicles(list: Vehicle[]): Promise<void> {
  await storage().putJSON("vehicles.json", list);
}

export async function getSettings(): Promise<SiteSettings> {
  return { ...seedSettings, ...((await safeGet<SiteSettings>("settings.json")) ?? {}) };
}

export async function saveSettings(s: SiteSettings): Promise<void> {
  await storage().putJSON("settings.json", s);
}

export async function getServices(): Promise<Service[]> {
  return (await safeGet<Service[]>("services.json")) ?? seedServices;
}

export async function saveServices(list: Service[]): Promise<void> {
  await storage().putJSON("services.json", list);
}

/* ── Leads (interest and evaluation requests) ─────────────────────────── */

export type Journey = "compra" | "restauracao" | "vision";
export type LeadStatus = "novo" | "em-contato" | "arquivado";

export interface Lead {
  id: string;
  createdAt: string;
  journey: Journey;
  name: string;
  whatsapp: string;
  email?: string;
  vehicleSlug?: string;
  vehicleLabel?: string;
  carMake?: string;
  carModel?: string;
  carYear?: string;
  services?: string[];
  message: string;
  visionBrief?: string;
  consent: { contact: boolean; images: boolean; at: string };
  images?: { original?: string; concept?: string };
  status: LeadStatus;
  /** Images (and the lead) are purged after this date, per retention policy. */
  expiresAt?: string;
}

export async function createLead(input: Omit<Lead, "id" | "createdAt" | "status">): Promise<Lead> {
  const lead: Lead = { ...input, id: randomUUID(), createdAt: new Date().toISOString(), status: "novo" };
  await storage().putJSON(`leads/${lead.id}.json`, lead);
  return lead;
}

export async function listLeads(): Promise<Lead[]> {
  const keys = await storage().list("leads");
  const leads = await Promise.all(keys.map((k) => safeGet<Lead>(k)));
  return leads.filter((l): l is Lead => !!l).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getLead(id: string): Promise<Lead | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  return safeGet<Lead>(`leads/${id}.json`);
}

export async function updateLead(lead: Lead): Promise<void> {
  await storage().putJSON(`leads/${lead.id}.json`, lead);
}

export async function deleteLead(lead: Lead): Promise<void> {
  const s = storage();
  if (lead.images?.original) await s.delete(lead.images.original);
  if (lead.images?.concept) await s.delete(lead.images.concept);
  await s.delete(`leads/${lead.id}.json`);
}

/** Removes leads whose retention window has passed. Returns how many were deleted. */
export async function purgeExpiredLeads(now = new Date()): Promise<number> {
  const leads = await listLeads();
  const expired = leads.filter((l) => l.expiresAt && new Date(l.expiresAt) < now);
  await Promise.all(expired.map(deleteLead));
  return expired.length;
}
