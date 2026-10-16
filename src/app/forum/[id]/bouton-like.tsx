"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icone } from "@/components/icones";

type Props = {
  postId: number;
  connecte: boolean;
  likedByMe: boolean;
  compteur: number;
};

type CorpsReponse = { actif?: boolean; message?: string };

/** Bouton like : POST /api/forum/[id]/like ; grisé et inactif si non connecté. */
export default function BoutonLike({ postId, connecte, likedByMe, compteur }: Props) {
  const router = useRouter();
  const [aime, setAime] = useState(likedByMe);
  const [nombre, setNombre] = useState(compteur);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  if (!connecte) {
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
      const reponse = await fetch(`/api/forum/${postId}/like`, { method: "POST" });
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
