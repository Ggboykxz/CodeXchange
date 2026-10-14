"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconeAnimee } from "./icone-animee";
import { cookieLocale, t } from "@/lib/i18n";

const CLE_STOCKAGE = "cx_recherches";
const MAX_HISTORIQUE = 5;

/** Lit l'historique local des recherches (jamais bloquant). */
function lireHistorique(): string[] {
  try {
    const brut = window.localStorage.getItem(CLE_STOCKAGE);
    const liste = brut ? (JSON.parse(brut) as unknown) : [];
    return Array.isArray(liste) ? liste.filter((v): v is string => typeof v === "string").slice(0, MAX_HISTORIQUE) : [];
  } catch {
    return [];
  }
}

function ecrireHistorique(liste: string[]): void {
  try {
    window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify(liste.slice(0, MAX_HISTORIQUE)));
  } catch {
    // stockage indisponible (navigation privée) : on ignore
  }
}

type Props = {
  /** Suggestions serveur : tags et villes courants. */
  suggestions: string[];
};

/**
 * Barre de recherche globale avec historique local et suggestions.
 * S'utilise dans l'en-tête (toutes tailles) comme sur la page /recherche.
 */
export default function BarreRecherche({ suggestions }: Props) {
  const router = useRouter();
  const [locale] = useState(() => cookieLocale());
  const [historique, setHistorique] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : lireHistorique(),
  );
  const [ouvert, setOuvert] = useState(false);
  const conteneur = useRef<HTMLDivElement>(null);

  // Ferme le panneau au clic extérieur.
  useEffect(() => {
    function surClic(e: MouseEvent) {
      if (conteneur.current && !conteneur.current.contains(e.target as Node)) setOuvert(false);
    }
    document.addEventListener("mousedown", surClic);
    return () => document.removeEventListener("mousedown", surClic);
  }, []);

  function memoriser(terme: string) {
    const valeur = terme.trim();
    if (valeur.length < 2) return;
    const suivant = [valeur, ...historique.filter((h) => h.toLowerCase() !== valeur.toLowerCase())].slice(
      0,
      MAX_HISTORIQUE,
    );
    setHistorique(suivant);
    ecrireHistorique(suivant);
  }

  function aller(terme: string) {
    memoriser(terme);
    setOuvert(false);
    router.push(`/recherche?q=${encodeURIComponent(terme.trim())}`);
  }

  const listeVisible = ouvert ? [...historique, ...suggestions.filter((s) => !historique.includes(s))].slice(0, 8) : [];

  return (
    <div ref={conteneur} className="relative w-full">
      <form
        action="/recherche"
        method="get"
        onSubmit={(e) => {
          e.preventDefault();
          const donnees = new FormData(e.currentTarget);
          aller(String(donnees.get("q") ?? ""));
        }}
      >
        <input
          name="q"
          type="search"
          placeholder={t(locale, "search.placeholder")}
          aria-label={t(locale, "nav.search")}
          data-cx-search="true"
          onFocus={() => setOuvert(true)}
          className="w-full rounded-lg border border-cx-border bg-cx-card px-3 py-1.5 text-sm outline-none focus:border-cx-primary focus:ring-2 focus:ring-cx-primary/30"
        />
      </form>

      {listeVisible.length > 0 ? (
        <ul className="absolute left-0 right-0 top-10 z-40 overflow-hidden rounded-xl border border-cx-border bg-cx-card py-1 shadow-lg">
          {listeVisible.map((terme, index) => (
            <li key={`${terme}-${index}`}>
              <button
                type="button"
                onClick={() => aller(terme)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-cx-muted"
              >
                <span aria-hidden="true" className="text-cx-muted-fg">
                  <IconeAnimee nom={index < historique.length ? "horloge" : "ampoule"} className="h-4 w-4" />
                </span>
                <span className="truncate">{terme}</span>
              </button>
            </li>
          ))}
          {historique.length > 0 ? (
            <li>
              <button
                type="button"
                onClick={() => {
                  setHistorique([]);
                  ecrireHistorique([]);
                }}
                className="w-full px-3 py-2 text-left text-xs text-cx-muted-fg hover:bg-cx-muted"
              >
                {t(locale, "common.cancel")} · {t(locale, "search.title")}
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
