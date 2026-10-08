"use client";

import { useEffect, useState } from "react";
import { useT } from "@/store/app-store";

/**
 * Boutons OAuth GitHub / Google (B6).
 *
 * La liste vient de `/api/oauth/providers` — source unique : un
 * fournisseur sans credentials n'apparaît jamais plutôt qu'un bouton
 * qui échouerait au retour. Les logos sont en SVG inline : lucide a
 * déprécié ses icônes de marque (retrait v1.0) et n'en a jamais eu pour
 * Google, on ne dépend donc d'aucun paquet pour des logos officiels.
 *
 * Clic = navigation complète vers le serveur : c'est un vrai lien
 * (`href`), avec `?next=#ancre` ajouté au moment du clic pour revenir
 * là où l'on était.
 */

type Provider = "github" | "google";

function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.28-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.98 8.98 0 0 0 9 0 9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

const LABELS: Record<Provider, string> = { github: "GitHub", google: "Google" };

export function OAuthButtons() {
  const t = useT();
  const [providers, setProviders] = useState<Provider[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/oauth/providers")
      .then((r) => (r.ok ? r.json() : { providers: [] }))
      .then((data: { providers?: unknown }) => {
        if (alive) {
          setProviders(
            Array.isArray(data.providers) ? (data.providers as Provider[]) : []
          );
        }
      })
      .catch(() => {
        if (alive) setProviders([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!providers?.length) return null;

  const go = (provider: Provider) => (e: React.MouseEvent) => {
    e.preventDefault();
    // On garde le chemin + l'ancre courante pour y revenir après connexion.
    const next = window.location.pathname + window.location.hash;
    window.location.assign(
      `/api/oauth/${provider}${next && next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {providers.map((p) => (
          <a
            key={p}
            href={`/api/oauth/${p}`}
            onClick={go(p)}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1"
          >
            {p === "github" ? <GitHubMark /> : <GoogleMark />}
            {LABELS[p]}
          </a>
        ))}
      </div>
      <div className="relative text-center text-xs text-muted-foreground">
        <span className="absolute inset-x-0 top-1/2 h-px bg-border" aria-hidden />
        <span className="relative bg-background px-2">{t("auth.oauth.or")}</span>
      </div>
    </div>
  );
}
