import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default async function Icon() {
  const logo = await readFile(join(process.cwd(), "public", "brand", "planet-infinity-orange.png"));
  const src = `data:image/png;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(145deg, #effbff 0%, #b9e9f6 100%)", borderRadius: 108 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" width={420} height={420} style={{ objectFit: "contain" }} />
    </div>,
    size,
  );
}
