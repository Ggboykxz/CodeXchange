"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/toast";
import CarteSujet from "@/components/carte-sujet";
import type { PostResume } from "@/lib/forum";
import type { Locale } from "@/lib/i18n";

type Props = {
  initialItems: PostResume[];
  totalPages: number;
  currentPage: number;
  basePath: string;
  locale: Locale;
  connecte: boolean;
  /** Paramètres d'URL courants (`q`, `tag`, `tri`) conservés au chargement. */
  params?: Record<string, string | undefined>;
};

/**
 * Fil du forum façon X : la page 1 est servie par le serveur, les suivantes
 * arrivent en JSON (`/api/forum/sujets`) via IntersectionObserver, plus un
 * bouton « Charger plus » en secours (et pour les lecteurs non-JS).
 *
 * Robustesse : après une erreur, l’auto-chargement s'arrête et l'erreur est
 * annoncée une seule fois (toast non dupliqué, message inline persistant).
 */
export function ForumFeed({ initialItems, totalPages, currentPage, locale, connecte, params }: Props) {
  const [items, setItems] = useState<PostResume[]>(initialItems);
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
      const url = new URL("/api/forum/sujets", window.location.origin);
      url.searchParams.set("page", String(pageSuivante));
      for (const [cle, valeur] of Object.entries(params ?? {})) {
        if (valeur) url.searchParams.set(cle, valeur);
      }
      const reponse = await fetch(url.toString(), { cache: "no-store" });
      if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
      const donnees = (await reponse.json()) as { items: PostResume[]; page: number; totalPages: number };
      setItems((prev) => [...prev, ...donnees.items]);
      setPageSuivante(donnees.page + 1);
      setHasMore(donnees.page < donnees.totalPages);
      setEnErreur(false);
    } catch {
      if (!enErreur) {
        toast.erreur("Impossible de charger la suite du fil. Réessaie avec « Charger plus ».");
      }
      setEnErreur(true);
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, pageSuivante, params, enErreur, toast]);

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
      <ul>
        {items.map((sujet) => (
          <CarteSujet key={sujet.id} sujet={sujet} locale={locale} connecte={connecte} />
        ))}
      </ul>
      {enErreur ? (
        <p className="py-2 text-center text-sm text-cx-destructive" role="status">
          La suite du fil n’a pas pu être chargée. Aucune auto-reprise : utilise le bouton ci-dessous.
        </p>
      ) : null}
      {hasMore ? (
        <div className="py-6 text-center">
          <button
            type="button"
            onClick={() => void charger()}
            className="rounded-full border border-cx-border px-4 py-2 text-sm font-medium text-cx-primary transition hover:bg-cx-muted/50 active:scale-[0.97]"
            disabled={isLoading}
            aria-live="polite"
          >
            {isLoading ? "Chargement…" : "Charger plus de sujets"}
          </button>
        </div>
      ) : null}
    </>
  );
}

export default ForumFeed;
