"use client";

import { useEffect, useState } from "react";
import { useT } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BadgeCheck, AlertTriangle, Loader2, MailWarning, Home } from "lucide-react";

type Status = "checking" | "success" | "invalid" | "expired" | "missing";

/**
 * Cible du lien reçu par e-mail (en dev : journal du serveur + lien
 * cliquable après inscription).
 *
 * La requête part automatiquement : l'utilisateur vient de cliquer sur
 * un lien, il ne doit rien saisir. `token` vient du serveur via
 * `searchParams` plutôt que `useSearchParams()` — ce qui évite la
 * frontière `<Suspense>` exigée par Next pour cette API en prerender.
 */
export function VerifyCard({ token }: { token: string | null }) {
  const t = useT();
  const [status, setStatus] = useState<Status>(token ? "checking" : "missing");
  const [resent, setResent] = useState(false);

  /**
   * Envoi automatique : l'utilisateur vient de cliquer sur un lien, il ne
   * doit rien saisir.
   *
   * Le setState vit dans les callbacks de `fetch` et non dans le corps de
   * l'effet — la règle `react-hooks/set-state-in-effect` refuse sinon, et
   * le drapeau `cancelled` évite une mise à jour après démontage (la page
   * peut être quittée pendant que le jeton se vérifie).
   */
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        if (cancelled) return;
        if (res.ok) setStatus("success");
        else setStatus(res.status === 410 ? "expired" : "invalid");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("invalid");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const resend = async () => {
    try {
      const res = await fetch("/api/auth/verify/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        toast.error(t("common.error"));
        return;
      }
      setResent(true);
      toast.success(t("verify.resent"));
    } catch {
      toast.error(t("common.network_error"));
    }
  };

  const view = {
    checking: { icon: <Loader2 className="h-8 w-8 animate-spin" />, title: t("verify.checking"), tone: "text-muted-foreground" },
    success: { icon: <BadgeCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />, title: t("verify.success_title"), tone: "text-foreground" },
    invalid: { icon: <AlertTriangle className="h-8 w-8 text-chart-1" />, title: t("verify.invalid_title"), tone: "text-foreground" },
    expired: { icon: <MailWarning className="h-8 w-8 text-chart-2" />, title: t("verify.expired_title"), tone: "text-foreground" },
    missing: { icon: <AlertTriangle className="h-8 w-8 text-chart-1" />, title: t("verify.missing_title"), tone: "text-foreground" },
  }[status];

  const body = {
    checking: t("verify.checking_body"),
    success: t("verify.success_body"),
    invalid: t("verify.invalid_body"),
    expired: t("verify.expired_body"),
    missing: t("verify.missing_body"),
  }[status];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <main id="contenu" className="w-full max-w-lg">
        <p className="eyebrow">codexchange // verify-email</p>
        <div className="flex items-center gap-3 mt-4 mb-2">
          <span className={view.tone}>{view.icon}</span>
          <h1 className="display text-3xl leading-tight">{view.title}</h1>
        </div>
        <div className="dot-divider my-6" role="presentation" />
        <p className="prose-mono text-muted-foreground">{body}</p>

        {resent && (
          <p className="prose-mono mt-4 text-chart-2">{t("verify.resent_hint")}</p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {status !== "checking" && status !== "success" && (
            <Button onClick={resend} disabled={resent}>
              {t("verify.resend")}
            </Button>
          )}
          <Button variant="outline" asChild>
            <a href="/">
              <Home className="h-4 w-4 mr-2" />
              {t("verify.home")}
            </a>
          </Button>
        </div>
      </main>
    </div>
  );
}
