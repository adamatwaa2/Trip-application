import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Planet Infinity — trips, experiences and events in Egypt";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logo = await readFile(join(process.cwd(), "public", "brand", "planet-infinity-orange.png"));
  const src = `data:image/png;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", padding: 72, background: "linear-gradient(135deg, #effbff 0%, #b7e8f5 48%, #f8c03c 100%)", color: "#081d29" }}>
      <div style={{ width: 390, height: 390, borderRadius: 96, background: "rgba(255,255,255,.72)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" width={330} height={330} style={{ objectFit: "contain" }} />
      </div>
      <div style={{ marginLeft: 64, display: "flex", flexDirection: "column", maxWidth: 570 }}>
        <div style={{ fontSize: 74, fontWeight: 800, lineHeight: 1 }}>Planet Infinity</div>
        <div style={{ marginTop: 28, fontSize: 36, lineHeight: 1.25 }}>Trips, experiences and events across Egypt.</div>
        <div style={{ marginTop: 38, fontSize: 24, letterSpacing: 4 }}>PLANETINFINITY.ONLINE</div>
      </div>
    </div>,
    size,
  );
}
