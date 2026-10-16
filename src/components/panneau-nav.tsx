"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useNav } from "@/components/nav-context";
import { Icone, type NomIcone } from "@/components/icones";
import SelecteurLangue from "@/components/selecteur-langue";
import SelecteurTheme from "@/components/selecteur-theme";
import { cn } from "@/lib/cn";
import { t, type Locale } from "@/lib/i18n";
import type { Theme } from "@/lib/theme";

type Communaute = { tag: string; count: number };
type Props = { locale: Locale; theme: Theme; communautes: Communaute[]; connecte: boolean };

const FIL: { href: string; cle: string; icone: NomIcone }[] = [
  { href: "/", cle: "nav.home", icone: "accueil" },
  { href: "/forum", cle: "nav.forum", icone: "forum" },
  { href: "/forum?tri=top", cle: "nav.popular", icone: "tendance" },
];

const EXPLORER: { href: string; cle: string; icone: NomIcone }[] = [
  { href: "/jobs", cle: "nav.jobs", icone: "jobs" },
  { href: "/projets", cle: "nav.projects", icone: "projets" },
  { href: "/annuaire", cle: "nav.directory", icone: "annuaire" },
  { href: "/tutos", cle: "nav.tutorials", icone: "tutos" },
  { href: "/evenements", cle: "nav.events", icone: "evenements" },
  { href: "/mentorat", cle: "nav.mentorship", icone: "mentorat" },
];

/** Titre de rubrique de la barre latérale. */
function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 first:mt-0">
      <h2 className="px-3 pb-1 text-xs font-bold uppercase tracking-wider text-cx-muted-fg">
        {titre}
      </h2>
      <ul className="space-y-0.5">{children}</ul>
    </section>
  );
}

/** Lien latéral façon Reddit : route active surlignée, ferme le drawer au clic. */
function Lien({ href, icone, libelle }: { href: string; icone: NomIcone; libelle: string }) {
  const pathname = usePathname();
  const { fermer } = useNav();
  // Route active : chemin exact uniquement (les variantes ?tri= ne surlignent pas).
  const actif = !href.includes("?") && pathname === href;

  return (
    <li>
      <Link
        href={href}
        onClick={fermer}
        aria-current={actif ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
          actif
            ? "bg-cx-primary/5 text-cx-primary"
            : "text-cx-muted-fg hover:bg-cx-muted hover:text-cx-fg",
        )}
      >
        <Icone nom={icone} className="size-5 shrink-0" />
        {libelle}
      </Link>
    </li>
  );
}

/** Navigation latérale façon Reddit (composant client : route active + drawer). */
export default function PanneauNav({ locale, theme, communautes, connecte }: Props) {
  const { ouverte, fermer } = useNav();
  const refAside = useRef<HTMLElement>(null);
  const premierRendu = useRef(true);

  // Drawer mobile = surface modale : le contenu derrière le voile devient
  // inerte (l'ordre de tabulation ne sort plus du panneau, WCAG 2.4.3), le focus
  // entre dans le panneau à l'ouverture et revient au ☰ à la fermeture.
  // Au premier rendu on ne touche à rien : voler le focus au chargement de la
  // page serait hostile (le ☰ apparaîtrait entouré sans action de l'utilisateur).
  useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    const cibles = [document.getElementById("main"), document.querySelector("footer")].filter(
      (el): el is HTMLElement => el !== null,
    );
    const bouton = document.querySelector<HTMLElement>(
      'button[aria-controls="navigation-laterale"]',
    );

    if (ouverte) {
      for (const el of cibles) el.setAttribute("inert", "");
      refAside.current?.querySelector<HTMLElement>("a, button")?.focus();
    } else {
      for (const el of cibles) el.removeAttribute("inert");
      bouton?.focus();
    }

    return () => {
      for (const el of cibles) el.removeAttribute("inert");
    };
  }, [ouverte]);

  return (
    <>
      {/* Voile (mobile) : referme au clic. */}
      {ouverte ? (
        <div
          onClick={fermer}
          aria-hidden="true"
          className="fixed top-14 bottom-0 left-0 right-0 z-30 bg-black/50 lg:hidden"
        />
      ) : null}

      <aside
        id="navigation-laterale"
        ref={refAside}
        aria-label="Navigation"
        className={[
          "fixed top-14 bottom-0 left-0 z-40 w-64 shrink-0 overflow-x-hidden overflow-y-auto border-r border-cx-border bg-cx-card pr-3 pl-[max(0.75rem,env(safe-area-inset-left))] pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform duration-200",
          ouverte ? "translate-x-0 visible" : "-translate-x-full invisible",
          "lg:sticky lg:top-14 lg:z-auto lg:h-[calc(100dvh-3.5rem)] lg:w-60 lg:self-start lg:translate-x-0 lg:visible lg:transition-none",
        ].join(" ")}
      >
        <nav className="flex h-full flex-col">
          <div className="flex-1">
            <Section titre={t(locale, "nav.feed")}>
              {FIL.map((l) => (
                <Lien key={l.href} href={l.href} icone={l.icone} libelle={t(locale, l.cle)} />
              ))}
            </Section>

            <Section titre={t(locale, "nav.explore")}>
              {EXPLORER.map((l) => (
                <Lien key={l.href} href={l.href} icone={l.icone} libelle={t(locale, l.cle)} />
              ))}
            </Section>

            {communautes.length > 0 ? (
              <Section titre={t(locale, "nav.communities")}>
                {communautes.map((c) => (
                  <Lien
                    key={c.tag}
                    href={`/forum?tag=${encodeURIComponent(c.tag)}`}
                    icone="forum"
                    libelle={`c/${c.tag}`}
                  />
                ))}
                <li>
                  <Link
                    href="/forum/tags"
                    onClick={fermer}
                    className="block rounded-lg px-3 py-2 pl-11 text-xs font-semibold text-cx-primary hover:bg-cx-muted"
                  >
                    {t(locale, "nav.discover")} →
                  </Link>
                </li>
              </Section>
            ) : null}
          </div>

          {/* Pied de panneau : langue + thème. */}
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-cx-border pt-3">
            <SelecteurLangue localeActuelle={locale} />
            <SelecteurTheme themeInitial={theme} />
          </div>
          {connecte ? null : (
            <div className="mt-3 flex gap-2">
              <Link
                href="/connexion"
                onClick={fermer}
                className="flex-1 rounded-lg border border-cx-border px-3 py-2 text-center text-sm font-medium text-cx-card-fg hover:bg-cx-muted"
              >
                {t(locale, "nav.login")}
              </Link>
              <Link
                href="/inscription"
                onClick={fermer}
                className="flex-1 rounded-lg bg-cx-primary px-3 py-2 text-center text-sm font-semibold text-cx-primary-fg hover:opacity-90 active:scale-[0.97]"
              >
                {t(locale, "nav.join")}
              </Link>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
