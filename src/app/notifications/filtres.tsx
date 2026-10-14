"use client";

import Link from "next/link";
import { cookieLocale, t } from "@/lib/i18n";

const FILTRES = ["toutes", "non-lues", "lues"] as const;
export type FiltreNotif = (typeof FILTRES)[number];

const CLES: Record<FiltreNotif, string> = {
  toutes: "notifications.all",
  "non-lues": "notifications.unread",
  lues: "notifications.read",
};

/** Onglets de filtre des notifications (GET, partageable). */
export default function FiltresNotifications({ actif }: { actif: FiltreNotif }) {
  const locale = cookieLocale();
  return (
    <nav aria-label="Filtres" className="flex flex-wrap gap-2 border-b border-cx-border pb-3">
      {FILTRES.map((filtre) => (
        <Link
          key={filtre}
          href={`/notifications?filtre=${filtre}`}
          aria-current={actif === filtre ? "page" : undefined}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            actif === filtre ? "bg-cx-primary text-cx-primary-fg" : "text-cx-muted-fg hover:bg-cx-muted"
          }`}
        >
          {t(locale, CLES[filtre])}
        </Link>
      ))}
    </nav>
  );
}
