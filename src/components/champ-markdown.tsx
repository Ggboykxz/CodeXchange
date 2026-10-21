"use client";

import { useEffect, useRef, useState } from "react";
import CompteurCaracteres from "@/components/compteur-caracteres";
import RenduMarkdown from "@/components/rendu-markdown";
import { Icone } from "@/components/icones";
import { appliquerFormat, type ActionFormat } from "@/lib/edition-markdown";
import { cn } from "@/lib/cn";

const CLASS_CHAMP =
  "w-full border border-cx-border-fort bg-cx-card px-3 py-2 text-sm outline-none focus:border-cx-primary focus:ring-2 focus:ring-cx-primary/30";

const BOUTONS: {
  action: ActionFormat;
  libelle: string;
  raccourci: string;
  contenu: React.ReactNode;
}[] = [
  { action: "gras", libelle: "Gras", raccourci: "Ctrl+B", contenu: <span aria-hidden="true" className="font-black">B</span> },
  { action: "italique", libelle: "Italique", raccourci: "Ctrl+I", contenu: <span aria-hidden="true" className="font-serif italic">I</span> },
  { action: "code", libelle: "Code inline", raccourci: "Ctrl+E", contenu: <span aria-hidden="true" className="font-mono text-[11px]">&lt;/&gt;</span> },
  { action: "bloc-code", libelle: "Bloc de code", raccourci: "", contenu: <span aria-hidden="true" className="font-mono text-[11px]">{"{ }"}</span> },
  { action: "lien", libelle: "Lien", raccourci: "Ctrl+K", contenu: <Icone nom="lien" className="size-4" /> },
  { action: "citation", libelle: "Citation", raccourci: "", contenu: <span aria-hidden="true" className="font-serif text-base leading-none">❝</span> },
  { action: "liste", libelle: "Liste à puces", raccourci: "", contenu: <span aria-hidden="true" className="text-base leading-none">•</span> },
];

/**
 * Zone de texte Markdown avec barre de mise en forme, aperçu et compteur.
 *
 * - Boutons accessibles (aria-label), cibles de 36 px, `onMouseDown`
 *   neutralisé pour conserver la sélection du textarea ;
 * - raccourcis Ctrl/⌘ + B/I/E/K et Ctrl/⌘ + Entrée pour publier ;
 * - aperçu rendu par le même moteur que le fil (aucune divergence) ;
 * - compteur et seuils annoncés aux lecteurs d'écran.
 */
export default function ChampMarkdown({
  id,
  name,
  label,
  valeur,
  onChange,
  max,
  rows = 6,
  required = false,
  placeholder,
  aide,
  paliers,
  onEnvoi,
}: {
  id: string;
  name: string;
  label: string;
  valeur: string;
  onChange: (valeur: string) => void;
  max: number;
  rows?: number;
  required?: boolean;
  placeholder?: string;
  aide?: string;
  paliers?: number[];
  /** Raccourci Ctrl/⌘ + Entrée : soumet le formulaire parent. */
  onEnvoi?: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const selectionEnAttente = useRef<[number, number] | null>(null);
  const [onglet, setOnglet] = useState<"ecrire" | "apercu">("ecrire");
  const idAide = `${id}-aide`;
  const idCompteur = `${id}-compteur`;

  // Replace le curseur après le rendu du nouveau texte (contrôlé par le parent).
  useEffect(() => {
    const selection = selectionEnAttente.current;
    if (!selection || !ref.current) return;
    selectionEnAttente.current = null;
    ref.current.focus();
    ref.current.setSelectionRange(selection[0], selection[1]);
  }, [valeur]);

  function appliquer(action: ActionFormat) {
    const el = ref.current;
    if (!el) return;
    const resultat = appliquerFormat(
      valeur,
      el.selectionStart ?? 0,
      el.selectionEnd ?? 0,
      action,
    );
    selectionEnAttente.current = [resultat.debut, resultat.fin];
    onChange(resultat.texte);
  }

  function surTouche(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!(e.metaKey || e.ctrlKey)) return;
    const touche = e.key.toLowerCase();

    if (touche === "enter" && onEnvoi) {
      e.preventDefault();
      onEnvoi();
      return;
    }

    const raccourcis: Record<string, ActionFormat> = {
      b: "gras",
      i: "italique",
      e: "code",
      k: "lien",
    };
    const action = raccourcis[touche];
    if (action) {
      e.preventDefault();
      appliquer(action);
    }
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="block text-sm font-medium">
          {label}
        </label>
        <div className="flex items-center rounded-full border border-cx-border p-0.5" role="group" aria-label="Mode d'édition">
          <button
            type="button"
            onClick={() => setOnglet("ecrire")}
            aria-pressed={onglet === "ecrire"}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-150",
              onglet === "ecrire" ? "bg-cx-muted text-cx-fg" : "text-cx-muted-fg hover:text-cx-fg",
            )}
          >
            Écrire
          </button>
          <button
            type="button"
            onClick={() => setOnglet("apercu")}
            aria-pressed={onglet === "apercu"}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-150",
              onglet === "apercu" ? "bg-cx-muted text-cx-fg" : "text-cx-muted-fg hover:text-cx-fg",
            )}
          >
            Aperçu
          </button>
        </div>
      </div>

      <div
        role="group"
        aria-label="Mise en forme Markdown"
        aria-controls={id}
        className="flex flex-wrap items-center gap-0.5 rounded-t-lg border border-b-0 border-cx-border-fort bg-cx-muted/40 px-1.5 py-1"
      >
        {BOUTONS.map((bouton) => (
          <button
            key={bouton.action}
            type="button"
            aria-label={bouton.libelle}
            title={bouton.raccourci ? `${bouton.libelle} (${bouton.raccourci})` : bouton.libelle}
            aria-keyshortcuts={bouton.raccourci ? `Control+${bouton.raccourci.slice(-1)} Meta+${bouton.raccourci.slice(-1)}` : undefined}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => appliquer(bouton.action)}
            className="inline-flex size-9 items-center justify-center rounded-md text-sm text-cx-muted-fg transition-colors duration-150 hover:bg-cx-card hover:text-cx-fg"
          >
            {bouton.contenu}
          </button>
        ))}
        {onEnvoi ? (
          <span className="ml-auto hidden pr-1 text-[11px] text-cx-muted-fg sm:inline">
            Ctrl/⌘ + Entrée pour publier
          </span>
        ) : null}
      </div>

      <textarea
        ref={ref}
        id={id}
        name={name}
        required={required}
        rows={rows}
        maxLength={max}
        placeholder={placeholder}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={surTouche}
        aria-describedby={cn(aide && idAide, idCompteur)}
        className={cn(CLASS_CHAMP, "mb-1 resize-y rounded-t-none rounded-b-lg")}
      />

      {onglet === "apercu" ? (
        <div className="mb-1 rounded-lg border border-cx-border-fort bg-cx-card px-3 py-2 text-sm">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-cx-muted-fg">
            Aperçu
          </p>
          {valeur.trim() ? (
            <RenduMarkdown texte={valeur} />
          ) : (
            <p className="text-cx-muted-fg">Rien à prévisualiser pour l’instant.</p>
          )}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        {aide ? (
          <p id={idAide} className="text-xs text-cx-muted-fg">
            {aide}
          </p>
        ) : (
          <span />
        )}
        <CompteurCaracteres id={idCompteur} valeur={valeur} max={max} paliers={paliers} />
      </div>
    </div>
  );
}
