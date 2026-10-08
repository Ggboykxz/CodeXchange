"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppStore, useT } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { SectionHeader } from "@/components/shared/section-header";
import { Avatar } from "@/components/shared/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Lock, MessageSquare, Send, Trash2 } from "lucide-react";
import { timeAgo } from "@/lib/time";
import { messagePreview } from "@/lib/messages";
import { cn } from "@/lib/utils";

/**
 * I2 — messagerie privée, layout « deux volets » façon Reddit chat :
 * liste des conversations à gauche, fil à droite (pleine largeur en
 * mobile quand un fil est ouvert).
 *
 * L'ancre porte l'id de l'**interlocuteur** (`#messages/<userId>`) :
 * écrire à quelqu'un qui n'a jamais ouvert la boîte crée la conversation
 * côté serveur, sans jamais avoir besoin d'un id de conversation côté URL.
 */

type Peer = {
  id: string;
  name: string;
  image: string | null;
  profile: { username: string; avatarColor: string | null } | null;
};

type Msg = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
};

type ConvRow = {
  id: string;
  peer: Peer;
  last: Msg | null;
  unread: number;
};

export function MessagesSection() {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const navigate = useAppStore((s) => s.navigate);
  const sectionParam = useAppStore((s) => s.sectionParam);
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const openAuth = useAuthStore((s) => s.openAuth);

  const [convs, setConvs] = useState<ConvRow[] | null>(null);
  const [thread, setThread] = useState<{ peer: Peer; messages: Msg[] } | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const refreshList = useCallback(async () => {
    try {
      const res = await fetch("/api/messages", { cache: "no-store" });
      if (!res.ok) {
        setConvs([]);
        return;
      }
      const data = await res.json();
      setConvs(Array.isArray(data.conversations) ? data.conversations : []);
    } catch {
      setConvs([]);
    }
  }, []);

  useEffect(() => {
    if (user) refreshList();
  }, [user, refreshList]);

  // Numéro de requête : un basculement de fil rapide ne doit pas laisser
  // une réponse périmée écraser le dernier (même garde que l'admin B8).
  const threadReq = useRef(0);
  const loadThread = useCallback(
    (peerId: string) => {
      const req = ++threadReq.current;
      setThreadLoading(true);
      fetch(`/api/messages/thread?peer=${encodeURIComponent(peerId)}`, {
        cache: "no-store",
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((d) => {
          if (threadReq.current !== req) return;
          setThread({ peer: d.peer, messages: d.messages || [] });
          refreshList(); // lu côté serveur → la pastille de la liste suit
        })
        .catch(() => {
          if (threadReq.current !== req) return;
          setThread(null);
          toast.error(t("common.network_error"));
        })
        .finally(() => {
          if (threadReq.current === req) setThreadLoading(false);
        });
    },
    [refreshList, t]
  );

  // Fil : un fetch par interlocuteur. Le serveur marque « lu » à
  // l'ouverture, donc on rafraîchit la liste derrière pour virer la
  // pastille d'inédit.
  useEffect(() => {
    if (!user || !sectionParam) {
      setThread(null);
      return;
    }
    loadThread(sectionParam);
  }, [user, sectionParam, loadThread]);

  // I3 — un message arrive par SSE (rediffusé par la cloche) : la liste se
  // rafraîchit toujours ; le fil ne bouge que si l'émetteur EST celui qui
  // est ouvert (sinon on ne fait que compter la pastille).
  useEffect(() => {
    const onMessage = (e: Event) => {
      refreshList();
      const detail = (e as CustomEvent).detail as { senderId?: string } | null;
      if (sectionParam && (!detail || detail.senderId === sectionParam)) {
        loadThread(sectionParam);
      }
    };
    window.addEventListener("cx:message", onMessage);
    return () => window.removeEventListener("cx:message", onMessage);
  }, [sectionParam, refreshList, loadThread]);

  const send = async () => {
    const body = draft.trim();
    if (!body || !sectionParam || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: sectionParam, body }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error((data && data.error) || t("common.network_error"));
        return;
      }
      setDraft("");
      setThread((prev) =>
        prev ? { ...prev, messages: [...prev.messages, data.message] } : prev
      );
      refreshList();
    } catch {
      toast.error(t("common.network_error"));
    } finally {
      setSending(false);
    }
  };

  const remove = async (id: string) => {
    try {
      const res = await fetch(`/api/messages/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error((data && data.error) || t("common.network_error"));
        return;
      }
      setThread((prev) =>
        prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== id) } : prev
      );
      toast.success(t("messages.delete_ok"));
      refreshList();
    } catch {
      toast.error(t("common.network_error"));
    }
  };

  /* ---------------------------------------------------------------- */
  /* Gardes — l'écran dit ce que le serveur fera de toute façon.        */
  /* ---------------------------------------------------------------- */

  // `fetchMe` remplit le store après le montage : sans cet écran tampon,
  // un membre au cache verrait « connecte-toi » clignoter.
  if (authLoading && !user) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-4" role="status" aria-busy="true">
        <span className="sr-only">{t("common.loading")}</span>
        <div className="h-10 rounded-lg bg-muted animate-pulse" />
        <div className="h-96 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <SectionHeader title={t("messages.title")} subtitle={t("messages.subtitle")} />
        <Card className="items-center gap-4 py-10 text-center mt-6">
          <Lock className="h-6 w-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">{t("messages.sign_in")}</p>
          <div className="flex gap-2">
            <Button onClick={() => openAuth("login")}>{t("nav.login")}</Button>
            <Button variant="outline" onClick={() => navigate("home")}>
              <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
              {t("nav.home")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const listPane = (
    <div className={cn("lg:block", sectionParam && "hidden")}>
      <Card className="p-2">
        {convs === null ? (
          <div className="space-y-2 p-2" role="status" aria-busy="true">
            <span className="sr-only">{t("common.loading")}</span>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 rounded bg-muted animate-pulse" />
            ))}
          </div>
        ) : convs.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">
            {t("messages.empty")}
          </p>
        ) : (
          <ul className="divide-y divide-border" data-testid="conv-list">
            {convs.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => navigate("messages", c.peer.id)}
                  aria-current={sectionParam === c.peer.id}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 text-start transition-colors hover:bg-muted/60",
                    sectionParam === c.peer.id && "bg-muted"
                  )}
                >
                  <Avatar
                    name={c.peer.name}
                    color={c.peer.profile?.avatarColor}
                    size="sm"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{c.peer.name}</span>
                      {c.last && (
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                          {timeAgo(c.last.createdAt, locale)}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground truncate">
                        {c.last ? messagePreview(c.last.body, 60) : ""}
                      </span>
                      {c.unread > 0 && (
                        <span
                          className="min-w-5 h-5 shrink-0 rounded-full bg-brand text-brand-foreground text-[10px] font-mono flex items-center justify-center px-1"
                          aria-label={String(c.unread)}
                        >
                          {c.unread}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );

  const threadPane = (
    <div className={cn("lg:col-span-2", !sectionParam && "hidden lg:block")}>
      {!sectionParam ? (
        <Card className="items-center gap-3 py-16 text-center">
          <MessageSquare className="h-6 w-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">{t("messages.pick")}</p>
        </Card>
      ) : threadLoading || !thread ? (
        <Card className="p-0 h-[70vh]">
          <div className="p-4 space-y-3" role="status" aria-busy="true">
            <span className="sr-only">{t("common.loading")}</span>
            <div className="h-12 rounded bg-muted animate-pulse" />
            <div className="h-40 rounded bg-muted animate-pulse" />
          </div>
        </Card>
      ) : (
        <Card className="p-0 flex flex-col h-[70vh] max-h-[70vh]">
          {/* En-tête du fil */}
          <div className="flex items-center gap-3 p-3 border-b border-border shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => navigate("messages")}
              aria-label={t("messages.back")}
            >
              <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
            </Button>
            <Avatar
              name={thread.peer.name}
              color={thread.peer.profile?.avatarColor}
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{thread.peer.name}</p>
              {thread.peer.profile?.username && (
                <p className="text-[11px] font-mono text-muted-foreground truncate">
                  @{thread.peer.profile.username}
                </p>
              )}
            </div>
          </div>

          {/* Bulles */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" data-testid="thread-messages">
            {thread.messages.map((m) => {
              const mine = m.senderId === user.id;
              return (
                <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                      mine ? "bg-brand text-brand-foreground" : "bg-muted"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <div
                      className={cn(
                        "mt-1 flex items-center gap-2 text-[10px] font-mono",
                        mine ? "justify-end text-background/70" : "text-muted-foreground"
                      )}
                    >
                      <span>{timeAgo(m.createdAt, locale)}</span>
                      {mine && (
                        <button
                          onClick={() => remove(m.id)}
                          aria-label={t("messages.delete")}
                          className="opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" aria-hidden />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Compositeur */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 p-3 border-t border-border shrink-0"
          >
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t("messages.compose")}
              aria-label={t("messages.compose")}
              maxLength={2000}
              autoComplete="off"
            />
            <Button
              type="submit"
              size="sm"
              disabled={sending || !draft.trim()}
              className="bg-brand text-brand-foreground hover:bg-brand/90 shrink-0"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
              )}
              <span className="hidden sm:inline">{t("messages.send")}</span>
            </Button>
          </form>
        </Card>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <SectionHeader title={t("messages.title")} subtitle={t("messages.subtitle")} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {listPane}
        {threadPane}
      </div>
    </div>
  );
}
