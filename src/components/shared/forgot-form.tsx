"use client";

import { useState } from "react";
import { useT } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";

/**
 * Panneau « mot de passe oublié » (B7) — rendu dans la
 * modale d'auth unique.
 *
 * La réponse de l'API est **identique** que l'adresse
 * existe ou non (anti-énumération) : le message de succès
 * est donc affiché dans les deux cas.
 */
export function ForgotForm({ onBack }: { onBack: () => void }) {
  const t = useT();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.status === 429) {
        toast.error(t("create.rate_limited"));
        return;
      }
      if (!res.ok) {
        toast.error(t("common.error"));
        return;
      }
      setSent(true);
    } catch {
      toast.error(t("common.network_error"));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-4 py-2 text-center">
        <MailCheck className="h-10 w-10 mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t("auth.forgot.sent")}</p>
        <Button variant="outline" onClick={onBack} className="w-full">
          <ArrowLeft className="h-4 w-4 me-2 rtl:-scale-x-100" />
          {t("auth.forgot.back")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm text-muted-foreground">{t("auth.forgot.subtitle")}</p>
      <div>
        <Label htmlFor="forgot-email" className="text-xs font-mono uppercase">
          {t("auth.email")}
        </Label>
        <Input
          id="forgot-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1"
          placeholder="toi@exemple.com"
        />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-foreground text-background hover:bg-foreground/90 mt-2"
      >
        {loading ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : null}
        {t("auth.forgot.submit")}
      </Button>
      <div className="text-center">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition"
        >
          <ArrowLeft className="h-3 w-3 rtl:-scale-x-100" />
          {t("auth.forgot.back")}
        </button>
      </div>
    </form>
  );
}
