import { ImageResponse } from "next/og";

export const alt = "CodeXchange — la plateforme des développeurs africains";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Image de partage par défaut (Open Graph). */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #2563eb 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 32, opacity: 0.85, marginBottom: 24 }}>
          Fait par des devs africains, pour des devs africains
        </div>
        <div style={{ display: "flex", fontSize: 88, fontWeight: 800, lineHeight: 1.05 }}>
          CodeXchange
        </div>
        <div style={{ display: "flex", fontSize: 44, marginTop: 20, color: "#fb923c", fontWeight: 700 }}>
          la plateforme des développeurs africains
        </div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 40, opacity: 0.8 }}>
          Forum · Emplois · Projets · Mentorat · Tutos · Événements
        </div>
      </div>
    ),
    size,
  );
}
