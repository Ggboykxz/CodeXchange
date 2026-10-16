"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import type { ReactNode, RefObject } from "react";
import { cn } from "@/lib/cn";

/**
 * Enveloppes minces autour de Base UI « AlertDialog ».
 *
 * Les seuls dialogues de l'app sont des confirmations (suppression, choix
 * irréversible) : le rôle `alertdialog` est donc le bon sémantique — le
 * clic extérieur ne ferme pas, le focus est piégé dans le panneau et revient au
 * déclencheur à la fermeture. Base UI câble `aria-labelledby`/
 * `aria-describedby` sur le titre et la description avec des ids **uniques**
 * (`useId`), ce qui permet deux dialogues simultanés sans collision.
 */

export const DialogueRacine = AlertDialog.Root;
export const DialogueDeclencheur = AlertDialog.Trigger;
export const DialogueFermer = AlertDialog.Close;
export const DialogueTitre = AlertDialog.Title;
export const DialogueDescription = AlertDialog.Description;

type PanneauProps = {
  children: ReactNode;
  className?: string;
  /** Élément qui reçoit le focus à l'ouverture (l'action la moins destructrice). */
  focusInitial?: RefObject<HTMLElement | null>;
};

/** Panneau centré — fond `z-30` (cf. `Z.overlay`) + contenu carte. Le centrage
 * et le repli sous les zones sûres (*safe-area*) viennent de `.dialogue-centre`
 * (globals.css) : le panneau ne passe jamais sous une encoche ou une barre système. */
export function DialoguePanneau({ children, className, focusInitial }: PanneauProps) {
  return (
    <AlertDialog.Portal>
      <AlertDialog.Backdrop className="fixed inset-0 z-30 bg-black/50" />
      <AlertDialog.Popup
        initialFocus={focusInitial}
        className={cn(
          "dialogue-centre fixed z-30 rounded-xl bg-cx-card p-6 shadow-xl outline-none",
          className,
        )}
      >
        {children}
      </AlertDialog.Popup>
    </AlertDialog.Portal>
  );
}
