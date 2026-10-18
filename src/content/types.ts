/**
 * Content model. Seed data lives in src/content; the admin panel stores edits through
 * the storage adapter (src/lib/storage), so UI components never import raw seed files.
 */

export type PhotoKind = "real" | "concept";

export interface Photo {
  src: string;
  alt: string;
  kind: PhotoKind;
  caption?: string;
  width?: number;
  height?: number;
}

/** Stage of preparation/restoration work. Independent from commercial status. */
export type WorkStage =
  | "a-confirmar"
  | "avaliacao"
  | "projeto"
  | "funilaria-pintura"
  | "preparacao"
  | "quase-pronto"
  | "concluido";

/** Commercial situation. Never derived from the work stage. */
export type CommercialStatus =
  | "a-confirmar"
  | "venda-prevista"
  | "disponivel"
  | "reservado"
  | "vendido"
  | "acervo";

export interface Swatch {
  name: string;
  hex: string;
}

export interface Spec {
  label: string;
  value: string;
}

export interface HistoryEntry {
  date?: string;
  title: string;
  note?: string;
}

export interface Vehicle {
  slug: string;
  maker: string;
  model: string;
  chassis: string;
  nickname?: string;
  body: string;
  /** Display label for the year, e.g. "c. 1966" while unverified. */
  yearLabel: string;
  yearConfirmed: boolean;
  decade: number;
  color: Swatch;
  roof?: Swatch;
  interior?: Swatch;
  workStage: WorkStage;
  workNote?: string;
  commercialStatus: CommercialStatus;
  /** Only shown when explicitly authorised in the admin panel. */
  price?: { authorised: boolean; amount?: number };
  summary: string;
  /** General factory facts for the model (not this specific car). */
  modelReference: Spec[];
  /** Facts about this specific car; values pending verification say so. */
  vehicleFacts: Spec[];
  history: HistoryEntry[];
  notes?: string;
  photos: Photo[];
  featured?: boolean;
  order: number;
}

export interface Service {
  slug: string;
  name: string;
  short: string;
  description: string;
  /** False until the owner confirms the service is offered. */
  confirmed: boolean;
}

export interface SiteSettings {
  /** WhatsApp in international format, digits only (e.g. 5511999999999). Empty = not configured. */
  whatsapp: string;
  email: string;
  instagram: string;
  city: string;
  addressNote: string;
}
