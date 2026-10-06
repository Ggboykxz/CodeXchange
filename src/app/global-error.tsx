"use client";

import { useEffect } from "react";

/**
 * Frontière d'erreur globale (D5) — remplace le layout racine quand ce dernier
 * échoue : elle DOIT fournir ses propres <html>/<body> et son propre style
 * (globals.css n'est plus chargé à ce stade).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erreur globale CodeXchange:", error);
  }, [error]);

  return (
    // global-error doit inclure html et body
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1.25rem",
          background: "#FAFAF9",
          color: "#1C1A19",
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          fontFeatureSettings: '"ss01", "cv11"',
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <main
          style={{
            width: "100%",
            maxWidth: "42rem",
            background: "#F8F8F7",
            border: "1px solid #D8D7D4",
            borderRadius: "0.375rem",
            padding: "2rem 1.75rem",
          }}
        >
          <p
            style={{
              margin: "0 0 1rem",
              fontSize: "0.7rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#73716F",
            }}
          >
            codexchange // erreur fatale
          </p>

          <h1
            style={{
              margin: "0 0 1rem",
              fontSize: "clamp(1.75rem, 6vw, 2.5rem)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
            }}
          >
            <span style={{ color: "#C43B15" }}>Erreur.</span> La page racine n&apos;a
            pas pu être chargée.
          </h1>

          <p
            style={{
              margin: "0 0 1rem",
              fontSize: "0.95rem",
              lineHeight: 1.7,
              color: "#73716F",
            }}
          >
            Une erreur inattendue est survenue au plus haut niveau de
            l&apos;application. Réessayez ; si le problème persiste, rechargez
            le navigateur.
          </p>

          {error.digest ? (
            <code
              style={{
                display: "block",
                margin: "1.5rem 0 0",
                background: "#FAFAF9",
                border: "1px solid #D8D7D4",
                borderRadius: "6px",
                padding: "0.75rem 1rem",
                fontSize: "0.875rem",
                overflowWrap: "anywhere",
              }}
            >
              <span style={{ color: "#C37F00" }}>$</span> digest: {error.digest}
            </code>
          ) : null}

          <div
            style={{
              marginTop: "1.5rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                font: "inherit",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                borderRadius: "6px",
                padding: "0.6rem 1.1rem",
                background: "#1C1A19",
                color: "#FAFAF9",
                border: "1px solid #1C1A19",
              }}
            >
              Réessayer
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                font: "inherit",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                borderRadius: "6px",
                padding: "0.6rem 1.1rem",
                background: "transparent",
                color: "#1C1A19",
                border: "1px solid #D8D7D4",
              }}
            >
              Recharger
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
