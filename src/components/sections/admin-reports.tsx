"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT, useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { Avatar } from "@/components/shared/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Check, X, ExternalLink } from "lucide-react";

type Report = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  details: string | null;
  status: string;
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
  reporter: { id: string; name: string; profile: { username: string } | null };
  resolvedBy: { id: string; name: string } | null;
};

/**
 * M1 — onglet « Signalements » de l'admin. Liste les signalements en
 * attente, permet de les résoudre (avec note) ou de les rejeter. Les
 * signalements traités restent visibles en bas de liste.
 */
export function AdminReports() {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const user = useAuthStore((s) => s.user);

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [resolving, setResolving] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");
  const [busy, setBusy] = useState(false);
  const reqId = useRef(0);

  const load = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?status=${filter}&pageSize=50`);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      if (reqId.current === id) setReports(data.reports);
    } catch {
      toast.error(t("common.network_error"));
    } finally {
      if (reqId.current === id) setLoading(false);
    }
  }, [filter, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = async (id: string, status: "resolved" | "dismissed") => {
    setBusy(true);
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolution: resolution.trim() || undefined }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error((data && data.error) || t("common.network_error"));
        return;
      }
      toast.success(status === "resolved" ? t("admin.report_resolved") : t("admin.report_dismissed"));
      setResolving(null);
      setResolution("");
      void load();
    } catch {
      toast.error(t("common.network_error"));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2" role="status" aria-busy="true">
        <span className="sr-only">{t("common.loading")}</span>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
        {(
          [
            { id: "pending", label: t("admin.reports_pending") },
            { id: "all", label: t("admin.reports_all") },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition",
              filter === f.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {reports.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {t("admin.reports_empty")}
        </p>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <Card key={r.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Avatar name={r.reporter.name} size="xs" />
                    <span className="text-sm font-medium">{r.reporter.name}</span>
                    <span className="text-xs text-muted-foreground">
                      @{r.reporter.profile?.username}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t(`admin.target_${r.targetType}`)} · {t(`report.reason.${r.reason}`)} ·{" "}
                    {timeAgo(r.createdAt, locale)}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                    r.status === "pending" && "bg-chart-2/10 text-chart-2",
                    r.status === "resolved" && "bg-green-500/10 text-green-600",
                    r.status === "dismissed" && "bg-muted text-muted-foreground"
                  )}
                >
                  {t(`admin.status_${r.status}`)}
                </span>
              </div>

              {r.details && (
                <p className="text-sm text-muted-foreground">{r.details}</p>
              )}

              {r.status === "pending" && (
                <div className="flex items-center gap-2">
                  {resolving === r.id ? (
                    <div className="flex-1 space-y-2">
                      <Textarea
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        placeholder={t("admin.resolution_placeholder")}
                        maxLength={500}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={busy || !resolution.trim()}
                          onClick={() => void decide(r.id, "resolved")}
                        >
                          <Check className="h-4 w-4" aria-hidden />
                          {t("admin.resolve")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void decide(r.id, "dismissed")}
                        >
                          <X className="h-4 w-4" aria-hidden />
                          {t("admin.dismiss")}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => {
                            setResolving(null);
                            setResolution("");
                          }}
                        >
                          {t("common.cancel")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setResolving(r.id)}
                      >
                        <Check className="h-4 w-4" aria-hidden />
                        {t("admin.resolve")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void decide(r.id, "dismissed")}
                      >
                        <X className="h-4 w-4" aria-hidden />
                        {t("admin.dismiss")}
                      </Button>
                    </>
                  )}
                </div>
              )}

              {r.status !== "pending" && r.resolution && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">{r.resolvedBy?.name}</span> · {r.resolution}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
