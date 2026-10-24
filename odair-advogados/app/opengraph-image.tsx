import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/config/site";

export const alt = `${site.name}: advocacia no Estado de São Paulo`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const lockup = await readFile(join(process.cwd(), "public/marca/assinatura-dourado.png"));
  const src = `data:image/png;base64,${lockup.toString("base64")}`;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "0 90px",
        background: "#071b2e",
        color: "#f7f5f0",
      }}
    >
      <img src={src} alt="" width={720} height={263} />
      <div style={{ display: "flex", marginTop: 48, width: 1020, height: 1, background: "#c6a15a" }} />
      <div style={{ display: "flex", marginTop: 32, fontSize: 34, color: "#b3c1ce" }}>
        Família e Sucessões · Previdenciário · Contratual e Consumidor · Trabalhista · Empresarial
      </div>
    </div>,
    size,
  );
}
