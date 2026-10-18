"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { workTrack } from "@/content/site";
import type { CommercialStatus, Photo, Service, SiteSettings, Spec, Vehicle, WorkStage } from "@/content/types";
import { endSession, passwordMatches, requireAdmin, startSession } from "@/lib/auth";
import { ImageError, normaliseImage } from "@/lib/images";
import { burstLimit, clientKey } from "@/lib/rate-limit";
import {
  deleteLead,
  getLead,
  getServices,
  getVehicles,
  purgeExpiredLeads,
  saveServices,
  saveSettings,
  saveVehicles,
  updateLead,
  type LeadStatus,
} from "@/lib/repo";
import { storage } from "@/lib/storage";

export type ActionState = { ok?: string; error?: string } | null;

const str = (fd: FormData, k: string, max = 400) => String(fd.get(k) ?? "").trim().slice(0, max);

function revalidateSite() {
  revalidatePath("/", "layout");
}

/* ── Session ─────────────────────────────────────────────────────────── */

export async function login(_: ActionState, fd: FormData): Promise<ActionState> {
  const client = await clientKey();
  if (!burstLimit(`login:${client}`, 5, 15 * 60_000)) {
    return { error: "Muitas tentativas. Aguarde 15 minutos." };
  }
  if (!passwordMatches(String(fd.get("password") ?? ""))) {
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Senha incorreta." };
  }
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

/* ── Vehicles ────────────────────────────────────────────────────────── */

/** "Rótulo: valor" per line → Spec[] */
function parseSpecs(text: string): Spec[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 30)
    .map((l) => {
      const i = l.indexOf(":");
      return i > 0 ? { label: l.slice(0, i).trim().slice(0, 80), value: l.slice(i + 1).trim().slice(0, 240) } : { label: l.slice(0, 80), value: "" };
    });
}

/** "data | título | nota" per line */
function parseHistory(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 40)
    .map((l) => {
      const [date, title, note] = l.split("|").map((p) => p.trim());
      return title ? { date: date || undefined, title: title.slice(0, 120), note: note?.slice(0, 400) || undefined } : { title: (date ?? "").slice(0, 120) };
    });
}

const stages: WorkStage[] = ["a-confirmar", ...workTrack];
const commercial: CommercialStatus[] = ["a-confirmar", "venda-prevista", "disponivel", "reservado", "vendido", "acervo"];
const hex = (v: string, fallback: string) => (/^#[0-9a-f]{6}$/i.test(v) ? v : fallback);

export async function saveVehicle(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const slug = str(fd, "slug", 80);
  const list = await getVehicles();
  const idx = list.findIndex((v) => v.slug === slug);
  if (idx < 0) return { error: "Veículo não encontrado." };
  const cur = list[idx];
  const stage = str(fd, "workStage") as WorkStage;
  const status = str(fd, "commercialStatus") as CommercialStatus;
  const amount = Number(str(fd, "priceAmount").replace(/\D/g, ""));
  const roofName = str(fd, "roofName", 60);
  const interiorName = str(fd, "interiorName", 60);
  const next: Vehicle = {
    ...cur,
    model: str(fd, "model", 80) || cur.model,
    chassis: str(fd, "chassis", 20) || cur.chassis,
    nickname: str(fd, "nickname", 40) || undefined,
    body: str(fd, "body", 40) || cur.body,
    yearLabel: str(fd, "yearLabel", 40) || cur.yearLabel,
    yearConfirmed: fd.get("yearConfirmed") === "on",
    decade: Number(str(fd, "decade")) || cur.decade,
    color: { name: str(fd, "colorName", 60) || cur.color.name, hex: hex(str(fd, "colorHex"), cur.color.hex) },
    roof: roofName ? { name: roofName, hex: hex(str(fd, "roofHex"), cur.roof?.hex ?? "#e4ddcf") } : undefined,
    interior: interiorName ? { name: interiorName, hex: hex(str(fd, "interiorHex"), cur.interior?.hex ?? "#7a2a2c") } : undefined,
    workStage: stages.includes(stage) ? stage : cur.workStage,
    workNote: str(fd, "workNote", 300) || undefined,
    commercialStatus: commercial.includes(status) ? status : cur.commercialStatus,
    price: { authorised: fd.get("priceAuthorised") === "on" && amount > 0, amount: amount > 0 ? amount : undefined },
    summary: str(fd, "summary", 400) || cur.summary,
    vehicleFacts: parseSpecs(str(fd, "vehicleFacts", 4000)),
    modelReference: parseSpecs(str(fd, "modelReference", 4000)),
    history: parseHistory(str(fd, "history", 6000)),
    notes: str(fd, "notes", 1000) || undefined,
    featured: fd.get("featured") === "on",
    order: Number(str(fd, "order")) || cur.order,
  };
  list[idx] = next;
  if (next.featured) list.forEach((v, i) => i !== idx && (v.featured = false));
  await saveVehicles(list);
  revalidateSite();
  return { ok: "Alterações salvas e publicadas." };
}

export async function uploadVehiclePhoto(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const slug = str(fd, "slug", 80);
  const file = fd.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Escolha uma fotografia." };
  const alt = str(fd, "alt", 200);
  if (alt.length < 8) return { error: "Descreva a foto (texto alternativo) com pelo menos 8 caracteres." };
  const kind = str(fd, "kind") === "concept" ? "concept" : "real";
  const list = await getVehicles();
  const v = list.find((x) => x.slug === slug);
  if (!v) return { error: "Veículo não encontrado." };
  try {
    const img = await normaliseImage(Buffer.from(await file.arrayBuffer()), { maxSide: 2400, format: "webp", quality: 86 });
    const url = await storage().putPublicFile(`vehicles/${slug}/${randomUUID()}.webp`, img.data, img.contentType);
    const photo: Photo = {
      src: url,
      alt,
      kind,
      caption: str(fd, "caption", 160) || (kind === "real" ? "Fotografia real" : "Ilustração conceitual · não é fotografia"),
      width: img.width,
      height: img.height,
    };
    v.photos = [...v.photos, photo];
    await saveVehicles(list);
    revalidateSite();
    return { ok: "Fotografia publicada." };
  } catch (err) {
    if (err instanceof ImageError) return { error: err.message };
    console.error("[admin] upload failed", err);
    return { error: "Não foi possível enviar a foto." };
  }
}

export async function editPhoto(fd: FormData) {
  await requireAdmin();
  const slug = str(fd, "slug", 80);
  const src = str(fd, "src", 600);
  const op = str(fd, "op");
  const list = await getVehicles();
  const v = list.find((x) => x.slug === slug);
  if (!v) return;
  const i = v.photos.findIndex((p) => p.src === src);
  if (i < 0) return;
  if (op === "delete") {
    const [removed] = v.photos.splice(i, 1);
    const key = removed.src.startsWith("/files/")
      ? removed.src.slice("/files/".length)
      : removed.src.startsWith("https://")
        ? new URL(removed.src).pathname.replace(/^\/public\//, "")
        : null; // seed photos in /public/media are never deleted
    if (key) await storage().delete(key).catch(() => undefined);
  } else if (op === "up" && i > 0) {
    [v.photos[i - 1], v.photos[i]] = [v.photos[i], v.photos[i - 1]];
  } else if (op === "down" && i < v.photos.length - 1) {
    [v.photos[i + 1], v.photos[i]] = [v.photos[i], v.photos[i + 1]];
  } else if (op === "meta") {
    v.photos[i] = {
      ...v.photos[i],
      alt: str(fd, "alt", 200) || v.photos[i].alt,
      caption: str(fd, "caption", 160) || v.photos[i].caption,
      kind: str(fd, "kind") === "concept" ? "concept" : "real",
    };
  }
  await saveVehicles(list);
  revalidateSite();
}

/* ── Settings & services ─────────────────────────────────────────────── */

export async function saveSiteSettings(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const whatsapp = str(fd, "whatsapp", 30).replace(/\D/g, "");
  if (whatsapp && (whatsapp.length < 12 || whatsapp.length > 15)) {
    return { error: "WhatsApp deve ter código do país e DDD, por exemplo 5511912345678." };
  }
  const s: SiteSettings = {
    whatsapp,
    email: str(fd, "email", 120),
    instagram: str(fd, "instagram", 60),
    city: str(fd, "city", 80),
    addressNote: str(fd, "addressNote", 160),
  };
  await saveSettings(s);
  revalidateSite();
  return { ok: "Contatos salvos e publicados." };
}

export async function saveServiceList(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const current = await getServices();
  const next: Service[] = current.map((s) => ({
    ...s,
    name: str(fd, `${s.slug}.name`, 80) || s.name,
    short: str(fd, `${s.slug}.short`, 120) || s.short,
    description: str(fd, `${s.slug}.description`, 600) || s.description,
    confirmed: fd.get(`${s.slug}.confirmed`) === "on",
  }));
  await saveServices(next);
  revalidateSite();
  return { ok: "Serviços salvos e publicados." };
}

/* ── Leads ───────────────────────────────────────────────────────────── */

export async function setLeadStatus(fd: FormData) {
  await requireAdmin();
  const lead = await getLead(str(fd, "id", 40));
  const status = str(fd, "status") as LeadStatus;
  if (!lead || !["novo", "em-contato", "arquivado"].includes(status)) return;
  await updateLead({ ...lead, status });
  revalidatePath("/admin/solicitacoes");
}

export async function removeLead(fd: FormData) {
  await requireAdmin();
  const lead = await getLead(str(fd, "id", 40));
  if (lead) await deleteLead(lead);
  revalidatePath("/admin/solicitacoes");
  redirect("/admin/solicitacoes");
}

export async function purgeNow(): Promise<void> {
  await requireAdmin();
  await purgeExpiredLeads();
  revalidatePath("/admin");
}
