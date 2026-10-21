import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/config/site";

export const alt = `${site.name} — barbearia no ${site.address.neighborhood}, ${site.address.city} – SP`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const photo = await readFile(join(process.cwd(), "public/fotos/low-fade-risca.jpg"));
  const photoSrc = `data:image/jpeg;base64,${photo.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#f9f8f5",
        color: "#141414",
      }}
    >
      <div
        style={{
          width: 660,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 72px",
        }}
      >
        <div style={{ fontSize: 24, letterSpacing: 6, color: "#76603f", display: "flex" }}>
          CAMPANÁRIO · DIADEMA
        </div>
        <div style={{ fontSize: 96, lineHeight: 1, marginTop: 20, display: "flex" }}>
          Seu estilo.
        </div>
        <div style={{ fontSize: 96, lineHeight: 1, display: "flex" }}>
          Nossa&nbsp;<span style={{ color: "#8c7350" }}>precisão.</span>
        </div>
        <div
          style={{ width: 70, height: 2, background: "#ad936e", marginTop: 36, display: "flex" }}
        />
        <div style={{ fontSize: 30, marginTop: 28, display: "flex" }}>
          LM Barbearia · Leonardo Miguel
        </div>
      </div>
      <img src={photoSrc} alt="" width={540} height={630} style={{ objectFit: "cover" }} />
    </div>,
    size,
  );
}
