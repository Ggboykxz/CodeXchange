"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";

type Option = { id: number; label: string; votes: number; userVoted: boolean };

export default function BoutonSondage({
  postId,
  question,
  options,
  total,
  userVoted,
  connecte,
}: {
  postId: number;
  question: string;
  options: Option[];
  total: number;
  userVoted: boolean;
  connecte: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [enCours, demarrer] = useTransition();
  const [opts, setOpts] = useState<Option[]>(options);
  const [totalVotes, setTotal] = useState(total);
  const [voted, setVoted] = useState(userVoted);

  async function voter(optionId: number) {
    if (!connecte) {
      toast.info("Connexion requise", "Connecte-toi pour voter.");
      return;
    }
    if (voted) {
      toast.info("Déjà voté", "Tu as déjà exprimé ton choix.");
      return;
    }
    demarrer(async () => {
      const r = await fetch(`/api/forum/${postId}/poll/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      if (!r.ok) {
        toast.erreur("Vote impossible");
        return;
      }
      // Optimiste : incrémente l'option choisie.
      setOpts((prev) => prev.map((o) => ({ ...o, votes: o.id === optionId ? o.votes + 1 : o.votes })));
      setTotal((t) => t + 1);
      setVoted(true);
      toast.succes("Vote enregistré");
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-cx-border bg-cx-card p-5">
      <h3 className="text-base font-semibold">{question}</h3>
      <div className="mt-3 flex flex-col gap-2">
        {opts.map((option) => {
          const pourcent = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
          return (
            <button
              key={option.id}
              type="button"
              disabled={voted || enCours || !connecte}
              onClick={() => void voter(option.id)}
              className={`relative overflow-hidden rounded-lg border px-4 py-2 text-left text-sm font-medium transition ${option.userVoted ? "border-cx-primary text-cx-primary" : "border-cx-border hover:bg-cx-muted"}`}
            >
              <span className="absolute inset-y-0 left-0 bg-cx-primary/10" style={{ width: `${pourcent}%` }} />
              <span className="relative z-10 flex items-center justify-between gap-2">
                <span>{option.label}</span>
                <span className="text-xs text-cx-muted-fg">{pourcent}% · {option.votes}</span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-cx-muted-fg">{totalVotes} vote{totalVotes > 1 ? "s" : ""}.</p>
      {!connecte ? <p className="mt-1 text-xs text-cx-muted-fg">Connecte-toi pour voter.</p> : null}
    </section>
  );
}
