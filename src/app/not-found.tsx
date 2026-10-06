import Link from "next/link";

/**
 * 404 — route introuvable (D5).
 * Server component : pas de JS côté client, rendu statique.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4 py-16">
      <main className="w-full max-w-xl">
        <p className="eyebrow">codexchange // status 404</p>

        <h1 className="display text-4xl sm:text-5xl mt-4">
          <span className="text-chart-1">404</span> — Page introuvable
        </h1>

        <div className="dot-divider my-6" role="presentation" />

        <p className="prose-mono text-muted-foreground">
          Cette route n&apos;existe pas (ou plus) sur CodeXchange. Elle a peut-être
          été déplacée, renommée, ou l&apos;URL contient une coquille.
        </p>

        <code className="cmd-block mt-6 block scroll-pretty">
          <span className="text-chart-2">$</span> ls ./cette/page — introuvable
        </code>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-foreground bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-chart-1 hover:border-chart-1 hover:text-[#FAFAF9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            ← Retour à l&apos;accueil
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Recharger CodeXchange
          </Link>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          Par les devs, pour les devs — CodeXchange.
        </p>
      </main>
    </div>
  );
}
