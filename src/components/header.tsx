import Link from "next/link";
import Logo from "@/components/logo";
import { Icone, type NomIcone } from "@/components/icones";
import MenuUtilisateur from "@/components/menu-utilisateur";
import MenuMobile from "@/components/menu-mobile";
import RechercheDropdown from "@/components/recherche-dropdown";
import PastilleMessages from "@/components/pastille-messages";
import { unreadMessages } from "@/lib/messagerie";
import { getSessionUserId } from "@/lib/session";
import { unreadCount } from "@/lib/notifications";
import { prisma } from "@/lib/db";
import { localeCourante, t } from "@/lib/i18n";
import SelecteurLangue from "./selecteur-langue";
import SelecteurTheme from "./selecteur-theme";
import { suggestionsRecherche } from "@/lib/suggestions";
import { themeCourant } from "@/lib/theme";

type Lien = { href: string; cle: string; icone: NomIcone };

// Navigation principale : 7 entrées, toujours en DOM (libellé masqué sous 2xl
// pour ne pas déborder → nav en icônes, libellés visibles sur très grand écran).
const NAV: Lien[] = [
  { href: "/forum", cle: "nav.forum", icone: "forum" },
  { href: "/jobs", cle: "nav.jobs", icone: "jobs" },
  { href: "/projets", cle: "nav.projects", icone: "projets" },
  { href: "/annuaire", cle: "nav.directory", icone: "annuaire" },
  { href: "/tutos", cle: "nav.tutorials", icone: "tutos" },
  { href: "/evenements", cle: "nav.events", icone: "evenements" },
  { href: "/mentorat", cle: "nav.mentorship", icone: "mentorat" },
];

function ItemNav({ l, locale }: { l: Lien; locale: Awaited<ReturnType<typeof localeCourante>> }) {
  const libelle = t(locale, l.cle);
  return (
    <Link
      href={l.href}
      title={libelle}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-cx-muted-fg hover:bg-cx-muted hover:text-cx-fg"
    >
      <Icone nom={l.icone} className="h-4 w-4 shrink-0" />
      {/* Visible ≥ 2xl ; sous 2xl la nav n'affiche que l'icône (le libellé reste
          accessible aux lecteurs d'écran via sr-only). */}
      <span className="hidden 2xl:inline">{libelle}</span>
      <span className="sr-only 2xl:hidden">{libelle}</span>
    </Link>
  );
}

export async function Header() {
  const userId = await getSessionUserId();
  const nonLues = userId !== null ? await unreadCount(userId).catch(() => 0) : 0;
  const nonLusMessages = userId !== null ? await unreadMessages(userId).catch(() => 0) : 0;
  const membre =
    userId !== null
      ? await prisma.user.findUnique({
          where: { id: userId },
          select: { nom: true, slug: true, avatar: true, role: true },
        })
      : null;
  const estAdmin = membre?.role === "ADMIN";

  const locale = await localeCourante();
  const theme = await themeCourant();
  const suggestions = await suggestionsRecherche().catch(() => []);

  return (
    <header className="sticky top-0 z-30 border-b border-cx-border bg-cx-bg/80 backdrop-blur">
      <Container>
        <div className="flex h-14 items-center justify-between gap-2">
          <Logo />

          {/* Navigation principale (≥ lg) : icônes + libellés (2xl). */}
          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Navigation principale">
            {NAV.map((l) => (
              <ItemNav key={l.href} l={l} locale={locale} />
            ))}
          </nav>

          {/* Recherche (≥ lg) : déroulante icône, compacte. En mobile : menu ☰. */}
          <div className="hidden lg:block">
            <RechercheDropdown locale={locale} suggestions={suggestions} />
          </div>

          <div className="flex-1" />

          {/* Cluster droit. */}
          <div className="flex items-center gap-1.5">
            <div className="hidden items-center gap-1.5 lg:flex">
              <SelecteurLangue localeActuelle={locale} />
              <SelecteurTheme themeInitial={theme} />
            </div>

            {userId ? (
              <>
                <Link
                  href="/notifications"
                  title={t(locale, "nav.notifications")}
                  className="relative hidden rounded-lg p-2 text-cx-muted-fg hover:bg-cx-muted hover:text-cx-fg sm:inline-flex"
                >
                  <Icone nom="notifications" className="h-5 w-5" />
                  {nonLues > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-cx-primary px-1 text-[10px] font-bold text-cx-primary-fg">
                      {nonLues}
                    </span>
                  ) : null}
                  <span className="sr-only">{t(locale, "nav.notifications")}</span>
                </Link>
                <Link
                  href="/messagerie"
                  title={t(locale, "nav.messages")}
                  className="relative hidden rounded-lg p-2 text-cx-muted-fg hover:bg-cx-muted hover:text-cx-fg sm:inline-flex"
                >
                  <Icone nom="messagerie" className="h-5 w-5" />
                  <PastilleMessages initial={nonLusMessages} />
                  <span className="sr-only">{t(locale, "nav.messages")}</span>
                </Link>
                <MenuUtilisateur
                  locale={locale}
                  nonLues={nonLues}
                  nonLusMessages={nonLusMessages}
                  estAdmin={estAdmin}
                  membre={{ nom: membre!.nom, slug: membre!.slug, avatar: membre!.avatar }}
                />
              </>
            ) : (
              <div className="hidden items-center gap-2 lg:flex">
                <Link
                  href="/connexion"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-cx-muted-fg hover:bg-cx-muted hover:text-cx-fg"
                >
                  {t(locale, "nav.login")}
                </Link>
                <Link
                  href="/inscription"
                  className="rounded-lg bg-cx-primary px-3 py-2 text-sm font-semibold text-cx-primary-fg hover:opacity-90"
                >
                  {t(locale, "nav.join")}
                </Link>
              </div>
            )}

            {/* Menu hamburger (mobile / tablette). */}
            <div className="lg:hidden">
              <MenuMobile locale={locale} theme={theme} connecte={userId !== null} />
            </div>
          </div>
        </div>
      </Container>
    </header>
  );
}

function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>;
}
