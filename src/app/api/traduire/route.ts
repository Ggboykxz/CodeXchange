import { NextResponse } from "next/server";

/**
 * POST /api/traduire — traduction de démo via l'endpoint public GTX (aucune
 * clé exposée côté client). Entrée : `{ texte, cible: "fr" | "en" }`,
 * sortie : `{ texte }`. Le markdown (blocs de code, images, liens) est
 * nettoyé avant envoi : on ne traduit jamais du code.
 */
export async function POST(requete: Request) {
  try {
    const { texte, cible } = (await requete.json()) as { texte?: string; cible?: string };
    if (typeof texte !== "string" || texte.trim() === "") {
      return NextResponse.json({ message: "Texte requis." }, { status: 400 });
    }
    if (cible !== "fr" && cible !== "en") {
      return NextResponse.json({ message: "Langue non prise en charge." }, { status: 400 });
    }

    const source = texte
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/^\s{0,3}#+\s/gm, "")
      .replace(/`([^`]+)`/g, "$1")
      .slice(0, 3000);

    const url = new URL("https://translate.googleapis.com/translate_a/single");
    url.searchParams.set("client", "gtx");
    url.searchParams.set("sl", "auto");
    url.searchParams.set("tl", cible);
    url.searchParams.set("dt", "t");
    url.searchParams.set("q", source);

    const reponse = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; CodeXchange/1.0)" },
      cache: "no-store",
    });
    if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);

    const brut = (await reponse.json()) as unknown;
    if (!Array.isArray(brut) || !Array.isArray(brut[0])) throw new Error("format");
    const sortie = (brut[0] as Array<[string, ...unknown[]]>)
      .map((segment) => segment[0])
      .join("");
    return NextResponse.json({ texte: sortie.trim() });
  } catch {
    return NextResponse.json({ message: "Traduction indisponible." }, { status: 502 });
  }
}
