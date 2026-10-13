import Link from "next/link";
import { getSessionUserId } from "@/lib/session";

const liens = [
  { href: "/forum", label: "Forum" },
  { href: "/jobs", label: "Emplois" },
  { href: "/projets", label: "Projets" },
  { href: "/annuaire", label: "Annuaire" },
  { href: "/tutos", label: "Tutos" },
  { href: "/evenements", label: "Événements" },
  { href: "/mentorat", label: "Mentorat" },
];

export async function Header() {
  const userId = await getSessionUserId();

  return (
    <header className="sticky top-0 z-30 border-b border-cx-border bg-cx-bg/80 backdrop-blur">
      <Container>
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight">
            CodeXchange
          </Link>
          <details className="md:hidden">
            <summary className="cursor-pointer rounded-lg p-2 text-cx-muted-fg hover:bg-cx-muted">
              ☰
            </summary>
            <nav className="absolute right-4 top-14 rounded-xl border border-cx-border bg-cx-card p-2 shadow-sm">
              <ul className="flex flex-col gap-1">
                {liens.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-cx-muted">
                      {l.label}
                    </Link>
                  </li>
                ))}
                {userId ? (
                  <li>
                    <form action="/api/auth/logout" method="post">
                      <button
                        type="submit"
                        className="block rounded-lg px-3 py-2 text-sm hover:bg-cx-muted"
                      >
                        Déconnexion
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
              </ul>
            </nav>
          </details>
          <nav className="hidden items-center gap-1 md:flex">
            <ul className="flex items-center gap-1">
              {liens.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-cx-muted-fg hover:bg-cx-muted hover:text-cx-fg"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="ml-3 border-l border-cx-border pl-3">
              {userId ? (
                <form action="/api/auth/logout" method="post">
                  <button
                    type="submit"
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-cx-muted-fg hover:bg-cx-muted hover:text-cx-fg"
                  >
                    Déconnexion
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
