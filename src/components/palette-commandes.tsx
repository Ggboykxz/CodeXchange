"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { cookieLocale, t } from "@/lib/i18n";
import { Icone, type NomIcone } from "@/components/icones";

type ItemPalette = {
  id: string;
  href: string;
  titre: string;
  detail?: string;
  groupe: string;
  icone?: NomIcone;
};

const ROUTES_STATIQUES: ItemPalette[] = [
  { id: "r-accueil", href: "/", titre: "Accueil", groupe: "Pages" },
  { id: "r-forum", href: "/forum", titre: "Forum", groupe: "Pages", icone: "forum" },
  { id: "r-jobs", href: "/jobs", titre: "Emplois", groupe: "Pages", icone: "jobs" },
  { id: "r-projets", href: "/projets", titre: "Projets", groupe: "Pages", icone: "projets" },
  { id: "r-annuaire", href: "/annuaire", titre: "Annuaire des devs", groupe: "Pages", icone: "annuaire" },
  { id: "r-tutos", href: "/tutos", titre: "Tutoriels", groupe: "Pages", icone: "tutos" },
  { id: "r-evenements", href: "/evenements", titre: "Événements", groupe: "Pages", icone: "evenements" },
  { id: "r-mentorat", href: "/mentorat", titre: "Mentorat", groupe: "Pages", icone: "mentorat" },
];

const GROUPES: Array<{ id: string; libelle: string; cle: keyof ResultatRecherche | null }> = [
  { id: "pages", libelle: "Pages", cle: null },
  { id: "sujets", libelle: "Sujets du forum", cle: "sujets" },
  { id: "offres", libelle: "Offres d'emploi", cle: "offres" },
  { id: "projets", libelle: "Projets", cle: "projets" },
  { id: "membres", libelle: "Membres", cle: "membres" },
  { id: "tutos", libelle: "Tutoriels", cle: "tutos" },
];

type ElementRecherche = { id?: number; slug?: string; titre?: string; nom?: string };

type ResultatRecherche = {
  sujets: ElementRecherche[];
  offres: ElementRecherche[];
  projets: ElementRecherche[];
  membres: ElementRecherche[];
  tutos: ElementRecherche[];
};

/**
 * Palette de commandes façon « Cmd+K » : recherche instantanée sur toutes les
 * rubriques (pages + contenus réels), navigation clavier complète.
 *
 * Un seul endroit pour chercher : la zone de recherche du header (desktop)
 * OUVRIT cette palette — pas deux interfaces divergentes. `pleine` rend la
 * déclencheuse en faux champ pleine largeur (look X).
 */
export default function PaletteCommandes({ pleine = false }: { pleine?: boolean }) {
  const router = useRouter();
  const [locale] = useState(() => cookieLocale());
  const [ouvert, setOuvert] = useState(false);
  const [q, setQ] = useState("");
  const [resultats, setResultats] = useState<ResultatRecherche | null>(null);
  const [actif, setActif] = useState(0);
  const entreeRef = useRef<HTMLInputElement>(null);
  const listeRef = useRef<HTMLDivElement>(null);

  const fermer = useCallback(() => {
    setOuvert(false);
    setQ("");
    setResultats(null);
    setActif(0);
  }, []);

  // Raccourcis : Ctrl/⌘+K ou « ? ».
  useEffect(() => {
    function surTouche(e: KeyboardEvent) {
      const cible = e.target as HTMLElement | null;
      const champSaisie = cible && (cible.tagName === "INPUT" || cible.tagName === "TEXTAREA" || cible.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOuvert((o) => !o);
        return;
      }
      if (!champSaisie && (e.key === "?" || (e.shiftKey && e.key === "/"))) {
        e.preventDefault();
        setOuvert(true);
      }
    }
    document.addEventListener("keydown", surTouche);
    return () => document.removeEventListener("keydown", surTouche);
  }, []);

  // Recherche à l'ouverture (toutes les rubriques) puis à la frappe (debounce).
  useEffect(() => {
    if (!ouvert) return;
    let annule = false;
    const minuteur = setTimeout(async () => {
      try {
        const r = await fetch(`/api/recherche?q=${encodeURIComponent(q)}`, { cache: "no-store" });
        const data = (await r.json()) as ResultatRecherche;
        if (!annule) setResultats(data);
      } catch {
        if (!annule) setResultats({ sujets: [], offres: [], projets: [], membres: [], tutos: [] });
      }
    }, 250);
    return () => {
      annule = true;
      clearTimeout(minuteur);
    };
  }, [ouvert, q]);

  // Construction de la liste affichée (routes + résultats par groupe).
  const items: ItemPalette[] = [];
  if (q.trim().length === 0) {
    items.push(...ROUTES_STATIQUES);
  } else {
    if (resultats) {
      for (const groupe of GROUPES) {
        if (!groupe.cle) continue;
        for (const res of resultats[groupe.cle] ?? []) {
          const titre = res.titre ?? res.nom ?? "";
          if (!titre.toLowerCase().includes(q.toLowerCase())) continue;
          const href =
            groupe.cle === "sujets"
              ? `/forum/${res.id}`
              : groupe.cle === "offres"
                ? `/jobs/${res.id}`
                : groupe.cle === "projets"
                  ? `/projets/${res.id}`
                  : groupe.cle === "membres"
                    ? `/membres/${res.slug}`
                    : `/tutos/${res.slug}`;
          items.push({ id: `${groupe.id}-${res.id ?? res.slug ?? ""}`, href, titre, groupe: groupe.libelle });
        }
      }
    }
  }

  // Navigation clavier dans la liste.
  function surToucheListe(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActif((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActif((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && items[actif]) {
      e.preventDefault();
      const item = items[actif];
      fermer();
      router.push(item.href);
    } else if (e.key === "Escape") {
      e.preventDefault();
      fermer();
    }
  }

  // Focus sur l'ouverture.
  useEffect(() => {
    if (ouvert) setTimeout(() => entreeRef.current?.focus(), 30);
  }, [ouvert]);

  // Défilement de l'élément actif.
  useEffect(() => {
    const el = listeRef.current?.querySelector<HTMLElement>(`[data-index="${actif}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [actif]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOuvert(true)}
        aria-keyshortcuts="Meta+K Control+K"
        title={t(locale, "palette.rapide_title")}
        className={
          pleine
            ? "flex w-full items-center gap-2 rounded-full border border-cx-border-fort bg-cx-muted/40 px-4 py-2.5 text-sm text-cx-muted-fg transition hover:border-cx-border hover:bg-cx-muted"
            : "hidden items-center gap-2 rounded-lg border border-cx-border bg-cx-card px-3 py-2 text-sm text-cx-muted-fg transition hover:bg-cx-muted sm:inline-flex"
        }
      >
        <Icone nom="recherche" className="size-4" />
        <span>{t(locale, "palette.champ")}</span>
        <kbd className={pleine ? "ml-auto rounded-md border border-cx-border px-1.5 py-0.5 text-[11px] font-medium text-cx-muted-fg" : "ml-2 rounded border border-cx-border px-1.5 py-0.5 text-[11px] text-cx-muted-fg"}>⌘K</kbd>
      </button>

      {ouvert ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[max(12dvh,env(safe-area-inset-top))]"
          onClick={fermer}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t(locale, "palette.titre")}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-cx-border bg-cx-bg text-cx-fg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-cx-border px-4 py-3">
              <Icone nom="recherche" className="size-4 text-cx-muted-fg" />
              <input
                ref={entreeRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setActif(0);
                }}
                onKeyDown={surToucheListe}
                placeholder={t(locale, "palette.placeholder")}
                aria-label={t(locale, "palette.placeholder")}
                className="w-full bg-transparent text-sm outline-none placeholder:text-cx-muted-fg"
              />
              <kbd className="rounded border border-cx-border px-1.5 py-0.5 text-[11px] text-cx-muted-fg">ESC</kbd>
            </div>

            <div ref={listeRef} className="max-h-[55dvh] overflow-y-auto overscroll-contain py-2">
              {items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-cx-muted-fg">{t(locale, "palette.vide")}</p>
              ) : (
                items.map((item, i) => (
                  <a
                    key={item.id}
                    data-index={i}
                    href={item.href}
                    onMouseEnter={() => setActif(i)}
                    onClick={(e) => {
                      e.preventDefault();
                      fermer();
                      router.push(item.href);
                    }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 text-sm",
                      i === actif ? "bg-cx-muted" : "hover:bg-cx-muted/60",
                    )}
                    aria-selected={i === actif}
                  >
                    {item.icone ? (
                      <Icone nom={item.icone} className="size-4 shrink-0 text-cx-muted-fg" />
                    ) : (
                      <span className="w-4 shrink-0" aria-hidden="true" />
                    )}
                    <span className="min-w-0 flex-1 truncate">{item.titre}</span>
                    <span className="text-xs text-cx-muted-fg">{item.groupe}</span>
                  </a>
                ))
              )}
            </div>

            <div className="flex items-center gap-4 border-t border-cx-border px-4 py-2 text-[11px] text-cx-muted-fg">
              <span>↑↓ naviguer</span>
              <span>↵ ouvrir</span>
              <span>Échap fermer</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
