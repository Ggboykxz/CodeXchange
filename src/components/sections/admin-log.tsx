"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT, useAppStore } from "@/store/app-store";
import { Avatar } from "@/components/shared/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { timeAgo, timeAgoLong } from "@/lib/time";
import { cn } from "@/lib/utils";
import { ScrollText } from "lucide-react";

type LogEntry = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  note: string | null;
  createdAt: string;
  actor: { id: string; name: string; profile: { username: string } | null };
};

/**
 * M1 — onglet « Journal » de l'admin : historique des actions de
 * modération (épinglages, résolutions de signalements, suppressions…).
 *
 * Journal chronologique, une ligne par action : acteur, type d'action,
 * cible, horodatage, puis la note laissée par le modérateur. Les actions
 * destructrices sont marquées en `destructive`, les autres en accent de
 * marque — la couleur n'est jamais le seul indice, le libellé reste là.
 */
export function AdminLog() {
  const t = useT();
  const locale = useAppStore((s) => s.locale);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const reqId = useRef(0);

  const load = useCallback(async (pageToLoad: number, append: boolean) => {
    const id = ++reqId.current;
    if (!append) setLoading(true);
    try {
      const res = await fetch(`/api/moderation/log?page=${pageToLoad}&pageSize=50`);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      if (reqId.current !== id) return;
      setLogs((prev) => (append ? [...prev, ...data.logs] : data.logs));
      setHasMore(data.logs.length === 50);
    } catch {
      toast.error(t("common.network_error"));
    } finally {
      if (reqId.current === id) setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load(1, false);
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-2" role="status" aria-busy="true">
        <span className="sr-only">{t("common.loading")}</span>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
        {t("admin.log_empty")}
      </p>
    );
  }

  return (
    <Card className="gap-0 overflow-hidden p-0 py-0">
      {/* En-tête du registre d'audit. */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
        <h3 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-foreground">
          <ScrollText className="h-3.5 w-3.5 text-brand" aria-hidden />
          {t("admin.tab_log")}
        </h3>
        <span className="font-mono text-[11px] text-muted-foreground">
          {logs.length} {t("common.results")}
        </span>
      </div>

      <ul className="divide-y divide-border">
        {logs.map((log) => (
          <li
            key={log.id}
            className="flex flex-wrap items-center gap-x-2.5 gap-y-1 px-3 py-2.5 transition-colors duration-150 hover:bg-muted/40"
          >
            <Avatar name={log.actor.name} size="xs" />
            <span className="truncate text-sm font-medium">{log.actor.name}</span>
            <span className="truncate font-mono text-[11px] text-muted-foreground">
              @{log.actor.profile?.username}
            </span>
            <time
              dateTime={log.createdAt}
              title={timeAgoLong(log.createdAt, locale)}
              className="ms-auto font-mono text-[11px] text-muted-foreground"
            >
              {timeAgo(log.createdAt, locale)}
            </time>

            {/* Action · cible · note — la seconde ligne, alignée sous
                l'avatar. */}
            <div className="flex w-full min-w-0 flex-wrap items-center gap-2 ps-8">
              <span
                className={cn(
                  "inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[11px] font-bold",
                  log.action === "delete_content" || log.action === "dismiss_report"
                    ? "border-destructive/30 bg-destructive/10 text-destructive"
                    : "border-brand/30 bg-brand/10 text-brand"
                )}
              >
                {t(`admin.action_${log.action}`)}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {t(`admin.target_${log.targetType}`)}
              </span>
              {log.note && (
                <span className="text-xs text-muted-foreground">{log.note}</span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="flex justify-center border-t border-border bg-muted/40 px-3 py-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const next = page + 1;
              setPage(next);
              void load(next, true);
            }}
          >
            {t("feed.more")}
          </Button>
        </div>
      )}
    </Card>
  );
}
