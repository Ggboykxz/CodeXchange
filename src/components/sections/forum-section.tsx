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
import { ReportDialog } from "@/components/shared/report-dialog";
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
  RotateCcw,
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

/**
 * Les trois statuts de résolution, en bascules façon terminal. L'API acceptait
 * déjà `?solved=` (all / false / true) : le sélecteur devenait des puces.
 */
const statusOptions: { value: "all" | "false" | "true"; labelKey: string }[] = [
  { value: "all", labelKey: "forum.filter.status.all" },
  { value: "false", labelKey: "forum.filter.status.unsolved" },
  { value: "true", labelKey: "forum.filter.status.solved" },
];

/**
 * Pastille « live » — le point émeraude qui pulse du design Stitch
 * (télémétrie, statut de synchronisation). Purement décoratif.
 */
function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex h-2 w-2", className)} aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
    </span>
  );
}

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
  // M1 — signalement de la question affichée.
  const [reportOpen, setReportOpen] = useState(false);
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

  /* ---------------------------------------------------------------- */
  /* Compteurs dérivés de la liste réellement chargée — aucun chiffre  */
  /* codé en dur : la colonne de droite (télémétrie, nuage de tags,    */
  /* podium des contributeurs) lit la même réponse API que le fil.     */
  /* ---------------------------------------------------------------- */

  const tagCounts = new Map<string, number>();
  const contributors = new Map<
    string,
    { username: string; upvotes: number; reputation: number; city: string | null }
  >();
  let solvedCount = 0;
  let answersCount = 0;

  for (const th of visible) {
    if (th.solved) solvedCount += 1;
    answersCount += th._count?.posts ?? 0;
    for (const tg of th.tags.split(",").map((s) => s.trim()).filter(Boolean)) {
      tagCounts.set(tg, (tagCounts.get(tg) ?? 0) + 1);
    }
    const username = th.author.profile?.username ?? th.author.name;
    const prev = contributors.get(th.author.id);
    contributors.set(th.author.id, {
      username,
      upvotes: (prev?.upvotes ?? 0) + th.upvotes,
      reputation: th.author.reputation ?? prev?.reputation ?? 0,
      city: th.author.profile?.city ?? prev?.city ?? null,
    });
  }

  /** Nuage de tags trié par fréquence (les plus cités d'abord). */
  const rankedTags = Array.from(tagCounts.entries()).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  );

  /** Podium des auteurs de la liste, par upvotes cumulés. */
  const topContributors = Array.from(contributors.values())
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, 4);

  /** Au moins un filtre actif ? Sert à n'afficher « Réinitialiser » qu'utile. */
  const filtersActive =
    !!q || category !== "all" || tag !== "all" || solved !== "all";

  const resetFilters = () => {
    setQ("");
    setCategory("all");
    setTag("all");
    setSolved("all");
  };

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

  /**
   * Ouvre le composeur — ou refuse poliment si le visiteur n'est pas
   * connecté. Partagé par le bouton d'en-tête et l'encadré latéral.
   */
  const openCreate = () => {
    if (!user) {
      toast.error(t("forum.sign_in_to_ask"));
      return;
    }
    setCreateOpen(true);
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
          className="mb-3 -ms-2 font-mono text-xs"
          onClick={() => navigate("forum")}
        >
          <ArrowLeft className="h-4 w-4 me-1 rtl:-scale-x-100" />
          {t("forum.back_to_list")}
        </Button>

        {/* Bandeau de commande — le fil d'Ariane façon terminal :
            `$ cd /forum/<slug>` à gauche, télémétrie de la discussion à
            droite (vues · réponses) avec la pastille « live ». */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-border bg-card px-3 py-2 font-mono text-[11px] sm:text-xs">
          <div className="flex min-w-0 items-center gap-2">
            <span className="font-bold text-brand" aria-hidden="true">
              $
            </span>
            <span className="truncate text-foreground">
              cd /forum/{selectedThread.slug}
            </span>
            <span className="hidden text-muted-foreground sm:inline">
              --category={selectedThread.category}
            </span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <LiveDot />
              [live]
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              {selectedThread.views} {t("forum.views")}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              {selectedThread.posts.length} {t("forum.answers")}
            </span>
          </div>
        </div>

        <article className="space-y-6">
          {/* Deux colonnes sur desktop : rail de vote vertical à gauche (la
              « colonne grise » de Reddit), contenu à droite. Sous `sm`, le
              rail devient une barre horizontale, à l'inverse (`order`). */}
          <div className="flex gap-4">
            {/* Rail de vote — la « colonne grise » de Reddit, en version
                terminal : filet bordé, chiffre mono en accent de marque. */}
            <div data-testid="vote-rail" className="hidden sm:flex w-12 shrink-0 flex-col items-center gap-0.5 self-start rounded-md border border-border bg-muted/40 px-1 py-2 font-mono text-sm">
              <button
                type="button"
                onClick={() =>
                  handleVote("thread", selectedThread.id, selectedThread.myVote === 1 ? 0 : 1)
                }
                aria-label={selectedThread.myVote === 1 ? t("forum.cancel_vote") : t("forum.upvote_question")}
                aria-pressed={selectedThread.myVote === 1}
                className={cn("rounded p-1 transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", selectedThread.myVote === 1 ? "text-brand" : "text-muted-foreground hover:text-brand")}
              >
                <ChevronUp className="h-5 w-5" />
              </button>
              <span className={cn("font-mono text-sm font-bold tabular-nums", selectedThread.myVote === 1 && "text-brand", selectedThread.myVote === -1 && "text-destructive")}>
                {selectedThread.upvotes}
              </span>
              <button
                type="button"
                onClick={() =>
                  handleVote("thread", selectedThread.id, selectedThread.myVote === -1 ? 0 : -1)
                }
                aria-label={selectedThread.myVote === -1 ? t("forum.cancel_vote") : t("forum.downvote_question")}
                aria-pressed={selectedThread.myVote === -1}
                className={cn("rounded p-1 transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", selectedThread.myVote === -1 ? "text-destructive" : "text-muted-foreground hover:text-brand")}
              >
                <ChevronDown className="h-5 w-5" />
              </button>
              <span className="mt-1 flex items-center gap-1 border-t border-border pt-1 text-[11px] text-muted-foreground">
                <Eye className="h-3 w-3" /> {selectedThread.views}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <MessageSquare className="h-3 w-3" /> {selectedThread.posts.length}
              </span>
            </div>

            <div className="min-w-0 flex-1">
          {/* Thread meta — barre d'en-tête façon terminal : badges de statut,
              « chemin » de la question, et hub régional de l'auteur (ville /
              pays) aligné à droite. */}
          <header>
            <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-border pb-3">
              <div className="flex flex-wrap items-center gap-2">
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
                <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
                  threads/{selectedThread.category}/{selectedThread.slug}.md
                </span>
              </div>
              {(selectedThread.author.profile?.city ||
                selectedThread.author.profile?.country) && (
                <span className="ms-auto inline-flex items-center rounded border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  [ HUB: {selectedThread.author.profile?.city ?? "—"} /{" "}
                  {selectedThread.author.profile?.country ?? "—"} ]
                </span>
              )}
            </div>
            <h1 className="display text-3xl sm:text-4xl lg:text-5xl text-balance mb-4">
              {selectedThread.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Avatar
                name={selectedThread.author.name}
                color={selectedThread.author.profile?.avatarColor}
                size="sm"
              />
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-mono text-xs">{t("forum.by")}</span>
                <button
                  onClick={() => navigate("annuaire", selectedThread.author.profile?.username)}
                  className="font-mono text-xs font-bold text-foreground transition hover:text-brand"
                >
                  u/{selectedThread.author.profile?.username ?? selectedThread.author.name}
                </button>
                {typeof selectedThread.author.reputation === "number" &&
                  selectedThread.author.reputation > 0 && (
                    <span className="font-mono text-[11px] tabular-nums">
                      ★ {selectedThread.author.reputation}{" "}
                      {t("annuaire.reputation")}
                    </span>
                  )}
                <time
                  dateTime={selectedThread.createdAt}
                  className="font-mono text-[11px] text-muted-foreground/70"
                  title={new Date(selectedThread.createdAt).toLocaleString(locale)}
                >
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
            <div className="flex flex-wrap items-center gap-1.5">
              {selectedThread.tags
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((tg) => (
                  <Tag
                    key={tg}
                    label={`#${tg}`}
                    variant={tagColors[tg] || "default"}
                  />
                ))}
            </div>
          )}

          {/* Sous `sm`, le rail vertical n'existe pas : on garde une barre de
              vote horizontale, masquée dès `sm` où le rail prend le relais. */}
          <div data-testid="vote-bar" className="flex sm:hidden items-center justify-between gap-5 font-mono text-xs text-muted-foreground border-t border-b border-border py-3">
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
                  "flex items-center gap-1 rounded px-1 -mx-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selectedThread.myVote === 1
                    ? "text-brand"
                    : "hover:text-brand"
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
                  "rounded px-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selectedThread.myVote === -1
                    ? "text-destructive"
                    : "hover:text-brand"
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
            onReport={
              user && user.id !== selectedThread.author.id
                ? () => setReportOpen(true)
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

          <ReportDialog
            open={reportOpen}
            onOpenChange={setReportOpen}
            targetType="thread"
            targetId={selectedThread.id}
            targetLabel={selectedThread.title}
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
      {/* ---------------------------------------------------------- */}
      {/* Bandeau de commande — `$ codexchange.dev/forum --filter=…`  */}
      {/* La ligne de prompt du design Stitch, avec les filtres        */}
      {/* réellement actifs et le nombre de résultats chargés.         */}
      {/* ---------------------------------------------------------- */}
      <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-3 py-2 font-mono text-[11px] sm:text-xs">
          <div className="flex min-w-0 items-center gap-2">
            <span className="font-bold text-brand" aria-hidden="true">
              $
            </span>
            <span className="truncate font-medium text-foreground">
              codexchange.dev/forum
            </span>
            <span className="hidden text-muted-foreground md:inline">
              --filter={category} --sort=activity
            </span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 border border-border bg-muted/50 px-1.5 py-0.5 font-bold">
              <LiveDot />
              [status: sync_ok]
            </span>
            <span aria-live="polite">
              {loading
                ? t("common.loading")
                : `${visible.length} ${t("common.results")}`}
            </span>
          </div>
        </div>
      </div>

      {/* Empilé sous `sm` : en ligne, le bouton `shrink-0` écrase le bloc
          titre et la description tombe à un mot par ligne. */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeader
          eyebrow={t("nav.forum")}
          title={t("forum.title")}
          subtitle={t("forum.subtitle")}
          className="w-full sm:min-w-0 sm:flex-1"
        />
        <Button onClick={openCreate} className="shrink-0 font-mono">
          <Plus className="h-4 w-4 me-2" aria-hidden="true" />
          {t("forum.new")}
        </Button>
      </div>

      {/* Barre de commandes — `> grep -in` pour la recherche, bascules de
          statut façon terminal, sélecteur de tag, et « Réinitialiser »
          qui n'apparaît que si un filtre est actif. */}
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex flex-1 items-center rounded-md border border-input bg-background px-3 transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]">
          <span
            className="me-2 hidden font-mono text-xs font-bold text-brand sm:inline"
            aria-hidden="true"
          >
            &gt; grep -in
          </span>
          <Search
            className="me-2 h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("forum.search.placeholder")}
            aria-label={t("common.search")}
            className="h-9 border-0 bg-transparent ps-0 shadow-none focus-visible:ring-0"
          />
          <kbd className="ms-2 hidden border border-border bg-muted px-1 font-mono text-[10px] text-muted-foreground sm:inline">
            ESC
          </kbd>
        </div>

        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label={t("forum.filter.status.label")}
        >
          <span
            className="hidden font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:inline"
            aria-hidden="true"
          >
            {t("forum.filter.status.label")}:
          </span>
          {statusOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={solved === o.value}
              onClick={() => setSolved(o.value)}
              className={cn(
                "rounded-md border px-2.5 py-1.5 font-mono text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                solved === o.value
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-border bg-muted/40 text-muted-foreground hover:border-brand/50 hover:text-foreground"
              )}
            >
              {t(o.labelKey)}
            </button>
          ))}

          <Select value={tag} onValueChange={setTag}>
            <SelectTrigger
              className="h-9 w-full text-xs font-mono sm:w-[170px]"
              aria-label={t("forum.filter.tag.all")}
            >
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

          {filtersActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="font-mono text-xs text-muted-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              {t("common.reset_filters")}
            </Button>
          )}
        </div>
      </div>

      {/* Catégories — la barre de puces `[x] / [ ]` du design Stitch : le
          même filtre que l'ancien sélecteur, lisible d'un coup d'œil. */}
      <div
        className="mb-6 flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-muted/30 p-2"
        role="group"
        aria-label={t("forum.filter.all")}
      >
        {categories.map((c) => (
          <button
            key={c.value}
            type="button"
            aria-pressed={category === c.value}
            onClick={() => setCategory(c.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              category === c.value
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border bg-background text-muted-foreground hover:border-brand/50 hover:text-foreground"
            )}
          >
            <span aria-hidden="true">{category === c.value ? "[x]" : "[ ]"}</span>
            {t(c.labelKey)}
          </button>
        ))}
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Deux colonnes : le fil technique (~70 %) et sa barre        */}
      {/* latérale de télémétrie (~30 %), comme sur le design.       */}
      {/* ---------------------------------------------------------- */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          {/* Threads list */}
          {loading ? (
            <div className="space-y-3" role="status" aria-busy="true">
              <span className="sr-only">{t("common.loading")}</span>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-lg border border-border bg-muted/40"
                />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="font-mono text-sm text-muted-foreground">
                {t("forum.empty")}
              </p>
            </Card>
          ) : (
            <>
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

              {/* Pied de liste façon terminal : ce que renvoie la requête,
                  sans pagination inventée. */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 font-mono text-[11px] text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="font-bold text-brand" aria-hidden="true">
                    $
                  </span>
                  ls threads/{category === "all" ? "*" : category} | wc -l
                </span>
                <span className="font-bold tabular-nums text-foreground">
                  {visible.length} {t("common.results")}
                </span>
                <span className="hidden sm:inline">[EOF_BUFFER]</span>
              </div>
            </>
          )}
        </div>

        {/* ------------------------------------------------------ */}
        {/* Colonne de droite — télémétrie, nuage de tags, podium   */}
        {/* ------------------------------------------------------ */}
        <aside className="space-y-4" aria-label={t("feed.sidebar_label")}>
          {/* Composeur — `$ forum post --new`, pastille live et rappels
              de soumission (libellés i18n existants). */}
          <Card className="card-interactive p-4">
            <div className="mb-3 flex items-center justify-between font-mono text-[11px]">
              <span className="font-bold text-brand">$ forum post --new</span>
              <LiveDot />
            </div>
            <Button onClick={openCreate} className="w-full font-mono">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("forum.new")}
            </Button>
            <div className="mt-3 space-y-1 rounded-md border border-border bg-muted/40 p-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
              <p className="font-bold text-foreground">
                {t("forum.create.title")}
              </p>
              <p className="flex gap-1.5">
                <span className="text-brand" aria-hidden="true">
                  •
                </span>
                {t("forum.create.body.placeholder")}
              </p>
              <p className="flex gap-1.5">
                <span className="text-brand" aria-hidden="true">
                  •
                </span>
                {t("forum.create.tags.placeholder")}
              </p>
            </div>
          </Card>

          {/* Télémétrie — les chiffres de la liste chargée, jamais codés
              en dur : discussions, résolues, ouvertes, réponses. */}
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
              <h2 className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {t("feed.sidebar_stats")}
              </h2>
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <LiveDot />
                [LIVE]
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-2">
              {[
                { label: t("stats.threads"), value: visible.length },
                { label: t("forum.solved"), value: solvedCount },
                {
                  label: t("forum.filter.status.unsolved"),
                  value: visible.length - solvedCount,
                },
                { label: t("forum.answers"), value: answersCount },
              ].map((row) => (
                <div
                  key={row.label}
                  className="rounded-md border border-border bg-muted/30 p-2"
                >
                  <dt className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {row.label}
                  </dt>
                  <dd className="font-mono text-lg font-bold tabular-nums text-brand">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>

          {/* Nuage de tags — cliquable : chaque puce applique le filtre
              `?tag=`, un second clic l'enlève. */}
          {rankedTags.length > 0 && (
            <Card className="p-4">
              <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
                <h2 className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  {t("feed.tech_stack")}
                </h2>
                <span className="font-mono text-[10px] text-muted-foreground">
                  INDEXED
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {rankedTags.slice(0, 12).map(([tg, count]) => (
                  <button
                    key={tg}
                    type="button"
                    aria-pressed={tag === tg}
                    onClick={() => setTag(tag === tg ? "all" : tg)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[11px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      tag === tg
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border bg-muted/40 text-foreground hover:border-brand/50 hover:text-brand"
                    )}
                  >
                    #{tg}
                    <span className="tabular-nums text-muted-foreground">
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Podium des contributeurs de la liste, par upvotes cumulés.
              Le clic ouvre l'annuaire (navigation existante). */}
          {topContributors.length > 0 && (
            <Card className="p-4">
              <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
                <h2 className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  {t("annuaire.leaderboard")}
                </h2>
                <span className="font-mono text-[10px] text-muted-foreground">
                  WEEK_TOP
                </span>
              </div>
              <ul className="space-y-1.5">
                {topContributors.map((c, i) => (
                  <li key={c.username}>
                    <button
                      type="button"
                      onClick={() => navigate("annuaire", c.username)}
                      className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-2 py-1.5 font-mono text-start transition hover:border-brand/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="w-4 shrink-0 text-[11px] font-bold tabular-nums text-brand">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="truncate text-[11px] font-bold text-foreground">
                          u/{c.username}
                        </span>
                        {c.city && (
                          <span className="truncate text-[10px] text-muted-foreground">
                            {c.city}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-[11px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        +{c.upvotes}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {typeof topContributors[0]?.reputation === "number" &&
                topContributors[0].reputation > 0 && (
                  <p className="mt-3 border-t border-border pt-2 font-mono text-[10px] text-muted-foreground">
                    ★ {topContributors[0].reputation}{" "}
                    {t("annuaire.reputation")}
                  </p>
                )}
            </Card>
          )}
        </aside>
      </div>

      {/* Create thread dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono text-2xl font-bold">
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
