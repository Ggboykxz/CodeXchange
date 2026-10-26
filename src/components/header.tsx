import Link from "next/link";
import Logo from "@/components/logo";
import BoutonMenuNav from "@/components/bouton-menu-nav";
import { Icone } from "@/components/icones";
import MenuUtilisateur from "@/components/menu-utilisateur";
import RechercheDropdown from "@/components/recherche-dropdown";
import PastilleMessages from "@/components/pastille-messages";
import { unreadMessages } from "@/lib/messagerie";
import { getSessionUserId } from "@/lib/session";
import { unreadCount } from "@/lib/notifications";
import { prisma } from "@/lib/db";
import { localeCourante, t } from "@/lib/i18n";
import PaletteCommandes from "./palette-commandes";
import { suggestionsRecherche } from "@/lib/suggestions";

/**
 * Barre supérieure façon Reddit : ☰ + logo à gauche, recherche centrée,
 * actions à droite (Écrire, notifications, messages, avatar / connexion).
 * La navigation vit dans la barre latérale (NavigationGauche).
 */
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
  const suggestions = await suggestionsRecherche().catch(() => []);

  return (
    <header className="sticky top-0 z-20 border-b border-cx-border bg-cx-bg/80 backdrop-blur">
      <Container>
        <div className="flex h-14 items-center gap-2">
          {/* Gauche : menu (mobile) + logo. */}
          <BoutonMenuNav libelle={t(locale, "nav.menu")} />
          <div className="transition-transform duration-200 hover:scale-105">
            <Logo />
          </div>

          {/* Centre : LA recherche — la palette ⌘K façon X (desktop). En
              mobile : menu dropdown via l'icône à droite. Pas deux interfaces. */}
          <div className="hidden flex-1 justify-center px-4 md:flex">
            <div className="w-full max-w-md">
              <PaletteCommandes pleine locale={locale} />
            </div>
          </div>

          {/* Droite : actions. */}
          <div className="ml-auto flex items-center gap-1.5">
            <div className="md:hidden">
              <RechercheDropdown locale={locale} suggestions={suggestions} />
            </div>

            {/* L'unique action accentuée de la vue (plan : un accent par vue). */}
            <Link
              href="/forum/nouveau"
              className="hidden items-center gap-1.5 rounded-full bg-cx-accent px-3.5 py-1.5 text-sm font-semibold text-cx-accent-fg transition hover:opacity-90 active:scale-[0.97] lg:inline-flex"
            >
              <Icone nom="plus" className="size-4" />
              {t(locale, "forum.new")}
            </Link>

            {userId ? (
              <>
                <Link
                  href="/notifications"
                  title={t(locale, "nav.notifications")}
                  className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-cx-muted-fg transition-transform duration-150 hover:scale-105 hover:bg-cx-muted hover:text-cx-fg"

                >
                  <Icone nom="notifications" className="size-5" />
                  {nonLues > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cx-primary px-1 text-[11px] font-bold text-cx-primary-fg">
                      {nonLues}
                    </span>
                  ) : null}
                  <span className="sr-only">{t(locale, "nav.notifications")}</span>
                </Link>
                <Link
                  href="/messagerie"
                  title={t(locale, "nav.messages")}
                  className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-cx-muted-fg transition-transform duration-150 hover:scale-105 hover:bg-cx-muted hover:text-cx-fg"

                >
                  <Icone nom="messagerie" className="size-5" />
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
              <div className="flex items-center gap-2">
                <Link
                  href="/connexion"
                  className="rounded-full px-3 py-2 text-sm font-medium text-cx-muted-fg hover:bg-cx-muted hover:text-cx-fg"
                >
                  {t(locale, "nav.login")}
                </Link>
                <Link
                  href="/inscription"
                  className="hidden rounded-full border border-cx-border px-3 py-2 text-sm font-semibold text-cx-fg transition hover:bg-cx-muted active:scale-[0.97] sm:inline-flex"
                >
                  {t(locale, "nav.join")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </Container>
    </header>
  );
}

function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">{children}</div>;
}
