"use client";

import Link from "next/link";
import Dropdown from "@/components/dropdown";
import { Icone, type NomIcone } from "@/components/icones";
import SelecteurLangue from "@/components/selecteur-langue";
import SelecteurTheme from "@/components/selecteur-theme";
import { t, type Locale } from "@/lib/i18n";

const LIENS: { href: string; cle: string; icone: NomIcone }[] = [
  { href: "/forum", cle: "nav.forum", icone: "forum" },
  { href: "/jobs", cle: "nav.jobs", icone: "jobs" },
  { href: "/projets", cle: "nav.projects", icone: "projets" },
  { href: "/annuaire", cle: "nav.directory", icone: "annuaire" },
  { href: "/tutos", cle: "nav.tutorials", icone: "tutos" },
  { href: "/evenements", cle: "nav.events", icone: "evenements" },
  { href: "/mentorat", cle: "nav.mentorship", icone: "mentorat" },
];

type Props = { locale: Locale; theme: "light" | "dark" | "auto"; connecte: boolean };

/**
 * Menu hamburger mobile — remplace les `<details>` natifs du header (ancrage
 * faux, pas de z-index, pas de fermeture extérieure). Cherche, navigue, langue
 * et thème au même endroit, correctement ancrés au bouton.
 */
export default function MenuMobile({ locale, theme, connecte }: Props) {
  return (
    <Dropdown
      label={t(locale, "nav.menu")}
      trigger={<Icone nom="menu" className="h-5 w-5" />}
      triggerClassName="rounded-lg p-2 text-cx-muted-fg hover:bg-cx-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cx-primary/50"
    >
      <form action="/recherche" method="get" className="flex gap-2 px-1 pb-2">
        <input
          name="q"
          type="search"
          placeholder={t(locale, "nav.search")}
          className="w-full rounded-lg border border-cx-border bg-cx-bg px-3 py-2 text-sm outline-none focus:border-cx-primary focus:ring-2 focus:ring-cx-primary/30"
        />
        <button
          type="submit"
          aria-label={t(locale, "nav.search")}
          className="rounded-lg bg-cx-primary px-3 text-cx-primary-fg"
        >
          <Icone nom="recherche" className="h-4 w-4" />
        </button>
      </form>

      <ul className="flex flex-col gap-0.5 border-t border-cx-border pt-2">
        {LIENS.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              role="menuitem"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-cx-card-fg hover:bg-cx-muted"
            >
              <Icone nom={l.icone} className="h-4 w-4 shrink-0 text-cx-muted-fg" />
              {t(locale, l.cle)}
            </Link>
          </li>
        ))}
        {connecte ? null : (
          <li className="flex gap-2 px-1 pt-1">
            <Link href="/connexion" className="flex-1 rounded-lg border border-cx-border px-3 py-2 text-center text-sm font-medium text-cx-card-fg hover:bg-cx-muted">
              {t(locale, "nav.login")}
            </Link>
            <Link href="/inscription" className="flex-1 rounded-lg bg-cx-primary px-3 py-2 text-center text-sm font-semibold text-cx-primary-fg hover:opacity-90">
              {t(locale, "nav.join")}
            </Link>
          </li>
        )}
      </ul>

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-cx-border pt-2">
        <SelecteurLangue localeActuelle={locale} />
        <SelecteurTheme themeInitial={theme} />
      </div>
    </Dropdown>
  );
}
