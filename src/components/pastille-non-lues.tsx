"use client";

import { useEffect, useState } from "react";

/** Pastille dynamique : recharge le nombre de notifications non lues toutes les 30s. */
export default function PastilleNonLues({ initial }: { initial: number }) {
  const [compte, setCompte] = useState(initial);

  useEffect(() => {
    let actif = true;
    async function recharger() {
      try {
        const r = await fetch("/api/notifications/non-lues", { cache: "no-store" });
        if (!r.ok) return;
        const data = await r.json();
        if (actif && typeof data.count === "number") setCompte(data.count);
      } catch {
        // sans réseau, on garde l'ancienne valeur
      }
    }
    const minuteur = setInterval(recharger, 30_000);
    return () => {
      actif = false;
      clearInterval(minuteur);
    };
  }, []);

  if (compte <= 0) return null;
  return (
    <span className="ml-1 rounded-full bg-cx-accent px-1.5 py-0.5 text-[10px] font-bold text-cx-accent-fg">
      {compte}
    </span>
  );
}
