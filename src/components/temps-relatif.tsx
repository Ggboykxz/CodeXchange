"use client";

import { useEffect, useState } from "react";

const FORMAT = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

function versTexte(date: Date, maintenant: number): string {
  const diffMs = date.getTime() - maintenant;
  const sec = Math.round(diffMs / 1000);
  const min = Math.round(sec / 60);
  const h = Math.round(min / 60);
  const j = Math.round(h / 24);
  const sem = Math.round(j / 7);
  const mois = Math.round(j / 30);
  const an = Math.round(j / 365);

  if (Math.abs(sec) < 45) return "à l'instant";
  if (Math.abs(min) < 60) return FORMAT.format(min, "minute");
  if (Math.abs(h) < 24) return FORMAT.format(h, "hour");
  if (Math.abs(j) < 7) return FORMAT.format(j, "day");
  if (Math.abs(sem) < 5) return FORMAT.format(sem, "week");
  if (Math.abs(mois) < 12) return FORMAT.format(mois, "month");
  return FORMAT.format(an, "year");
}

/** Horodatage relatif (« il y a 3 h ») qui se rafraîchit chaque minute. */
export default function TempsRelatif({ date }: { date: Date | string }) {
  const cible = typeof date === "string" ? new Date(date) : date;
  const [maintenant, setMaintenant] = useState(() => Date.now());

  useEffect(() => {
    const m = setInterval(() => setMaintenant(Date.now()), 60_000);
    setMaintenant(Date.now());
    return () => clearInterval(m);
  }, []);

  const iso = cible.toISOString();
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {versTexte(cible, maintenant)}
    </time>
  );
}
