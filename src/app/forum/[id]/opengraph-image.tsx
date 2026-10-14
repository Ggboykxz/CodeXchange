import { ImageResponse } from "next/og";
import { getPost, parseId } from "@/lib/forum";

export const alt = "Sujet CodeXchange";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Image de partage propre à chaque sujet du forum. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postId = parseId(id);
  const post = postId === null ? null : await getPost(postId);

  const titre = post?.titre ?? "Sujet CodeXchange";
  const extrait = (post?.corps ?? "").slice(0, 140).trim();

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
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #ea580c 130%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 2, opacity: 0.75, marginBottom: 28 }}>
          CODEXCHANGE · FORUM
        </div>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 800, lineHeight: 1.1 }}>{titre}</div>
        {extrait ? (
          <div style={{ display: "flex", fontSize: 32, marginTop: 28, opacity: 0.85 }}>{extrait}</div>
        ) : null}
        <div style={{ display: "flex", fontSize: 26, marginTop: 48, color: "#fb923c" }}>
          {post?.author.nom ?? ""} · {post?._count.replies ?? 0} réponses
        </div>
      </div>
    ),
    size,
  );
}
