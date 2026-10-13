"use client";

import { useEffect, useState } from "react";
import type { StatsAdmin } from "@/lib/admin";

/** Rafraîchit les compteurs toutes les 10 s (dashboard temps réel). */
export default function CartesStats({ statsInitiaux }: { statsInitiaux: StatsAdmin }) {
  const [stats, setStats] = useState(statsInitiaux);
  const [pause, setPause] = useState(false);

  useEffect(() => {
    if (pause) return;
    const minuteur = setInterval(async () => {
      try {
        const r = await fetch("/api/admin/stats");
        if (r.ok) setStats(await r.json());
      } catch {
        // on garde les valeurs affichées
      }
    }, 10_000);
    return () => clearInterval(minuteur);
  }, [pause]);

  const cartes: Array<[string, number]> = [
    ["Membres", stats.membres],
    ["Sujets", stats.sujets],
    ["Réponses", stats.reponses],
    ["Offres", stats.offres],
    ["Projets", stats.projets],
    ["Événements", stats.evenements],
    ["Tutos", stats.tutos],
    ["Messages", stats.messages],
    ["Notifications", stats.notifications],
  ];

  return (
    <section className="grid grid-cols-3 gap-3 sm:grid-cols-5">
      {cartes.map(([label, valeur]) => (
        <div key={label} className="rounded-xl border border-cx-border bg-cx-card px-4 py-3 text-center">
          <p className="text-2xl font-black text-cx-primary">{valeur}</p>
          <p className="text-xs text-cx-muted-fg">{label}</p>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setPause((p) => !p)}
        className="col-span-full justify-self-end text-xs text-cx-muted-fg underline-offset-2 hover:underline sm:col-span-5"
      >
        {pause ? "Reprendre le rafraîchissement" : "Mettre en pause le rafraîchissement (10 s)"}
      </button>
    </section>
  );
}
