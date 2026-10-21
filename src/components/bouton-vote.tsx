"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { RAYON } from "@/lib/design";
import { useToast } from "./toast";

/**
 * Contrôleur de vote : ▲ score ▼.
 * Orange (`cx-accent`) à la hausse, bleu (`cx-primary`) à la baisse — les
 * couleurs sémantiques de la plateforme.
 *
 * Variantes :
 * - `gouttiere` : colonne verticale (fila Reddit historique, page sujet) ;
 * - `encadre`   : colonne verticale dans un cadre arrondi ;
 * - `action`    : pastille horizontale ▲ n ▼ (ligne façon X).
 *
 * État : optimiste puis réconcilié avec le serveur. En cas de rejet (session
 * expirée, réseau), l'état revenu en arrière et un toast explicite l'annonce —
 * plus aucun vote fantôme collant après un 401.
 */
export default function BoutonVote({
  postId,
  initialVote,
  initialScore,
  connecte,
  variante = "gouttiere",
}: {
  postId: number;
  initialVote: number;
  initialScore: number;
  connecte: boolean;
  variante?: "gouttiere" | "encadre" | "action";
}) {
  const toast = useToast();
  const [vote, setVote] = useState<number>(initialVote);
  const [score, setScore] = useState(initialScore);
  const [annonce, setAnnonce] = useState("");
  const [enCours, demarrer] = useTransition();

  async function voter(direction: 1 | -1) {
    if (!connecte) {
      toast.info("Connexion requise", "Connecte-toi pour voter.");
      return;
    }
    const precedentVote = vote;
    demarrer(async () => {
      const nouvelleDirection = precedentVote === direction ? 0 : direction;
      const ancienVote = precedentVote;
      const scoreOptimiste = score - ancienVote + nouvelleDirection;
      // optimiste
      setVote(nouvelleDirection);
      setScore(scoreOptimiste);
      setAnnonce(
        nouvelleDirection === 0
          ? `Vote retiré. Score ${scoreOptimiste}.`
          : nouvelleDirection === 1
            ? `Vote positif enregistré. Score ${scoreOptimiste}.`
            : `Vote négatif enregistré. Score ${scoreOptimiste}.`,
      );
      try {
        const r = await fetch(`/api/forum/${postId}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ direction }),
        });
        const data = (await r.json().catch(() => null)) as { vote?: number } | null;
        if (r.ok && data && typeof data.vote === "number") {
          setVote(data.vote);
        } else {
          // Rejet serveur (401 session expirée, 404…) : retour en arrière.
          setVote(ancienVote);
          setScore((s) => s + ancienVote - nouvelleDirection);
          setAnnonce(`Vote impossible. Score ${score}.`);
          if (r.status === 401) {
            toast.info("Connexion requise", "Connecte-toi pour voter.");
          } else {
            toast.erreur("Vote impossible", "Le vote n'a pas pu être enregistré.");
          }
        }
      } catch {
        setVote(ancienVote);
        setScore((s) => s + ancienVote - nouvelleDirection);
        setAnnonce(`Vote impossible. Score ${score}.`);
        toast.erreur("Vote impossible", "Vérifie ta connexion réseau.");
      }
    });
  }

  const clsHaut =
    vote === 1
      ? "text-cx-accent"
      : "text-cx-muted-fg hover:text-cx-accent";
  const clsBas =
    vote === -1
      ? "text-cx-primary"
      : "text-cx-muted-fg hover:text-cx-primary";

  const verticale = variante !== "action";
  const clsScore =
    vote === 1 ? "text-cx-accent" : vote === -1 ? "text-cx-primary" : "text-cx-fg";

  const cadre = cn(
    variante === "encadre" && "border border-cx-border bg-cx-card px-2 py-1.5",
    variante === "encadre" && RAYON.md,
  );

  const cible = cn(
    "inline-flex cursor-pointer items-center justify-center transition active:scale-[0.97]",
    verticale ? "min-h-[44px] min-w-[44px]" : "min-h-9 min-w-9 rounded-full px-1.5",
  );

  const svgClasse = verticale ? "size-5" : "size-4";
  const flecheHaut = (
    <svg viewBox="0 0 24 24" className={svgClasse} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  );
  const flecheBas = (
    <svg viewBox="0 0 24 24" className={svgClasse} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M19 12l-7 7-7-7" />
    </svg>
  );

  if (!verticale) {
    return (
      <div
        className={cn("inline-flex items-center rounded-full transition", vertePadding(variante))}
        role="group"
        aria-label="Vote"
      >
        <button
          type="button"
          aria-label="Upvote"
          aria-pressed={vote === 1}
          disabled={enCours}
          aria-busy={enCours}
          onClick={() => void voter(1)}
          className={cn(cible, clsHaut, "hover:bg-cx-accent/10")}
        >
          {flecheHaut}
        </button>
        <span className={cn("min-w-[1.5rem] select-none text-center text-xs font-semibold tabular-nums", clsScore)}>
          {score}
        </span>
        <button
          type="button"
          aria-label="Downvote"
          aria-pressed={vote === -1}
          disabled={enCours}
          aria-busy={enCours}
          onClick={() => void voter(-1)}
          className={cn(cible, clsBas, "hover:bg-cx-primary/10")}
        >
          {flecheBas}
        </button>
        <span className="sr-only" role="status" aria-live="polite">
          {annonce}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col items-center gap-1 select-none", cadre)}
      role="group"
      aria-label="Vote"
    >
      <button
        type="button"
        aria-label="Upvote"
        aria-pressed={vote === 1}
        disabled={enCours}
        aria-busy={enCours}
        onClick={() => void voter(1)}
        className={cn(cible, clsHaut)}
      >
        {flecheHaut}
      </button>
      <span className={cn("text-sm font-bold tabular-nums", clsScore)}>{score}</span>
      <button
        type="button"
        aria-label="Downvote"
        aria-pressed={vote === -1}
        disabled={enCours}
        aria-busy={enCours}
        onClick={() => void voter(-1)}
        className={cn(cible, clsBas)}
      >
        {flecheBas}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {annonce}
      </span>
    </div>
  );
}

function vertePadding(variante: string): string {
  return variante === "action" ? "border border-transparent hover:border-cx-border" : "";
}
