"use client";

import { useEffect, useState } from "react";
import { IconeAnimee } from "./icone-animee";

/** Bouton flottant « retour en haut » (visible après 300px de défilement). */
export default function RetourHaut() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 300);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Retour en haut"
      className="fixed bottom-6 right-6 z-40 rounded-full bg-cx-primary px-4 py-2 text-sm font-bold text-cx-primary-fg shadow-lg"
    >
      <IconeAnimee nom="haut" className="h-4 w-4" />
    </button>
  );
}
