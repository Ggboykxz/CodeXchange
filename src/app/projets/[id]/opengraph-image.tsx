import { ImageResponse } from "next/og";
import { getProject } from "@/lib/projects";
import { parseId } from "@/lib/forum";

export const alt = "Projet CodeXchange";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projetId = parseId(id);
  const projet = projetId === null ? null : await getProject(projetId);
  const titre = projet?.titre ?? "Projet CodeXchange";
  const extrait = (projet?.description ?? "").slice(0, 140).trim();

  return new ImageResponse(
    (
      <div
        style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px", background: "linear-gradient(135deg, #0f172a 0%, #0ea5e9 60%, #ea580c 130%)", color: "white", fontFamily: "sans-serif" }}
      >
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 2, opacity: 0.75, marginBottom: 28 }}>CODEXCHANGE · PROJETS</div>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 800, lineHeight: 1.1 }}>{titre}</div>
        {extrait ? <div style={{ display: "flex", fontSize: 32, marginTop: 28, opacity: 0.85 }}>{extrait}</div> : null}
        <div style={{ display: "flex", fontSize: 26, marginTop: 48, color: "#fb923c" }}>
          {projet?.stack?.slice(0, 4).join(" · ") ?? ""}
        </div>
      </div>
    ),
    size,
  );
}
