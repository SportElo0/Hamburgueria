import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Ícone de tela inicial com o selo original da Regiane sobre o creme. */
export default async function AppleIcon() {
  const seal = await readFile(join(process.cwd(), "public/selo-regiane.png"));
  const src = `data:image/png;base64,${seal.toString("base64")}`;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff7ef",
      }}
    >
      <img src={src} alt="" width={164} height={164} />
    </div>,
    size,
  );
}
