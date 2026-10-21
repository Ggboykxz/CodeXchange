"use client";

import { useCallback, useEffect, useState } from "react";
import CarteSujet from "@/components/carte-sujet";
import { useToast } from "@/components/toast";
import { useRaccourcisFil } from "@/lib/use-raccourcis-fil";
import type { PostResume } from "@/lib/forum";
import type { Locale } from "@/lib/i18n";

export default function FilAccueil({
  items: initialItems,
  locale,
  connecte,
}: {
  items: PostResume[];
  locale: Locale;
  connecte: boolean;
}) {
  const toast = useToast();
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cx-hidden-posts");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- préférence locale : localStorage n'existe pas au rendu serveur, la lecture après hydratation est volontaire.
      if (raw) setHidden(new Set(JSON.parse(raw) as number[]));
    } catch {
      /* ignoré */
    }
  }, []);

  const masquer = useCallback(
    (id: number) => {
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
    },
    [toast],
  );

  const visibles = initialItems.filter((s) => !hidden.has(s.id));
  const { actifId } = useRaccourcisFil(visibles.map((s) => s.id));
  return (
    <>
      <p id="raccourcis-accueil" className="sr-only">
        Navigation clavier : j pour le sujet suivant, k pour le précédent, Entrée ou o pour
        ouvrir le sujet actif, Échap pour quitter.
      </p>
      <ul aria-describedby="raccourcis-accueil" aria-keyshortcuts="j k Enter o Escape">
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
    </>
  );
}
