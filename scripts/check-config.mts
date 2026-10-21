/**
 * Lista o que ainda precisa da confirmação do proprietário antes de publicar.
 * Uso: npm run check:config
 */
import { site } from "../config/site.ts";

const pending: string[] = [];

if (!site.hours.confirmed)
  pending.push("Horários: confirmar com o Leonardo e mudar hours.confirmed para true.");
const allPhotos = [
  site.hero.photo,
  site.about.photo,
  ...site.gallery,
  ...site.services.flatMap((s) => (s.photo ? [s.photo] : [])),
];
const missing = new Set(allPhotos.filter((p) => !p.src).map((p) => p.caption));
if (missing.size) pending.push(`Fotos sem arquivo: ${[...missing].join(", ")}.`);
const fromScreenshot = new Set(
  allPhotos.filter((p) => p.src && p.fromScreenshot).map((p) => p.src),
);
if (fromScreenshot.size)
  pending.push(
    `${fromScreenshot.size} fotos vieram de capturas de tela; trocar pelos originais em alta (mesmo nome em public/fotos): ${[...fromScreenshot].join(", ")}.`,
  );
const noPrice = site.services.filter((s) => s.price === null).map((s) => s.name);
if (noPrice.length)
  pending.push(
    `Preços não informados: ${noPrice.join(", ")} (opcional; o site mostra "Valor no WhatsApp").`,
  );
if (site.about.draft) pending.push("Texto do 'Sobre' ainda marcado como provisório (about.draft).");
if (!site.address.geo)
  pending.push("Coordenadas (address.geo) não informadas (opcional, melhora o SEO local).");
if (process.env.NEXT_PUBLIC_ALLOW_INDEXING !== "true")
  pending.push(
    "Indexação no Google desligada: defina NEXT_PUBLIC_ALLOW_INDEXING=true quando o conteúdo estiver aprovado.",
  );
if (!process.env.NEXT_PUBLIC_SITE_URL)
  pending.push(`NEXT_PUBLIC_SITE_URL não definida; usando ${site.url}.`);

if (pending.length === 0) {
  console.log("Tudo confirmado. Pronto para publicar.");
} else {
  console.log(`Pendências (${pending.length}):\n`);
  for (const item of pending) console.log(`  • ${item}`);
  console.log("");
}
