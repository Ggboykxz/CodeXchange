/** Squelettes de chargement (états vides pendant la récupération). */

/**
 * Barre de squelette : le seul endroit du projet qui porte `animate-pulse`.
 * Les écrans de chargement l'utilisent pour leurs en-têtes au lieu de
 * dupliquer le trio `animate-pulse rounded-md bg-cx-muted`.
 */
export function SqueletteBarre({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-cx-muted ${className}`} aria-hidden="true" />;
}

function Barre({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-cx-muted ${className}`} />;
}

/** Bloc générique : lignes de texte simulées. */
export function SqueletteLignes({ nombre = 3 }: { nombre?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: nombre }, (_, i) => (
        <div key={i} className="rounded-xl border border-cx-border bg-cx-card px-5 py-4">
          <Barre className="h-4 w-2/3" />
          <Barre className="mt-3 h-3 w-1/3" />
          <Barre className="mt-3 h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

/** Squelette de liste de cartes (forum, jobs, projets, annuaire, tutos). */
export function SqueletteListe({ nombre = 5 }: { nombre?: number }) {
  return (
    <ul className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: nombre }, (_, i) => (
        <li key={i} className="rounded-xl border border-cx-border bg-cx-card px-5 py-4">
          <Barre className="h-4 w-1/2" />
          <Barre className="mt-3 h-3 w-1/4" />
          <Barre className="mt-3 h-3 w-5/6" />
          <div className="mt-3 flex gap-2">
            <Barre className="h-5 w-16 rounded-full" />
            <Barre className="h-5 w-12 rounded-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Squelette de grille (annuaire, mentorat). */
export function SqueletteGrille({ nombre = 6 }: { nombre?: number }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2" aria-hidden="true">
      {Array.from({ length: nombre }, (_, i) => (
        <li key={i} className="rounded-xl border border-cx-border bg-cx-card px-5 py-4">
          <div className="flex items-start gap-4">
            <Barre className="h-11 w-11 rounded-full" />
            <div className="flex-1">
              <Barre className="h-4 w-1/2" />
              <Barre className="mt-2 h-3 w-1/3" />
              <Barre className="mt-3 h-3 w-full" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Squelette de conversation (messagerie). */
export function SqueletteConversation() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <div className="flex justify-start">
        <Barre className="h-16 w-2/3 rounded-2xl" />
      </div>
      <div className="flex justify-end">
        <Barre className="h-10 w-1/2 rounded-2xl" />
      </div>
      <div className="flex justify-start">
        <Barre className="h-12 w-3/5 rounded-2xl" />
      </div>
    </div>
  );
}

/** Squelette de tableau de bord (statistiques). */
export function SqueletteStats() {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-5" aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} className="rounded-xl border border-cx-border bg-cx-card px-4 py-3 text-center">
          <Barre className="mx-auto h-6 w-8" />
          <Barre className="mx-auto mt-2 h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

/** Squelette de profil / détail. */
export function SqueletteDetail() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="flex items-center gap-4">
        <Barre className="size-20 rounded-full" />
        <div className="flex-1">
          <Barre className="h-5 w-1/3" />
          <Barre className="mt-3 h-3 w-1/4" />
        </div>
      </div>
      <div className="rounded-xl border border-cx-border bg-cx-card px-5 py-5">
        <Barre className="h-3 w-full" />
        <Barre className="mt-3 h-3 w-full" />
        <Barre className="mt-3 h-3 w-2/3" />
      </div>
    </div>
  );
}
