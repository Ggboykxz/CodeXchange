"use client";

import { useEffect } from "react";

type Props = {
  open: boolean;
  titre: string;
  description?: string;
  confirmer: () => void;
  annuler: () => void;
  labelConfirmer?: string;
  labelAnnuler?: string;
};

/** Modale de confirmation stylée (remplace `confirm()`). */
export function ConfirmDialog({
  open,
  titre,
  description,
  confirmer,
  annuler,
  labelConfirmer = "Confirmer",
  labelAnnuler = "Annuler",
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") annuler();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, annuler]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-titre"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-md rounded-xl bg-cx-card p-6 shadow-xl">
        <h3 id="confirm-titre" className="text-lg font-bold">
          {titre}
        </h3>
        {description ? <p className="mt-2 text-sm text-cx-muted-fg">{description}</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={annuler}
            className="rounded-lg border border-cx-border px-3 py-2 text-sm font-medium hover:bg-cx-muted"
          >
            {labelAnnuler}
          </button>
          <button
            type="button"
            onClick={confirmer}
            className="rounded-lg bg-cx-destructive px-3 py-2 text-sm font-bold text-cx-destructive-fg"
          >
            {labelConfirmer}
          </button>
        </div>
      </div>
    </div>
  );
}
