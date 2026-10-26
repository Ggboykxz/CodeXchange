"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Icone } from "@/components/icones";
import { fetchWithCsrf } from "@/lib/csrf-client";

type Props = {
  postId: number;
  connecte: boolean;
  likedByMe: boolean;
  compteur: number;
  /** `action` = pastille compacte façon X (barre d'actions du détail). */
  variante?: "encadre" | "action";
};

type CorpsReponse = { actif?: boolean; message?: string };

/** Bouton like : POST /api/forum/[id]/like ; grisé et inactif si non connecté. */
export default function BoutonLike({ postId, connecte, likedByMe, compteur, variante = "encadre" }: Props) {
  const router = useRouter();
  const [aime, setAime] = useState(likedByMe);
  const [nombre, setNombre] = useState(compteur);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  if (!connecte) {
    if (variante === "action") {
      // Façon X : l'action reste rendue mais renvoie à la connexion.
      return (
        <Link
          href="/connexion"
          aria-label="Connectez-vous pour liker ce sujet"
          title="Connectez-vous pour liker ce sujet"
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-cx-muted-fg transition hover:bg-cx-accent/10 hover:text-cx-accent"
        >
          <Icone nom="coeur" className={`size-4 ${aime ? "fill-current" : ""}`} />{" "}
          <span className="tabular-nums">{nombre}</span>
        </Link>
      );
    }
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Connectez-vous pour liker ce sujet"
        className="cursor-not-allowed rounded-lg border border-cx-border px-3 py-1.5 text-sm text-cx-muted-fg opacity-60"
      >
        <Icone nom="coeur" className={`size-4 ${aime ? "fill-current" : ""}`} /> {nombre} · connectez-vous pour liker
      </button>
    );
  }

  async function basculer() {
    setEnCours(true);
    setErreur(null);
    try {
      const reponse = await fetchWithCsrf(`/api/forum/${postId}/like`, { method: "POST" });
      const corps = (await reponse.json().catch(() => null)) as CorpsReponse | null;
      if (!reponse.ok) {
        setErreur(corps?.message ?? "Une erreur est survenue.");
        return;
      }
      const actif = corps?.actif === true;
      setAime(actif);
      setNombre((n) => Math.max(0, n + (actif ? 1 : -1)));
      router.refresh();
    } catch {
      setErreur("Impossible de contacter le serveur. Réessayez dans un instant.");
    } finally {
      setEnCours(false);
    }
  }

  const etiquete = aime ? "Aimé" : "J'aime";
  if (variante === "action") {
    return (
      <span className="inline-flex items-center">
        <button
          type="button"
          onClick={basculer}
          disabled={enCours}
          aria-busy={enCours}
          aria-pressed={aime}
          aria-label={`${etiquete} · ${nombre}`}
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
            aime ? "text-cx-accent hover:bg-cx-accent/10" : "text-cx-muted-fg hover:bg-cx-accent/10 hover:text-cx-accent"
          }`}
        >
          <Icone nom="coeur" className={`size-4 ${aime ? "fill-current" : ""}`} />{" "}
          <span className="tabular-nums">{nombre}</span>
        </button>
        {erreur && (
          <span role="alert" className="ml-1 text-xs text-cx-destructive">
            !
          </span>
        )}
      </span>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={basculer}
        disabled={enCours}
        aria-busy={enCours}
        aria-pressed={aime}
        className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:opacity-60 ${
          aime
            ? "border-cx-accent bg-cx-accent/5 text-cx-accent"
            : "border-cx-border hover:border-cx-accent"
        }`}
      >
        <Icone nom="coeur" className={`size-4 ${aime ? "fill-current" : ""}`} /> {nombre}{" "}
        {aime ? "Aimé" : "J'aime"}
      </button>
      {erreur && (
        <span role="alert" className="text-xs text-cx-destructive">
          {erreur}
        </span>
      )}
    </span>
  );
}
