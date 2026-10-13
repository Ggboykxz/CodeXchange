"use client";

import { useState } from "react";
import type { KindSignalement } from "@/lib/reports";

type Props = { kind: KindSignalement; targetId: number; libelle?: string };

export default function BoutonSignaler({ kind, targetId, libelle = "Signaler" }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const [raison, setRaison] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

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
        setMessage("Signalement envoyé. Merci !");
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
        className="rounded-md px-2 py-1 text-xs font-medium text-cx-muted-fg hover:bg-cx-muted"
      >
        ⚑ {libelle}
      </button>
      {ouvert ? (
        <span className="mt-2 flex flex-col gap-2 rounded-lg border border-cx-border bg-cx-card p-2">
          <input
            value={raison}
            onChange={(e) => setRaison(e.target.value)}
            maxLength={500}
            placeholder="Motif du signalement…"
            className="w-full rounded-md border border-cx-border bg-transparent px-2 py-1 text-xs outline-none focus:border-cx-primary"
          />
          <span className="flex gap-2">
            <button
              type="button"
              onClick={envoyer}
              disabled={busy}
              className="rounded-md bg-cx-primary px-2 py-1 text-xs font-semibold text-cx-primary-fg"
            >
              Envoyer
            </button>
            <button
              type="button"
              onClick={() => setOuvert(false)}
              className="rounded-md px-2 py-1 text-xs text-cx-muted-fg hover:bg-cx-muted"
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
