"use client";

import { useEffect, useState } from "react";
import { cookieLocale, t } from "@/lib/i18n";
import type { StatsAdmin } from "@/lib/admin";

/** Rafraîchit les compteurs toutes les 10 s (dashboard temps réel). */
export default function CartesStats({ statsInitiaux }: { statsInitiaux: StatsAdmin }) {
  const [stats, setStats] = useState(statsInitiaux);
  const locale = cookieLocale();
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
    [t(locale, "admin.members"), stats.membres],
    [t(locale, "admin.posts"), stats.sujets],
    [t(locale, "admin.replies"), stats.reponses],
    [t(locale, "admin.jobs"), stats.offres],
    [t(locale, "admin.projects"), stats.projets],
    [t(locale, "admin.events"), stats.evenements],
    [t(locale, "admin.tutorials"), stats.tutos],
    [t(locale, "admin.messages"), stats.messages],
    [t(locale, "admin.notifications"), stats.notifications],
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
          className="inline-flex items-center min-h-[24px] col-span-full justify-self-end text-xs text-cx-muted-fg underline-offset-2 hover:underline sm:col-span-5"
        >
        {pause ? t(locale, "admin.refresh_resume") : t(locale, "admin.refresh_pause")}
      </button>
    </section>
  );
}
