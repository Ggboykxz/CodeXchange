"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { RAYON } from "@/lib/design";
import { Icone } from "@/components/icones";
import type { EtatRepost } from "@/lib/reposts";

type Props = {
  postId: number;
  slug?: string;
  initial: EtatRepost;
  connecte: boolean;
};

type CorpsErr = { message?: string };

/**
 * Bouton « Repost » (partage interne) + copie du lien externe.
 * Toggle optimiste : repost → annulation. La copie du lien utilise le
 * presse-papiers avec repli `execCommand` et un retour visuel « Copié ✓ ».
 */
export default function BoutonRepost({ postId, initial, connecte }: Props) {
  const router = useRouter();
  const [etat, setEtat] = useState<EtatRepost>(initial);
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [copie, setCopie] = useState(false);

  function basculer() {
    if (!connecte) {
      setErreur("Connectez-vous pour reposter.");
      return;
    }
    const precedent = etat;
    setErreur(null);
    setEtat((e) => ({ repostes: Math.max(0, e.repostes + (e.jeLaiReposte ? -1 : 1)), jeLaiReposte: !e.jeLaiReposte }));
    demarrer(async () => {
      try {
        const r = await fetch("/api/reposts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId }),
        });
        const corps = (await r.json().catch(() => null)) as EtatRepost | CorpsErr | null;
        if (!r.ok) {
          setEtat(precedent);
          setErreur((corps as CorpsErr)?.message ?? "Une erreur est survenue.");
          return;
        }
        setEtat(corps as EtatRepost);
        router.refresh();
      } catch {
        setEtat(precedent);
        setErreur("Impossible de contacter le serveur.");
      }
    });
  }

  async function copierLien() {
    const url = typeof window !== "undefined" ? `${window.location.origin}/forum/${postId}` : `/forum/${postId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // repli navigateurs anciens
      const zone = document.createElement("textarea");
      zone.value = url;
      document.body.appendChild(zone);
      zone.select();
      try {
        document.execCommand("copy");
      } catch {
        /* ignoré */
      }
      document.body.removeChild(zone);
    }
    setCopie(true);
    setTimeout(() => setCopie(false), 1600);
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <span className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={basculer}
          disabled={enCours}
          aria-busy={enCours}
          aria-pressed={etat.jeLaiReposte}
          className={cn(
            "inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 border px-3 py-2 text-xs font-semibold transition disabled:opacity-60 active:scale-[0.97]",
            RAYON.md,
            etat.jeLaiReposte
              ? "border-cx-success/60 bg-cx-success/5 text-cx-success"
              : "border-cx-border bg-cx-card text-cx-card-fg hover:border-cx-success/60 hover:text-cx-success",
          )}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M17 1l4 4-4 4" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <path d="M7 23l-4-4 4-4" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
          Repost
          {etat.repostes > 0 ? <span className="tabular-nums">{etat.repostes}</span> : null}
        </button>
        <button
          type="button"
          onClick={copierLien}
          className={cn(
            "inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 border border-cx-border bg-cx-card px-3 py-2 text-xs font-semibold text-cx-card-fg transition hover:border-cx-primary/60 hover:text-cx-primary active:scale-[0.97]",
            RAYON.md,
          )}
        >
          {copie ? <Icone nom="copie" className="h-4 w-4" /> : <Icone nom="partage" className="h-4 w-4" />}
          {copie ? "Lien copié" : "Partager"}
        </button>
      </span>
      {erreur ? (
        <span role="alert" className="text-xs text-cx-destructive">
          {erreur}
        </span>
      ) : null}
    </span>
  );
}
