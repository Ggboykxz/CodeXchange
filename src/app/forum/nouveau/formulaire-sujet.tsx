"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MESSAGE_FR } from "@/lib/errors";
import { effacerBrouillon, ecrireBrouillon, lireBrouillon } from "@/lib/brouillon";
import CompteurCaracteres from "@/components/compteur-caracteres";
import ChampMarkdown from "@/components/champ-markdown";

const CLE_BROUILLON = "forum-sujet";

const CLASS_CHAMP =
  "w-full rounded-lg border border-cx-border-fort bg-cx-card px-3 py-2 text-sm outline-none focus:border-cx-primary focus:ring-2 focus:ring-cx-primary/30";

type CorpsReponse = { message?: string };

export default function FormulaireSujet() {
  const [erreur, setErreur] = useState<string | null>(null);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
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
  const [image, setImage] = useState(() => {
    if (typeof window === "undefined") return "";
    return lireBrouillon<{ image?: string }>(CLE_BROUILLON)?.image ?? "";
  });

  // Sauvegarde automatique.
  useEffect(() => {
    ecrireBrouillon(CLE_BROUILLON, { titre, corps, tags, sondage, image });
  }, [titre, corps, tags, sondage, image]);

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
        body: JSON.stringify({
          titre,
          // L'image collée est ajoutée en fin de corps : le fil et la page du
          // sujet l'affichent comme un bloc média (marqueur Markdown image).
          corps: image.trim() !== "" ? `${corps}\n\n![image](${image.trim()})` : corps,
          tags: tagsList,
          sondage: sondage.split("\n").map((x) => x.trim()).filter(Boolean),
        }),
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
    <form ref={formRef} onSubmit={envoyerFormulaire} className="flex flex-col gap-4">
      <div>
        <label htmlFor="titre" className="mb-1 block text-sm font-medium">Titre du sujet</label>
        <input id="titre" name="titre" type="text" required minLength={8} maxLength={120} placeholder="Bug Flutter sur Android 14 : crash au démarrage" className={CLASS_CHAMP} value={titre} onChange={(e) => setTitre(e.target.value)} aria-describedby="titre-aide titre-compteur" />
        <div className="mt-1 flex items-center justify-between gap-2">
          <p id="titre-aide" className="text-xs text-cx-muted-fg">8 à 120 caractères. Brouillon sauvegardé automatiquement.</p>
          <CompteurCaracteres id="titre-compteur" valeur={titre} max={120} />
        </div>
      </div>

      <ChampMarkdown
        id="corps"
        name="corps"
        label="Corps du sujet"
        valeur={corps}
        onChange={setCorps}
        max={5000}
        rows={8}
        required
        placeholder="Décrivez le contexte… **gras**, `code`, ```bloc de code```, [lien](https://)."
        aide="5 000 caractères maximum. Markdown pris en charge."
        paliers={[500, 100, 0]}
        onEnvoi={() => formRef.current?.requestSubmit()}
      />

      <div>
        <label htmlFor="image" className="mb-1 block text-sm font-medium">Image (URL, optionnel)</label>
        <input id="image" name="image" type="url" placeholder="https://…/capture.png" className={CLASS_CHAMP} value={image} onChange={(e) => setImage(e.target.value)} />
        <p className="mt-1 text-xs text-cx-muted-fg">Rendue comme un bloc média dans le fil et sur la page du sujet.</p>
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
        <p className="mt-1 text-xs text-cx-muted-fg">1 à 3 tags séparés par des virgules.</p>
      </div>

      {erreur && (
        <p role="alert" className="rounded-lg bg-cx-destructive/5 px-3 py-2 text-sm text-cx-destructive">{erreur}</p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={enCours} className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-cx-accent px-4 py-2.5 text-sm font-semibold text-cx-accent-fg disabled:opacity-60">
          {enCours ? "Publication…" : "Publier le sujet"}
        </button>
        <button
          type="button"
          onClick={() => { setTitre(""); setCorps(""); setTags(""); setImage(""); effacerBrouillon(CLE_BROUILLON); }}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-cx-border px-4 py-2.5 text-sm font-medium"
        >
          Réinitialiser
        </button>
        <Link href="/forum" className="rounded-lg border border-cx-border px-4 py-2.5 text-sm font-medium">
          Annuler
        </Link>
      </div>
    </form>
  );
}
