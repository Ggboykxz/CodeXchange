import Link from "next/link";
import { getSessionUserId } from "@/lib/session";
import { unreadCount } from "@/lib/notifications";
import { prisma } from "@/lib/db";
import { localeCourante, t } from "@/lib/i18n";
import SelecteurLangue from "./selecteur-langue";

const liens = [
  { href: "/forum", cle: "nav.forum" },
  { href: "/jobs", cle: "nav.jobs" },
  { href: "/projets", cle: "nav.projects" },
  { href: "/annuaire", cle: "nav.directory" },
  { href: "/tutos", cle: "nav.tutorials" },
  { href: "/evenements", cle: "nav.events" },
  { href: "/mentorat", cle: "nav.mentorship" },
];

export async function Header() {
  const userId = await getSessionUserId();
  const nonLues = userId !== null ? await unreadCount(userId).catch(() => 0) : 0;
  const estAdmin = userId !== null ? await prisma.user.findUnique({ where: { id: userId }, select: { role: true } }).then((u) => u?.role === "ADMIN") : false;

  const locale = await localeCourante();

  return (
    <header className="sticky top-0 z-30 border-b border-cx-border bg-cx-bg/80 backdrop-blur">
      <Container>
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight">
            CodeXchange
          </Link>
          <div className="hidden md:block">
            <SelecteurLangue localeActuelle={locale} />
          </div>
          <details className="md:hidden">
            <summary
              className="cursor-pointer rounded-lg p-2 text-cx-muted-fg hover:bg-cx-muted"
              aria-label={t(locale, "nav.search")}
            >
              🔍
            </summary>
            <form
              action="/recherche"
              method="get"
              className="absolute left-4 right-4 top-14 flex gap-2 rounded-xl border border-cx-border bg-cx-card p-2 shadow-sm"
            >
              <input
                name="q"
                type="search"
                autoFocus
                placeholder={t(locale, "nav.search")}
                className="w-full rounded-lg border border-cx-border bg-transparent px-3 py-2 text-sm outline-none focus:border-cx-primary"
              />
              <button
                type="submit"
                className="rounded-lg bg-cx-primary px-3 py-2 text-sm font-semibold text-cx-primary-fg"
              >
                OK
              </button>
            </form>
          </details>
          <details className="md:hidden">
            <summary className="cursor-pointer rounded-lg p-2 text-cx-muted-fg hover:bg-cx-muted">
              ☰
            </summary>
            <nav className="absolute right-4 top-14 rounded-xl border border-cx-border bg-cx-card p-2 shadow-sm">
              <ul className="flex flex-col gap-1">
                {liens.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-cx-muted">
                      {t(locale, l.cle)}
                    </Link>
                  </li>
                ))}
                {userId ? (
                  <li>
                    <Link href="/notifications" className="block rounded-lg px-3 py-2 text-sm hover:bg-cx-muted">
                      {t(locale, "nav.notifications")}{nonLues > 0 ? ` (${nonLues})` : ""}
                    </Link>
                  </li>
                ) : null}
                {userId ? (
                  <li>
                    <Link href="/favoris" className="block rounded-lg px-3 py-2 text-sm hover:bg-cx-muted">
                      {t(locale, "nav.favorites")}
                    </Link>
                  </li>
                ) : null}
                {userId ? (
                  <li>
                    <Link href="/messagerie" className="block rounded-lg px-3 py-2 text-sm hover:bg-cx-muted">
                      {t(locale, "nav.messages")}
                    </Link>
                  </li>
                ) : null}
                {userId ? (
                  <li>
                    <Link href="/profil" className="block rounded-lg px-3 py-2 text-sm hover:bg-cx-muted">
                      {t(locale, "nav.profile")}
                    </Link>
                  </li>
                ) : null}
                {estAdmin ? (
                  <li>
                    <Link href="/admin" className="block rounded-lg px-3 py-2 text-sm hover:bg-cx-muted">
                      {t(locale, "nav.admin")}
                    </Link>
                  </li>
                ) : null}
                {userId ? (
                  <li>
                    <form action="/api/auth/logout" method="post">
                      <button
                        type="submit"
                        className="block rounded-lg px-3 py-2 text-sm hover:bg-cx-muted"
                      >
                        {t(locale, "nav.logout")}
                      </button>
                    </form>
                  </li>
                ) : (
                  <li>
                    <Link href="/connexion" className="block rounded-lg px-3 py-2 text-sm font-semibold text-cx-primary">
                      Se connecter
                    </Link>
                  </li>
                )}
                <li className="pt-2">
                  <SelecteurLangue localeActuelle={locale} />
                </li>
              </ul>
            </nav>
          </details>
          <form action="/recherche" method="get" className="hidden items-center md:flex">
            <input
              name="q"
              type="search"
              placeholder={t(locale, "nav.search")}
              className="w-44 rounded-lg border border-cx-border bg-transparent px-3 py-1.5 text-sm outline-none focus:border-cx-primary focus:ring-2 focus:ring-cx-primary/30"
            />
          </form>
          <nav className="hidden items-center gap-1 md:flex">
            <ul className="flex items-center gap-1">
              {liens.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-cx-muted-fg hover:bg-cx-muted hover:text-cx-fg"
                  >
                    {t(locale, l.cle)}
                  </Link>
                </li>
              ))}
            </ul>
            {userId ? (
              <li>
                <Link
                  href="/notifications"
                  className="relative rounded-lg px-3 py-2 text-sm font-medium text-cx-muted-fg hover:bg-cx-muted hover:text-cx-fg"
                >
                  {t(locale, "nav.notifications")}
                  {nonLues > 0 ? (
                    <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-cx-primary px-1 text-[10px] font-bold text-cx-primary-fg">
                      {nonLues}
                    </span>
                  ) : null}
                </Link>
              </li>
            ) : null}
            {userId ? (
              <li>
                <Link
                  href="/favoris"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-cx-muted-fg hover:bg-cx-muted hover:text-cx-fg"
                >
                  {t(locale, "nav.favorites")}
                </Link>
              </li>
            ) : null}
            {userId ? (
              <li>
                <Link
                  href="/messagerie"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-cx-muted-fg hover:bg-cx-muted hover:text-cx-fg"
                >
                  {t(locale, "nav.messages")}
                </Link>
              </li>
            ) : null}
            {userId ? (
              <li>
                <Link
                  href="/profil"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-cx-muted-fg hover:bg-cx-muted hover:text-cx-fg"
                >
                  {t(locale, "nav.profile")}
                </Link>
              </li>
            ) : null}
            {estAdmin ? (
              <li>
                <Link
                  href="/admin"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-cx-muted-fg hover:bg-cx-muted hover:text-cx-fg"
                >
                  {t(locale, "nav.admin")}
                </Link>
              </li>
            ) : null}
            <div className="ml-3 border-l border-cx-border pl-3">
              {userId ? (
                <form action="/api/auth/logout" method="post">
                  <button
                    type="submit"
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-cx-muted-fg hover:bg-cx-muted hover:text-cx-fg"
                  >
                    {t(locale, "nav.logout")}
                  </button>
                </form>
              ) : (
                <>
                  <Link href="/connexion" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-cx-muted">
                    Connexion
                  </Link>
                  <Link
                    href="/inscription"
                    className="ml-1 rounded-lg bg-cx-primary px-3 py-2 text-sm font-semibold text-cx-primary-fg hover:opacity-90"
                  >
                    Rejoindre
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </Container>
    </header>
  );
}

function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>;
}
