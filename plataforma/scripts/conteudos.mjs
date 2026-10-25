// Runs before `next build`: turns ../growlift-social into the panel's Conteúdos section.
//   node scripts/conteudos.mjs [source-dir]
// Writes conteudos-gerados/: manifest.json, the original files and WebP thumbnails.
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(process.argv[2] || process.env.CONTEUDOS_DIR || '../growlift-social');
const OUT = path.resolve('conteudos-gerados');

if (!fs.existsSync(SRC)) {
  console.error(`conteudos: pasta de origem não encontrada (${SRC}).`);
  process.exit(1);
}

let sharp = null;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.warn('conteudos: sharp indisponível, as miniaturas serão os próprios arquivos.');
}

const FOLDERS = {
  '01-identidade': { title: 'Identidade visual', blurb: 'Cores, fonte, margens e tom de voz das peças.' },
  '02-instagram-perfil': { title: 'Perfil do Instagram', blurb: 'Foto, nome, bio e botões de contato.' },
  '03-destaques': { title: 'Stories e destaques', blurb: 'Capas e stories de cada destaque, na ordem de postar.' },
  '04-posts-fixados': { title: 'Posts e carrosséis', blurb: 'Os carrosséis fixados, com legenda pronta.' },
  '05-reels': { title: 'Reels', blurb: 'Roteiros com gancho, demonstração e chamada.', sectionStatus: true },
  '06-whatsapp-business': { title: 'WhatsApp Business', blurb: 'Perfil, mensagens automáticas, respostas rápidas e etiquetas.' },
  '07-planejamento': { title: 'Planejamento', blurb: 'Pilares, ritmo e calendário das primeiras semanas.' },
  '08-prompts': { title: 'Prompts', blurb: 'Os prompts das imagens e do vídeo do site, e um modelo para pedir conteúdo novo.' },
};

const WORDS = {
  servicos: 'Serviços', portfolio: 'Portfólio', 'quem-somos': 'Quem somos', projetos: 'Projetos', processo: 'Processo',
  contato: 'Contato', design: 'Design', clientes: 'Clientes', capas: 'Capas', 'direcao-a': 'direção A', 'direcao-b': 'direção B',
  'foto-perfil': 'Foto de perfil', 'sistema-visual': 'Sistema visual',
};
const IMAGE = /\.(png|jpe?g|webp)$/i;
const TYPES = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };

const pretty = (name) => {
  const key = name.toLowerCase();
  if (WORDS[key]) return WORDS[key];
  const bare = key.replace(/^\d+-/, '');
  if (WORDS[bare]) return WORDS[bare];
  const s = bare.replace(/[-_]+/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const formatOf = (w, h) => (w === 1080 && h === 1920 ? 'Story' : w === 1080 && h === 1350 ? 'Post 4:5' : w === h ? 'Quadrado' : `${w}×${h}`);

// --- Markdown: the small subset these docs use. Every piece of text is escaped. ---
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function inline(text) {
  const codes = [];
  let s = esc(text).replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`);
  s = s
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/(^|[\s(])(https:\/\/[^\s<)]+[^\s<).,;:])/g, '$1<a href="$2" target="_blank" rel="noreferrer">$2</a>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
}

function render(lines) {
  const out = [];
  let i = 0;
  const isBlockStart = (l) => /^(```|#{1,4} |\|| *[-*] | *\d+\. |---\s*$)/.test(l);
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.startsWith('```')) {
      const body = [];
      for (i++; i < lines.length && !lines[i].startsWith('```'); i++) body.push(lines[i]);
      i++;
      out.push(`<div class="copy-block"><pre>${esc(body.join('\n'))}</pre><button type="button" data-copy>Copiar</button></div>`);
      continue;
    }
    const h = /^(#{3,4}) (.*)$/.exec(line);
    if (h) { out.push(`<h4>${inline(h[2])}</h4>`); i++; continue; }
    if (/^---\s*$/.test(line)) { out.push('<hr>'); i++; continue; }
    if (line.startsWith('|')) {
      const rows = [];
      for (; i < lines.length && lines[i].startsWith('|'); i++) rows.push(lines[i]);
      const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const [head, , ...body] = rows;
      out.push(
        `<div class="table-wrap"><table><thead><tr>${cells(head).map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>` +
          body.map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('') +
          '</tbody></table></div>',
      );
      continue;
    }
    if (/^ *([-*]|\d+\.) /.test(line)) {
      const list = (indent) => {
        const ordered = /^ *\d+\. /.test(lines[i]);
        const items = [];
        while (i < lines.length) {
          const m = /^( *)([-*]|\d+\.) (.*)$/.exec(lines[i]);
          if (!m || m[1].length < indent) break;
          if (m[1].length > indent) { items[items.length - 1] += list(m[1].length); continue; }
          items.push(inline(m[3]));
          i++;
        }
        const tag = ordered ? 'ol' : 'ul';
        return `<${tag}>${items.map((it) => `<li>${it}</li>`).join('')}</${tag}>`;
      };
      out.push(list(/^ */.exec(line)[0].length));
      continue;
    }
    const para = [];
    for (; i < lines.length && lines[i].trim() && !isBlockStart(lines[i]); i++) para.push(lines[i].trim());
    if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`);
    else i++;
  }
  return out.join('\n');
}

function parseDoc(text, file) {
  const lines = text.replace(/\r/g, '').split('\n');
  let title = pretty(path.basename(file, '.md'));
  const intro = [];
  const sections = [];
  let current = null;
  let fence = false;
  for (const line of lines) {
    if (line.startsWith('```')) fence = !fence;
    if (!fence && /^# /.test(line)) { title = line.slice(2).trim(); continue; }
    if (!fence && /^## /.test(line)) {
      current = { title: line.slice(3).trim(), lines: [] };
      sections.push(current);
      continue;
    }
    (current ? current.lines : intro).push(line);
  }
  const ids = new Set();
  return {
    title,
    intro: render(intro),
    sections: sections.map((s) => {
      let id = slug(s.title) || 'secao';
      while (ids.has(id)) id += '-2';
      ids.add(id);
      return { id, title: s.title.replace(/\*\*/g, ''), html: render(s.lines) };
    }),
  };
}

// --- Walk the folders ---
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const folderNames = fs.readdirSync(SRC, { withFileTypes: true }).filter((d) => d.isDirectory() && /^\d{2}-/.test(d.name)).map((d) => d.name).sort();
const folders = [];
let fileCount = 0;

for (const name of folderNames) {
  const meta = FOLDERS[name] ?? {};
  const groups = new Map();
  const docs = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (e.name.startsWith('.')) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (IMAGE.test(e.name)) {
        const rel = path.relative(SRC, full).split(path.sep).join('/');
        const groupDir = path.dirname(rel);
        if (!groups.has(groupDir)) groups.set(groupDir, []);
        groups.get(groupDir).push(rel);
      } else if (e.name.endsWith('.md')) {
        docs.push({ file: path.relative(SRC, full).split(path.sep).join('/'), ...parseDoc(fs.readFileSync(full, 'utf8'), e.name) });
      }
    }
  };
  walk(path.join(SRC, name));

  const outGroups = [];
  for (const [dir, files] of groups) {
    const parts = dir.split('/').slice(1);
    const title = parts.length ? parts.map(pretty).join(' · ') : files.length === 1 ? pretty(path.basename(files[0]).replace(IMAGE, '')) : 'Imagens';
    const items = [];
    for (const rel of files) {
      const ext = rel.split('.').pop().toLowerCase();
      const src = path.join(SRC, rel);
      const dest = path.join(OUT, 'arquivos', rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
      let width = 0, height = 0, thumb = rel;
      if (sharp) {
        const img = sharp(src);
        ({ width, height } = await img.metadata());
        thumb = rel.replace(IMAGE, '.webp');
        const tdest = path.join(OUT, 'miniaturas', thumb);
        fs.mkdirSync(path.dirname(tdest), { recursive: true });
        await img.resize({ width: 480, withoutEnlargement: true }).webp({ quality: 78 }).toFile(tdest);
      }
      items.push({
        path: rel,
        name: path.basename(rel),
        type: TYPES[ext],
        size: fs.statSync(src).size,
        width,
        height,
        format: width ? formatOf(width, height) : '',
        thumb,
        doNotPublish: path.basename(rel).startsWith('_'),
      });
      fileCount++;
    }
    outGroups.push({ id: dir, title, files: items });
  }
  // Highlight covers: the chosen direction first, the one kept for the record last.
  const rank = (g) => (/\/capas\/direcao-a$/i.test(g.id) ? 0 : /\/capas\//.test(g.id) ? 2 : 1);
  outGroups.sort((a, b) => rank(a) - rank(b));

  folders.push({
    slug: name,
    title: meta.title ?? docs[0]?.title ?? pretty(name),
    blurb: meta.blurb ?? '',
    sectionStatus: Boolean(meta.sectionStatus),
    groups: outGroups,
    docs,
  });
}

fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({ generatedAt: new Date().toISOString(), folders }, null, 1));
console.log(`conteudos: ${folders.length} pastas, ${fileCount} imagens, ${folders.reduce((n, f) => n + f.docs.length, 0)} textos.`);
