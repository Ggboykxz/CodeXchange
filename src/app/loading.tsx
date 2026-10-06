/**
 * État de chargement du segment racine (D5).
 * Réutilise les classes skeleton de `src/components/sections/jobs-section.tsx`
 * (lignes ~186-196) : `h-44 rounded-lg bg-muted animate-pulse`.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        {/* Barre de titre */}
        <div
          className="h-8 w-56 rounded-lg bg-muted animate-pulse"
          aria-hidden="true"
        />
        <div
          className="mt-4 h-4 w-80 max-w-full rounded-lg bg-muted animate-pulse"
          aria-hidden="true"
        />

        {/* Filtres / carte de contrôle */}
        <div
          className="mt-8 h-24 w-full rounded-lg bg-muted animate-pulse"
          aria-hidden="true"
        />

        {/* Contenu */}
        <div
          className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-lg bg-muted animate-pulse"
              aria-hidden="true"
            />
          ))}
        </div>

        <span className="sr-only">Chargement de CodeXchange…</span>
      </div>
    </div>
  );
}
