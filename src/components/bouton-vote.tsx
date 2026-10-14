"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./toast";

export default function BoutonVote({
  postId,
  initialVote,
  initialScore,
  connecte,
}: {
  postId: number;
  initialVote: number;
  initialScore: number;
  connecte: boolean;
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

  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg border border-cx-border px-2 py-1 text-sm">
      <button type="button" aria-label="Upvote" disabled={enCours} onClick={() => void voter(1)} className={vote === 1 ? "text-cx-accent" : "text-cx-muted-fg hover:text-cx-accent"}>
        ▲
      </button>
      <span className="font-bold tabular-nums">{score}</span>
      <button type="button" aria-label="Downvote" disabled={enCours} onClick={() => void voter(-1)} className={vote === -1 ? "text-cx-primary" : "text-cx-muted-fg hover:text-cx-primary"}>
        ▼
      </button>
    </div>
  );
}
