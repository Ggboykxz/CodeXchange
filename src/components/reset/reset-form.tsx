"use client";

import { useState } from "react";
import { useT } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CheckCircle2,
  Home,
  Link2Off,
  Loader2,
  MailWarning,
} from "lucide-react";

type Status = "editing" | "saving" | "success" | "invalid" | "expired";

/**
 * Page cible du lien de réinitialisation (B7).
 *
 * Le jeton arrive par `searchParams` côté serveur (pas de
 * `useSearchParams()`, donc pas de frontière `<Suspense>`),
 * exactement comme pour `/verify`. Il n'est jamais affiché
 * ni persisté côté client.
 */
export function ResetForm({ token }: { token: string | null }) {
  const t = useT();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>(
    token ? "editing" : "invalid"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setStatus("saving");
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (res.ok) {
        setStatus("success");
        return;
      }
      // 410 = expiré, 400 = invalide/déjà utilisé.
      setStatus(res.status === 410 ? "expired" : "invalid");
    } catch {
      toast.error(t("common.network_error"));
      setStatus("editing");
    }
  };

  const view = {
    editing: { icon: null, title: t("auth.reset.title") },
    saving: { icon: <Loader2 className="h-8 w-8 animate-spin" />, title: t("auth.reset.title") },
    success: { icon: <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />, title: t("auth.reset.title") },
    invalid: { icon: <Link2Off className="h-8 w-8 text-chart-1" />, title: t("auth.reset.invalid") },
    expired: { icon: <MailWarning className="h-8 w-8 text-chart-2" />, title: t("auth.reset.expired") },
  }[status];

  const done = status === "success" || status === "invalid" || status === "expired";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <main className="w-full max-w-lg">
        <p className="eyebrow">codexchange // reset-password</p>
        <div className="flex items-center gap-3 mt-4 mb-2">
          {view.icon}
          <h1 className="display text-3xl leading-tight">{view.title}</h1>
        </div>
        <div className="dot-divider my-6" role="presentation" />

        {done ? (
          <div className="space-y-4">
            <p className="prose-mono text-muted-foreground">
              {status === "success"
                ? t("auth.reset.success")
                : status === "expired"
                  ? t("auth.reset.expired_body")
                  : t("auth.reset.invalid_body")}
            </p>
            <Button variant="outline" asChild className="w-full">
              <a href="/">
                <Home className="h-4 w-4 mr-2" />
                {t("auth.reset.home")}
              </a>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="prose-mono text-muted-foreground">
              {t("auth.reset.subtitle")}
            </p>
            <div>
              <Label htmlFor="reset-password" className="text-xs font-mono uppercase">
                {t("auth.password")}
              </Label>
              <Input
                id="reset-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="mt-1"
                placeholder="••••••••"
              />
              <p className="text-[10px] text-muted-foreground/70 font-mono mt-1">
                {t("auth.reset.policy")}
              </p>
            </div>
            <Button
              type="submit"
              disabled={status === "saving"}
              className="w-full bg-foreground text-background hover:bg-foreground/90 mt-2"
            >
              {status === "saving" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {t("auth.reset.submit")}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
