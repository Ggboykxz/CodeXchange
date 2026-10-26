"use client";

import { IconeAnimee } from "@/components/icone-animee";
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
        className="cursor-not-allowed rounded-full border border-cx-border px-4 py-2.5 text-sm text-cx-muted-fg opacity-60"
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
          className="cursor-not-allowed rounded-full border border-cx-accent bg-cx-primary/5 px-4 py-2.5 text-sm font-medium text-cx-primary"
        >
          <IconeAnimee nom="coche" className="mr-1 inline size-3" /> Présence confirmée
        </button>
        <span className="text-xs text-cx-muted-fg">
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
        className="rounded-full bg-cx-accent px-4 py-2.5 text-sm font-semibold text-cx-accent-fg transition disabled:opacity-60"
      >
        {enCours ? "Envoi…" : "Je participe"}
      </button>
      <span className="text-xs text-cx-muted-fg">
        {nombre} {nombre > 1 ? "participants" : "participant"}
      </span>
      {erreur && (
        <span role="alert" className="text-xs text-cx-destructive">
          {erreur}
        </span>
      )}
    </span>
  );
}
