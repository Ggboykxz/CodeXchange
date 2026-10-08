"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useT } from "@/store/app-store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { REPORT_REASONS } from "@/lib/validate";
import { cn } from "@/lib/utils";

/**
 * M1 — boîte de dialogue de signalement. Le membre choisit un motif
 * (borné par `REPORT_REASONS`) et peut ajouter des détails optionnels.
 * L'envoi passe par `POST /api/reports` ; un doublon renvoie 409 et
 * l'utilisateur est averti sans perdre sa saisie.
 */
export function ReportDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: string;
  targetId: string;
  targetLabel?: string;
}) {
  const t = useT();
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          details: details.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error((data && data.error) || t("common.network_error"));
        return;
      }
      toast.success(t("report.submitted"));
      setDetails("");
      onOpenChange(false);
    } catch {
      toast.error(t("common.network_error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!busy) onOpenChange(v);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("report.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {targetLabel
              ? t("report.target_label").replace("{label}", targetLabel)
              : t("report.target_generic")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">{t("report.reason")}</p>
            <div className="flex flex-wrap gap-2">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  aria-pressed={reason === r}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition",
                    reason === r
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {t(`report.reason.${r}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="report-details" className="text-sm font-medium">
              {t("report.details")}
            </label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t("report.details_placeholder")}
              maxLength={1000}
              rows={3}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={(e) => {
              e.preventDefault();
              void submit();
            }}
            className="bg-destructive text-background hover:bg-destructive/90"
          >
            {busy ? t("common.sending") : t("report.submit")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
