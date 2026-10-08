"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT, useAppStore } from "@/store/app-store";
import { Avatar } from "@/components/shared/avatar";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";

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
      <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        {t("admin.log_empty")}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-3 px-4 py-3">
            <Avatar name={log.actor.name} size="xs" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{log.actor.name}</span>
                <span className="text-xs text-muted-foreground">
                  @{log.actor.profile?.username}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                <span className="font-mono font-medium text-foreground">
                  {t(`admin.action_${log.action}`)}
                </span>{" "}
                · {t(`admin.target_${log.targetType}`)} · {timeAgo(log.createdAt, locale)}
              </p>
              {log.note && (
                <p className="mt-1 text-sm text-muted-foreground">{log.note}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              const next = page + 1;
              setPage(next);
              void load(next, true);
            }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {t("feed.more")}
          </button>
        </div>
      )}
    </div>
  );
}
