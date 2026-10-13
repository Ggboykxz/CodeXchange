"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";

type Props = { destinataireId: number; onEnvoye: () => void };

export default function FormulaireMessage({ destinataireId, onEnvoye }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [texte, setTexte] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function envoyer() {
    if (!texte.trim() || busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/messagerie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: destinataireId, corps: texte }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => null);
        toast.erreur("Envoi impossible", data?.message ?? "Réessayez dans un instant.");
        return;
      }
      setTexte("");
      toast.succes("Message envoyé");
      onEnvoye?.();
      router.refresh();
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  // Garde le focus clavier après l'envoi (mobile : le clavier reste ouvert).
  useEffect(() => {
    inputRef.current?.focus();
  }, [destinataireId]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void envoyer();
      }}
      className="flex gap-2"
    >
      <input
        ref={inputRef}
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        placeholder="Écrire un message…"
        maxLength={2000}
        aria-label="Écrire un message"
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
