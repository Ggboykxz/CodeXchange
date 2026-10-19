"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Compteur animé : anime la valeur numérique entre l'ancienne et la nouvelle
 * en transform/opacity? Text content replace; no layout-property animation
 * (textContent simply ticks). Respecte les préférences de mouvement.
 */
export default function CompteurAnime({ value }: { value: number }) {
  const [affiche, setAffiche] = useState(value);
  const precedent = useRef(value);

  useEffect(() => {
    const debut = precedent.current;
    const fin = value;
    precedent.current = value;
    if (debut === fin) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      queueMicrotask(() => setAffiche(fin));
      return;
    }
    const debutMs = performance.now();
    const duree = 500;
    let raf = 0;
    function step(t: number) {
      const p = Math.min(1, (t - debutMs) / duree);
      const eased = 1 - Math.pow(1 - p, 3);
      setAffiche(Math.round(debut + (fin - debut) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span className="tabular-nums">{affiche}</span>;
}
