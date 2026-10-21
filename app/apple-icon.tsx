import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#0b0c0e",
        color: "#f5f2ed",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 88,
          fontWeight: 800,
          letterSpacing: -4,
        }}
      >
        LM
      </div>
      <div style={{ height: 12, background: "#17191d", display: "flex" }} />
      <div style={{ height: 12, background: "#1d2025", display: "flex" }} />
      <div style={{ height: 22, background: "#252930", display: "flex" }} />
    </div>,
    size,
  );
}
