/**
 * Lista o que ainda precisa da confirmação do proprietário antes de publicar.
 * Uso: npm run check:config
 */
import { site } from "../config/site.ts";

const pending: string[] = [];

if (!site.hours.confirmed)
  pending.push("Horários: confirmar com o Leonardo e mudar hours.confirmed para true.");
if (!site.hero.photo.src) pending.push("Foto principal (hero.photo.src) ainda é placeholder.");
if (!site.about.photo.src) pending.push("Foto do Leonardo (about.photo.src) ainda é placeholder.");
const missingGallery = site.gallery.filter((p) => !p.src).length;
if (missingGallery)
  pending.push(
    `Galeria: ${missingGallery} de ${site.gallery.length} fotos ainda são placeholders.`,
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
