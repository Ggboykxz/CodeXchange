"use client";

import { IconeAnimee } from "@/components/icone-animee";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  projectId: number;
  connecte: boolean;
  estAuteur: boolean;
  dejaMembre: boolean;
  compteur: number;
};

type CorpsReponse = { membres?: number; message?: string };

/**
 * Bouton « Je veux rejoindre » → POST /api/projects/[id]/join (idempotent).
 * Grisé et inactif si non connecté, si le projet est le sien ou si l'on est
 * déjà membre.
 */
export default function BoutonRejoindre({
  projectId,
  connecte,
  estAuteur,
  dejaMembre,
  compteur,
}: Props) {
  const router = useRouter();
  const [membre, setMembre] = useState(dejaMembre);
  const [nombre, setNombre] = useState(compteur);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  if (!connecte) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Connectez-vous pour rejoindre ce projet"
        className="cursor-not-allowed rounded-lg border border-cx-border px-4 py-2.5 text-sm text-cx-muted-fg opacity-60"
      >
        Je veux rejoindre · connectez-vous
      </button>
    );
  }

  if (estAuteur) {
    return (
      <span className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Vous êtes l'auteur de ce projet"
          className="cursor-not-allowed rounded-lg border border-cx-border px-4 py-2.5 text-sm text-cx-muted-fg opacity-60"
        >
          <IconeAnimee nom="coche" className="mr-1 inline size-3" /> Votre projet
        </button>
        <span className="text-xs text-cx-muted-fg">
          {nombre} {nombre > 1 ? "membres" : "membre"}
        </span>
      </span>
    );
  }

  if (membre) {
    return (
      <span className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Vous avez déjà rejoint ce projet"
          className="cursor-not-allowed rounded-lg border border-cx-accent bg-cx-accent/5 px-4 py-2.5 text-sm font-medium text-cx-accent"
        >
          <IconeAnimee nom="coche" className="mr-1 inline size-3" /> Vous avez rejoint ce projet
        </button>
        <span className="text-xs text-cx-muted-fg">
          {nombre} {nombre > 1 ? "membres" : "membre"}
        </span>
      </span>
    );
  }

  async function rejoindreProjet() {
    setEnCours(true);
    setErreur(null);
    try {
      const reponse = await fetch(`/api/projects/${projectId}/join`, { method: "POST" });
      const corps = (await reponse.json().catch(() => null)) as CorpsReponse | null;
      if (!reponse.ok) {
        setErreur(corps?.message ?? "Impossible de rejoindre ce projet.");
        return;
      }
      setMembre(true);
      setNombre(corps?.membres ?? nombre + 1);
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
        onClick={rejoindreProjet}
        disabled={enCours}
        className="rounded-lg bg-cx-accent px-4 py-2.5 text-sm font-semibold text-cx-accent-fg transition disabled:opacity-60"
      >
        {enCours ? "Envoi…" : "Je veux rejoindre"}
      </button>
      <span className="text-xs text-cx-muted-fg">
        {nombre} {nombre > 1 ? "membres" : "membre"}
      </span>
      {erreur && (
        <span role="alert" className="text-xs text-cx-destructive">
          {erreur}
        </span>
      )}
    </span>
  );
}
