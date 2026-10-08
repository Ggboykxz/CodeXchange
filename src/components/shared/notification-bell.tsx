"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppStore, useT } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { Avatar } from "@/components/shared/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { toast } from "sonner";
import { timeAgo } from "@/lib/time";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  createdAt: string;
  actor: { id: string; name: string; image: string | null } | null;
};

export function NotificationBell() {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const user = useAuthStore((s) => s.user);
  const navigate = useAppStore((s) => s.navigate);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setItems(data.notifications || []);
      setUnread(data.unread || 0);
    } catch {
      /* silent: the bell degrades to an empty list */
    }
  }, [user]);

  // Polling 60 s : le **secours** du temps réel (SSE bloqué, proxy…).
  // Le `setState` reste enfermé dans le `.then` (règle
  // `set-state-in-effect`) : l'effet ne déclenche aucun rendu synchrone.
  useEffect(() => {
    if (!user) return;
    let alive = true;
    const pull = () => {
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((data) => {
          if (!alive) return;
          setItems(data.notifications || []);
          setUnread(data.unread || 0);
        })
        .catch(() => {
          /* la cloche dégrade en liste vide */
        });
    };
    pull();
    const timer = setInterval(pull, 60_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [user]);

  // I3 — temps réel : une connexion SSE tant que l'onglet est visible
  // (fermeture à la mise en arrière-plan : une connexion maintenue dort
  // coûteux). `notification` → on re-télécharge (l'API reste la source de
  // vérité) ; `message` → on rediffuse un `CustomEvent` page pour la
  // section Messagerie, qui écoute le même évènement.
  useEffect(() => {
    if (!user || typeof EventSource === "undefined") return;
    let source: EventSource | null = null;
    const connect = () => {
      if (source || document.hidden) return;
      source = new EventSource("/api/events");
      source.addEventListener("notification", () => load());
      source.addEventListener("message", (e) => {
        let detail: unknown = null;
        try {
          detail = JSON.parse((e as MessageEvent).data);
        } catch {
          /* payload illisible : simple déclencheur de rafraîchissement */
        }
        window.dispatchEvent(new CustomEvent("cx:message", { detail }));
      });
      // `onerror` : EventSource se reconnecte tout seul (backoff natif) ;
      // on ne referme que sur visibilité ou déconnexion.
    };
    const onVisibility = () => {
      if (document.hidden) {
        source?.close();
        source = null;
      } else {
        connect();
        load(); // rattrapage : l'onglet masqué a pu manquer du contenu
      }
    };
    connect();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      source?.close();
      source = null;
    };
  }, [user, load]);

  // Logged-out state is derived, never written from an effect.
  const visibleItems = user ? items : [];
  const visibleUnread = user ? unread : 0;

  const markAllRead = async () => {
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
    } catch {
      toast.error(t("common.error"));
      load();
    }
  };

  const onItemClick = async (n: Notification) => {
    setOpen(false);
    if (!n.read) {
      setUnread((c) => Math.max(0, c - 1));
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
      );
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      }).catch(() => {});
    }
    if (n.href?.startsWith("#")) {
      const [section, param] = n.href.slice(1).split("/");
      navigate(section, param);
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          aria-label={t("notif.title")}
        >
          <Bell className="h-4 w-4" />
          {visibleUnread > 0 && (
            <span className="absolute -top-0.5 -end-0.5 min-w-4 h-4 px-1 rounded-full bg-foreground text-background text-[10px] font-mono font-bold flex items-center justify-center">
              {visibleUnread > 9 ? "9+" : visibleUnread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            {t("notif.title")}
            {visibleUnread > 0 && (
              <span className="ms-2 text-foreground">
                {visibleUnread} {t("notif.unread")}
              </span>
            )}
          </span>
          {visibleUnread > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
            >
              <CheckCheck className="h-3 w-3" />
              {t("notif.mark_all")}
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {visibleItems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Inbox className="h-5 w-5" />
              <p className="text-xs">{t("notif.empty")}</p>
            </div>
          ) : (
            visibleItems.map((n) => (
              <button
                key={n.id}
                onClick={() => onItemClick(n)}
                className={
                  "flex w-full gap-3 px-3 py-2.5 text-start hover:bg-muted/60 transition border-b border-border/50 last:border-0 " +
                  (n.read ? "opacity-60" : "")
                }
              >
                <Avatar name={n.actor?.name || "?"} size="xs" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-snug">{n.title}</span>
                  {n.body && (
                    <span className="block text-xs text-muted-foreground truncate">
                      {n.body}
                    </span>
                  )}
                  <span className="block text-[10px] font-mono text-muted-foreground mt-0.5">
                    {timeAgo(n.createdAt, locale)}
                  </span>
                </span>
                {!n.read && (
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                )}
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
