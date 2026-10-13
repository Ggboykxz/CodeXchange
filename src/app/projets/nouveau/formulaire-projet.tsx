"use client";

import Link from "next/link";
import { useState } from "react";
import { MESSAGE_FR } from "@/lib/errors";

const CLASS_CHAMP =
  "w-full rounded-lg border border-[var(--cx-muted)]/40 bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--cx-accent)] focus:ring-2 focus:ring-[var(--cx-accent)]/30";

type CorpsReponse = { id?: number; message?: string };

/** Formulaire de lancement d'un projet → POST /api/projects, puis redirection. */
export default function FormulaireProjet() {
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function envoyerFormulaire(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);
    const donnees = new FormData(e.currentTarget);

    try {
      const reponse = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: donnees.get("titre"),
          description: donnees.get("description"),
          stack: donnees.get("stack"),
          cherche: donnees.get("cherche"),
          lien: donnees.get("lien"),
        }),
      });
      if (!reponse.ok) {
        const corps = (await reponse.json().catch(() => null)) as CorpsReponse | null;
        setErreur(corps?.message ?? MESSAGE_FR.FORUM_VALIDATION);
        return;
      }
      const { id } = (await reponse.json()) as CorpsReponse;
      window.location.href = `/projets/${id}`;
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
          Nom du projet
        </label>
        <input
          id="titre"
          name="titre"
          type="text"
          required
          maxLength={120}
          placeholder="Carnet de bord des pêcheurs de Port-Gentil"
          className={CLASS_CHAMP}
        />
        <p className="mt-1 text-xs text-[var(--cx-muted)]">120 caractères max.</p>
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          maxLength={2000}
          rows={5}
          placeholder="Le problème réglé, l&apos;état d&apos;avancement, la stack…"
          className={CLASS_CHAMP}
        />
        <p className="mt-1 text-xs text-[var(--cx-muted)]">2 000 caractères max.</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="sm:flex-1">
          <label htmlFor="stack" className="mb-1 block text-sm font-medium">
            Stack technique
          </label>
          <input
            id="stack"
            name="stack"
            type="text"
            placeholder="Flutter,Node,Postgres"
            className={CLASS_CHAMP}
          />
          <p className="mt-1 text-xs text-[var(--cx-muted)]">Séparée par des virgules.</p>
        </div>

        <div className="sm:flex-1">
          <label htmlFor="cherche" className="mb-1 block text-sm font-medium">
            On cherche…
          </label>
          <input
            id="cherche"
            name="cherche"
            type="text"
            placeholder="Designer,Mobile"
            className={CLASS_CHAMP}
          />
          <p className="mt-1 text-xs text-[var(--cx-muted)]">Séparée par des virgules.</p>
        </div>
      </div>

      <div>
        <label htmlFor="lien" className="mb-1 block text-sm font-medium">
          Lien du projet (facultatif)
        </label>
        <input
          id="lien"
          name="lien"
          type="url"
          placeholder="https://github.com/equipe/projet"
          className={CLASS_CHAMP}
        />
        <p className="mt-1 text-xs text-[var(--cx-muted)]">
          URL complète, en http:// ou https:// — dépôt, site ou maquette.
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
          {enCours ? "Publication…" : "Lancer le projet"}
        </button>
        <Link
          href="/projets"
          className="rounded-lg border border-[var(--cx-muted)]/40 px-4 py-2.5 text-sm font-medium"
        >
          Annuler
        </Link>
      </div>
    </form>
  );
}
