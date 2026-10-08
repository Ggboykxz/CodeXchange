"use client";

import { useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useAppStore, useT } from "@/store/app-store";
import { Avatar } from "@/components/shared/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { timeAgoLong } from "@/lib/time";
import {
  COMMENT_SORTS,
  descendantsOf,
  prepareComments,
  type CommentNode,
  type CommentSort,
} from "@/lib/comments";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Minus,
  Plus,
  Send,
} from "lucide-react";

/** Rendu markdown différé — déjà chargé ailleurs dans le forum. */
const Markdown = dynamic(
  () => import("@/components/shared/markdown").then((m) => m.Markdown),
  {
    ssr: false,
    loading: () => (
      <div className="h-8 w-full animate-pulse rounded bg-muted/50" aria-hidden="true" />
    ),
  }
);

export type CommentAuthor = {
  id: string;
  name: string;
  reputation?: number | null;
  profile: {
    username: string;
    avatarColor: string | null;
    country?: string | null;
    city?: string | null;
  } | null;
};

export type CommentData = {
  id: string;
  body: string;
  upvotes: number;
  myVote?: number;
  isAnswer: boolean;
  parentId: string | null;
  createdAt: string;
  author: CommentAuthor;
};

const sortLabels: Record<CommentSort, string> = {
  best: "forum.comment.sort.best",
  new: "forum.comment.sort.new",
  old: "forum.comment.sort.old",
};

/** Indentation plafonnée : au-delà, on garde la marge mais on n'ajoute plus. */
const MAX_DEPTH = 6;

interface CommentThreadProps {
  posts: CommentData[];
  /** Sert au badge « Auteur » et à qui peut accepter une réponse. */
  threadAuthorId: string;
  user: { id: string; role?: string } | null;
  /** Vote ±1/0 sur un commentaire — géré par l'appelant (optimisme). */
  onVote: (postId: string, value: 1 | -1 | 0) => void;
  onAccept: (postId: string, next: boolean) => void;
  /** Publication d'une réponse (`parentId: null` = racine). true = succès. */
  onReply: (parentId: string | null, body: string) => Promise<boolean>;
  onOpenProfile: (username?: string) => void;
}

/**
 * Fil de discussion façon Reddit : commentaires **imbriqués** avec ligne de
 * fil, pliage d'une branche, tri des racines (meilleurs / nouveaux / anciens),
 * vote ↑↓ et réponse en ligne sous chaque commentaire.
 *
 * La structure vient de `lib/comments` (pur, testé) : ce composant ne fait
 * que la rendre.
 */
export function CommentThread({
  posts,
  threadAuthorId,
  user,
  onVote,
  onAccept,
  onReply,
  onOpenProfile,
}: CommentThreadProps) {
  const t = useT();
  const locale = useAppStore((s) => s.locale);

  const [sort, setSort] = useState<CommentSort>("best");
  const [folded, setFolded] = useState<ReadonlySet<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [rootBody, setRootBody] = useState("");

  const tree = useMemo(() => prepareComments(posts, sort), [posts, sort]);
  const canAccept = Boolean(
    user && (user.id === threadAuthorId || user.role === "admin" || user.role === "moderator")
  );

  const toggleFold = (id: string) =>
    setFolded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /** Publie puis referme le formulaire — l'appelant rafraîchit l'arbre. */
  const send = async (
    parentId: string | null,
    body: string,
    done: () => void
  ) => {
    const ok = await onReply(parentId, body);
    if (ok) {
      done();
      setReplyingTo(null);
    }
  };

  const countLabel = (n: number) =>
    n === 1 ? t("forum.comment.answers_one") : t("forum.answers");

  const renderComment = (node: CommentNode<CommentData>, depth: number): ReactNode => {
    const isFolded = folded.has(node.id);
    const replies = descendantsOf(node);
    const myVote = node.myVote ?? 0;
    const isOP = node.author.id === threadAuthorId;
    const username = node.author.profile?.username;
    const indent = Math.min(depth, MAX_DEPTH);

    return (
      <div
        key={node.id}
        className={cn(
          depth > 0 && "ms-2 border-s border-border ps-3 sm:ms-4 sm:ps-4",
          depth >= MAX_DEPTH && "border-s-0 ps-0 sm:border-s sm:ps-4"
        )}
      >
        {/* En-tête replié : Reddit affiche auteur + nombre de réponses. */}
        {isFolded ? (
          <button
            type="button"
            onClick={() => toggleFold(node.id)}
            aria-expanded={false}
            className="flex w-full items-center gap-2 rounded px-1 py-1.5 text-start text-xs text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{node.author.name}</span>
            {/* Un commentaire sans enfant se replie sur son seul auteur. */}
            {replies > 0 && (
              <span className="shrink-0 font-medium">
                {replies}{" "}
                {replies <= 1
                  ? t("forum.comment.folded_one")
                  : t("forum.comment.folded_many")}
              </span>
            )}
          </button>
        ) : (
          <>
            <article className="py-2">
              {/* Ligne d'identité : auteur, réputation, OP, âge. */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => toggleFold(node.id)}
                  aria-expanded
                  aria-label={t("forum.comment.collapse")}
                  title={t("forum.comment.collapse")}
                  className="rounded p-0.5 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1"
                >
                  <Minus className="h-3 w-3" aria-hidden="true" />
                </button>
                <Avatar
                  name={node.author.name}
                  color={node.author.profile?.avatarColor}
                  size="xs"
                />
                <button
                  type="button"
                  onClick={() => onOpenProfile(username)}
                  className="font-medium text-foreground hover:underline"
                >
                  {node.author.name}
                </button>
                <span
                  className="font-mono text-[11px]"
                  title={t("annuaire.reputation_hint")}
                >
                  ★ {node.author.reputation ?? 0}
                </span>
                {isOP && (
                  <span className="rounded bg-foreground px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-background">
                    {t("forum.comment.op")}
                  </span>
                )}
                <time
                  dateTime={node.createdAt}
                  title={new Date(node.createdAt).toLocaleString(locale)}
                >
                  · {timeAgoLong(node.createdAt, locale)}
                </time>
                {node.isAnswer && (
                  <span className="flex items-center gap-1 text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("forum.accepted")}
                  </span>
                )}
              </div>

              <div className="mt-1.5 ps-5 text-sm leading-relaxed text-foreground/90">
                <Markdown content={node.body} />
              </div>

              {/* Actions : vote horizontal façon Reddit, réponse, acceptation. */}
              <div className="mt-1.5 flex flex-wrap items-center gap-2 ps-5">
                <span className="inline-flex items-center rounded border border-border">
                  <button
                    type="button"
                    aria-label={
                      myVote === 1 ? t("forum.cancel_vote") : t("forum.upvote_answer")
                    }
                    aria-pressed={myVote === 1}
                    onClick={() => onVote(node.id, myVote === 1 ? 0 : 1)}
                    className={cn(
                      "rounded-l px-1.5 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1",
                      myVote === 1
                        ? "text-chart-1"
                        : "text-muted-foreground hover:text-chart-1"
                    )}
                  >
                    <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <span
                    className={cn(
                      "px-1 font-mono text-xs tabular-nums",
                      myVote === 1 && "text-chart-1",
                      myVote === -1 && "text-destructive"
                    )}
                  >
                    {node.upvotes}
                  </span>
                  <button
                    type="button"
                    aria-label={t("forum.downvote_answer")}
                    aria-pressed={myVote === -1}
                    onClick={() => onVote(node.id, myVote === -1 ? 0 : -1)}
                    className={cn(
                      "rounded-r px-1.5 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1",
                      myVote === -1
                        ? "text-destructive"
                        : "text-muted-foreground hover:text-destructive"
                    )}
                  >
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </span>

                <button
                  type="button"
                  onClick={() => setReplyingTo(replyingTo === node.id ? null : node.id)}
                  className="rounded px-1.5 py-1 text-xs font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1"
                >
                  {t("forum.answer.submit")}
                </button>

                {canAccept && (
                  <button
                    type="button"
                    aria-pressed={node.isAnswer}
                    onClick={() => onAccept(node.id, !node.isAnswer)}
                    className={cn(
                      "flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1",
                      node.isAnswer
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {node.isAnswer ? t("forum.accepted") : t("forum.accept")}
                  </button>
                )}
              </div>

              {/* Réponse en ligne sous le commentaire visé. */}
              {replyingTo === node.id && (
                <div className="mt-2 ps-5">
                  <ReplyBox
                    placeholder={t("forum.answer.placeholder")}
                    onCancel={() => setReplyingTo(null)}
                    onSubmit={(body) => send(node.id, body, () => undefined)}
                  />
                </div>
              )}
            </article>

            {/* Enfants : la ligne de fil verticale continue le fil. */}
            {node.children.length > 0 && (
              <div>
                {node.children.map((child) => renderComment(child, indent + 1))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <section aria-label={t("forum.comment.section_label")} className="space-y-3">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          {posts.length} {countLabel(posts.length)}
        </h3>
        <Select value={sort} onValueChange={(v) => setSort(v as CommentSort)}>
          <SelectTrigger
            className="h-8 w-[150px] text-xs"
            aria-label={t("forum.comment.sort_label")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMMENT_SORTS.map((s) => (
              <SelectItem key={s} value={s}>
                {t(sortLabels[s])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {posts.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <p className="text-sm text-muted-foreground">{t("forum.comment.empty")}</p>
        </Card>
      ) : (
        <div>{tree.map((node) => renderComment(node, 0))}</div>
      )}

      {/* Composer de fond : c'est là que Reddit place sa zone de saisie. */}
      {user ? (
        <div className="space-y-2 border-t border-border pt-4">
          <Textarea
            value={rootBody}
            onChange={(e) => setRootBody(e.target.value)}
            placeholder={t("forum.answer.placeholder")}
            rows={4}
            className="resize-y"
            aria-label={t("forum.answer.submit")}
          />
          <div className="flex justify-end">
            <SendButton
              body={rootBody}
              onSend={() => send(null, rootBody, () => setRootBody(""))}
            />
          </div>
        </div>
      ) : (
        <Card className="p-5 text-center border-dashed">
          <p className="text-sm text-muted-foreground">{t("forum.sign_in_to_answer")}</p>
        </Card>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Sous-composants                                                     */
/* ------------------------------------------------------------------ */

function ReplyBox({
  placeholder,
  onCancel,
  onSubmit,
}: {
  placeholder: string;
  onCancel: () => void;
  onSubmit: (body: string) => Promise<void> | void;
}) {
  const t = useT();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      await onSubmit(body);
      setBody("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="resize-y"
        autoFocus
      />
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          {t("forum.comment.cancel")}
        </Button>
        <Button
          type="button"
          size="sm"
          aria-label={t("forum.comment.send")}
          disabled={!body.trim() || sending}
          onClick={submit}
          className="bg-brand text-brand-foreground hover:bg-brand/90"
        >
          {sending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {t("forum.answer.submit")}
        </Button>
      </div>
    </div>
  );
}

/** Bouton d'envoi du composer de fond (désactivé tant que le corps est vide). */
function SendButton({ body, onSend }: { body: string; onSend: () => Promise<void> }) {
  const t = useT();
  const [sending, setSending] = useState(false);

  return (
    <Button
      type="button"
      size="sm"
      aria-label={t("forum.comment.send")}
      disabled={!body.trim() || sending}
      onClick={async () => {
        setSending(true);
        try {
          await onSend();
        } finally {
          setSending(false);
        }
      }}
      className="bg-brand text-brand-foreground hover:bg-brand/90"
    >
      {sending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Send className="h-4 w-4" aria-hidden="true" />
      )}
      {t("forum.answer.submit")}
    </Button>
  );
}
