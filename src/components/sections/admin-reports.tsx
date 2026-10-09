"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT, useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { Avatar } from "@/components/shared/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tag } from "@/components/shared/tag";
import { toast } from "sonner";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Check, Flag, X, ExternalLink } from "lucide-react";

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
 *
 * File de triage « terminal » : chaque carte porte son émetteur, la
 * cible, le motif et l'horodatage, puis les deux seules décisions que
 * l'API expose (résoudre / rejeter). Rien d'inventé ici : pas de bouton
 * « bannir » ou « geler » tant que la route ne le permet pas.
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

  const pending = reports.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-4">
      {/* En-tête de la file + sélecteur de périmètre. */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-foreground">
            <Flag className="h-3.5 w-3.5 text-brand" aria-hidden />
            {t("admin.tab_reports")}
          </h3>
          <Tag
            label={`${pending} ${t("admin.reports_pending")}`}
            tone={pending > 0 ? "terracotta" : undefined}
            variant={pending > 0 ? undefined : "muted"}
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
          {(
            [
              { id: "pending", label: t("admin.reports_pending") },
              { id: "all", label: t("admin.reports_all") },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wide transition-colors duration-150",
                filter === f.id
                  ? "bg-brand text-brand-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {reports.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          {t("admin.reports_empty")}
        </p>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <Card key={r.id} className="card-interactive gap-3 p-4">
              {/* Émetteur + statut — qui a signalé, où en est le dossier. */}
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar name={r.reporter.name} size="xs" />
                  <span className="truncate text-sm font-medium">
                    {r.reporter.name}
                  </span>
                  <span className="truncate font-mono text-[11px] text-muted-foreground">
                    @{r.reporter.profile?.username}
                  </span>
                </div>
                {r.status === "pending" && (
                  <Tag label={t("admin.status_pending")} tone="terracotta" />
                )}
                {r.status === "resolved" && (
                  <Tag label={t("admin.status_resolved")} tone="sage" />
                )}
                {r.status === "dismissed" && (
                  <Tag label={t("admin.status_dismissed")} variant="muted" />
                )}
              </div>

              {/* Cible, motif, âge — le triplet que le modérateur lit
                  avant de décider. */}
              <div className="flex flex-wrap items-center gap-2">
                <Tag label={t(`admin.target_${r.targetType}`)} variant="outline" />
                <Tag label={t(`report.reason.${r.reason}`)} variant="muted" />
                <span className="font-mono text-[11px] text-muted-foreground">
                  {timeAgo(r.createdAt, locale)}
                </span>
              </div>

              {r.details && (
                <p className="text-sm text-muted-foreground">{r.details}</p>
              )}

              <p className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{r.targetId}</span>
              </p>

              {r.status === "pending" && (
                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  {resolving === r.id ? (
                    <div className="w-full space-y-2">
                      <Textarea
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        placeholder={t("admin.resolution_placeholder")}
                        maxLength={500}
                        rows={2}
                      />
                      <div className="flex flex-wrap gap-2">
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
                          {t("forum.cancel")}
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
                <p className="border-t border-border pt-2 font-mono text-[11px] text-muted-foreground">
                  <span className="font-bold text-foreground">
                    {r.resolvedBy?.name}
                  </span>{" "}
                  · {r.resolution}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
