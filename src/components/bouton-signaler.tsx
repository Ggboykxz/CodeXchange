"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { RAYON } from "@/lib/design";
import { useToast } from "@/components/toast";
import type { KindSignalement } from "@/lib/reports";
import { Icone } from "@/components/icones";

type Props = { kind: KindSignalement; targetId: number; libelle?: string };

export default function BoutonSignaler({ kind, targetId, libelle = "Signaler" }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const [raison, setRaison] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function envoyer() {
    if (raison.trim().length < 3) {
      setMessage("Merci de préciser un motif (3 caractères minimum).");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/signalements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, targetId, raison }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => null);
        setMessage(data?.message ?? "Échec de l'envoi du signalement.");
      } else {
        toast.succes("Signalement envoyé", "Merci, un administrateur va l'examiner.");
        setOuvert(false);
        setRaison("");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-block">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        className={cn(
          "inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 px-2 text-xs font-medium text-cx-muted-fg transition hover:bg-cx-muted active:scale-[0.97]",
          RAYON.md,
        )}
      >
        <Icone nom="signaler" className="size-3.5" />
        {libelle}
      </button>
      {ouvert ? (
        <span className="mt-2 flex flex-col gap-2 rounded-lg border border-cx-border bg-cx-card p-2">
          <input
            value={raison}
            onChange={(e) => setRaison(e.target.value)}
            maxLength={500}
            placeholder="Motif du signalement…"
            className="w-full rounded-md border border-cx-border-fort bg-cx-card px-2 py-1 text-xs outline-none focus:border-cx-primary focus:ring-2 focus:ring-cx-primary/30"
          />
          <span className="flex gap-2">
            <button
              type="button"
              onClick={envoyer}
              disabled={busy}
                aria-busy={busy}
              className={cn(
                "min-h-[44px] cursor-pointer bg-cx-primary px-2 text-xs font-semibold text-cx-primary-fg active:scale-[0.97]",
                RAYON.md,
              )}
            >
              Envoyer
            </button>
            <button
              type="button"
              onClick={() => setOuvert(false)}
              className={cn(
                "min-h-[44px] cursor-pointer px-2 text-xs text-cx-muted-fg transition hover:bg-cx-muted active:scale-[0.97]",
                RAYON.md,
              )}
            >
              Annuler
            </button>
          </span>
          {message ? <span className="text-xs text-cx-muted-fg">{message}</span> : null}
        </span>
      ) : null}
    </span>
  );
}
