"use client";

import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/shared/avatar";
import { Tag, tagColors } from "@/components/shared/tag";
import { PostActions } from "@/components/shared/post-actions";
import { timeAgo, timeAgoLong } from "@/lib/time";
import { useAppStore, useT } from "@/store/app-store";
import { cn } from "@/lib/utils";
import {
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Pin,
  Eye,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types partagés — le fil d'accueil et la liste du forum lisent la    */
/* même réponse JSON (/api/threads), donc un seul type suffit.         */
/* ------------------------------------------------------------------ */

export type ThreadProfile = {
  id: string;
  username: string;
  avatarColor: string | null;
  country: string | null;
  city: string | null;
} | null;

export type ThreadAuthor = {
  id: string;
  name: string;
  reputation?: number | null;
  profile: ThreadProfile;
};

export type ThreadCardData = {
  id: string;
  title: string;
  slug: string;
  body: string;
  tags: string;
  category: string;
  views: number;
  upvotes: number;
  /** Vote du visiteur (1 / -1 / 0), déduit de la session côté serveur. */
  myVote?: number;
  pinned: boolean;
  solved: boolean;
  createdAt: string;
  author: ThreadAuthor;
  _count?: { posts: number };
};

interface ThreadCardProps {
  thread: ThreadCardData;
  /** Ouverture de la discussion (le clic carte + le lien titre convergent). */
  onOpen: (thread: ThreadCardData) => void;
  /** `0` retire le vote. L'appelant gère l'optimisme et le retour serveur. */
  onVote: (thread: ThreadCardData, value: 1 | -1 | 0) => void;
  className?: string;
}

/**
 * Carte de discussion — le composant social le plus utilisé du site (fil
 * d'accueil **et** liste du forum).
 *
 * Reprend la structure de Reddit, dans l'ordre : rail de vote à gauche,
 * ligne d'identité (avatar, auteur, réputation, âge, badges), titre **vrai
 * lien**, extrait, tags, puis la barre d'actions `Commenter · Partager ·
 * Sauvegarder · ⋯` en pied de carte.
 *
 * Le titre est un lien natif : clic médian, clic droit → ouvrir dans un
 * onglet, barre d'espace au clavier. La carte entière est cliquable pour la
 * lecture rapide ; les actions, elles, stoppent la propagation du clic.
 */
export function ThreadCard({ thread, onOpen, onVote, className }: ThreadCardProps) {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const myVote = thread.myVote ?? 0;
  const comments = thread._count?.posts ?? 0;
  const username = thread.author.profile?.username ?? thread.author.name;

  const vote = (e: React.MouseEvent, value: 1 | -1 | 0) => {
    e.stopPropagation();
    e.preventDefault();
    onVote(thread, value);
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <article
      onClick={() => onOpen(thread)}
      className={cn("rise-in group cursor-pointer", className)}
    >
      <Card className="p-3 transition-[border-color,box-shadow] hover:border-foreground/40 hover:shadow-sm sm:p-4">
        <div className="flex gap-3">
          {/* Rail de vote — fond visible au survol, comme la colonne grise
              de Reddit, pour montrer qu'il est interactif. */}
          <div className="flex shrink-0 flex-col items-center gap-0.5 self-start rounded-md py-1 transition-colors group-hover:bg-muted/70">
            <button
              type="button"
              aria-label={
                myVote === 1 ? t("forum.cancel_vote") : t("forum.upvote_question")
              }
              aria-pressed={myVote === 1}
              onClick={(e) => vote(e, myVote === 1 ? 0 : 1)}
              className={cn(
                "rounded p-1 transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1",
                myVote === 1
                  ? "text-chart-1"
                  : "text-muted-foreground hover:text-chart-1"
              )}
            >
              <ChevronUp className="h-5 w-5" aria-hidden="true" />
            </button>
            {/* `key` = force un remontage à chaque changement de score, ce
                qui rejoue l'animation `vote-pop`. */}
            <span
              key={thread.upvotes}
              className={cn(
                "vote-pop min-w-[2ch] text-center font-mono text-xs font-semibold tabular-nums",
                myVote === 1 && "text-chart-1",
                myVote === -1 && "text-destructive"
              )}
            >
              {thread.upvotes}
            </span>
            <button
              type="button"
              aria-label={t("forum.downvote_question")}
              aria-pressed={myVote === -1}
              onClick={(e) => vote(e, myVote === -1 ? 0 : -1)}
              className={cn(
                "rounded p-1 transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1",
                myVote === -1
                  ? "text-destructive"
                  : "text-muted-foreground hover:text-destructive"
              )}
            >
              <ChevronDown className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Contenu */}
          <div className="min-w-0 flex-1">
            {/* Identité + âge du post : le contexte social d'abord. */}
            <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <Avatar
                name={thread.author.name}
                color={thread.author.profile?.avatarColor}
                size="xs"
              />
              <a
                href={`#annuaire/${username}`}
                onClick={stop}
                className="font-medium text-foreground decoration-underline underline-offset-2 hover:underline"
              >
                u/{username}
              </a>
              {typeof thread.author.reputation === "number" &&
                thread.author.reputation > 0 && (
                  <span className="font-mono text-[11px] text-muted-foreground">
                    ★ {thread.author.reputation}
                  </span>
                )}
              <span aria-hidden="true">·</span>
              <time
                dateTime={thread.createdAt}
                title={timeAgoLong(thread.createdAt, locale)}
              >
                {timeAgo(thread.createdAt, locale)}
              </time>
              {thread.pinned && (
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <Pin className="h-3 w-3" aria-hidden="true" />
                  {t("forum.pinned")}
                </span>
              )}
              {thread.solved && (
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  {t("forum.solved")}
                </span>
              )}
              <span className="ms-auto inline-flex items-center gap-1">
                <Eye className="h-3 w-3" aria-hidden="true" />
                {thread.views}
              </span>
            </div>

            <h3 className="text-base font-bold leading-snug sm:text-lg">
              <a
                href={`#forum/${thread.slug}`}
                onClick={(e) => {
                  // Laisse le lien natif faire son travail (onglet, copie)
                  // tout en pilotant le store : un seul chemin de navigation.
                  e.preventDefault();
                  onOpen(thread);
                }}
                className="decoration-underline underline-offset-4 hover:underline"
              >
                {thread.title}
              </a>
            </h3>

            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {thread.body}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Tag
                label={t(`forum.category.${thread.category}`)}
                variant="outline"
              />
              {thread.tags
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, 3)
                .map((tg) => (
                  <Tag key={tg} label={tg} variant={tagColors[tg] || "default"} />
                ))}
            </div>

            {/* Barre d'actions — le clic ne doit pas ouvrir la carte.
                 Les actions de gestion (épingler / modifier / supprimer)
                 arrivent avec C10, quand l'API les expose. */}
            <PostActions
              threadId={thread.id}
              threadSlug={thread.slug}
              comments={comments}
              onOpen={() => onOpen(thread)}
            />
          </div>
        </div>
      </Card>
    </article>
  );
}
