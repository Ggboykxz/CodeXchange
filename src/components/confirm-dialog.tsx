"use client";

import { useRef } from "react";
import {
  DialogueDescription,
  DialoguePanneau,
  DialogueRacine,
  DialogueTitre,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  titre: string;
  description?: string;
  confirmer: () => void;
  annuler: () => void;
  labelConfirmer?: string;
  labelAnnuler?: string;
};

/**
 * Modale de confirmation portée par Base UI (`role="alertdialog"`) :
 * le clic extérieur ne ferme pas, Échap annule, le focus est piégé dans le
 * panneau et posé sur « Annuler » à l'ouverture (l'action non destructive), puis
 * rendu au déclencheur à la fermeture. Les ids du titre et de la description
 * sont générés par la librairie : deux dialogues ouverts ne se marchent pas
 * dessus.
 */
export function ConfirmDialog({
  open,
  titre,
  description,
  confirmer,
  annuler,
  labelConfirmer = "Confirmer",
  labelAnnuler = "Annuler",
}: Props) {
  const refAnnuler = useRef<HTMLButtonElement>(null);

  return (
    <DialogueRacine
      open={open}
      onOpenChange={(ouvert) => {
        if (!ouvert) annuler();
      }}
    >
      <DialoguePanneau focusInitial={refAnnuler}>
        <DialogueTitre className="text-lg font-bold">{titre}</DialogueTitre>
        {description ? (
          <DialogueDescription className="mt-2 text-sm text-cx-muted-fg">
            {description}
          </DialogueDescription>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={refAnnuler}
            type="button"
            onClick={annuler}
            className="min-h-[44px] rounded-full border border-cx-border px-3 py-2 text-sm font-medium transition outline-none hover:bg-cx-muted focus-visible:ring-2 focus-visible:ring-cx-primary/40 active:scale-[0.97]"
          >
            {labelAnnuler}
          </button>
          <button
            type="button"
            onClick={confirmer}
            className="min-h-[44px] rounded-full bg-cx-destructive px-3 py-2 text-sm font-bold text-cx-destructive-fg transition outline-none focus-visible:ring-2 focus-visible:ring-cx-destructive/40 active:scale-[0.97]"
          >
            {labelConfirmer}
          </button>
        </div>
      </DialoguePanneau>
    </DialogueRacine>
  );
}
