import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { StorageDriver, StoredFile } from "./index";
import { safeKey } from "./index";

const root = path.resolve(/*turbopackIgnore: true*/ process.cwd(), ".data");
const dataDir = path.join(root, "data");
const publicDir = path.join(root, "public");
const privateDir = path.join(root, "private");

const types: Record<string, string> = { ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" };

async function write(file: string, data: Buffer | string) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, data);
  await fs.rename(tmp, file);
}

async function read(file: string): Promise<StoredFile | null> {
  try {
    const data = await fs.readFile(file);
    return { data, contentType: types[path.extname(file).toLowerCase()] ?? "application/octet-stream" };
  } catch {
    return null;
  }
}

/** Local filesystem driver: development and Node hosting with a persistent disk. */
export function fsDriver(): StorageDriver {
  return {
    name: "fs",
    async getJSON<T>(key: string) {
      try {
        return JSON.parse(await fs.readFile(path.join(dataDir, safeKey(key)), "utf8")) as T;
      } catch {
        return null;
      }
    },
    async putJSON(key, value) {
      await write(path.join(dataDir, safeKey(key)), JSON.stringify(value, null, 2));
    },
    async list(prefix) {
      const dir = path.join(dataDir, safeKey(prefix.replace(/\/$/, "")));
      try {
        const entries = await fs.readdir(dir);
        return entries.filter((e) => !e.endsWith(".tmp")).map((e) => `${prefix.replace(/\/$/, "")}/${e}`);
      } catch {
        return [];
      }
    },
    async delete(key) {
      const k = safeKey(key);
      await Promise.all(
        [dataDir, privateDir, publicDir].map((d) => fs.rm(path.join(/*turbopackIgnore: true*/ d, k), { force: true }).catch(() => undefined)),
      );
    },
    async putPublicFile(key, data) {
      const k = safeKey(key);
      await write(path.join(publicDir, k), data);
      return `/files/${k}`;
    },
    async putPrivateFile(key, data) {
      await write(path.join(privateDir, safeKey(key)), data);
    },
    async getPrivateFile(key) {
      return read(path.join(privateDir, safeKey(key)));
    },
    async getPublicFile(key) {
      return read(path.join(publicDir, safeKey(key)));
    },
  };
}
