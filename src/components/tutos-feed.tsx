"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatDureeLecture } from "@/lib/lecture";
import { useToast } from "@/components/toast";
import { t, type Locale } from "@/lib/i18n";
import { localeCourante } from "@/lib/i18n";

type TutosFeedProps = {
  initialItems: any[];
  totalPages: number;
  currentPage: number;
  basePath: string;
  locale: Locale;
};

export function TutosFeed({
  initialItems,
  totalPages,
  currentPage,
  basePath,
  locale,
}: TutosFeedProps & { locale: Locale }) {
  const [items, setItems] = useState<any[]>(initialItems);
  const [clientPage, setClientPage] = useState(currentPage);
  const [hasMore, setHasMore] = useState(currentPage < totalPages);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Chargement de la page suivante
  const loadMore = async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const r = await fetch(`${window.location.origin}${basePath}?page=${clientPage + 1}`, {
        cache: "no-store",
      });
      const data = (await r.json()) as { items: any[]; page: number; totalPages: number };
      const newItems = data.items ?? [];
      setItems((prev) => [...prev, ...newItems]);
      setClientPage(data.page ?? clientPage + 1);
      const total = data.totalPages ?? totalPages;
      setHasMore((data.page ?? clientPage + 1) < total);
    } catch (erreur) {
      toast.erreur("Impossible de charger la page suivante");
      console.error(erreur);
    } finally {
      setIsLoading(false);
    }
  };

  // IntersectionObserver pour le chargement automatique au scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading]);

  return (
    <>
      <ul className="flex flex-col gap-3">
        {items.map((tuto) => (
          <li
            key={tuto.id}
            className="rounded-xl border border-cx-border px-5 py-4 transition hover:border-cx-primary/60"
          >
            <Link href={`/tutos/${tuto.slug}`} className="block">
              <h2 className="text-lg font-semibold leading-snug hover:text-cx-primary">
                {tuto.titre}
              </h2>
            </Link>

            <p className="mt-1 text-sm text-cx-muted-fg">{tuto.resume}</p>

            <ul className="mt-3 flex flex-wrap items-center gap-2">
              <li className="rounded-full border border-cx-border px-2.5 py-0.5 text-xs font-medium tabular-nums text-cx-muted-fg">
                ⏱ {formatDureeLecture(tuto.corps)} {t(locale, "tutorials.reading")}
              </li>
              {tuto.tags.map((tag: string) => (
                <li
                  key={tag}
                  className="rounded-full bg-cx-primary/5 px-2.5 py-0.5 text-xs font-semibold text-cx-primary"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      {/* Sentinelle de chargement (visible seulement en mode développement ou selon besoin) */}
      {hasMore && !isLoading && (
        <div
          ref={sentinelRef}
          className="h-6 w-full" // hauteur invisible, observe via IntersectionObserver
          aria-hidden="true"
        />
      )}

      {/* Bouton "Charger plus" manuel en cas d'échec de l'observer ou préférence utilisateur */}
      {hasMore && (
        <div className="py-6 text-center">
          <button
            onClick={loadMore}
            className="rounded-lg border border-cx-border px-4 py-2 text-sm font-medium text-cx-primary hover:bg-cx-muted/50 transition"
            disabled={isLoading}
            aria-live="polite"
          >
            {isLoading ? "Chargement…" : "Charger plus"}
          </button>
        </div>
      )}
    </>
  );
}

export default function TutosFeedDemo({
  initialItems,
  totalPages,
  currentPage,
  basePath,
  locale,
}: TutosFeedProps) {
  return <TutosFeed initialItems={initialItems} totalPages={totalPages} currentPage={currentPage} basePath={basePath} locale={locale} />;
}