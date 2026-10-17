"use client";

import { useCallback, useEffect, useState } from "react";
import CarteSujet from "@/components/carte-sujet";
import { useToast } from "@/components/toast";
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
  return (
    <ul>
      {visibles.map((sujet) => (
        <CarteSujet key={sujet.id} sujet={sujet} locale={locale} connecte={connecte} onMasquer={masquer} />
      ))}
    </ul>
  );
}
