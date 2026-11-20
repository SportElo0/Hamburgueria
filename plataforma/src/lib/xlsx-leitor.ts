/**
 * Reads the first sheet of an Excel file (.xlsx) as rows of text, with no library: an .xlsx is a ZIP of XML files.
 * Runs in the browser (the owner's file never leaves the phone or computer whole: only the columns we need are sent)
 * and in Node for the tests. Deflate comes from the platform's DecompressionStream; the XML is simple enough for
 * regular expressions (Excel always writes the same shapes: shared strings, inline strings and numbers).
 */

const MAX_BYTES = 15 * 1024 * 1024;

interface Entry {
  name: string;
  method: number;
  compressed: number;
  offset: number;
}

function entries(b: Uint8Array): Entry[] {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  // End of central directory: scan back from the end (it can be followed by a comment of up to 64 KB).
  let eocd = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 22 - 65535); i--) {
    if (v.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('Arquivo não é uma planilha .xlsx válida.');
  const total = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const out: Entry[] = [];
  const dec = new TextDecoder();
  for (let n = 0; n < total; n++) {
    if (v.getUint32(p, true) !== 0x02014b50) throw new Error('Planilha danificada.');
    const method = v.getUint16(p + 10, true);
    const compressed = v.getUint32(p + 20, true);
    const nameLen = v.getUint16(p + 28, true);
    const extraLen = v.getUint16(p + 30, true);
    const commentLen = v.getUint16(p + 32, true);
    const offset = v.getUint32(p + 42, true);
    out.push({ name: dec.decode(b.subarray(p + 46, p + 46 + nameLen)), method, compressed, offset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

/** Unpacked size cap: a real customer export is a few MB; this stops a "zip bomb" from freezing the tab. */
const MAX_DESCOMPACTADO = 50 * 1024 * 1024;

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const reader = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_DESCOMPACTADO) {
      await reader.cancel().catch(() => {});
      throw new Error('Planilha grande demais. Exporte só os clientes (inativos ou ativos).');
    }
    parts.push(value);
  }
  const out = new Uint8Array(size);
  let o = 0;
  for (const part of parts) {
    out.set(part, o);
    o += part.byteLength;
  }
  return out;
}

async function read(b: Uint8Array, e: Entry): Promise<string> {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (v.getUint32(e.offset, true) !== 0x04034b50) throw new Error('Planilha danificada.');
  const start = e.offset + 30 + v.getUint16(e.offset + 26, true) + v.getUint16(e.offset + 28, true);
  const raw = b.subarray(start, start + e.compressed);
  if (e.method === 0) return new TextDecoder().decode(raw);
  if (e.method === 8) return new TextDecoder().decode(await inflate(raw));
  throw new Error('Formato de compressão da planilha não suportado.');
}

const decode = (s: string) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, '&');

/** Text of all <t> pieces inside an XML fragment (rich text has several). */
const texts = (xml: string) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => decode(m[1])).join('');

const colIndex = (ref: string) => {
  let n = 0;
  for (const ch of ref.replace(/\d+$/, '')) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

/** A number as Excel stored it, without scientific notation or ".0" (phones are stored as numbers). */
function numberText(v: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return Number.isInteger(n) ? BigInt(Math.round(n)).toString() : String(n);
}

export async function lerXlsx(bytes: Uint8Array): Promise<string[][]> {
  if (bytes.length > MAX_BYTES) throw new Error('Planilha grande demais (máximo 15 MB).');
  const list = entries(bytes);
  const shared = list.find((e) => e.name === 'xl/sharedStrings.xml');
  const sheets = list.filter((e) => /^xl\/worksheets\/sheet\d+\.xml$/.test(e.name)).sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
  if (!sheets.length) throw new Error('A planilha não tem nenhuma aba.');
  const strings = shared ? [...(await read(bytes, shared)).matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => texts(m[1])) : [];
  const xml = await read(bytes, sheets[0]);
  const rows: string[][] = [];
  for (const row of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: string[] = [];
    for (const c of row[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = c[1];
      const body = c[2] ?? '';
      const ref = /\br="([A-Z]+\d+)"/.exec(attrs)?.[1];
      const type = /\bt="(\w+)"/.exec(attrs)?.[1];
      const value = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1];
      let text = '';
      if (type === 's' && value !== undefined) text = strings[Number(value)] ?? '';
      else if (type === 'inlineStr') text = texts(body);
      else if (type === 'str' || type === 'b' || type === 'e') text = decode(value ?? '');
      else if (value !== undefined) text = numberText(value);
      const i = ref ? colIndex(ref) : cells.length;
      while (cells.length < i) cells.push('');
      cells[i] = text.trim();
    }
    rows.push(cells);
  }
  return rows;
}

/** A simple CSV (comma or semicolon, quotes allowed) for owners who export CSV instead. */
export function lerCsv(text: string): string[][] {
  const sep = (text.split('\n', 1)[0].match(/;/g)?.length ?? 0) > (text.split('\n', 1)[0].match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      row.push(cell.trim());
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell.trim());
      if (row.some((x) => x)) rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  row.push(cell.trim());
  if (row.some((x) => x)) rows.push(row);
  return rows;
}
