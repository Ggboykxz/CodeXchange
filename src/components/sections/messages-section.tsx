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
import {
  ArrowLeft,
  Check,
  Inbox,
  Loader2,
  Lock,
  MessageSquare,
  RefreshCw,
  Send,
  Trash2,
} from "lucide-react";
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
 *
 * Portage du design Stitch « Terminal Private Messaging & Encrypted
 * Channels » : bandeau de commande en tête, répertoire de fils à gauche
 * (avatar, aperçu précédé d'un `>`, horodatage, pastille d'inédit
 * terracotta, rail de marque sur le fil actif), fil à droite avec
 * métadonnées mono, bulles (miennes = terracotta, les leurs = surface),
 * diviseurs de jour, matrice de points, et compositeur en ligne de
 * commande (`echo … | gpg --encrypt`, compteur de caractères réel).
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

/** Un jour civil du fil, avec ses messages — diviseur « epoch » de Stitch. */
type DayGroup = { key: string; label: string; items: Msg[] };

/**
 * Regroupe le fil par jour civil **local** (pas par tranche UTC : un
 * message de 23 h ne doit pas tomber dans la journée du lendemain).
 * Fonction pure : aucune dépendance au composant, testable seule.
 */
function groupByDay(messages: Msg[], locale: string): DayGroup[] {
  const fmt = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const groups: DayGroup[] = [];
  for (const m of messages) {
    const d = new Date(m.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(m);
    else groups.push({ key, label: fmt.format(d), items: [m] });
  }
  return groups;
}

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

  /** Total d'inédits — compteur réel, jamais codé en dur. */
  const totalUnread = (convs ?? []).reduce((n, c) => n + c.unread, 0);

  const listPane = (
    <aside
      className={cn("lg:col-span-4 lg:block", sectionParam && "hidden")}
      aria-label={t("messages.title")}
    >
      <Card className="gap-0 overflow-hidden p-0 lg:h-[70vh]">
        {/* En-tête du répertoire — « DIRECTORY_THREADS » + nombre de fils. */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
          <div className="flex min-w-0 items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-foreground">
            <Inbox className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden="true" />
            <span className="truncate">{t("messages.title")}</span>
          </div>
          <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
            [{convs?.length ?? 0}_paired]
          </span>
        </div>

        {convs === null ? (
          <div className="space-y-2 p-2" role="status" aria-busy="true">
            <span className="sr-only">{t("common.loading")}</span>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 rounded bg-muted animate-pulse" />
            ))}
          </div>
        ) : convs.length === 0 ? (
          <p className="p-6 text-center font-mono text-xs text-muted-foreground">
            {t("messages.empty")}
          </p>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto scroll-pretty">
            <ul className="divide-y divide-border" data-testid="conv-list">
              {convs.map((c) => {
                const active = sectionParam === c.peer.id;
                const unread = c.unread > 0;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => navigate("messages", c.peer.id)}
                      aria-current={active}
                      className={cn(
                        "card-interactive flex w-full items-start gap-3 border-s-2 p-3 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1",
                        active
                          ? "border-s-brand bg-muted"
                          : "border-s-transparent hover:bg-muted/60"
                      )}
                    >
                      <Avatar
                        name={c.peer.name}
                        color={c.peer.profile?.avatarColor}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate text-sm font-bold text-foreground">
                            {c.peer.name}
                          </span>
                          {c.last && (
                            <span
                              className={cn(
                                "shrink-0 font-mono text-[10px] tabular-nums",
                                unread ? "font-bold text-brand" : "text-muted-foreground"
                              )}
                            >
                              {timeAgo(c.last.createdAt, locale)}
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                            {c.last && (
                              <>
                                <span className="font-mono text-brand" aria-hidden="true">
                                  &gt;{" "}
                                </span>
                                {messagePreview(c.last.body, 60)}
                              </>
                            )}
                          </span>
                          {unread && (
                            <span
                              className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand px-1 font-mono text-[10px] font-bold tabular-nums text-brand-foreground"
                              aria-label={String(c.unread)}
                            >
                              {c.unread}
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Pied de liste — lecture d'état + rechargement manuel (Stitch :
            barre « SESSION / RELOAD_KEYRING »). */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border bg-muted/40 px-3 py-2 font-mono text-[10px] text-muted-foreground">
          <span className="truncate">session: live [ok]</span>
          <button
            type="button"
            onClick={() => refreshList()}
            className="inline-flex shrink-0 items-center gap-1 rounded font-bold text-brand transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            {t("feed.retry")}
          </button>
        </div>
      </Card>
    </aside>
  );

  const threadPane = (
    <div className={cn("lg:col-span-8", !sectionParam && "hidden lg:block")}>
      {!sectionParam ? (
        <Card className="items-center gap-3 border-dashed py-16 text-center">
          <MessageSquare className="h-6 w-6 text-muted-foreground" aria-hidden />
          <p className="eyebrow">no active channel</p>
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
        <Card className="gap-0 p-0 flex flex-col h-[70vh] max-h-[70vh]">
          {/* En-tête du fil — identité de l'interlocuteur + action profil. */}
          <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border p-3">
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
              size="md"
            />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-bold text-foreground">
                {thread.peer.name}
              </h2>
              {thread.peer.profile?.username && (
                <p className="mt-0.5 truncate font-mono text-[11px] text-brand">
                  @{thread.peer.profile.username}
                </p>
              )}
            </div>
            {thread.peer.profile?.username && (
              <a
                href={`/annuaire/${thread.peer.profile.username}`}
                onClick={(e) => {
                  // Lien natif (onglet, copie) doublé d'une navigation store :
                  // un seul chemin de navigation, comme sur ThreadCard.
                  e.preventDefault();
                  navigate("annuaire", thread.peer.profile?.username);
                }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 font-mono text-[11px] text-foreground transition-colors hover:border-brand/40 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1"
              >
                <span className="font-bold text-brand" aria-hidden="true">
                  $
                </span>
                man{" "}
                <span className="max-w-[8rem] truncate">
                  @{thread.peer.profile.username}
                </span>
              </a>
            )}
          </div>

          {/* Bandeau de canal — rappel de confidentialité (Stitch : bannière
              « E2EE BUFFER »). */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-1.5 font-mono text-[10px] text-muted-foreground">
            <span className="flex min-w-0 items-center gap-1.5">
              <Lock className="h-3 w-3 shrink-0 text-brand" aria-hidden="true" />
              <span className="truncate">{"// private channel · e2ee"}</span>
            </span>
            <span className="shrink-0 border border-border bg-background px-1.5 py-0.5 font-bold text-foreground">
              [direct]
            </span>
          </div>

          {/* Flux — journal vivant (SSE) : `role="log"` pour les lecteurs
              d'écran, matrice de points en fond (motif terminal). */}
          <div
            className="min-h-0 flex-1 overflow-y-auto scroll-pretty p-4 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px]"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-busy={threadLoading}
            data-testid="thread-messages"
          >
            <div className="space-y-4">
              {groupByDay(thread.messages, locale).map((group) => (
                <div key={group.key} className="space-y-3">
                  {/* Diviseur de jour — l'« epoch » du design Stitch. */}
                  <div className="flex items-center gap-3">
                    <span className="h-px flex-1 bg-border" aria-hidden="true" />
                    <span className="border border-border bg-card px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      epoch: {group.label}
                    </span>
                    <span className="h-px flex-1 bg-border" aria-hidden="true" />
                  </div>

                  {group.items.map((m) => {
                    const mine = m.senderId === user.id;
                    return (
                      <div
                        key={m.id}
                        className={cn("flex", mine ? "justify-end" : "justify-start")}
                      >
                        <div className="max-w-[85%] space-y-1 md:max-w-[75%]">
                          {/* Métadonnées — émetteur, horodatage, état, action. */}
                          <div
                            className={cn(
                              "flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground",
                              mine ? "justify-end" : "justify-start"
                            )}
                          >
                            {!mine && (
                              <span className="max-w-[10rem] truncate font-bold text-foreground">
                                {thread.peer.name}
                              </span>
                            )}
                            {!mine && <span aria-hidden="true">·</span>}
                            <time dateTime={m.createdAt} className="tabular-nums">
                              {timeAgo(m.createdAt, locale)}
                            </time>
                            {mine && (
                              <>
                                <Check
                                  className="h-3 w-3 shrink-0 text-brand"
                                  aria-hidden="true"
                                />
                                <button
                                  type="button"
                                  onClick={() => remove(m.id)}
                                  aria-label={t("messages.delete")}
                                  className="rounded p-0.5 opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1"
                                >
                                  <Trash2 className="h-3 w-3" aria-hidden />
                                </button>
                              </>
                            )}
                          </div>
                          <div
                            className={cn(
                              "rounded-lg border px-3 py-2 text-sm shadow-sm",
                              mine
                                ? "border-brand/40 bg-brand text-brand-foreground"
                                : "border-border bg-card text-card-foreground"
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words leading-relaxed">
                              {m.body}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Compositeur — ligne de commande façon terminal (Stitch :
              `echo -n "message" | gpg --encrypt`). */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="shrink-0 border-t border-border p-3"
          >
            <div className="mb-1.5 flex items-center justify-between gap-2 font-mono text-[10px] text-muted-foreground">
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="font-bold text-brand" aria-hidden="true">
                  &gt;
                </span>
                <span className="truncate">
                  echo -n &quot;message&quot; | gpg --encrypt
                </span>
              </span>
              <span className="shrink-0 tabular-nums">
                [char: {draft.length}/2000]
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t("messages.compose")}
                aria-label={t("messages.compose")}
                maxLength={2000}
                autoComplete="off"
                className="font-mono text-sm"
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
            </div>
            <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
              {"// [enter] "}
              {t("messages.send").toLowerCase()}
            </p>
          </form>
        </Card>
      )}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <SectionHeader
        eyebrow={t("nav.messages")}
        title={t("messages.title")}
        subtitle={t("messages.subtitle")}
      />

      {/* Bandeau « terminal » — la ligne de commande du canal, comme sur les
          autres sections portées de Stitch (voyant vivant + prompt + état). */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2 font-mono text-[11px] text-muted-foreground">
        <div className="flex min-w-0 items-center gap-2">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-bold text-brand" aria-hidden="true">
            $
          </span>
          <span className="truncate font-bold text-foreground">
            codexchange.dev/messages
          </span>
          <span className="hidden sm:inline">--channel=direct --cipher=e2ee</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="border border-border bg-muted px-1.5 py-0.5 font-bold text-foreground">
            [secure_channel // established]
          </span>
          {totalUnread > 0 && (
            <span className="border border-brand/40 bg-brand/10 px-1.5 py-0.5 font-bold tabular-nums text-brand">
              [unread: {totalUnread}]
            </span>
          )}
        </div>
      </div>

      {/* Espace de travail — 4/12 répertoire, 8/12 fil (grille Stitch). */}
      <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        {listPane}
        {threadPane}
      </div>
    </div>
  );
}
