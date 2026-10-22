/**
 * Lista o que ainda depende da Regiane antes da publicação definitiva.
 * Uso: npm run check:config
 */
import { products, site, styles } from "../config/site.ts";

const pending: string[] = [];

if (site.demo) pending.push("Site marcado como demonstração (site.demo = true). Mude para false depois da contratação.");
if (process.env.NEXT_PUBLIC_ALLOW_INDEXING !== "true")
  pending.push("Indexação no Google desligada (NEXT_PUBLIC_ALLOW_INDEXING não é \"true\").");
if (!process.env.NEXT_PUBLIC_SITE_URL) pending.push(`Endereço do site não definido (usando ${site.url}).`);
if (site.about.draft) pending.push("Texto da seção Sobre ainda é provisório (about.draft = true).");
if (!site.hours) pending.push("Horário de atendimento não informado (site.hours = null).");
pending.push(`Antecedência mínima do calendário: ${site.order.minDaysAhead} dia(s). Confirmar com a Regiane.`);
pending.push(`Estilos da vitrine são proposta visual: ${styles.map((s) => s.name).join(", ")}. Confirmar quais ela oferece.`);

const screenshots = products.filter((p) => p.photo.fromScreenshot);
if (screenshots.length)
  pending.push(`Fotos vindas de captura do Instagram: ${screenshots.map((p) => p.name).join(", ")}. Trocar pelos originais.`);

for (const product of products) {
  const missing = [
    product.price === null && "preço",
    !product.sizes.length && "tamanhos",
    !product.flavors.length && "sabores",
    !product.fillings.length && "recheios",
  ].filter(Boolean);
  if (missing.length) pending.push(`${product.name}: sem ${missing.join(", ")} (mostra "a combinar").`);
}

console.log(pending.length ? `Pendências (${pending.length}):\n- ${pending.join("\n- ")}` : "Nada pendente.");
