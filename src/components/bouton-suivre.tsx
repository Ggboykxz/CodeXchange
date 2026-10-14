"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icone } from "@/components/icones";
import type { CompteursSuivi } from "@/lib/follows";

type Props = {
  cibleId: number;
  initial: CompteursSuivi;
  connecte: boolean;
};

type CorpsErr = { message?: string };

/**
 * Bouton « Suivre » / « Abonné » (réseau social). Toggle optimiste avec
 * compteurs d'abonnés/abonnements mis à jour immédiatement.
 */
export default function BoutonSuivre({ cibleId, initial, connecte }: Props) {
  const router = useRouter();
  const [etat, setEtat] = useState<CompteursSuivi>(initial);
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  function basculer() {
    if (!connecte) {
      setErreur("Connectez-vous pour suivre ce membre.");
      return;
    }
    const precedent = etat;
    setErreur(null);
    // Optimiste : inverse localement.
    setEtat((e) => ({
      ...e,
      jeLeSuis: !e.jeLeSuis,
      abonnes: Math.max(0, e.abonnes + (e.jeLeSuis ? -1 : 1)),
    }));
    demarrer(async () => {
      try {
        const r = await fetch("/api/users/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: cibleId }),
        });
        const corps = (await r.json().catch(() => null)) as CompteursSuivi | CorpsErr | null;
        if (!r.ok) {
          setEtat(precedent);
          setErreur((corps as CorpsErr)?.message ?? "Une erreur est survenue.");
          return;
        }
        setEtat(corps as CompteursSuivi);
        router.refresh();
      } catch {
        setEtat(precedent);
        setErreur("Impossible de contacter le serveur.");
      }
    });
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={basculer}
        disabled={enCours}
        aria-pressed={etat.jeLeSuis}
        className={`inline-flex min-h-[40px] cursor-pointer items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold transition disabled:opacity-60 ${
          etat.jeLeSuis
            ? "border border-cx-border bg-cx-muted text-cx-fg hover:border-cx-destructive/50 hover:text-cx-destructive"
            : "bg-cx-primary text-cx-primary-fg hover:opacity-90"
        }`}
      >
        {etat.jeLeSuis ? <Icone nom="coche" className="h-4 w-4" /> : null}
        {etat.jeLeSuis ? "Abonné" : "Suivre"}
      </button>
      <span className="text-xs text-cx-muted-fg">
        {etat.abonnes} abonné{etat.abonnes > 1 ? "s" : ""} · {etat.abonnements} abonnement
        {etat.abonnements > 1 ? "s" : ""}
      </span>
      {erreur ? (
        <span role="alert" className="text-xs text-cx-destructive">
          {erreur}
        </span>
      ) : null}
    </span>
  );
}
