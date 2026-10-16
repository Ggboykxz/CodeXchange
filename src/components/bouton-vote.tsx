"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { RAYON } from "@/lib/design";
import { useToast } from "./toast";

/**
 * Contrôleur de vote vertical façon Reddit : ▲ score ▼.
 * Orange (`cx-accent`) à la hausse, bleu (`cx-primary`) à la baisse — les
 * couleurs sémantiques de la plateforme correspondent à celles de Reddit.
 * Rendu « gouttière » (sans cadre) ou encadré selon `variante`.
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
  variante?: "gouttiere" | "encadre";
}) {
  const router = useRouter();
  const toast = useToast();
  const [vote, setVote] = useState<number>(initialVote);
  const [score, setScore] = useState(initialScore);
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
      // optimiste
      setVote(nouvelleDirection);
      setScore((s) => s - ancienVote + nouvelleDirection);
      try {
        const r = await fetch(`/api/forum/${postId}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ direction }),
        });
        const data = await r.json();
        if (typeof data.vote === "number") setVote(data.vote);
      } catch {
        setVote(ancienVote);
        setScore(initialScore);
        toast.erreur("Vote impossible");
      } finally {
        router.refresh();
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
  const clsScore =
    vote === 1 ? "text-cx-accent" : vote === -1 ? "text-cx-primary" : "text-cx-fg";

  const cadre = cn(
    variante === "encadre" && "border border-cx-border bg-cx-card px-2 py-1.5",
    variante === "encadre" && RAYON.md,
  );

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
        className={cn(
          "inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center transition active:scale-[0.97]",
          clsHaut,
        )}
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 19V5" />
          <path d="M5 12l7-7 7 7" />
        </svg>
      </button>
      <span className={`text-xs font-bold tabular-nums ${clsScore}`}>{score}</span>
      <button
        type="button"
        aria-label="Downvote"
        aria-pressed={vote === -1}
        disabled={enCours}
        aria-busy={enCours}
        onClick={() => void voter(-1)}
        className={cn(
          "inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center transition active:scale-[0.97]",
          clsBas,
        )}
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 5v14" />
          <path d="M19 12l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}
