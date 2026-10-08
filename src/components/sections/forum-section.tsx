"use client";

import { useEffect, useState, useCallback } from "react";
import { useT } from "@/store/app-store";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { useFeedPrefsStore } from "@/store/feed-prefs-store";
import {
  PostActions,
  DeleteThreadDialog,
} from "@/components/shared/post-actions";
import { SectionHeader } from "@/components/shared/section-header";
import { Tag, tagColors } from "@/components/shared/tag";
import { ThreadCard } from "@/components/shared/thread-card";
import { CommentThread } from "@/components/shared/comment-thread";
import { timeAgoLong } from "@/lib/time";
import {
  CreateThreadForm,
  categories,
} from "@/components/shared/create-thread-form";
import { Avatar } from "@/components/shared/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import {
  Search,
  Plus,
  Eye,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  Pin,
  CheckCircle2,
  ArrowLeft,
  Send,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Chargé à la demande : react-markdown + Prism pèsent dans la centaine de Ko,
 * inutiles tant qu'on n'a pas ouvert une discussion (objectif bundle du CDC).
 */
const Markdown = dynamic(
  () => import("@/components/shared/markdown").then((m) => m.Markdown),
  {
    ssr: false,
    loading: () => (
      <div className="h-24 w-full animate-pulse rounded bg-muted/50" aria-hidden="true" />
    ),
  }
);


type Profile = {
  id: string;
  username: string;
  avatarColor: string | null;
  country: string | null;
  city: string | null;
};

type Author = {
  id: string;
  name: string;
  reputation?: number;
  profile: Profile | null;
};

type Thread = {
  id: string;
  title: string;
  slug: string;
  body: string;
  tags: string;
  category: string;
  views: number;
  upvotes: number;
  /** Vote du visiteur : 1 / -1 / 0 — déduit de la session, jamais du body. */
  myVote?: number;
  pinned: boolean;
  solved: boolean;
  createdAt: string;
  author: Author;
  _count?: { posts: number };
};

type Post = {
  id: string;
  body: string;
  upvotes: number;
  myVote?: number;
  isAnswer: boolean;
  /** Commentaire parent (fil imbriqué) — `null` = racine. */
  parentId: string | null;
  createdAt: string;
  author: Author;
};

type ThreadDetail = Thread & {
  posts: Post[];
};

export function ForumSection() {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const navigate = useAppStoreNav();
  const sectionParam = useAppStore((s) => s.sectionParam);
  const user = useAuthStore((s) => s.user);

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  // Publications masquées depuis la barre d'actions : même store que le fil
  // d'accueil, donc une question masquée l'est partout dans l'app.
  const hiddenIds = useFeedPrefsStore((s) => s.hidden);
  const visible = threads.filter((th) => !hiddenIds.includes(th.id));
  const [category, setCategory] = useState("all");
  const [tag, setTag] = useState("all");
  const [q, setQ] = useState("");
  // C8 — filtre « non résolu » : l'API acceptait déjà `?solved=`, il n'y
  // avait aucun sélecteur pour l'atteindre depuis l'interface.
  const [solved, setSolved] = useState<"all" | "false" | "true">("all");
  // Detail is cached by slug so we never have to reset it from an effect.
  const [detail, setDetail] = useState<{ slug: string; thread: ThreadDetail | null } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  // --- C10 : édition / suppression / épinglage de la question affichée ----
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editCategory, setEditCategory] = useState("general");
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);

  // Derived view state — no setState inside effects needed.
  const selectedThread =
    sectionParam && detail && detail.slug === sectionParam ? detail.thread : null;
  const loadingDetail =
    !!sectionParam && (!detail || detail.slug !== sectionParam);

  /** Staff = `admin` ou `moderator` : épingle et modère. */
  const isStaffUser =
    !!user && (user.role === "admin" || user.role === "moderator");
  /** Auteur de la question OU staff : peut modifier / supprimer. */
  const canManageDetail =
    !!user &&
    !!selectedThread &&
    (user.id === selectedThread.author.id || isStaffUser);

  // Available tags (computed from current threads)
  const allTags = Array.from(
    new Set(
      threads.flatMap((th) =>
        th.tags.split(",").map((s) => s.trim()).filter(Boolean)
      )
    )
  ).sort();

  const loadThreads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (tag !== "all") params.set("tag", tag);
      if (q) params.set("q", q);
      if (solved !== "all") params.set("solved", solved);
      const res = await fetch(`/api/threads?${params}`);
      const data = await res.json();
      setThreads(data.threads || []);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [category, tag, q, solved, t]);

  useEffect(() => {
    if (!sectionParam) return;
    if (detail?.slug === sectionParam) return;
    let cancelled = false;
    fetch(`/api/threads/${sectionParam}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.thread) setDetail({ slug: sectionParam, thread: d.thread });
        else {
          setDetail({ slug: sectionParam, thread: null });
          toast.error(t("forum.thread_not_found"));
          navigate("forum");
        }
      })
      .catch(() => {
        if (cancelled) return;
        toast.error(t("common.error"));
        setDetail({ slug: sectionParam, thread: null });
      });
    return () => {
      cancelled = true;
    };
  }, [sectionParam, detail, navigate, t]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!sectionParam) loadThreads();
    }, 250);
    return () => clearTimeout(timer);
  }, [q, sectionParam, loadThreads]);

  const handleCreateThread = async (data: {
    title: string;
    body: string;
    tags: string;
    category: string;
  }) => {
    if (!user) {
      toast.error(t("forum.sign_in_to_ask"));
      return;
    }
    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // L'auteur est déduit de la session côté serveur : envoyer
        // `authorId` depuis le client permettait de poster en n'importe qui.
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Erreur");
        return;
      }
      toast.success(t("forum.thread_created"));
      setCreateOpen(false);
      loadThreads();
      navigate("forum", result.thread.slug);
    } catch {
      toast.error(t("common.network_error"));
    }
  };

  /**
   * Publie une réponse — en racine (`parentId: null`) ou sous un
   * commentaire. La liste reste plate côté état : c'est `CommentThread`
   * qui la transforme en arbre à chaque rendu.
   */
  const handleReply = async (parentId: string | null, body: string) => {
    if (!user || !selectedThread || !body.trim()) return false;
    try {
      const res = await fetch(`/api/threads/${selectedThread.slug}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, parentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur");
        return false;
      }
      setDetail({
        slug: selectedThread.slug,
        thread: {
          ...selectedThread,
          posts: [...selectedThread.posts, data.post],
        },
      });
      toast.success(t("forum.answer_published"));
      return true;
    } catch {
      toast.error(t("common.network_error"));
      return false;
    }
  };

  /** Mise à jour locale de la discussion affichée (votes, acceptation). */
  const patchDetail = (fn: (t: ThreadDetail) => ThreadDetail) =>
    setDetail((prev) => (prev?.thread ? { ...prev, thread: fn(prev.thread) } : prev));

  /** Ouvre le formulaire d'édition pré-rempli avec la question courante. */
  const startEdit = () => {
    if (!selectedThread) return;
    setEditTitle(selectedThread.title);
    setEditBody(selectedThread.body);
    setEditTags(selectedThread.tags);
    setEditCategory(selectedThread.category);
    setEditing(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/threads/${selectedThread.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          body: editBody,
          tags: editTags,
          category: editCategory,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("common.error"));
        return;
      }
      // `data.thread` ne porte que les champs scalaires — on les fusionne
      // dans le détail courant pour ne pas perdre l'auteur ni les réponses.
      patchDetail((prev) => ({ ...prev, ...data.thread }));
      toast.success(t("forum.edit_ok"));
      setEditing(false);
    } catch {
      toast.error(t("common.network_error"));
    } finally {
      setBusy(false);
    }
  };

  /** Épinglage réservé au staff côté serveur — le front n'expose le bouton
   *  que si `isStaffUser` (`management.canPin`). */
  const handleTogglePin = async () => {
    if (!selectedThread) return;
    try {
      const res = await fetch(`/api/threads/${selectedThread.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !selectedThread.pinned }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("common.error"));
        return;
      }
      patchDetail((prev) => ({ ...prev, ...data.thread }));
      toast.success(selectedThread.pinned ? t("post.unpinned_ok") : t("post.pinned_ok"));
    } catch {
      toast.error(t("common.network_error"));
    }
  };

  const handleDelete = async () => {
    if (!selectedThread) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/threads/${selectedThread.slug}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || t("common.error"));
        return;
      }
      toast.success(t("post.deleted_ok"));
      setDeleting(false);
      navigate("forum");
      loadThreads();
    } catch {
      toast.error(t("common.network_error"));
    } finally {
      setBusy(false);
    }
  };

  /**
   * Vote ±1 sur une question ou une réponse.
   * L'identité vient du cookie de session côté serveur — le client n'envoie
   * que la cible et la valeur.
   */
  const handleVote = async (
    target: "thread" | "post",
    targetId: string,
    // 0 = annuler le vote précédent : l'API l'accepte depuis le début,
    // l'UI ne l'envoyait jamais.
    value: 1 | -1 | 0
  ) => {
    if (!user) {
      toast.error(t("forum.sign_in_to_vote"));
      return;
    }
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, targetId, value }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("common.error"));
        return;
      }
      const upvotes: number = data.upvotes;
      const myVote: number = data.value;
      patchDetail((prev) =>
        target === "thread"
          ? { ...prev, upvotes, myVote }
          : {
              ...prev,
              posts: prev.posts.map((p) =>
                p.id === targetId ? { ...p, upvotes, myVote } : p
              ),
            }
      );
      setThreads((prev) =>
        prev.map((th) =>
          target === "thread" && th.id === targetId
            ? { ...th, upvotes, myVote }
            : th
        )
      );
    } catch {
      toast.error(t("common.network_error"));
    }
  };

  /** Marque / démarque la meilleure réponse (auteur de la question ou modérateur). */
  const handleAccept = async (postId: string, next: boolean) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAnswer: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("common.error"));
        return;
      }
      patchDetail((prev) => ({
        ...prev,
        solved: next,
        posts: prev.posts.map((p) => ({
          ...p,
          isAnswer: p.id === postId ? next : false,
        })),
      }));
      toast.success(next ? t("forum.answer_accepted") : t("forum.answer_unaccepted"));
    } catch {
      toast.error(t("common.network_error"));
    }
  };

  // THREAD DETAIL VIEW
  if (sectionParam) {
    if (loadingDetail) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-foreground" />
        </div>
      );
    }
    if (!selectedThread) return null;

    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 -ms-2"
          onClick={() => navigate("forum")}
        >
          <ArrowLeft className="h-4 w-4 me-1 rtl:-scale-x-100" />
          {t("forum.back_to_list")}
        </Button>

        <article className="space-y-6">
          {/* Deux colonnes sur desktop : rail de vote vertical à gauche (la
              « colonne grise » de Reddit), contenu à droite. Sous `sm`, le
              rail devient une barre horizontale, à l'inverse (`order`). */}
          <div className="flex gap-4">
            <div data-testid="vote-rail" className="hidden sm:flex shrink-0 flex-col items-center gap-0.5 self-start rounded-md border border-border bg-muted/40 px-1.5 py-2 text-sm">
              <button
                type="button"
                onClick={() =>
                  handleVote("thread", selectedThread.id, selectedThread.myVote === 1 ? 0 : 1)
                }
                aria-label={selectedThread.myVote === 1 ? t("forum.cancel_vote") : t("forum.upvote_question")}
                aria-pressed={selectedThread.myVote === 1}
                className={cn("rounded p-1 transition hover:bg-background", selectedThread.myVote === 1 ? "text-chart-1" : "text-muted-foreground hover:text-chart-1")}
              >
                <ChevronUp className="h-5 w-5" />
              </button>
              <span className={cn("font-mono text-sm font-semibold tabular-nums", selectedThread.myVote === 1 && "text-chart-1", selectedThread.myVote === -1 && "text-destructive")}>
                {selectedThread.upvotes}
              </span>
              <button
                type="button"
                onClick={() =>
                  handleVote("thread", selectedThread.id, selectedThread.myVote === -1 ? 0 : -1)
                }
                aria-label={selectedThread.myVote === -1 ? t("forum.cancel_vote") : t("forum.downvote_question")}
                aria-pressed={selectedThread.myVote === -1}
                className={cn("rounded p-1 transition hover:bg-background", selectedThread.myVote === -1 ? "text-destructive" : "text-muted-foreground hover:text-destructive")}
              >
                <ChevronDown className="h-5 w-5" />
              </button>
              <span className="mt-1 flex items-center gap-1 border-t border-border pt-1 text-xs text-muted-foreground">
                <Eye className="h-3 w-3" /> {selectedThread.views}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3" /> {selectedThread.posts.length}
              </span>
            </div>

            <div className="min-w-0 flex-1">
          {/* Thread meta */}
          <header>
            <div className="flex items-center gap-2 mb-3">
              {selectedThread.pinned && (
                <Tag label={t("forum.pinned")} variant="solid">
                  <Pin className="h-3 w-3 me-1 inline" />
                </Tag>
              )}
              {selectedThread.solved && (
                <Tag label={t("forum.solved")} variant="outline">
                  <CheckCircle2 className="h-3 w-3 me-1 inline" />
                </Tag>
              )}
              <Tag label={t(`forum.category.${selectedThread.category}`)} />
            </div>
            <h1 className="display text-3xl sm:text-4xl lg:text-5xl text-balance mb-4">
              {selectedThread.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Avatar
                name={selectedThread.author.name}
                color={selectedThread.author.profile?.avatarColor}
                size="sm"
              />
              <span>
                {t("forum.by")}{" "}
                <button
                  onClick={() => navigate("annuaire", selectedThread.author.profile?.username)}
                  className="font-medium text-foreground hover:text-foreground transition"
                >
                  {selectedThread.author.name}
                </button>
                {selectedThread.author.profile?.country && (
                  <span className="text-muted-foreground/70">
                    {" · "}
                    {selectedThread.author.profile.city}, {selectedThread.author.profile.country}
                  </span>
                )}
                <time
                  dateTime={selectedThread.createdAt}
                  className="text-muted-foreground/70"
                  title={new Date(selectedThread.createdAt).toLocaleString(locale)}
                >
                  {" · "}
                  {timeAgoLong(selectedThread.createdAt, locale)}
                </time>
              </span>
            </div>
          </header>

          {/* Corps de la question — remplacé par le formulaire d'édition
              quand on est en mode `editing` (C10). */}
          {editing ? (
            <form onSubmit={handleEdit} className="space-y-4 rounded-lg border border-border p-4">
              <div>
                <Label htmlFor="edit-title" className="text-xs font-mono uppercase">
                  {t("forum.create.title_field")}
                </Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  minLength={8}
                  maxLength={180}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-category" className="text-xs font-mono uppercase">
                  {t("forum.create.category_field")}
                </Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger id="edit-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {t(c.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-tags" className="text-xs font-mono uppercase">
                  {t("forum.create.tags_field")}
                </Label>
                <Input
                  id="edit-tags"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder={t("forum.create.tags.placeholder")}
                />
              </div>
              <div>
                <Label htmlFor="edit-body" className="text-xs font-mono uppercase">
                  {t("forum.create.body_field")}
                </Label>
                <Textarea
                  id="edit-body"
                  rows={10}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={busy}>
                  {t("forum.save_changes")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditing(false)}
                  disabled={busy}
                >
                  {t("forum.cancel")}
                </Button>
              </div>
            </form>
          ) : (
            <div className="prose-editorial">
              <Markdown content={selectedThread.body} />
            </div>
          )}

          {selectedThread.tags && !editing && (
            <div className="flex flex-wrap gap-1.5">
              {selectedThread.tags
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((tg) => (
                  <Tag key={tg} label={tg} variant={tagColors[tg] || "default"} />
                ))}
            </div>
          )}

          {/* Sous `sm`, le rail vertical n'existe pas : on garde une barre de
              vote horizontale, masquée dès `sm` où le rail prend le relais. */}
          <div data-testid="vote-bar" className="flex sm:hidden items-center justify-between gap-5 text-sm text-muted-foreground border-t border-b border-border py-3">
            <span className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  handleVote(
                    "thread",
                    selectedThread.id,
                    selectedThread.myVote === 1 ? 0 : 1
                  )
                }
                aria-label={
                  selectedThread.myVote === 1
                    ? t("forum.cancel_vote")
                    : t("forum.upvote_question")
                }
                aria-pressed={selectedThread.myVote === 1}
                className={cn(
                  "flex items-center gap-1 rounded px-1 -mx-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1",
                  selectedThread.myVote === 1
                    ? "text-chart-1"
                    : "hover:text-chart-1"
                )}
              >
                <ChevronUp className="h-4 w-4" />
                {selectedThread.upvotes} {t("forum.upvotes")}
              </button>
              <button
                type="button"
                onClick={() =>
                  handleVote(
                    "thread",
                    selectedThread.id,
                    selectedThread.myVote === -1 ? 0 : -1
                  )
                }
                aria-label={
                  selectedThread.myVote === -1
                    ? t("forum.cancel_vote")
                    : t("forum.downvote_question")
                }
                aria-pressed={selectedThread.myVote === -1}
                title={t("forum.downvote_hint")}
                className={cn(
                  "rounded px-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1",
                  selectedThread.myVote === -1
                    ? "text-chart-1"
                    : "hover:text-chart-1"
                )}
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {selectedThread.views} {t("forum.views")}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {selectedThread.posts.length} {t("forum.answers")}
            </span>
          </div>

          {/* Barre d'actions façon Reddit : commenter · partager · sauvegarder
              · ⋯. La gestion (épingler / modifier / supprimer) n'apparaît que
              si l'utilisateur y a droit (auteur ou staff). */}
          <PostActions
            threadId={selectedThread.id}
            threadSlug={selectedThread.slug}
            comments={selectedThread.posts.length}
            onOpen={() =>
              document
                .getElementById("thread-comments")
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            management={
              canManageDetail
                ? {
                    pinned: selectedThread.pinned,
                    canManage: true,
                    canPin: isStaffUser,
                    onTogglePin: handleTogglePin,
                    onEdit: startEdit,
                    onDelete: () => setDeleting(true),
                  }
                : undefined
            }
          />

          <DeleteThreadDialog
            open={deleting}
            onOpenChange={setDeleting}
            title={t("post.delete_title")}
            body={t("post.delete_body")}
            confirmLabel={t("post.delete")}
            cancelLabel={t("forum.cancel")}
            busy={busy}
            onConfirm={handleDelete}
          />

          </div>{/* /min-w-0 */}
          </div>{/* /flex */}

          {/* Fil de commentaires : imbriqué, triable et repliable, à la
              façon de Reddit. Le composant reconstruit l'arbre à partir de
              la liste plate fournie par l'API. */}
          <div id="thread-comments">
          <CommentThread
            posts={selectedThread.posts}
            threadAuthorId={selectedThread.author.id}
            user={user ? { id: user.id, role: user.role } : null}
            onVote={(postId, value) => handleVote("post", postId, value)}
            onAccept={handleAccept}
            onReply={handleReply}
            onOpenProfile={(username) => navigate("annuaire", username)}
          />
          </div>
        </article>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Empilé sous `sm` : en ligne, le bouton `shrink-0` écrase le bloc
          titre et la description tombe à un mot par ligne. */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeader
          eyebrow={t("nav.forum")}
          title={t("forum.title")}
          subtitle={t("forum.subtitle")}
          className="w-full sm:min-w-0 sm:flex-1"
        />
        <Button
          onClick={() => {
            if (!user) {
              toast.error(t("forum.sign_in_to_ask"));
              return;
            }
            setCreateOpen(true);
          }}
          className="bg-foreground text-background hover:bg-foreground/90 shrink-0"
        >
          <Plus className="h-4 w-4 me-2" />
          {t("forum.new")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("forum.search.placeholder")}
            className="ps-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {t(c.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tag} onValueChange={setTag}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("forum.filter.tag.all")}</SelectItem>
            {allTags.map((tg) => (
              <SelectItem key={tg} value={tg}>
                {tg}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={solved} onValueChange={(v) => setSolved(v as typeof solved)}>
          <SelectTrigger
            className="w-full sm:w-[180px]"
            aria-label={t("forum.filter.status.label")}
          >
            <SelectValue placeholder={t("forum.filter.status.all")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("forum.filter.status.all")}</SelectItem>
            <SelectItem value="false">{t("forum.filter.status.unsolved")}</SelectItem>
            <SelectItem value="true">{t("forum.filter.status.solved")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Threads list */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{t("forum.empty")}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              onOpen={(th) => navigate("forum", th.slug)}
              onVote={(th, value) => handleVote("thread", th.id, value)}
            />
          ))}
        </div>
      )}

      {/* Create thread dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-bold text-2xl">
              {t("forum.create.title")}
            </DialogTitle>
          </DialogHeader>
          <CreateThreadForm onSubmit={handleCreateThread} categories={categories} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Small inline import to keep file self-contained
function useAppStoreNav() {
  return useAppStore((s) => s.navigate);
}
