"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatDureeLecture } from "@/lib/lecture";
import { useToast } from "@/components/toast";
import { t, type Locale } from "@/lib/i18n";
import CarteSujet from "@/components/carte-sujet";

type ForumFeedProps = {
  initialItems: any[];
  totalPages: number;
  currentPage: number;
  basePath: string;
  locale: Locale;
};

export function ForumFeed({
  initialItems,
  totalPages,
  currentPage,
  basePath,
  locale,
}: ForumFeedProps) {
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
      const data = (await r.json()) as any;
      const newItems = data.items ?? [];
      setItems((prev) => [...prev, ...newItems]);
      setClientPage(data.page ?? clientPage + 1);
      const total = data.totalPages ?? totalPages;
      setHasMore(data.page ?? clientPage + 1 < total);
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
      {items.map((sujet) => (
        <CarteSujet
          key={sujet.id}
          sujet={sujet}
          locale={locale}
          connecte={true} // le connecte est gôté par le composant parent
        />
      ))}

      {/* Sentinelle de chargement (invisible, détectée par IntersectionObserver) */}
      {hasMore && !isLoading && (
        <div
          ref={sentinelRef}
          className="h-6 w-full"
          aria-hidden="true"
        />
      )}

      {/* Bouton "Charger plus" manuel */}
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

export default function ForumFeedDemo({
  initialItems,
  totalPages,
  currentPage,
  basePath,
  locale,
}: ForumFeedProps) {
  return <ForumFeed initialItems={initialItems} totalPages={totalPages} currentPage={currentPage} basePath={basePath} locale={locale} />;
}