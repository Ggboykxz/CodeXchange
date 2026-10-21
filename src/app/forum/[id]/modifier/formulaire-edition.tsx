"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import ChampMarkdown from "@/components/champ-markdown";

export default function FormulaireEdition({
  postId,
  titreInitial,
  corpsInitial,
  tagsInitial,
  locale,
}: {
  postId: number;
  titreInitial: string;
  corpsInitial: string;
  tagsInitial: string;
  locale: Locale;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [titre, setTitre] = useState(titreInitial);
  const [corps, setCorps] = useState(corpsInitial);
  const [tags, setTags] = useState(tagsInitial);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);
    try {
      const r = await fetch(`/api/forum/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titre, corps, tags: tags.split(",").map((t) => t.trim()).filter(Boolean) }),
      });
      if (!r.ok) {
        const b = await r.json().catch(() => null);
        setErreur(b?.message ?? "Erreur lors de la modification.");
        return;
      }
      router.push(`/forum/${postId}`);
      router.refresh();
    } catch {
      setErreur("Impossible de contacter le serveur.");
    } finally {
      setEnCours(false);
    }
  }

  const input = "w-full rounded-lg border border-cx-border-fort bg-cx-card px-3 py-2 text-sm outline-none focus:border-cx-primary focus:ring-2 focus:ring-cx-primary/30";

  return (
    <form ref={formRef} onSubmit={soumettre} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Titre
        <input value={titre} onChange={(e) => setTitre(e.target.value)} className={input} required />
      </label>
      <ChampMarkdown
        id="corps-edition"
        name="corps"
        label="Corps (markdown)"
        valeur={corps}
        onChange={setCorps}
        max={5000}
        rows={10}
        required
        aide="5 000 caractères maximum. Markdown pris en charge."
        paliers={[500, 100, 0]}
        onEnvoi={() => formRef.current?.requestSubmit()}
      />
      <label className="flex flex-col gap-1 text-sm font-medium">
        Tags (virgules)
        <input value={tags} onChange={(e) => setTags(e.target.value)} className={input} />
      </label>
      {erreur ? <p role="alert" className="text-sm text-cx-destructive">{erreur}</p> : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={enCours}
          className="rounded-full bg-cx-primary px-5 py-2 text-sm font-bold text-cx-primary-fg transition hover:opacity-90 disabled:opacity-60"
        >
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full border border-cx-border px-5 py-2 text-sm font-medium"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}