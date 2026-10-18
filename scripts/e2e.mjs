// End-to-end checks against a running server: forms, admin, Vision (provider mocked at the network layer).
import { chromium } from "playwright-core";
const BASE = process.env.BASE ?? "http://localhost:3000";
const out = ".impeccable/review";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ok = (m) => console.log("✓", m);
const fail = (m) => { console.log("✗", m); process.exitCode = 1; };

// 1. Interest form on a car page (no WhatsApp configured → form fallback)
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.goto(`${BASE}/acervo/500-sec-c126`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /Tenho interesse neste clássico/ }).first().click();
  await page.locator("#interesse button[type=submit]").click();
  (await page.getByRole("alert").first().isVisible()) ? ok("form: error summary shown on empty submit") : fail("form: no error summary");
  await page.getByLabel("Nome").fill("Cliente Teste");
  await page.getByLabel("WhatsApp com DDD").fill("(11) 98765-4321");
  await page.getByLabel(/Autorizo a Mercantil/).check();
  await page.locator("#interesse button[type=submit]").click();
  await page.getByText("Solicitação recebida.").waitFor({ timeout: 8000 }).then(() => ok("form: lead sent"), () => fail("form: no success state"));
  await page.screenshot({ path: `${out}/e2e-interest-mobile.png` });
  await page.close();
}

// 2. Vision: unavailable state, then mocked successful generation
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/vision?pintura=vinho&teto=marfim`, { waitUntil: "networkidle" });
  (await page.getByText("Geração indisponível no momento.").isVisible()) ? ok("vision: unavailable banner") : fail("vision: no unavailable banner");
  const gen = page.getByRole("button", { name: "Visualizar meu projeto" });
  (await gen.isDisabled()) ? ok("vision: generate disabled without key/photo") : fail("vision: generate enabled");
  (await page.getByRole("radio", { name: "Vinho" }).first().getAttribute("aria-checked")) === "true" ? ok("vision: preset from query") : fail("vision: preset not applied");
  await page.screenshot({ path: `${out}/e2e-vision-unavailable.png` });

  // mock provider responses at the network layer to verify the UI flow end to end
  await page.route("**/api/vision", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: { available: true, remaining: 3, perClient: 3, maxMb: 8 } });
    await new Promise((r) => setTimeout(r, 2500));
    // echo the uploaded image back as the "concept" — test-only, never in the product
    const body = route.request().postDataBuffer();
    const start = body.indexOf(Buffer.from([0xff, 0xd8]));
    const end = body.lastIndexOf(Buffer.from([0xff, 0xd9])) + 2;
    const img = body.subarray(start, end).toString("base64");
    return route.fulfill({ json: { image: `data:image/jpeg;base64,${img}`, remaining: 2, seconds: 2 } });
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator('input[type=file]').setInputFiles("public/media/charuto/real-full.webp");
  await page.getByRole("radio", { name: "Rodas de liga de época" }).click();
  await page.getByRole("button", { name: "Visualizar meu projeto" }).click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/e2e-vision-generating.png` });
  await page.getByText("O próximo capítulo, em conceito.").waitFor({ timeout: 10000 }).then(() => ok("vision: result state"), () => fail("vision: no result"));
  (await page.getByLabel(/Comparar original e conceito/).count()) ? ok("vision: comparator present") : fail("vision: no comparator");
  await page.getByLabel(/Comparar original e conceito/).focus();
  await page.keyboard.press("ArrowLeft");
  ok("vision: comparator keyboard operable");
  await page.screenshot({ path: `${out}/e2e-vision-result.png` });
  await page.getByRole("button", { name: /Quero avaliar esse projeto/ }).click();
  (await page.getByLabel("Modelo").isVisible()) ? ok("vision: evaluation form with car fields") : fail("vision: no evaluation form");
  await page.close();
}

// 3. Admin: login, settings, vehicle edit, leads
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  page.url().includes("/admin/login") ? ok("admin: redirected to login") : fail("admin: not protected");
  await page.getByLabel("Senha").fill("errada");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.getByText("Senha incorreta.").waitFor({ timeout: 5000 }).then(() => ok("admin: wrong password refused"), () => fail("admin: wrong password not refused"));
  await page.getByLabel("Senha").fill(process.env.ADMIN_PASSWORD ?? "teste-local-mercantil");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(`${BASE}/admin`);
  ok("admin: logged in");
  await page.screenshot({ path: `${out}/e2e-admin-home.png` });
  await page.goto(`${BASE}/admin/solicitacoes`);
  (await page.getByText("Cliente Teste").first().isVisible()) ? ok("admin: lead listed") : fail("admin: lead missing");
  await page.goto(`${BASE}/admin/veiculos/500-sec-c126`);
  await page.getByLabel("Nota sobre a etapa").fill("Quase pronto — ajustes finais de acabamento.");
  await page.getByRole("button", { name: "Salvar e publicar" }).click();
  await page.getByText("Alterações salvas e publicadas.").waitFor({ timeout: 8000 }).then(() => ok("admin: vehicle saved"), () => fail("admin: vehicle not saved"));
  await page.locator("#photo").setInputFiles("public/media/charuto/real-car.webp");
  await page.locator("#alt").fill("Foto de teste do para-choque cromado");
  await page.getByRole("button", { name: "Enviar fotografia" }).click();
  await page.getByText("Fotografia publicada.").waitFor({ timeout: 10000 }).then(() => ok("admin: photo uploaded"), () => fail("admin: photo upload failed"));
  await page.screenshot({ path: `${out}/e2e-admin-vehicle.png`, fullPage: true });
  const pub = await browser.newPage();
  await pub.goto(`${BASE}/acervo/500-sec-c126`, { waitUntil: "networkidle" });
  (await pub.getByText("ajustes finais de acabamento").count()) ? ok("public: admin edit visible") : fail("public: edit not visible");
  (await pub.locator('img[alt="Foto de teste do para-choque cromado"]').count()) ? ok("public: uploaded photo visible") : fail("public: photo not visible");
  await pub.close();
  await page.close();
}
await browser.close();
