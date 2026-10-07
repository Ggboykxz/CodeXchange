"use client";

import { useT } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AuthForm } from "@/components/shared/auth-form";

/**
 * La modale d'authentification de l'application — **une seule**, rendue une
 * fois dans `app/page.tsx` et pilotée par `auth-store`.
 *
 * Elle remplace les deux copies qui coexistaient (en-tête et fil) : toute
 * section peut appeler `openAuth("login")`, y compris en réponse à un 401,
 * et il est désormais impossible d'avoir deux superpositions.
 */
export function AuthDialog() {
  const t = useT();
  const open = useAuthStore((s) => s.authOpen);
  const mode = useAuthStore((s) => s.authMode);
  const closeAuth = useAuthStore((s) => s.closeAuth);
  const switchAuthMode = useAuthStore((s) => s.switchAuthMode);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  /** Ferme la modale et revalide la session (état de vérification inclus). */
  const onAuthSuccess = () => {
    closeAuth();
    void fetchMe();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && closeAuth()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            <span className="text-muted-foreground">$</span>{" "}
            {mode === "login" ? t("nav.login") : t("nav.register")}
          </DialogTitle>
        </DialogHeader>
        <AuthForm mode={mode} onSuccess={onAuthSuccess} onSwitch={switchAuthMode} />
      </DialogContent>
    </Dialog>
  );
}
