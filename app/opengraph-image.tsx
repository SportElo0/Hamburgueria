import { ImageResponse } from "next/og";
import { site } from "@/config/site";

export const alt = `${site.name} — barbearia no ${site.address.neighborhood}, ${site.address.city} – SP`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const bands = ["#252930", "#1d2025", "#17191d", "#141619", "#101215"];

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#0b0c0e",
        color: "#f5f2ed",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        {bands.map((tone) => (
          <div key={tone} style={{ flex: 1, background: tone, display: "flex" }} />
        ))}
        <div style={{ flex: 3, background: "#0b0c0e", display: "flex" }} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          bottom: 64,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ fontSize: 30, color: "#a6a8ad", letterSpacing: 6, display: "flex" }}>
          LEONARDO MIGUEL · DIADEMA – SP
        </div>
        <div
          style={{
            fontSize: 124,
            fontWeight: 800,
            letterSpacing: -4,
            lineHeight: 1,
            marginTop: 12,
            display: "flex",
          }}
        >
          LM BARBEARIA
        </div>
        <div style={{ display: "flex", alignItems: "center", marginTop: 28, fontSize: 32 }}>
          <div
            style={{
              width: 56,
              height: 4,
              background: "#436bd9",
              marginRight: 20,
              display: "flex",
            }}
          />
          O estilo começa no detalhe.
        </div>
      </div>
    </div>,
    size,
  );
}
