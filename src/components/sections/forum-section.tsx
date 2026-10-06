"use client";

import { useEffect, useState, useCallback } from "react";
import { useT } from "@/store/app-store";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { SectionHeader } from "@/components/shared/section-header";
import { Tag } from "@/components/shared/tag";
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
  isAnswer: boolean;
  createdAt: string;
  author: Author;
};

type ThreadDetail = Thread & {
  posts: Post[];
};

const categories = [
  { value: "all", labelKey: "forum.filter.all" },
  { value: "general", labelKey: "forum.category.general" },
  { value: "frontend", labelKey: "forum.category.frontend" },
  { value: "backend", labelKey: "forum.category.backend" },
  { value: "mobile", labelKey: "forum.category.mobile" },
  { value: "devops", labelKey: "forum.category.devops" },
  { value: "ai", labelKey: "forum.category.ai" },
  { value: "career", labelKey: "forum.category.career" },
];

const tagColors: Record<string, "terracotta" | "sun" | "clay" | "baobab" | "default"> = {
  react: "terracotta",
  nextjs: "terracotta",
  go: "sun",
  rust: "clay",
  flutter: "sun",
  ai: "baobab",
  ml: "baobab",
  devops: "clay",
  career: "default",
  kotlin: "clay",
};

export function ForumSection() {
  const t = useT();
  const navigate = useAppStoreNav();
  const sectionParam = useAppStore((s) => s.sectionParam);
  const user = useAuthStore((s) => s.user);

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [tag, setTag] = useState("all");
  const [q, setQ] = useState("");
  // C8 — filtre « non résolu » : l'API acceptait déjà `?solved=`, il n'y
  // avait aucun sélecteur pour l'atteindre depuis l'interface.
  const [solved, setSolved] = useState<"all" | "false" | "true">("all");
  // Detail is cached by slug so we never have to reset it from an effect.
  const [detail, setDetail] = useState<{ slug: string; thread: ThreadDetail | null } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [answerBody, setAnswerBody] = useState("");
  const [postingAnswer, setPostingAnswer] = useState(false);

  // Derived view state — no setState inside effects needed.
  const selectedThread =
    sectionParam && detail && detail.slug === sectionParam ? detail.thread : null;
  const loadingDetail =
    !!sectionParam && (!detail || detail.slug !== sectionParam);

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

  const handleAnswer = async () => {
    if (!user || !selectedThread || !answerBody.trim()) return;
    setPostingAnswer(true);
    try {
      const res = await fetch(`/api/threads/${selectedThread.slug}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: answerBody }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur");
        return;
      }
      setDetail({
        slug: selectedThread.slug,
        thread: {
          ...selectedThread,
          posts: [...selectedThread.posts, data.post],
        },
      });
      setAnswerBody("");
      toast.success(t("forum.answer_published"));
    } catch {
      toast.error(t("common.network_error"));
    } finally {
      setPostingAnswer(false);
    }
  };

  /** Mise à jour locale de la discussion affichée (votes, acceptation). */
  const patchDetail = (fn: (t: ThreadDetail) => ThreadDetail) =>
    setDetail((prev) => (prev?.thread ? { ...prev, thread: fn(prev.thread) } : prev));

  /**
   * Vote ±1 sur une question ou une réponse.
   * L'identité vient du cookie de session côté serveur — le client n'envoie
   * que la cible et la valeur.
   */
  const handleVote = async (
    target: "thread" | "post",
    targetId: string,
    value: 1 | -1
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
      patchDetail((prev) =>
        target === "thread"
          ? { ...prev, upvotes }
          : {
              ...prev,
              posts: prev.posts.map((p) =>
                p.id === targetId ? { ...p, upvotes } : p
              ),
            }
      );
      setThreads((prev) =>
        prev.map((th) => (th.id === targetId ? { ...th, upvotes } : th))
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
          className="mb-6 -ml-2"
          onClick={() => navigate("forum")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t("forum.back_to_list")}
        </Button>

        <article className="space-y-6">
          {/* Thread meta */}
          <header>
            <div className="flex items-center gap-2 mb-3">
              {selectedThread.pinned && (
                <Tag label={t("forum.pinned")} variant="solid">
                  <Pin className="h-3 w-3 mr-1 inline" />
                </Tag>
              )}
              {selectedThread.solved && (
                <Tag label={t("forum.solved")} variant="outline">
                  <CheckCircle2 className="h-3 w-3 mr-1 inline" />
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
              </span>
            </div>
          </header>

          {/* Thread body */}
          <div className="prose-editorial">
            <Markdown content={selectedThread.body} />
          </div>

          {selectedThread.tags && (
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

          <div className="flex items-center gap-5 text-sm text-muted-foreground border-t border-b border-border py-3">
            <button
              type="button"
              onClick={() => handleVote("thread", selectedThread.id, 1)}
              aria-label={t("forum.upvote_question")}
              className="flex items-center gap-1 rounded px-1 -mx-1 transition hover:text-chart-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1"
            >
              <ChevronUp className="h-4 w-4" />
              {selectedThread.upvotes} {t("forum.upvotes")}
            </button>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {selectedThread.views} {t("forum.views")}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {selectedThread.posts.length} {t("forum.answers")}
            </span>
          </div>

          {/* Answers */}
          <div className="space-y-4">
            <h3 className="font-bold text-xl">
              {selectedThread.posts.length} {t("forum.answers")}
            </h3>
            {selectedThread.posts.map((post) => (
              <Card
                key={post.id}
                className={cn(
                  "p-5",
                  post.isAnswer && "border-border bg-muted/30"
                )}
              >
                {post.isAnswer && (
                  <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-foreground mb-2">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t("forum.solved")}
                  </div>
                )}
                <Markdown content={post.body} />
                <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-border/60">
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={post.author.name}
                      color={post.author.profile?.avatarColor}
                      size="xs"
                    />
                    <span className="text-sm">
                      <button
                        onClick={() => navigate("annuaire", post.author.profile?.username)}
                        className="font-medium hover:text-foreground transition"
                      >
                        {post.author.name}
                      </button>
                      <span
                        className="ml-1 font-mono text-[11px] text-muted-foreground"
                        title={t("annuaire.reputation_hint")}
                      >
                        ★ {post.author.reputation ?? 0}
                        <span className="sr-only">
                          {" "}
                          {t("annuaire.reputation")}
                        </span>
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Accepter / retirer la meilleure réponse — visible pour
                        l'auteur de la question et les modérateurs. */}
                    {(selectedThread.author.id === user?.id || user?.role === "admin" || user?.role === "moderator") && (
                      <Button
                        type="button"
                        size="sm"
                        variant={post.isAnswer ? "default" : "outline"}
                        onClick={() => handleAccept(post.id, !post.isAnswer)}
                        aria-pressed={post.isAnswer}
                        className={cn(
                          "h-7 px-2 text-[11px]",
                          post.isAnswer && "bg-foreground text-background"
                        )}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {post.isAnswer ? t("forum.accepted") : t("forum.accept")}
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleVote("post", post.id, 1)}
                      aria-label={t("forum.upvote_answer")}
                      aria-pressed={false}
                      className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-muted-foreground transition hover:border-chart-1 hover:text-chart-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                      {post.upvotes}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Answer form */}
          {user ? (
            <div className="space-y-3 pt-4">
              <Label className="text-xs font-mono uppercase tracking-widest">
                {t("forum.answer.submit")}
              </Label>
              <Textarea
                value={answerBody}
                onChange={(e) => setAnswerBody(e.target.value)}
                placeholder={t("forum.answer.placeholder")}
                rows={5}
                className="resize-y"
              />
              <Button
                onClick={handleAnswer}
                disabled={!answerBody.trim() || postingAnswer}
                className="bg-foreground text-background hover:bg-foreground/90"
              >
                {postingAnswer ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {t("forum.answer.submit")}
              </Button>
            </div>
          ) : (
            <Card className="p-6 text-center border-dashed">
              <p className="text-sm text-muted-foreground">
                Connecte-toi pour répondre à cette discussion.
              </p>
            </Card>
          )}
        </article>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex items-start justify-between gap-4 mb-8">
        <SectionHeader
          eyebrow={t("nav.forum")}
          title={t("forum.title")}
          subtitle={t("forum.subtitle")}
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
          <Plus className="h-4 w-4 mr-2" />
          {t("forum.new")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("forum.search.placeholder")}
            className="pl-9"
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
      ) : threads.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{t("forum.empty")}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => navigate("forum", thread.slug)}
              className="w-full text-left group"
            >
              <Card className="p-5 hover:border-foreground/50 hover:shadow-sm transition-all">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                    <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition" />
                    <span className="text-xs font-mono text-muted-foreground">
                      {thread.upvotes}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      {thread.pinned && (
                        <Pin className="h-3.5 w-3.5 text-foreground shrink-0 mt-1" />
                      )}
                      {thread.solved && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-foreground shrink-0 mt-1" />
                      )}
                      <h3 className="font-bold text-lg leading-snug group-hover:text-foreground transition-colors">
                        {thread.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {thread.body}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Tag label={t(`forum.category.${thread.category}`)} />
                      {thread.tags
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .slice(0, 3)
                        .map((tg) => (
                          <Tag
                            key={tg}
                            label={tg}
                            variant={tagColors[tg] || "default"}
                          />
                        ))}
                      <span className="ml-auto flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {thread._count?.posts ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {thread.views}
                        </span>
                        <span className="hidden sm:inline">·</span>
                        <span className="hidden sm:flex items-center gap-1">
                          {t("forum.by")} {thread.author.name}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </button>
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

function CreateThreadForm({
  onSubmit,
  categories,
}: {
  onSubmit: (data: {
    title: string;
    body: string;
    tags: string;
    category: string;
  }) => void;
  categories: { value: string; labelKey: string }[];
}) {
  const t = useT();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    onSubmit({ title, body, tags, category });
    setSubmitting(false);
    setTitle("");
    setBody("");
    setTags("");
    setCategory("general");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label className="text-xs font-mono uppercase">Titre</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={120}
          className="mt-1"
          placeholder={t("forum.create.body.placeholder")}
        />
      </div>
      <div>
        <Label className="text-xs font-mono uppercase">Catégorie</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories
              .filter((c) => c.value !== "all")
              .map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {t(c.labelKey)}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs font-mono uppercase">Détails</Label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={6}
          className="mt-1 resize-y"
          placeholder={t("forum.create.body.placeholder")}
        />
      </div>
      <div>
        <Label className="text-xs font-mono uppercase">Tags</Label>
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="mt-1 font-mono"
          placeholder={t("forum.create.tags.placeholder")}
        />
      </div>
      <Button
        type="submit"
        disabled={submitting || !title || !body}
        className="w-full bg-foreground text-background hover:bg-foreground/90"
      >
        {t("forum.create.submit")}
      </Button>
    </form>
  );
}
