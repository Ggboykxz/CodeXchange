"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { REACTIONS, type ReactionCounts } from "@/lib/reactions";

type Props = {
  kind: "post" | "reply";
  targetId: number;
  initial: ReactionCounts;
  connecte: boolean;
  /** Variante compacte pour les réponses. */
  compact?: boolean;
};

type CorpsErr = { message?: string };

/**
 * Barre de réactions sociales (👍❤️🎉🤔🔥🚀) pour un post ou une réponse.
 * Toggle optimiste : cliquer un emoji le pose/remplace ; re-cliquer le retire.
 * Accessible : chaque bouton expose `aria-pressed` et un libellé lisible.
 */
export default function BarreReactions({ kind, targetId, initial, connecte, compact = false }: Props) {
  const router = useRouter();
  const [etat, setEtat] = useState<ReactionCounts>(initial);
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  function choisir(emoji: string) {
    if (!connecte) {
      setErreur("Connectez-vous pour réagir.");
      return;
    }
    const precedent = etat;
    setErreur(null);
    // Mise à jour optimiste immédiate.
    setEtat((e) => {
      const totaux = { ...e.totaux };
      let total = e.total;
      if (e.maReaction === emoji) {
        // Toggle off.
        totaux[emoji] = Math.max(0, totaux[emoji] - 1);
        total = Math.max(0, total - 1);
        return { totaux, maReaction: null, total };
      }
      if (e.maReaction) {
        // Remplacement : décrémente l'ancien.
        totaux[e.maReaction] = Math.max(0, totaux[e.maReaction] - 1);
        total = Math.max(0, total - 1);
      }
      totaux[emoji] = totaux[emoji] + 1;
      total = total + 1;
      return { totaux, maReaction: emoji, total };
    });

    demarrer(async () => {
      try {
        const r = await fetch("/api/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, targetId, emoji }),
        });
        const corps = (await r.json().catch(() => null)) as ReactionCounts | CorpsErr | null;
        if (!r.ok) {
          setEtat(precedent);
          setErreur((corps as CorpsErr)?.message ?? "Une erreur est survenue.");
          return;
        }
        setEtat(corps as ReactionCounts);
        router.refresh();
      } catch {
        setEtat(precedent);
        setErreur("Impossible de contacter le serveur.");
      }
    });
  }

  const taille = compact ? "px-1.5 py-0.5 text-base" : "px-2 py-1 text-lg";

  return (
    <div className="flex flex-wrap items-center gap-1">
      {REACTIONS.map((r) => {
        const actif = etat.maReaction === r.emoji;
        const n = etat.totaux[r.emoji] ?? 0;
        return (
          <button
            key={r.emoji}
            type="button"
            onClick={() => choisir(r.emoji)}
            disabled={enCours}
            aria-pressed={actif}
            aria-label={`${r.label}${n > 0 ? `, ${n}` : ""}`}
            title={r.label}
            className={`inline-flex items-center gap-1 rounded-full border transition ${taille} disabled:opacity-60 ${
              actif
                ? "border-cx-primary bg-cx-primary/5 font-semibold"
                : "border-cx-border hover:border-cx-primary/60 hover:bg-cx-muted"
            }`}
          >
            <span aria-hidden className={actif ? "animate-[pop-in_0.25s_ease]" : ""}>
              {r.emoji}
            </span>
            {n > 0 ? (
              <span className={`text-xs tabular-nums ${actif ? "text-cx-primary" : "text-cx-muted-fg"}`}>
                {n}
              </span>
            ) : null}
          </button>
        );
      })}
      {erreur ? (
        <span role="alert" className="ml-1 text-xs text-cx-destructive">
          {erreur}
        </span>
      ) : null}
    </div>
  );
}
