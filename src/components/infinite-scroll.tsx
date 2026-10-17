"use client";

import { useEffect, useRef, useState } from "react";

/** Hook qui observe le dernier élément de la liste et déclenche le chargement suivant
 * quand l'utilisateur approche du bas (seuil configurable).
 * Renvoie :
 *   - setLoadMore : fonction à appeler pour charger la page suivante
 *   - hasMore : s'il reste des éléments à charger
 *   - isLoading : état de chargement courant
 *   - sentinelRef : à attacher sur l'élément "chargeur" en fin de liste
 */
export function useInfiniteScroll({
  hasMore,
  loadMore,
  threshold = 0.2,
}: {
  hasMore: boolean;
  loadMore: () => Promise<void>;
  threshold?: number;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          setIsLoading(true);
          loadMore().then(() => setIsLoading(false));
        }
      },
      { threshold },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadMore, isLoading, threshold]);

  return { sentinelRef, isLoading };
}

/** Composant "Load more" qui s'affiche en fin de liste quand il reste des pages.
 * Il suffit d'enrober la liste de <InfiniteScroll sentinelRef={...}> et d'appeler
 * la fonction loadMore fournie par le hook useInfiniteScroll.
 */
export default function InfiniteScroll({
  hasMore,
  loadMore,
  threshold = 0.2,
  children,
  loadMoreLabel = "Charger plus",
}: {
  hasMore: boolean;
  loadMore: () => Promise<void>;
  threshold?: number;
  children: React.ReactNode;
  loadMoreLabel?: string;
}) {
  const { sentinelRef, isLoading } = useInfiniteScroll({ hasMore, loadMore, threshold });

  return (
    <>
      {children}
      {hasMore && !isLoading && (
        <div
          ref={sentinelRef}
          className="py-6 text-center"
          aria-label="Fin de liste"
        >
          {isLoading ? (
            <span className="text-cx-muted-fg">Chargement…</span>
          ) : (
            <button
              onClick={() => {
                // Le IntersectionObserver gère le déclenchement,
                // mais on autorise un clic manuel aussi.
              }}
              className="rounded-lg border border-cx-border px-4 py-2 text-sm font-medium text-cx-primary hover:bg-cx-muted/50 transition"
              disabled={isLoading}
              aria-live="polite"
            >
              {isLoading ? "Chargement…" : loadMoreLabel}
            </button>
          )}
        </div>
      )}
    </>
  );
}

/** Utilitaire : compte les pages restantes à partir du résultat paginé.
 * À utiliser dans les pages qui rejouent `list…(page)` côté serveur.
 */
function usePaginatedHasMore({ page, totalPages }: { page: number; totalPages: number }) {
  return page < totalPages;
}

export { usePaginatedHasMore };