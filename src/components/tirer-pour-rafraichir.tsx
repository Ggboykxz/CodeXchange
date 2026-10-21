"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/** Distance (px, après résistance) à franchir pour déclencher l'actualisation. */
const SEUIL = 72;
/** Plafond visuel de l'indicateur. */
const MAX = 110;

/**
 * Tirer-pour-actualiser (mobile) — geste natif façon X.
 *
 * Le geste ne s'arme qu'en haut de page, avec un seul doigt, hors dialogue
 * modal. La résistance (×0,5) évite le déclenchement accidentel ; passé le
 * seuil, `router.refresh()` recharge les données serveur sans perdre l'état
 * client, et l'indicateur reste visible le temps du rafraîchissement.
 *
 * Aucune dépendance : événements tactiles natifs, `passive: false` uniquement
 * sur `touchmove` pour neutraliser le pull-to-refresh natif concurrent.
 */
export default function TirerPourRafraichir() {
  const router = useRouter();
  const [distance, setDistance] = useState(0);
  const [rafraichit, setRafraichit] = useState(false);
  const depart = useRef<number | null>(null);
  const distanceRef = useRef(0);
  const actif = useRef(false);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function debut(e: TouchEvent) {
      if (window.scrollY > 0 || e.touches.length !== 1) return;
      if (document.querySelector("[role='dialog'][aria-modal='true'], [role='alertdialog']")) return;
      depart.current = e.touches[0].clientY;
      actif.current = true;
    }

    function mouvement(e: TouchEvent) {
      if (!actif.current || depart.current == null) return;
      const delta = e.touches[0].clientY - depart.current;
      if (delta <= 0) {
        distanceRef.current = 0;
        setDistance(0);
        return;
      }
      // On est en haut de page et on tire vers le bas : le geste nous
      // appartient, on empêche le rechargement natif du navigateur.
      if (e.cancelable) e.preventDefault();
      const valeur = Math.min(MAX, delta * 0.5);
      distanceRef.current = valeur;
      setDistance(valeur);
    }

    function fin() {
      if (!actif.current) return;
      actif.current = false;
      depart.current = null;
      const declenche = distanceRef.current >= SEUIL;
      distanceRef.current = 0;
      setDistance(0);
      if (!declenche) return;
      setRafraichit(true);
      router.refresh();
      if (minuteur.current) clearTimeout(minuteur.current);
      minuteur.current = setTimeout(() => setRafraichit(false), 900);
    }

    document.addEventListener("touchstart", debut, { passive: true });
    document.addEventListener("touchmove", mouvement, { passive: false });
    document.addEventListener("touchend", fin, { passive: true });
    document.addEventListener("touchcancel", fin, { passive: true });
    return () => {
      document.removeEventListener("touchstart", debut);
      document.removeEventListener("touchmove", mouvement);
      document.removeEventListener("touchend", fin);
      document.removeEventListener("touchcancel", fin);
      if (minuteur.current) clearTimeout(minuteur.current);
    };
  }, [router]);

  const visible = distance > 0 || rafraichit;
  const progression = Math.min(1, distance / SEUIL);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[max(0.5rem,env(safe-area-inset-top))] z-40 flex justify-center"
      aria-hidden={!visible}
    >
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 rounded-full border border-cx-border bg-cx-card px-3 py-1.5 text-xs font-semibold text-cx-muted-fg shadow-md transition duration-150"
        style={{
          opacity: visible ? 1 : 0,
          transform: `translateY(${rafraichit ? 8 : distance * 0.35}px) scale(${
            0.9 + progression * 0.1
          })`,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          className={rafraichit ? "size-3.5 animate-spin" : "size-3.5"}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{ transform: rafraichit ? undefined : `rotate(${progression * 240}deg)` }}
        >
          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
          <path d="M21 3v6h-6" />
        </svg>
        <span>{rafraichit ? "Actualisation…" : "Tirer pour actualiser"}</span>
      </div>
    </div>
  );
}
