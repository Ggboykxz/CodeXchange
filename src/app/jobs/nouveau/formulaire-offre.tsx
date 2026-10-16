"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CONTRATS } from "@/lib/contrats";
import { MESSAGE_FR } from "@/lib/errors";

const CLASS_CHAMP =
  "w-full rounded-lg border border-cx-border-fort bg-cx-card px-3 py-2 text-sm outline-none focus:border-cx-primary focus:ring-2 focus:ring-cx-primary/30";

type CorpsReponse = { id?: number; message?: string };

/** Formulaire de publication d'une offre → POST /api/jobs, puis redirection. */
export default function FormulaireOffre() {
  const [erreur, setErreur] = useState<string | null>(null);
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function envoyerFormulaire(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);
    const donnees = new FormData(e.currentTarget);

    try {
      const reponse = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: donnees.get("titre"),
          entreprise: donnees.get("entreprise"),
          contrat: donnees.get("contrat"),
          remote: donnees.get("remote") === "on",
          pays: donnees.get("pays"),
          ville: donnees.get("ville"),
          lien: donnees.get("lien"),
        }),
      });
      if (!reponse.ok) {
        const corps = (await reponse.json().catch(() => null)) as CorpsReponse | null;
        setErreur(corps?.message ?? MESSAGE_FR.FORUM_VALIDATION);
        return;
      }
      const { id } = (await reponse.json()) as CorpsReponse;
      router.push( `/jobs/${id}`);
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
          Titre de l&apos;offre
        </label>
        <input
          id="titre"
          name="titre"
          type="text"
          required
          minLength={3}
          maxLength={120}
          placeholder="Développeur Flutter pour fintech (remote)"
          className={CLASS_CHAMP}
        />
        <p className="mt-1 text-xs text-cx-muted-fg">3 à 120 caractères.</p>
      </div>

      <div>
        <label htmlFor="entreprise" className="mb-1 block text-sm font-medium">
          Entreprise
        </label>
        <input
          id="entreprise"
          name="entreprise"
          type="text"
          required
          maxLength={120}
          placeholder="Microfinance Numérique"
          className={CLASS_CHAMP}
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="sm:flex-1">
          <label htmlFor="contrat" className="mb-1 block text-sm font-medium">
            Type de contrat
          </label>
          <select id="contrat" name="contrat" required defaultValue="CDI" className={CLASS_CHAMP}>
            {CONTRATS.map((contrat) => (
              <option key={contrat} value={contrat}>
                {contrat}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:flex-1">
          <label htmlFor="pays" className="mb-1 block text-sm font-medium">
            Pays
          </label>
          <input
            id="pays"
            name="pays"
            type="text"
            required
            maxLength={60}
            placeholder="Gabon"
            defaultValue=""
            className={CLASS_CHAMP}
          />
        </div>

        <div className="sm:flex-1">
          <label htmlFor="ville" className="mb-1 block text-sm font-medium">
            Ville (facultatif)
          </label>
          <input
            id="ville"
            name="ville"
            type="text"
            maxLength={60}
            placeholder="Libreville"
            className={CLASS_CHAMP}
          />
        </div>
      </div>

      <label htmlFor="remote" className="flex items-center gap-2 text-sm font-medium">
        <input id="remote" name="remote" type="checkbox" className="size-4 accent-cx-accent" />
        Poste en remote possible
      </label>

      <div>
        <label htmlFor="lien" className="mb-1 block text-sm font-medium">
          Lien de l&apos;offre
        </label>
        <input
          id="lien"
          name="lien"
          type="url"
          required
          placeholder="https://entreprise.ga/offres/123"
          className={CLASS_CHAMP}
        />
        <p className="mt-1 text-xs text-cx-muted-fg">
          URL complète, en http:// ou https:// — c&apos;est le lien que suivront les candidats.
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
          {enCours ? "Publication…" : "Publier l'offre"}
        </button>
        <Link
          href="/jobs"
          className="rounded-lg border border-cx-border px-4 py-2.5 text-sm font-medium"
        >
          Annuler
        </Link>
      </div>
    </form>
  );
}
