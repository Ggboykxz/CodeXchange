"use client";

import { useState } from "react";
import { Icone } from "@/components/icones";
import { t, type Locale } from "@/lib/i18n";

/** Heuristique légère : le corps est-il plutôt anglais ? (FR theoretical words vs EN) */
function langueEstAnglaise(texte: string): boolean {
  const extrait = texte.slice(0, 1500).toLowerCase();
  const fr = (extrait.match(/\b(les?|la|une|des|est|pour|avec|dans|sur|vous|nous|plus|mais|tout|été|cette|donc|aux|leur|je)\b/g) ?? []).length;
  const en = (extrait.match(/\b(the|and|is|are|with|for|you|this|that|have|not|from|about)\b/g) ?? []).length;
  return en > fr;
}

type Etat = "repos" | "encours" | "affiche" | "erreur";

type Props = { texte: string; locale: Locale };

/**
 * « Voir la traduction » façon X : un bouton discret sous un long texte
 * Foreign — jamais automatique, c'est l'utilisateur qui décide. Traduit via
 * l'API maison (/api/traduire), affiche un bloc masquable dans la charte.
 */
export default function Traduction({ texte, locale }: Props) {
  const [trad, setTrad] = useState<string | null>(null);
  const [etat, setEtat] = useState<Etat>("repos");

  const cible = locale; // traduit vers la langue de l'interface, comme X
  const utile = texte.length >= 220 && (locale === "fr" ? langueEstAnglaise(texte) : !langueEstAnglaise(texte));
  if (!utile) return null;

  async function traduire() {
    if (trad !== null) {
      setEtat("affiche");
      return;
    }
    setEtat("encours");
    try {
      const reponse = await fetch("/api/traduire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texte, cible }),
      });
      if (!reponse.ok) throw new Error("HTTP");
      const donnees = (await reponse.json()) as { texte?: string };
      if (typeof donnees.texte !== "string" || donnees.texte === "") throw new Error("Vide");
      setTrad(donnees.texte);
      setEtat("affiche");
    } catch {
      setEtat("erreur");
    }
  }

  return (
    <div className="mt-3">
      {etat !== "affiche" ? (
        <button
          type="button"
          onClick={traduire}
          disabled={etat === "encours"}
          className={
            etat === "erreur"
              ? "inline-flex min-h-7 items-center gap-1.5 rounded-full text-sm font-semibold text-cx-destructive hover:underline"
              : "inline-flex min-h-7 items-center gap-1.5 rounded-full text-sm font-semibold text-cx-primary hover:underline disabled:opacity-60"
          }
        >
          <Icone nom="traduire" className="size-4" />
          {etat === "encours" ? t(locale, "traduire.encours") : t(locale, etat === "erreur" ? "traduire.erreur" : "traduire.voir")}
        </button>
      ) : null}
      {etat === "affiche" && trad !== null ? (
        <div className="border-l-2 border-cx-border pl-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-cx-accent-fort">
            {t(locale, "traduire.machine")}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-cx-fg">{trad}</p>
          <button
            type="button"
            onClick={() => setEtat("repos")}
            className="mt-1.5 text-xs font-medium text-cx-muted-fg hover:underline"
          >
            {t(locale, "traduire.cacher")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
