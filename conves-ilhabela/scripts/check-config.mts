/**
 * Lista o que ainda depende do restaurante antes da publicação definitiva.
 * Uso: npm run check:config
 */
import { photos, site } from "../config/site.ts";
import { menu, menuSettings } from "../data/menu.ts";

const pending: string[] = [];
if (site.demo) pending.push("Site marcado como demonstração (site.demo = true).");
if (process.env.NEXT_PUBLIC_ALLOW_INDEXING !== "true") pending.push("Indexação no Google desligada.");
if (!site.whatsapp) pending.push("WhatsApp não configurado: a reserva termina em ligação + copiar mensagem.");
if (!site.hours) pending.push("Horários de funcionamento não informados (site.hours = null).");
if (!site.rating) pending.push("Nota do Google não verificada (site.rating = null): o site mostra só o link.");
if (!menuSettings.showPrices) pending.push("Preços ocultos (menuSettings.showPrices = false).");
if (!menuSettings.showAlcohol) pending.push("Cervejas transcritas, mas ocultas (menuSettings.showAlcohol = false).");
const provisional = Object.values(photos).filter((p) => p.provisional);
if (provisional.length) pending.push(`Fotos provisórias de terceiros: ${provisional.map((p) => p.src).join(", ")}.`);
const notConfirmed = menu.filter((m) => m.status !== "confirmado");
pending.push(`${notConfirmed.length} de ${menu.length} itens do cardápio sem confirmação do restaurante.`);
const review = menu.filter((m) => m.status === "revisar");
if (review.length) pending.push(`Revisar com prioridade: ${review.map((m) => m.name).join(", ")}.`);
pending.push("Logotipo: versão tipográfica provisória; pedir o arquivo original.");
pending.push("Horários de preferência sugeridos na reserva (site.reservation.times): ajustar aos horários reais.");

console.log(`Pendências (${pending.length}):\n- ${pending.join("\n- ")}`);
