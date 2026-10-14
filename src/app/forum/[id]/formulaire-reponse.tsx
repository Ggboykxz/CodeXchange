"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MESSAGE_FR } from "@/lib/errors";

const CLASS_CHAMP =
  "w-full rounded-lg border border-cx-border bg-cx-card px-3 py-2 text-sm outline-none focus:border-cx-primary focus:ring-2 focus:ring-cx-primary/30";

type Props = { postId: number; parentId?: number };
type CorpsReponse = { message?: string };

/** Formulaire de réponse → POST /api/forum/[id]/replies, puis rafraîchit la page. */
export default function FormulaireReponse({ postId, parentId }: Props) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function envoyerFormulaire(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formulaire = e.currentTarget;
    setEnCours(true);
    setErreur(null);

    try {
      const reponse = await fetch(`/api/forum/${postId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ corps: new FormData(formulaire).get("corps"), parentId: parentId ?? null }),
      });
      if (!reponse.ok) {
        const corps = (await reponse.json().catch(() => null)) as CorpsReponse | null;
        setErreur(corps?.message ?? MESSAGE_FR.FORUM_VALIDATION);
        return;
      }
      formulaire.reset();
      router.refresh();
    } catch {
      setErreur("Impossible de contacter le serveur. Réessayez dans un instant.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={envoyerFormulaire} className="mt-3 flex flex-col gap-3">
      <label htmlFor="corps" className="sr-only">
        Votre réponse
      </label>
      <textarea
        id="corps"
        name="corps"
        required
        rows={4}
        minLength={1}
        maxLength={2000}
        placeholder="Votre réponse… (1 à 2 000 caractères)"
        className={`${CLASS_CHAMP} resize-y`}
      />
      {erreur && (
        <p role="alert" className="rounded-lg bg-cx-destructive/5 px-3 py-2 text-sm text-cx-destructive">
          {erreur}
        </p>
      )}
      <div>
        <button
          type="submit"
          disabled={enCours}
          className="rounded-lg bg-[var(--cx-accent)] px-4 py-2.5 text-sm font-semibold text-cx-accent-fg disabled:opacity-60"
        >
          {enCours ? "Envoi…" : "Publier la réponse"}
        </button>
      </div>
    </form>
  );
}
