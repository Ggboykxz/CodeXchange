"use client";

import { useEffect } from "react";

/**
 * Frontière d'erreur par segment (D5) — doit être un Client Component.
 * Affiche un message d'erreur clair en français et propose de re-rendre le
 * segment via `reset()`.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Journalise (services d'error-reporting branchés ici plus tard)
    console.error("Erreur de rendu CodeXchange:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-background px-4 py-16">
      <main className="w-full max-w-xl">
        <p className="eyebrow">codexchange // erreur</p>

        <h1 className="display text-3xl sm:text-4xl mt-4">
          <span className="text-chart-1">Erreur.</span> Quelque chose a cassé.
        </h1>

        <div className="dot-divider my-6" role="presentation" />

        <p className="prose-mono text-muted-foreground">
          Une erreur inattendue s&apos;est produite lors du chargement de cette
          page. Nos équipes ont été (symboliquement) notifiées — réessayez dans
          un instant.
        </p>

        {error.digest ? (
          <code className="cmd-block mt-6 block scroll-pretty break-all">
            <span className="text-chart-2">$</span> digest: {error.digest}
          </code>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-md border border-foreground bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-chart-1 hover:border-chart-1 hover:text-[#FAFAF9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Retour à l&apos;accueil
          </a>
        </div>
      </main>
    </div>
  );
}
