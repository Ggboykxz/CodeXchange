"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  /** Contenu du bouton déclencheur (icône, avatar, libellé…). */
  trigger: ReactNode;
  /** Contenu du panneau déroulant (items, formulaires…). */
  children: ReactNode;
  /** Libellé d'accessibilité du bouton. */
  label: string;
  /** Alignement du panneau par rapport au bouton. */
  align?: "right" | "left";
  /** Classes additionnelles du bouton déclencheur. */
  triggerClassName?: string;
};

/**
 * Menu déroulant réutilisable et **fiable** (corrige les `<details>` du header) :
 *
 * - **Ancrage** : le panneau est `absolute` dans un wrapper `relative` → il se
 *   positionne par rapport au **bouton**, pas par rapport au header pleine
 *   largeur (le `backdrop-blur` faisait du header le bloc conteneur).
 * - **Z-index** : `z-40` explicite → le panneau passe au-dessus du contenu.
 * - **Fermeture** : clic extérieur + `Escape` + clic sur un item.
 * - **Accessibilité** : `aria-expanded`, `aria-haspopup`, `aria-controls`.
 */
export default function Dropdown({
  trigger,
  children,
  label,
  align = "right",
  triggerClassName = "",
}: Props) {
  const [ouvert, setOuvert] = useState(false);
  const racine = useRef<HTMLDivElement>(null);
  const bouton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    function auClic(e: MouseEvent) {
      if (racine.current && !racine.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    }
    function auClavier(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOuvert(false);
        bouton.current?.focus();
      }
    }
    document.addEventListener("mousedown", auClic);
    document.addEventListener("keydown", auClavier);
    return () => {
      document.removeEventListener("mousedown", auClic);
      document.removeEventListener("keydown", auClavier);
    };
  }, [ouvert]);

  return (
    <div className="relative" ref={racine}>
      <button
        ref={bouton}
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={ouvert}
        aria-label={label}
        aria-controls={`menu-${label}`}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {ouvert ? (
        <div
          id={`menu-${label}`}
          role="menu"
          onClick={() => setOuvert(false)}
          className={`absolute z-40 mt-2 min-w-56 rounded-xl border border-cx-border bg-cx-card p-1.5 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
