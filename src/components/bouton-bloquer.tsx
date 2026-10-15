"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { RAYON } from "@/lib/design";

type Props = { cibleId: number; bloqueInitialement: boolean; connecte: boolean };

type CorpsErr = { message?: string };

/**
 * Bouton « Bloquer / Débloquer » un membre. Action sensible : demande une
 * confirmation avant le premier blocage. Toggle optimiste avec retour serveur.
 */
export default function BoutonBloquer({ cibleId, bloqueInitialement, connecte }: Props) {
  const router = useRouter();
  const [bloque, setBloque] = useState(bloqueInitialement);
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirme, setConfirme] = useState(false);

  function agir() {
    if (!connecte) {
      setErreur("Connectez-vous pour bloquer ce membre.");
      return;
    }
    // Confirmation avant le premier blocage (pas pour débloquer).
    if (!bloque && !confirme) {
      setConfirme(true);
      return;
    }
    const precedent = bloque;
    setErreur(null);
    setConfirme(false);
    setBloque(!bloque); // optimiste
    demarrer(async () => {
      try {
        const r = await fetch("/api/users/block", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: cibleId }),
        });
        const corps = (await r.json().catch(() => null)) as { blocked?: boolean } | CorpsErr | null;
        if (!r.ok) {
          setBloque(precedent);
          setErreur((corps as CorpsErr)?.message ?? "Une erreur est survenue.");
          return;
        }
        setBloque((corps as { blocked?: boolean })?.blocked ?? !precedent);
        router.refresh();
      } catch {
        setBloque(precedent);
        setErreur("Impossible de contacter le serveur.");
      }
    });
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={agir}
        disabled={enCours}
        aria-busy={enCours}
        aria-pressed={bloque}
        className={cn(
          "inline-flex min-h-[44px] cursor-pointer items-center border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 active:scale-[0.97]",
          RAYON.md,
          bloque
            ? "border-cx-destructive/60 bg-cx-destructive/5 text-cx-destructive"
            : "border-cx-border text-cx-muted-fg hover:border-cx-destructive/50 hover:text-cx-destructive",
        )}
      >
        {bloque ? "Débloquer" : confirme ? "Confirmer le blocage ?" : "Bloquer"}
      </button>
      {erreur ? (
        <span role="alert" className="text-xs text-cx-destructive">
          {erreur}
        </span>
      ) : null}
    </span>
  );
}
