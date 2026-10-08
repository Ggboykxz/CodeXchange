"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useT } from "@/store/app-store";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * P1 — boîte de dialogue de paiement mobile money.
 *
 * Flux : l'utilisateur saisit son numéro → `POST /api/payments` crée la
 * transaction → instructions affichées → polling `POST …/confirm`
 * jusqu'à ce que le provider confirme (mock : après 3 s).
 */
export function PaymentDialog({
  open,
  onOpenChange,
  targetId,
  targetLabel,
  amount,
  currency,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetId: string;
  targetLabel: string;
  amount: number;
  currency: string;
}) {
  const t = useT();
  const [phone, setPhone] = useState("");
  const [phase, setPhase] = useState<"form" | "waiting" | "done">("form");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const txId = useRef<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Nettoyage du timer au démontage ou à la fermeture du dialog.
  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setPhase("form");
      setPhone("");
      setMessage("");
      txId.current = null;
      if (pollTimer.current) clearInterval(pollTimer.current);
    }
  }, [open]);

  const pay = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "mock",
          amount,
          currency,
          phoneNumber: phone,
          purpose: "mentorship",
          targetId,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error((data && data.error) || t("common.network_error"));
        return;
      }
      txId.current = data.transaction.id;
      setMessage(data.message);
      setPhase("waiting");

      // Polling jusqu'à confirmation (mock : après 3 s).
      pollTimer.current = setInterval(async () => {
        try {
          const confirmRes = await fetch(`/api/payments/${txId.current}/confirm`, {
            method: "POST",
          });
          const confirmData = await confirmRes.json().catch(() => null);
          if (confirmData?.status === "completed") {
            if (pollTimer.current) clearInterval(pollTimer.current);
            setPhase("done");
            toast.success(t("payment.success"));
          } else if (confirmData?.status === "failed" || confirmData?.status === "cancelled") {
            if (pollTimer.current) clearInterval(pollTimer.current);
            setPhase("form");
            toast.error(t("payment.failed"));
          }
        } catch {
          /* retry au prochain tick */
        }
      }, 1500);
    } catch {
      toast.error(t("common.network_error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!busy) onOpenChange(v); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("payment.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {phase === "form" &&
              `${amount} ${currency} — ${targetLabel}`}
            {phase === "waiting" && message}
            {phase === "done" && t("payment.success_message")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {phase === "form" && (
          <div className="space-y-2 py-2">
            <Label htmlFor="pay-phone">{t("payment.phone")}</Label>
            <Input
              id="pay-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+221 77 123 45 67"
              maxLength={20}
            />
          </div>
        )}

        {phase === "waiting" && (
          <div className="flex items-center gap-3 py-4" role="status">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
            <p className="text-sm text-muted-foreground">{t("payment.waiting")}</p>
          </div>
        )}

        <AlertDialogFooter>
          {phase === "form" && (
            <>
              <AlertDialogCancel disabled={busy}>{t("common.cancel")}</AlertDialogCancel>
              <Button
                disabled={busy || phone.trim().length < 8}
                onClick={(e) => { e.preventDefault(); void pay(); }}
                className="bg-foreground text-background hover:bg-foreground/90"
              >
                {busy ? t("common.sending") : `${t("payment.pay")} — ${amount} ${currency}`}
              </Button>
            </>
          )}
          {phase === "done" && (
            <Button onClick={() => onOpenChange(false)}>{t("common.close")}</Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
