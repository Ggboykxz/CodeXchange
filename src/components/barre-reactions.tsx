"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { REACTIONS, type ReactionCounts } from "@/lib/reactions";
import { Icone } from "@/components/icones";
import { fetchWithCsrf } from "@/lib/csrf-client";

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
 * Barre de réactions sociales. Pour réduire la charge cognitive (heuristique
 * « minimalisme »), la rangée complète n'est révélée qu'à la demande via un
 * bouton « Réagir » unique ; l'état courant (emoji + total) reste visible.
 * Toggle optimiste : cliquer un emoji le pose/remplace ; re-cliquer le retire.
 */
export default function BarreReactions({ kind, targetId, initial, connecte, compact = false }: Props) {
  const router = useRouter();
  const [etat, setEtat] = useState<ReactionCounts>(initial);
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fermeture au clic extérieur / Échap.
  useEffect(() => {
    if (!ouvert) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOuvert(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOuvert(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [ouvert]);

  function choisir(emoji: string) {
    if (!connecte) {
      setErreur("Connectez-vous pour réagir.");
      return;
    }
    const precedent = etat;
    setErreur(null);
    setEtat((e) => {
      const totaux = { ...e.totaux };
      let total = e.total;
      if (e.maReaction === emoji) {
        totaux[emoji] = Math.max(0, totaux[emoji] - 1);
        total = Math.max(0, total - 1);
        return { totaux, maReaction: null, total };
      }
      if (e.maReaction) {
        totaux[e.maReaction] = Math.max(0, totaux[e.maReaction] - 1);
        total = Math.max(0, total - 1);
      }
      totaux[emoji] = totaux[emoji] + 1;
      total = total + 1;
      return { totaux, maReaction: emoji, total };
    });

    demarrer(async () => {
      try {
        const r = await fetchWithCsrf("/api/reactions", {
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
    // Ferme le panneau après la sélection.
    setOuvert(false);
  }

  const taille = compact ? "px-1.5 py-0.5 text-base" : "px-2.5 py-1.5 text-sm";
  const courant = etat.maReaction;

  return (
    <div ref={ref} className="flex flex-wrap items-center gap-1.5">
      {/* Résumé compact : emoji courant + total. */}
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-expanded={ouvert}
        aria-haspopup="true"
        aria-label={`Réagir${etat.total > 0 ? `, ${etat.total} réactions` : ""}`}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-sm font-medium transition ${
          courant
            ? "border-cx-primary bg-cx-primary/[.08] text-cx-primary"
            : "border-cx-border bg-cx-card/50 text-cx-muted-fg hover:border-cx-primary/60 hover:bg-cx-muted"
        }`}
      >
        <Icone nom="coeur" className="size-4" />
        {courant ? <span aria-hidden>{courant}</span> : null}
        {etat.total > 0 ? <span className="tabular-nums">{etat.total}</span> : null}
        <span className="text-xs">{ouvert ? "▲" : "▼"}</span>
      </button>

      {ouvert ? (
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Choisir une réaction">
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
                className={`group relative inline-flex items-center gap-1.5 rounded-full border ${taille} font-medium transition duration-150 ease-out disabled:opacity-60 ${
                  actif
                    ? "border-cx-primary bg-cx-primary/[.08] text-cx-primary"
                    : "border-cx-border bg-cx-card/50 hover:border-cx-primary/60 hover:bg-cx-muted"
                }`}
              >
                <span aria-hidden>{r.emoji}</span>
                {n > 0 ? <span className="min-w-[1ch] tabular-nums">{n}</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {erreur ? (
        <span role="alert" className="ml-1 text-xs text-cx-destructive">
          {erreur}
        </span>
      ) : null}
    </div>
  );
}
