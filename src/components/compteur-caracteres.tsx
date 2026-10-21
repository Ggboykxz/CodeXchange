"use client";

/**
 * Compteur de caractères façon X : anneau de progression + « n / max ».
 *
 * L'anneau se remplit à mesure de la frappe ; il passe en couleur d'alerte
 * dans les derniers 10 % et en couleur destructive au-delà de la limite.
 * L'information n'est pas seulement colorée : le texte « n / max » reste
 * lisible, et un statut lecteur d'écran n'annonce que les franchissements de
 * paliers (pas chaque frappe).
 */
export default function CompteurCaracteres({
  valeur,
  max,
  paliers = [50, 20, 0],
  id,
}: {
  valeur: string;
  max: number;
  /** Seuils (en caractères restants) annoncés aux lecteurs d'écran. */
  paliers?: number[];
  id?: string;
}) {
  const nombre = valeur.length;
  const reste = max - nombre;
  const ratio = Math.min(1, nombre / max);
  const proche = reste <= Math.max(20, Math.round(max * 0.1));
  const depasse = reste < 0;

  // Palier courant : le texte du statut ne change qu'au franchissement.
  const palier = [...paliers].sort((a, b) => b - a).find((p) => reste <= p);
  const annonce =
    palier == null
      ? ""
      : palier === 0
        ? depasse
          ? `Limite dépassée de ${Math.abs(reste)} caractères.`
          : "Limite atteinte."
        : `Plus que ${palier} caractères.`;

  const rayon = 8;
  const circonference = 2 * Math.PI * rayon;

  return (
    <span id={id} className="inline-flex items-center gap-1.5 text-xs">
      <svg viewBox="0 0 20 20" className="size-4 -rotate-90" aria-hidden="true">
        <circle cx="10" cy="10" r={rayon} fill="none" stroke="currentColor" strokeWidth="2" className="text-cx-border" />
        <circle
          cx="10"
          cy="10"
          r={rayon}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circonference}
          strokeDashoffset={circonference * (1 - ratio)}
          className={depasse ? "text-cx-destructive" : proche ? "text-cx-warning" : "text-cx-primary"}
        />
      </svg>
      <span
        aria-hidden="true"
        className={
          depasse
            ? "tabular-nums font-semibold text-cx-destructive"
            : proche
              ? "tabular-nums font-semibold text-cx-warning"
              : "tabular-nums text-cx-muted-fg"
        }
      >
        {nombre} / {max}
      </span>
      <span className="sr-only" role="status" aria-live="polite">
        {annonce}
      </span>
    </span>
  );
}
