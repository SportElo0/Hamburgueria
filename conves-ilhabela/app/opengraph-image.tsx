import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/config/site";

export const alt = `${site.name}: gastronomia à beira-mar no Perequê, Ilhabela – SP`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const photo = await readFile(join(process.cwd(), "public/fotos/gramado-mar.jpg"));
  const src = `data:image/jpeg;base64,${photo.toString("base64")}`;
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#f8f5ef" }}>
      <img src={src} alt="" width={1200} height={630} style={{ position: "absolute", inset: 0, objectFit: "cover" }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background: "linear-gradient(90deg, #f8f5ef 0%, rgba(248,245,239,0.92) 42%, rgba(248,245,239,0) 75%)",
        }}
      />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 72px", color: "#102f45" }}>
        <div style={{ fontSize: 22, letterSpacing: 6, color: "#76603d", display: "flex" }}>ILHABELA • PEREQUÊ</div>
        <div style={{ fontSize: 76, lineHeight: 1.05, marginTop: 20, display: "flex" }}>O sabor de Ilhabela.</div>
        <div style={{ fontSize: 76, lineHeight: 1.05, display: "flex", color: "#76603d" }}>A beleza do mar.</div>
        <div style={{ fontSize: 30, marginTop: 30, display: "flex" }}>Restaurante Convés Ilhabela</div>
      </div>
    </div>,
    size,
  );
}
