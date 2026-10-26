"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { MESSAGE_FR } from "@/lib/errors";
import ChampMarkdown from "@/components/champ-markdown";
import { fetchWithCsrf } from "@/lib/csrf-client";

type Props = { postId: number; parentId?: number };
type CorpsReponse = { message?: string };

/** Formulaire de réponse → POST /api/forum/[id]/replies, puis rafraîchit la page. */
export default function FormulaireReponse({ postId, parentId }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const idCorps = `reply-body-${postId}-${parentId ?? "root"}`;
  const [corps, setCorps] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function envoyerFormulaire(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);

    try {
      const reponse = await fetchWithCsrf(`/api/forum/${postId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ corps, parentId: parentId ?? null }),
      });
      if (!reponse.ok) {
        const corpsErreur = (await reponse.json().catch(() => null)) as CorpsReponse | null;
        setErreur(corpsErreur?.message ?? MESSAGE_FR.FORUM_VALIDATION);
        return;
      }
      setCorps("");
      router.refresh();
    } catch {
      setErreur("Impossible de contacter le serveur. Réessayez dans un instant.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={envoyerFormulaire} className="mt-3 flex flex-col gap-3">
      <ChampMarkdown
        id={idCorps}
        name="corps"
        label="Votre réponse"
        valeur={corps}
        onChange={setCorps}
        max={2000}
        rows={4}
        required
        placeholder="Votre réponse… **gras**, `code`, ```bloc```, [lien](https://)."
        aide="1 à 2 000 caractères. Markdown pris en charge."
        paliers={[200, 50, 0]}
        onEnvoi={() => formRef.current?.requestSubmit()}
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
          className="rounded-full bg-cx-accent px-4 py-2.5 text-sm font-semibold text-cx-accent-fg disabled:opacity-60"
        >
          {enCours ? "Envoi…" : "Publier la réponse"}
        </button>
      </div>
    </form>
  );
}
