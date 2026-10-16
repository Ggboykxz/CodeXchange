"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MESSAGE_FR } from "@/lib/errors";

type Props = {
  /** Mentors proposés dans le select (le membre connecté est exclu). */
  mentors: { id: number; nom: string }[];
  /** Sans session, le formulaire exige la connexion avant tout envoi. */
  connecte: boolean;
};

type CorpsReponse = { id?: number; message?: string };

const CLASSES_CHAMP =
  "w-full rounded-lg border border-cx-border bg-cx-card px-3 py-2 text-sm outline-none focus:border-cx-primary focus:ring-2 focus:ring-cx-primary/30";

const MESSAGE_MIN = 10;
const MESSAGE_MAX = 1000;

/**
 * Formulaire « demander un mentorat » → POST /api/mentorat.
 * Les erreurs remontées par l'API sont les messages FR de `MESSAGE_FR`
 * (401/403/409/422) ; sans session, un lien de connexion remplace le formulaire.
 */
export default function FormulaireMentorat({ mentors, connecte }: Props) {
  const router = useRouter();
  const [mentorId, setMentorId] = useState(mentors[0]?.id ?? 0);
  const [message, setMessage] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  if (!connecte) {
    return (
      <section className="rounded-xl border border-cx-border px-5 py-5 text-sm">
        <h2 className="font-semibold">Demander un mentorat</h2>
        <p className="mt-2 text-cx-muted-fg">
          Vous devez être connecté pour écrire à un mentor : votre demande est ensuite transmise
          directement.
        </p>
        <Link
          href="/connexion"
          className="mt-3 inline-block rounded-lg bg-cx-accent px-4 py-2.5 text-sm font-semibold text-cx-accent-fg"
        >
          Se connecter pour demander un mentorat
        </Link>
      </section>
    );
  }

  if (mentors.length === 0) {
    return (
      <section className="rounded-xl border border-cx-border px-5 py-5 text-sm">
        <h2 className="font-semibold">Demander un mentorat</h2>
        <p className="mt-2 text-cx-muted-fg">
          Aucun mentor n&apos;est joignable pour l&apos;instant : revenez bientôt, la communauté
          grandit chaque semaine.
        </p>
      </section>
    );
  }

  async function envoyerDemande(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEnCours(true);
    setErreur(null);
    setSucces(false);

    const texte = message.trim();
    if (texte.length < MESSAGE_MIN || texte.length > MESSAGE_MAX) {
      setErreur(
        `Le message doit faire entre ${MESSAGE_MIN} et ${MESSAGE_MAX} caractères.`,
      );
      setEnCours(false);
      return;
    }

    try {
      const reponse = await fetch("/api/mentorat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorId, message: texte }),
      });
      const corps = (await reponse.json().catch(() => null)) as CorpsReponse | null;
      if (!reponse.ok) {
        setErreur(corps?.message ?? MESSAGE_FR.FORUM_VALIDATION);
        return;
      }
      setMessage("");
      setSucces(true);
      router.refresh();
    } catch {
      setErreur("Impossible de contacter le serveur. Réessayez dans un instant.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <section className="rounded-xl border border-cx-border px-5 py-5">
      <h2 className="text-base font-semibold">Demander un mentorat</h2>
      <p className="mt-1 text-sm text-cx-muted-fg">
        Décrivez votre situation en quelques phrases : le mentor reçoit votre demande telle quelle.
      </p>

      <form onSubmit={envoyerDemande} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:max-w-64">
          <label htmlFor="mentor" className="text-sm font-medium">
            Mentor
          </label>
          <select
            id="mentor"
            value={mentorId}
            onChange={(event) => setMentorId(Number(event.target.value))}
            className={`${CLASSES_CHAMP} mt-1`}
            required
          >
            {mentors.map((mentor) => (
              <option key={mentor.id} value={mentor.id}>
                {mentor.nom}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label htmlFor="message" className="text-sm font-medium">
            Votre message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            minLength={MESSAGE_MIN}
            maxLength={MESSAGE_MAX}
            required
            rows={3}
            placeholder="Bonjour, je bloque sur… et j’aimerais votre conseil."
            className={`${CLASSES_CHAMP} mt-1`}
          />
        </div>

        <button
          type="submit"
          disabled={enCours}
          className="rounded-lg bg-cx-accent px-4 py-2.5 text-sm font-semibold text-cx-accent-fg transition disabled:opacity-60"
        >
          {enCours ? "Envoi…" : "Envoyer la demande"}
        </button>
      </form>

      {succes && (
        <p role="status" className="mt-3 text-sm text-cx-success">
          Votre demande a bien été envoyée au mentor. Il vous répondra depuis son profil.
        </p>
      )}
      {erreur && (
        <p role="alert" className="mt-3 text-sm text-cx-destructive">
          {erreur}
        </p>
      )}
    </section>
  );
}
