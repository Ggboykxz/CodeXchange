"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { destinataireId: number; onEnvoye: () => void };

export default function FormulaireMessage({ destinataireId, onEnvoye }: Props) {
  const router = useRouter();
  const [texte, setTexte] = useState("");
  const [busy, setBusy] = useState(false);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!texte.trim()) return;
    setBusy(true);
    try {
      await fetch("/api/messagerie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: destinataireId, corps: texte }),
      });
      setTexte("");
      onEnvoye?.();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={envoyer} className="flex gap-2">
      <input
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        placeholder="Écrire un message…"
        maxLength={2000}
        className="flex-1 rounded-lg border border-cx-border bg-transparent px-3 py-2 text-sm outline-none focus:border-cx-primary"
      />
      <button
        type="submit"
        disabled={busy || !texte.trim()}
        className="rounded-lg bg-cx-primary px-4 py-2 text-sm font-semibold text-cx-primary-fg"
      >
        Envoyer
      </button>
    </form>
  );
}
