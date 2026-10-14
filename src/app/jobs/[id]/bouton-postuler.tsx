"use client";

import { IconeAnimee } from "@/components/icone-animee";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MESSAGE_FR } from "@/lib/errors";

type Props = {
  jobId: number;
  connecte: boolean;
  dejaPostule: boolean;
  compteur: number;
};

type CorpsReponse = { candidatures?: number; message?: string };

/**
 * Bouton « Postuler » → POST /api/jobs/[id]/apply.
 * Grisé et inactif si non connecté ou si la postulation est déjà enregistrée.
 */
export default function BoutonPostuler({ jobId, connecte, dejaPostule, compteur }: Props) {
  const router = useRouter();
  const [postule, setPostule] = useState(dejaPostule);
  const [nombre, setNombre] = useState(compteur);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  if (!connecte) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Connectez-vous pour postuler à cette offre"
        className="cursor-not-allowed rounded-lg border border-[var(--cx-muted)]/40 px-4 py-2.5 text-sm text-[var(--cx-muted)] opacity-60"
      >
        Postuler · connectez-vous
      </button>
    );
  }

  if (postule) {
    return (
      <span className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Vous avez déjà postulé à cette offre"
          className="cursor-not-allowed rounded-lg border border-[var(--cx-accent)] bg-[var(--cx-accent)]/10 px-4 py-2.5 text-sm font-medium text-[var(--cx-accent)] opacity-80"
        >
          <IconeAnimee nom="coche" className="mr-1 inline h-3 w-3" /> Candidature envoyée
        </button>
        <span className="text-xs text-[var(--cx-muted)]">
          {nombre} {nombre > 1 ? "candidatures" : "candidature"}
        </span>
      </span>
    );
  }

  async function postulerOffre() {
    setEnCours(true);
    setErreur(null);
    try {
      const reponse = await fetch(`/api/jobs/${jobId}/apply`, { method: "POST" });
      const corps = (await reponse.json().catch(() => null)) as CorpsReponse | null;
      if (!reponse.ok) {
        setErreur(corps?.message ?? MESSAGE_FR.JOB_DUPLICATE_APPLICATION);
        return;
      }
      setPostule(true);
      setNombre(corps?.candidatures ?? nombre + 1);
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
        onClick={postulerOffre}
        disabled={enCours}
        className="rounded-lg bg-[var(--cx-accent)] px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
      >
        {enCours ? "Envoi…" : "Postuler"}
      </button>
      <span className="text-xs text-[var(--cx-muted)]">
        {nombre} {nombre > 1 ? "candidatures" : "candidature"}
      </span>
      {erreur && (
        <span role="alert" className="text-xs text-red-600">
          {erreur}
        </span>
      )}
    </span>
  );
}
