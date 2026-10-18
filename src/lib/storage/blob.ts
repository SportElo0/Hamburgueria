import "server-only";
import { del, get, list, put } from "@vercel/blob";
import type { StorageDriver } from "./index";
import { safeKey } from "./index";

async function readStream(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  return Buffer.from(await new Response(stream).arrayBuffer());
}

/**
 * Vercel Blob driver for serverless hosting. JSON documents and visitor files are private;
 * only vehicle photos uploaded by the admin are public.
 */
export function blobDriver(): StorageDriver {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("STORAGE_DRIVER=blob requires BLOB_READ_WRITE_TOKEN");
  }
  const data = (k: string) => `data/${safeKey(k)}`;
  const priv = (k: string) => `private/${safeKey(k)}`;
  return {
    name: "blob",
    async getJSON<T>(key: string) {
      const res = await get(data(key), { access: "private", useCache: false }).catch(() => null);
      if (!res || res.statusCode !== 200) return null;
      return JSON.parse((await readStream(res.stream)).toString("utf8")) as T;
    },
    async putJSON(key, value) {
      await put(data(key), JSON.stringify(value), {
        access: "private",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    },
    async list(prefix) {
      const base = data(prefix.replace(/\/$/, "")) + "/";
      const keys: string[] = [];
      let cursor: string | undefined;
      do {
        const page = await list({ prefix: base, cursor });
        keys.push(...page.blobs.map((b) => b.pathname.slice("data/".length)));
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
      return keys;
    },
    async delete(key) {
      const k = safeKey(key);
      const candidates = [`data/${k}`, `private/${k}`, `public/${k}`];
      await Promise.all(candidates.map((c) => del(c).catch(() => undefined)));
    },
    async putPublicFile(key, buf, contentType) {
      const res = await put(`public/${safeKey(key)}`, buf, {
        access: "public",
        contentType,
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      return res.url;
    },
    async putPrivateFile(key, buf, contentType) {
      await put(priv(key), buf, { access: "private", contentType, addRandomSuffix: false, allowOverwrite: true });
    },
    async getPrivateFile(key) {
      const res = await get(priv(key), { access: "private", useCache: false }).catch(() => null);
      if (!res || res.statusCode !== 200) return null;
      return { data: await readStream(res.stream), contentType: res.blob.contentType };
    },
  };
}
