import Link from "next/link";

/** 404 française et soignée : le membre ou la page demandé(e) n'existe pas (plus). */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-7xl font-black tracking-tight text-[var(--cx-accent)]">404</p>
      <h1 className="text-2xl font-bold leading-snug">Cette page n&apos;existe pas (ou plus).</h1>
      <p className="text-sm text-[var(--cx-muted)]">
        Le lien a peut-être expiré, ou le membre a supprimé son profil. Pas de panique : la
        communauté est juste à côté.
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg border border-[var(--cx-muted)]/40 px-4 py-2.5 text-sm font-medium"
        >
          Retour à l&apos;accueil
        </Link>
        <Link
          href="/annuaire"
          className="rounded-lg bg-[var(--cx-accent)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          Parcourir l&apos;annuaire
        </Link>
      </div>
    </main>
  );
}
