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
        alignItems: "center",
        justifyContent: "center",
        background: "#f9f8f5",
      }}
    >
      <div
        style={{
          width: 150,
          height: 150,
          borderRadius: 75,
          border: "3px solid #ad936e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#141414",
          fontSize: 70,
          fontWeight: 700,
          letterSpacing: -3,
        }}
      >
        LM
      </div>
    </div>,
    size,
  );
}
