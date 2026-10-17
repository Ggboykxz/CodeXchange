"use client";


/**
 * Icônes vectorielles animées (remplacent les emojis statiques).
 * Respecte `prefers-reduced-motion` via CSS global.
 */

export type NomIcone =
  | "succes"
  | "erreur"
  | "info"
  | "fermer"
  | "etoile"
  | "etoile-vide"
  | "like"
  | "like-vide"
  | "horloge"
  | "ampoule"
  | "haut"
  | "coche"
  | "copie";

const CLASSES = "inline-block size-5";

export function IconeAnimee({ nom, className = CLASSES }: { nom: NomIcone; className?: string }) {
  switch (nom) {
    case "succes":
      return (
        <svg className={`${className} animate-pop-in`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" className="animate-pulse-slow" />
          <path d="M7.5 12.5l3 3 6-7" pathLength="100" className="animate-tracer" />
        </svg>
      );
    case "erreur":
      return (
        <svg className={`${className} animate-shake`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case "info":
      return (
        <svg className={`${className} animate-pulse-slow`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="11" x2="12" y2="16" />
          <circle cx="12" cy="7.5" r="0.7" fill="currentColor" />
        </svg>
      );
    case "fermer":
      return (
        <svg className={`${className} transition-transform hover:rotate-90`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    case "etoile":
      return (
        <svg className={`${className} animate-pop-in fill-amber-400 text-amber-500`} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    case "etoile-vide":
      return (
        <svg className={`${className} text-cx-muted-fg`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    case "like":
      return (
        <svg className={`${className} animate-pop-in fill-cx-primary`} viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      );
    case "like-vide":
      return (
        <svg className={`${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      );
    case "horloge":
      return (
        <svg className={`${className} animate-spin-slow`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="12" x2="12" y2="7" />
          <line x1="12" y1="12" x2="15.5" y2="14" />
        </svg>
      );
    case "ampoule":
      return (
        <svg className={`${className} animate-glow`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.5-1.5 3.5-2 5-.5.8-1 1.5-1 2H8c0-.5-.5-1.2-1-2-.5-1.5-2-2.5-2-5A7 7 0 0 1 12 2z" />
        </svg>
      );
    case "haut":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      );
    case "coche":
      return (
        <svg className={`${className} animate-pop-in`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l5 5 9-11" pathLength="100" className="animate-tracer" />
        </svg>
      );
    case "copie":
      return (
        <svg className={`${className} transition-transform hover:scale-110`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      );
    default:
      return <span aria-hidden="true" className={className} />;
  }
}
