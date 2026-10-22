import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/config/site";

export const alt = `${site.name}: bolos personalizados em ${site.address.city} – SP`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const [photo, seal] = await Promise.all([
    readFile(join(process.cwd(), "public/fotos/morangos.jpg")),
    readFile(join(process.cwd(), "public/selo-regiane.png")),
  ]);
  const photoSrc = `data:image/jpeg;base64,${photo.toString("base64")}`;
  const sealSrc = `data:image/png;base64,${seal.toString("base64")}`;

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#fff7ef", color: "#36251f" }}>
      <div
        style={{
          width: 680,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 72px",
        }}
      >
        <img src={sealSrc} alt="" width={120} height={120} />
        <div style={{ fontSize: 26, letterSpacing: 6, color: "#b73439", marginTop: 34, display: "flex" }}>
          BOLOS PARA MOMENTOS ESPECIAIS
        </div>
        <div style={{ fontSize: 66, lineHeight: 1.08, marginTop: 18, display: "flex", color: "#63341f" }}>
          Bolos e Doces Regiane Camilo
        </div>
        <div style={{ fontSize: 30, marginTop: 24, display: "flex", color: "#76665f" }}>
          Bolos personalizados em São Sebastião – SP
        </div>
      </div>
      <img src={photoSrc} alt="" width={520} height={630} style={{ objectFit: "cover" }} />
    </div>,
    size,
  );
}
