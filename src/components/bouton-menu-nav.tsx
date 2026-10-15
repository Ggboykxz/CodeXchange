"use client";

import { useNav } from "@/components/nav-context";
import { Icone } from "@/components/icones";

/**
 * ☰ du header : ouvre/ferme la navigation latérale (drawer sur mobile).
 * Visible sous `lg` ; sur desktop la sidebar est déjà fixée en permanence.
 */
export default function BoutonMenuNav({ libelle }: { libelle: string }) {
  const { basculer, ouverte } = useNav();
  return (
    <button
      type="button"
      onClick={basculer}
      aria-label={libelle}
      aria-expanded={ouverte}
      aria-controls="navigation-laterale"
      className="rounded-lg p-2 text-cx-muted-fg transition hover:bg-cx-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cx-primary/50 active:scale-[0.97] lg:hidden"
    >
      <Icone nom="menu" className="h-5 w-5" />
    </button>
  );
}
