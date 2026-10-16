import { ImageResponse } from "next/og";
import { getJob } from "@/lib/jobs";
import { parseId } from "@/lib/forum";

export const alt = "Offre d'emploi CodeXchange";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jobId = parseId(id);
  const offre = jobId === null ? null : await getJob(jobId);
  const titre = offre?.titre ?? "Offre d'emploi CodeXchange";
  const extrait = [offre?.entreprise, offre?.contrat, offre?.remote ? "Remote" : offre?.ville]
    .filter(Boolean)
    .join(" · ");

  return new ImageResponse(
    (
      <div
        style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px", background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 60%, #ea580c 130%)", color: "white", fontFamily: "sans-serif" }}
      >
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 2, opacity: 0.75, marginBottom: 28 }}>CODEXCHANGE · EMPLOIS</div>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 800, lineHeight: 1.1 }}>{titre}</div>
        {extrait ? <div style={{ display: "flex", fontSize: 32, marginTop: 28, opacity: 0.85 }}>{extrait}</div> : null}
        <div style={{ display: "flex", fontSize: 26, marginTop: 48, color: "#fb923c" }}>
          {offre?._count.candidatures ?? 0} candidature{offre?._count.candidatures === 1 ? "" : "s"}
        </div>
      </div>
    ),
    size,
  );
}
