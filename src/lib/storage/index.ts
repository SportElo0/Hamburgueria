import "server-only";
import { blobDriver } from "./blob";
import { fsDriver } from "./fs";

/**
 * Storage adapter. Keys are POSIX-like paths ("vehicles.json", "leads/abc.json").
 * Public files (vehicle photos) get a URL the site can render; private files (visitor uploads,
 * lead data) are only readable server-side and through the authenticated admin.
 */
export interface StoredFile {
  data: Buffer;
  contentType: string;
}

export interface StorageDriver {
  name: "fs" | "blob";
  getJSON<T>(key: string): Promise<T | null>;
  putJSON(key: string, value: unknown): Promise<void>;
  list(prefix: string): Promise<string[]>;
  delete(key: string): Promise<void>;
  putPublicFile(key: string, data: Buffer, contentType: string): Promise<string>;
  putPrivateFile(key: string, data: Buffer, contentType: string): Promise<void>;
  getPrivateFile(key: string): Promise<StoredFile | null>;
  getPublicFile?(key: string): Promise<StoredFile | null>;
}

let driver: StorageDriver | null = null;

export function storage(): StorageDriver {
  if (driver) return driver;
  const choice = (process.env.STORAGE_DRIVER ?? "fs").toLowerCase();
  driver = choice === "blob" ? blobDriver() : fsDriver();
  return driver;
}

/** Rejects path traversal and anything outside a conservative key alphabet. */
export function safeKey(key: string): string {
  if (!/^[a-z0-9][a-z0-9/_.-]*$/i.test(key) || key.includes("..") || key.includes("//")) {
    throw new Error("Invalid storage key");
  }
  return key;
}
