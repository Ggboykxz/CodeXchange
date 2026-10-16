import { ImageResponse } from "next/og";
import { getTutorial } from "@/lib/tutorials";

export const alt = "Tutoriel CodeXchange";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tuto = await getTutorial(slug);
  const titre = tuto?.titre ?? "Tutoriel CodeXchange";
  const extrait = (tuto?.resume ?? "").slice(0, 140).trim();

  return new ImageResponse(
    (
      <div
        style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px", background: "linear-gradient(135deg, #0f172a 0%, #7c3aed 60%, #ea580c 130%)", color: "white", fontFamily: "sans-serif" }}
      >
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 2, opacity: 0.75, marginBottom: 28 }}>CODEXCHANGE · TUTOS</div>
        <div style={{ display: "flex", fontSize: 68, fontWeight: 800, lineHeight: 1.1 }}>{titre}</div>
        {extrait ? <div style={{ display: "flex", fontSize: 32, marginTop: 28, opacity: 0.85 }}>{extrait}</div> : null}
        <div style={{ display: "flex", fontSize: 26, marginTop: 48, color: "#fb923c" }}>
          {tuto?.dureeMin ? `${tuto.dureeMin} min de lecture` : "Lire l'article"}
        </div>
      </div>
    ),
    size,
  );
}
