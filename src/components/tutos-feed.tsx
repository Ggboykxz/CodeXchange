"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/toast";
import { tempsDeLectureMin } from "@/lib/lecture";
import { t, type Locale } from "@/lib/i18n";

type Props = {
  initialItems: TutoResume[];
  totalPages: number;
  currentPage: number;
  basePath: string;
  locale: Locale;
};

/** Forme affichée d'un tuto (celle servie par `listTutorials`). */
type TutoResume = {
  id: number;
  slug: string;
  titre: string;
  resume?: string | null;
  corps: string;
  tags: string[];
};

/**
 * Liste des tutos : la page 1 est servie par le serveur, les suivantes
 * arrivent en JSON (`/api/tutorials/liste`) via IntersectionObserver, avec un
 * bouton « Charger plus » en secours.
 *
 * Robustesse : après une erreur, l’auto-chargement s'arrête et le toast n'est
 * émis qu'une fois ; la carte entière est cliquable (pas que le titre).
 */
export function TutosFeed({ initialItems, totalPages, currentPage, locale }: Props) {
  const [items, setItems] = useState<TutoResume[]>(initialItems);
  const [pageSuivante, setPageSuivante] = useState(currentPage + 1);
  const [hasMore, setHasMore] = useState(currentPage < totalPages);
  const [isLoading, setIsLoading] = useState(false);
  const [enErreur, setEnErreur] = useState(false);
  const sentinelleRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const charger = useCallback(async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const url = new URL("/api/tutorials/liste", window.location.origin);
      url.searchParams.set("page", String(pageSuivante));
      const reponse = await fetch(url.toString(), { cache: "no-store" });
      if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
      const donnees = (await reponse.json()) as { items: TutoResume[]; page: number; totalPages: number };
      setItems((prev) => [...prev, ...donnees.items]);
      setPageSuivante(donnees.page + 1);
      setHasMore(donnees.page < donnees.totalPages);
      setEnErreur(false);
    } catch {
      if (!enErreur) {
        toast.erreur("Impossible de charger les tutos suivants. Réessaie avec « Charger plus ».");
      }
      setEnErreur(true);
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, pageSuivante, enErreur, toast]);

  // Auto-chargement au défilement, suspendu après un échec (reprise manuelle).
  useEffect(() => {
    if (enErreur || !sentinelleRef.current) return;
    const observer = new IntersectionObserver(
      (entrees) => {
        if (entrees[0].isIntersecting && !isLoading && hasMore) void charger();
      },
      { rootMargin: "240px" },
    );
    observer.observe(sentinelleRef.current);
    return () => observer.disconnect();
  }, [charger, isLoading, hasMore, enErreur]);

  return (
    <>
      <ul className="flex flex-col gap-3">
        {items.map((tuto) => (
          <li key={tuto.id} className="rounded-xl border border-cx-border bg-cx-card/50 transition hover:border-cx-primary/60 hover:bg-cx-muted/20">
            <Link href={`/tutos/${tuto.slug}`} className="block rounded-xl px-5 py-4">
              <h2 className="text-[15px] font-bold leading-5 text-cx-fg">{tuto.titre}</h2>
              {tuto.resume ? <p className="mt-1 text-sm text-cx-muted-fg">{tuto.resume}</p> : null}
              <ul className="mt-3 flex flex-wrap items-center gap-2">
                <li className="rounded-full border border-cx-border px-2.5 py-0.5 text-xs font-medium tabular-nums text-cx-muted-fg">
                  {tempsDeLectureMin(tuto.corps)} {t(locale, "tutorials.reading")}
                </li>
                {tuto.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-cx-primary/5 px-2.5 py-0.5 text-xs font-semibold text-cx-primary"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </Link>
          </li>
        ))}
      </ul>
      {enErreur ? (
        <p className="py-2 text-center text-sm text-cx-destructive" role="status">
          Les tutos suivants n’ont pas pu être chargés. Aucune auto-reprise : utilise le bouton ci-dessous.
        </p>
      ) : null}

      {/* Sentinelle invisible détectée par l'IntersectionObserver. */}
      {hasMore && !enErreur && !isLoading ? <div ref={sentinelleRef} className="h-6 w-full" aria-hidden="true" /> : null}
      {hasMore ? (
        <div className="py-6 text-center">
          <button
            type="button"
            onClick={() => void charger()}
            className="rounded-full border border-cx-border px-4 py-2 text-sm font-medium text-cx-primary transition hover:bg-cx-muted/50 active:scale-[0.97]"
            disabled={isLoading}
            aria-live="polite"
          >
            {isLoading ? "Chargement…" : "Charger plus de tutos"}
          </button>
        </div>
      ) : null}
    </>
  );
}

export default TutosFeed;
