"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useT } from "@/store/app-store";
import type { SearchKind, SearchResult } from "@/lib/search";

/** Groupe → clé i18n du libellé (groupes dans un ordre fixe). */
const GROUP_LABELS: Record<SearchKind, string> = {
  threads: "nav.forum",
  jobs: "nav.jobs",
  projects: "nav.projects",
  tutorials: "nav.tutos",
  events: "search.events",
  people: "nav.annuaire",
};

/**
 * Recherche transverse du header (D9) — tout module, une seule boîte.
 *
 * Même contrat que la recherche du fil : saisie instantanée, requête
 * envoyée après 300 ms de debounce, réponse fraîche seule visible.
 * Le panneau se ferme au clic (le lien navigue par ancre), sur Escape,
 * et au blur **après 150 ms** : le mousedown sur le panneau annule le
 * changement de focus, donc un clic de résultat n'est jamais
 * court-circuité par la fermeture au blur.
 */
export function GlobalSearch() {
  const t = useT();
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  /** Réponse associée à SA requête — un résultat arrivé en retard pour un
   *  `q` précédent ne s'affiche jamais (ticket `alive` en garde-fou). */
  const [result, setResult] = useState<{ q: string; data: SearchResult | null } | null>(null);
  const [open, setOpen] = useState(false);

  /** Saisie → requête différée de 300 ms. */
  useEffect(() => {
    const id = setTimeout(() => setQ(input.trim()), 300);
    return () => clearTimeout(id);
  }, [input]);

  /**
   * Requête → réponse. Tout le setState est dans des callbacks
   * asynchrones : l'état « recherche en cours » et « résultat périmé » se
   * dérivent ensuite au render (pas de setState dans le corps d'effet —
   * règle `react-hooks/set-state-in-effect`).
   */
  useEffect(() => {
    if (q.length < 2) return;
    let alive = true;
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: SearchResult | null) => {
        if (!alive) return;
        setResult({ q, data: d });
        setOpen(true);
      })
      .catch(() => {
        if (alive) setResult({ q, data: null });
      });
    return () => {
      alive = false;
    };
  }, [q]);

  /** Spin seulement quand la requête courante n'a pas encore répondu. */
  const busy = q.length >= 2 && result?.q !== q;
  /** Le panneau n'affiche jamais les résultats d'une saisie révolue. */
  const visible = q.length >= 2 && result?.q === q ? result.data : null;

  return (
    <div className="relative">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          aria-hidden
        />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => {
            if (result && result.q === q && q.length >= 2) setOpen(true);
          }}
          onBlur={() => {
            // Fermeture différée seulement : un mousedown sur le panneau
            // empêche le blur d'arriver (preventDefault), mais il faut
            // laisser un vrai clic extérieur conclure.
            setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              e.currentTarget.blur();
            }
          }}
          placeholder={t("nav.search")}
          aria-label={t("nav.search")}
          className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-9 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-chart-1"
        />
        {busy && (
          <Loader2
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground"
            aria-hidden
          />
        )}
      </div>

      {open && visible && (
        <div
          // Le mousedown sur le panneau ne doit pas voler le focus à
          // l'input : sans ça, un clic de résultat fermerait le panneau
          // avant que le lien ne soit suivi.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[60vh] overflow-auto rounded-md border border-border bg-background p-1 shadow-lg"
        >
          {visible.groups.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              {t("search.no_results")} «{visible.query}»
            </p>
          ) : (
            visible.groups.map((group) => (
              <div key={group.kind}>
                <p className="px-3 pb-1 pt-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                  {t(GROUP_LABELS[group.kind])}
                </p>
                {group.items.map((item) => (
                  <a
                    key={`${item.kind}:${item.href}:${item.title}`}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex flex-col rounded px-3 py-1.5 text-sm transition-colors hover:bg-muted"
                  >
                    <span className="truncate font-medium">{item.title}</span>
                    {item.sub && (
                      <span className="truncate text-xs text-muted-foreground">{item.sub}</span>
                    )}
                  </a>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
