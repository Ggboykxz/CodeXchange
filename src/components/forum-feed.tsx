"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/toast";
import CarteSujet from "@/components/carte-sujet";
import { useRaccourcisFil } from "@/lib/use-raccourcis-fil";
import type { PostResume } from "@/lib/forum";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

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
  const toast = useToast();
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const [items, setItems] = useState<PostResume[]>(initialItems);
  // Charger les sujets masqués depuis localStorage (1 tap = contrôle du fil).
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cx-hidden-posts");
      if (raw) {
        const ids = JSON.parse(raw) as number[];
        // eslint-disable-next-line react-hooks/set-state-in-effect -- préférence locale : localStorage n'existe pas au rendu serveur, la lecture après hydratation est volontaire.
        setHidden(new Set(ids));
      }
    } catch {
      /* ignoré */
    }
  }, []);

  const masquer = useCallback((id: number) => {
    setHidden((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem("cx-hidden-posts", JSON.stringify(Array.from(next)));
      } catch {
        /* ignoré */
      }
      return next;
    });
    toast.avecAction(
      "Sujet masqué",
      {
        label: "Annuler",
        onClick: () => {
          setHidden((prev) => {
            const next = new Set(prev);
            next.delete(id);
            try {
              localStorage.setItem("cx-hidden-posts", JSON.stringify(Array.from(next)));
            } catch {
              /* ignoré */
            }
            return next;
          });
        },
      },
      "Tu peux l'afficher à nouveau.",
    );
  }, [toast]);

  const visibles = items.filter((s) => !hidden.has(s.id));
  const { actifId } = useRaccourcisFil(visibles.map((s) => s.id));
  const [pageSuivante, setPageSuivante] = useState(currentPage + 1);
  const [hasMore, setHasMore] = useState(currentPage < totalPages);
  const [isLoading, setIsLoading] = useState(false);
  const [enErreur, setEnErreur] = useState(false);
  const sentinelleRef = useRef<HTMLDivElement>(null);
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
      // Toast dédupliqué : une seule alerte, puis stop-auto (bouton manuel).
      if (!enErreur) toast.erreur(t(locale, "feed.erreur"));
      setEnErreur(true);
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, pageSuivante, params, enErreur, toast, locale]);

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
      <p id="raccourcis-fil" className="sr-only">
        Navigation clavier : j pour le sujet suivant, k pour le précédent, Entrée ou o pour
        ouvrir le sujet actif, Échap pour quitter.
      </p>
      <ul aria-describedby="raccourcis-fil" aria-keyshortcuts="j k Enter o Escape">
        {visibles.map((sujet, index) => (
          <CarteSujet
            key={sujet.id}
            sujet={sujet}
            locale={locale}
            connecte={connecte}
            onMasquer={masquer}
            actif={sujet.id === actifId}
            entree={index}
          />
        ))}
      </ul>
      {enErreur ? (
        <p className="py-2 text-center text-sm text-cx-destructive" role="status">
          {t(locale, "feed.erreur")}
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
            {isLoading ? t(locale, "common.loading") : t(locale, "feed.load_more")}
          </button>
        </div>
      ) : null}
      {!hasMore && !enErreur ? (
        <p role="status" className="py-6 text-center text-sm font-medium text-cx-muted-fg">
          {t(locale, "feed.up_to_date")}
        </p>
      ) : null}
    </>
  );
}

export default ForumFeed;
