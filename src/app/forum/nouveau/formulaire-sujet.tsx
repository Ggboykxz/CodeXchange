"use client";

import Link from "next/link";
import { useState } from "react";
import { MESSAGE_FR } from "@/lib/errors";

const CLASS_CHAMP =
  "w-full rounded-lg border border-[var(--cx-muted)]/40 bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--cx-accent)] focus:ring-2 focus:ring-[var(--cx-accent)]/30";

type CorpsReponse = { message?: string };

/** Formulaire de création d'un sujet → POST /api/forum. */
export default function FormulaireSujet() {
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function envoyerFormulaire(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);
    const donnees = new FormData(e.currentTarget);
    const tags = String(donnees.get("tags") ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    try {
      const reponse = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: donnees.get("titre"),
          corps: donnees.get("corps"),
          tags,
        }),
      });
      if (!reponse.ok) {
        const corps = (await reponse.json().catch(() => null)) as CorpsReponse | null;
        setErreur(corps?.message ?? MESSAGE_FR.FORUM_VALIDATION);
        return;
      }
      const { id } = (await reponse.json()) as { id: number };
      window.location.href = `/forum/${id}`;
    } catch {
      setErreur("Impossible de contacter le serveur. Réessayez dans un instant.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={envoyerFormulaire} className="flex flex-col gap-4">
      <div>
        <label htmlFor="titre" className="mb-1 block text-sm font-medium">
          Titre du sujet
        </label>
        <input
          id="titre"
          name="titre"
          type="text"
          required
          minLength={8}
          maxLength={120}
          placeholder="Bug Flutter sur Android 14 : crash au démarrage"
          className={CLASS_CHAMP}
        />
        <p className="mt-1 text-xs text-[var(--cx-muted)]">8 à 120 caractères.</p>
      </div>

      <div>
        <label htmlFor="corps" className="mb-1 block text-sm font-medium">
          Corps du sujet
        </label>
        <textarea
          id="corps"
          name="corps"
          required
          rows={8}
          maxLength={5000}
          placeholder="Décrivez le contexte, ce que vous avez essayé et le résultat attendu."
          className={`${CLASS_CHAMP} resize-y`}
        />
        <p className="mt-1 text-xs text-[var(--cx-muted)]">5 000 caractères maximum.</p>
      </div>

      <div>
        <label htmlFor="tags" className="mb-1 block text-sm font-medium">
          Tags
        </label>
        <input
          id="tags"
          name="tags"
          type="text"
          required
          placeholder="flutter, android, gabon"
          className={CLASS_CHAMP}
        />
        <p className="mt-1 text-xs text-[var(--cx-muted)]">
          1 à 3 tags séparés par des virgules.
        </p>
      </div>

      {erreur && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {erreur}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={enCours}
          className="rounded-lg bg-[var(--cx-accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {enCours ? "Publication…" : "Publier le sujet"}
        </button>
        <Link
          href="/forum"
          className="rounded-lg border border-[var(--cx-muted)]/40 px-4 py-2.5 text-sm font-medium"
        >
          Annuler
        </Link>
      </div>
    </form>
  );
}
