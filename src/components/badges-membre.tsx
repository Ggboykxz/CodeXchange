import React from "react";
import { calculerNiveau } from "@/lib/gamification";
import { Icone } from "@/components/icones";

/**
 * Badges d'identité d'un membre : coche de vérification + niveau (gamification).
 * Présentation pure — s'affiche à côté du nom sur profil, annuaire, messages.
 */

/** Badge de vérification — coche verte. */
function BadgeVerificationComponent() {
  return (
    <span
      title="Membre vérifié"
      aria-label="Membre vérifié"
      className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-cx-primary align-middle"
    >
      <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M20 6 9 17l-5-5" className="text-cx-primary-fg" />
      </svg>
    </span>
  );
}

function BadgeNiveauComponent({ karma }: { karma: number }) {
  const n = calculerNiveau(karma);
  return (
    <span
      title={`Niveau ${n.niveau} — ${n.titre}`}
      className="inline-flex items-center gap-1 rounded-full bg-cx-primary/5 px-2 py-0.5 text-xs font-semibold text-cx-primary"
    >
      <Icone nom="verifie" className="size-3.5" />
      N{n.niveau} · {n.titre}
    </span>
  );
}

export const BadgeVerification = React.memo(BadgeVerificationComponent);
BadgeVerification.displayName = "BadgeVerification";

export const BadgeNiveau = React.memo(BadgeNiveauComponent);
BadgeNiveau.displayName = "BadgeNiveau";
