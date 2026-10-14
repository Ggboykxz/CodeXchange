"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MESSAGE_FR } from "@/lib/errors";
import { effacerBrouillon, ecrireBrouillon, lireBrouillon } from "@/lib/brouillon";

const CLE_BROUILLON = "forum-sujet";

const CLASS_CHAMP =
  "w-full rounded-lg border border-cx-border bg-cx-card px-3 py-2 text-sm outline-none focus:border-cx-primary focus:ring-2 focus:ring-cx-primary/30";

type CorpsReponse = { message?: string };

export default function FormulaireSujet() {
  const [erreur, setErreur] = useState<string | null>(null);
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [titre, setTitre] = useState(() => {
    if (typeof window === "undefined") return "";
    return lireBrouillon<{ titre?: string }>(CLE_BROUILLON)?.titre ?? "";
  });
  const [corps, setCorps] = useState(() => {
    if (typeof window === "undefined") return "";
    return lireBrouillon<{ corps?: string }>(CLE_BROUILLON)?.corps ?? "";
  });
  const [tags, setTags] = useState(() => {
    if (typeof window === "undefined") return "";
    return lireBrouillon<{ tags?: string }>(CLE_BROUILLON)?.tags ?? "";
  });
  const [sondage, setSondage] = useState(() => {
    if (typeof window === "undefined") return "";
    return lireBrouillon<{ sondage?: string }>(CLE_BROUILLON)?.sondage ?? "";
  });

  // Sauvegarde automatique.
  useEffect(() => {
    ecrireBrouillon(CLE_BROUILLON, { titre, corps, tags, sondage });
  }, [titre, corps, tags, sondage]);

  async function envoyerFormulaire(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);
    const tagsList = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    try {
      const reponse = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titre, corps, tags: tagsList, sondage: sondage.split("\n").map((x) => x.trim()).filter(Boolean) }),
      });
      if (!reponse.ok) {
        const corps2 = (await reponse.json().catch(() => null)) as CorpsReponse | null;
        setErreur(corps2?.message ?? MESSAGE_FR.FORUM_VALIDATION);
        return;
      }
      effacerBrouillon(CLE_BROUILLON);
      const { id } = (await reponse.json()) as { id: number };
      router.push(`/forum/${id}`);
    } catch {
      setErreur("Impossible de contacter le serveur. Réessayez dans un instant.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={envoyerFormulaire} className="flex flex-col gap-4">
      <div>
        <label htmlFor="titre" className="mb-1 block text-sm font-medium">Titre du sujet</label>
        <input id="titre" name="titre" type="text" required minLength={8} maxLength={120} placeholder="Bug Flutter sur Android 14 : crash au démarrage" className={CLASS_CHAMP} value={titre} onChange={(e) => setTitre(e.target.value)} />
        <p className="mt-1 text-xs text-[var(--cx-muted)]">8 à 120 caractères. Brouillon sauvegardé automatiquement.</p>
      </div>

      <div>
        <label htmlFor="corps" className="mb-1 block text-sm font-medium">Corps du sujet</label>
        <textarea id="corps" name="corps" required rows={8} maxLength={5000} placeholder="Décrivez le contexte…" className={`${CLASS_CHAMP} resize-y`} value={corps} onChange={(e) => setCorps(e.target.value)} />
        <p className="mt-1 text-xs text-[var(--cx-muted)]">5 000 caractères maximum.</p>
      </div>

      <div>
        <label htmlFor="sondage" className="mb-1 block text-sm font-medium">Sondage (optionnel, une option par ligne)</label>
        <textarea id="sondage" name="sondage" rows={4} placeholder="Option A\nOption B" className={`${CLASS_CHAMP} resize-y`} value={sondage} onChange={(e) => setSondage(e.target.value)} />
      </div>

      <div>
        <label htmlFor="tags" className="mb-1 block text-sm font-medium">Tags</label>
        <input id="tags" name="tags" type="text" required placeholder="flutter, android, gabon" className={CLASS_CHAMP} value={tags} onChange={(e) => setTags(e.target.value)} list="tags-suggestions" />
        <datalist id="tags-suggestions">
          <option value="flutter" />
          <option value="android" />
          <option value="gabon" />
          <option value="nestjs" />
          <option value="react" />
          <option value="jobs" />
          <option value="mentorat" />
        </datalist>
        <p className="mt-1 text-xs text-[var(--cx-muted)]">1 à 3 tags séparés par des virgules.</p>
      </div>

      {erreur && (
        <p role="alert" className="rounded-lg bg-cx-destructive/10 px-3 py-2 text-sm text-cx-destructive">{erreur}</p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={enCours} className="rounded-lg bg-[var(--cx-accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {enCours ? "Publication…" : "Publier le sujet"}
        </button>
        <button
          type="button"
          onClick={() => { setTitre(""); setCorps(""); setTags(""); effacerBrouillon(CLE_BROUILLON); }}
          className="rounded-lg border border-[var(--cx-muted)]/40 px-4 py-2.5 text-sm font-medium"
        >
          Réinitialiser
        </button>
        <Link href="/forum" className="rounded-lg border border-[var(--cx-muted)]/40 px-4 py-2.5 text-sm font-medium">
          Annuler
        </Link>
      </div>
    </form>
  );
}
