"use client";

import { useEffect, useState } from "react";

export default function PastilleMessages({ initial }: { initial: number }) {
  const [compte, setCompte] = useState(initial);
  useEffect(() => {
    let actif = true;
    async function recharger() {
      try {
        const r = await fetch("/api/messagerie/non-lus", { cache: "no-store" });
        const data = await r.json();
        if (actif && typeof data.count === "number") setCompte(data.count);
      } catch {}
    }
    const m = setInterval(recharger, 30_000);
    return () => { actif = false; clearInterval(m); };
  }, []);
  if (compte <= 0) return null;
  return <span key={compte} className="ml-1 rounded-full bg-cx-destructive px-1.5 py-0.5 text-[11px] font-bold text-cx-destructive-fg animate-count-pop">{compte}</span>;
}