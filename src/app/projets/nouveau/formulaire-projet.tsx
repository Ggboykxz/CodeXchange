"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MESSAGE_FR } from "@/lib/errors";

const CLASS_CHAMP =
  "w-full rounded-lg border border-cx-border bg-cx-card px-3 py-2 text-sm outline-none focus:border-cx-primary focus:ring-2 focus:ring-cx-primary/30";

type CorpsReponse = { id?: number; message?: string };

/** Formulaire de lancement d'un projet → POST /api/projects, puis redirection. */
export default function FormulaireProjet() {
  const [erreur, setErreur] = useState<string | null>(null);
  const router = useRouter();
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
      router.push( `/projets/${id}`);
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
        <p className="mt-1 text-xs text-cx-muted-fg">120 caractères max.</p>
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
        <p className="mt-1 text-xs text-cx-muted-fg">2 000 caractères max.</p>
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
          <p className="mt-1 text-xs text-cx-muted-fg">Séparée par des virgules.</p>
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
          <p className="mt-1 text-xs text-cx-muted-fg">Séparée par des virgules.</p>
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
        <p className="mt-1 text-xs text-cx-muted-fg">
          URL complète, en http:// ou https:// — dépôt, site ou maquette.
        </p>
      </div>

      {erreur && (
        <p role="alert" className="rounded-lg bg-cx-destructive/5 px-3 py-2 text-sm text-cx-destructive">
          {erreur}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={enCours}
          className="rounded-lg bg-cx-accent px-4 py-2.5 text-sm font-semibold text-cx-accent-fg disabled:opacity-60"
        >
          {enCours ? "Publication…" : "Lancer le projet"}
        </button>
        <Link
          href="/projets"
          className="rounded-lg border border-cx-border px-4 py-2.5 text-sm font-medium"
        >
          Annuler
        </Link>
      </div>
    </form>
  );
}
