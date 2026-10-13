"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  eventId: number;
  connecte: boolean;
  dejaConfirme: boolean;
  compteur: number;
};

type CorpsReponse = { rsvps?: number; message?: string };

const MESSAGE_DOUBLON = "Vous avez déjà confirmé votre présence à cet événement.";

/**
 * Bouton « Je participe » → POST /api/events/[id]/rsvp.
 * Grisé et inactif si non connecté ou si la présence est déjà enregistrée.
 */
export default function BoutonRsvp({ eventId, connecte, dejaConfirme, compteur }: Props) {
  const router = useRouter();
  const [confirme, setConfirme] = useState(dejaConfirme);
  const [nombre, setNombre] = useState(compteur);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  if (!connecte) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Connectez-vous pour confirmer votre présence"
        className="cursor-not-allowed rounded-lg border border-[var(--cx-muted)]/40 px-4 py-2.5 text-sm text-[var(--cx-muted)] opacity-60"
      >
        Participer · connectez-vous
      </button>
    );
  }

  if (confirme) {
    return (
      <span className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Vous avez déjà confirmé votre présence"
          className="cursor-not-allowed rounded-lg border border-[var(--cx-accent)] bg-[var(--cx-accent)]/10 px-4 py-2.5 text-sm font-medium text-[var(--cx-accent)] opacity-80"
        >
          ✓ Présence confirmée
        </button>
        <span className="text-xs text-[var(--cx-muted)]">
          {nombre} {nombre > 1 ? "participants" : "participant"}
        </span>
      </span>
    );
  }

  async function confirmerPresence() {
    setEnCours(true);
    setErreur(null);
    try {
      const reponse = await fetch(`/api/events/${eventId}/rsvp`, { method: "POST" });
      const corps = (await reponse.json().catch(() => null)) as CorpsReponse | null;
      if (!reponse.ok) {
        setErreur(corps?.message ?? MESSAGE_DOUBLON);
        return;
      }
      setConfirme(true);
      setNombre(corps?.rsvps ?? nombre + 1);
      router.refresh();
    } catch {
      setErreur("Impossible de contacter le serveur. Réessayez dans un instant.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={confirmerPresence}
        disabled={enCours}
        className="rounded-lg bg-[var(--cx-accent)] px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
      >
        {enCours ? "Envoi…" : "Je participe"}
      </button>
      <span className="text-xs text-[var(--cx-muted)]">
        {nombre} {nombre > 1 ? "participants" : "participant"}
      </span>
      {erreur && (
        <span role="alert" className="text-xs text-red-600">
          {erreur}
        </span>
      )}
    </span>
  );
}
