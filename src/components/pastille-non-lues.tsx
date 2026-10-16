"use client";

import { useEffect, useState } from "react";

/** Pastille dynamique : recharge le nombre de notifications non lues toutes les 60s (pause hors vue). */
export default function PastilleNonLues({ initial }: { initial: number }) {
  const [compte, setCompte] = useState(initial);

  useEffect(() => {
    let actif = true;
    async function recharger() {
      if (document.visibilityState !== "visible") return;
      try {
        const r = await fetch("/api/notifications/non-lues", { cache: "no-store" });
        if (!r.ok) return;
        const data = await r.json();
        if (actif && typeof data.count === "number") setCompte(data.count);
      } catch {
      }
    }
    const m = setInterval(recharger, 60_000);
    document.addEventListener("visibilitychange", recharger);
    return () => {
      actif = false;
      clearInterval(m);
      document.removeEventListener("visibilitychange", recharger);
    }
  }, []);

  if (compte <= 0) return null;
  return <span key={compte} className="ml-1 rounded-full bg-cx-accent px-1.5 py-0.5 text-[11px] font-bold text-cx-accent-fg animate-count-pop">{compte}</span>;
}
