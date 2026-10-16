"use client";

import { useState } from "react";
import ActionsReponse from "./bouton-reponse";
import FormulaireReponse from "./formulaire-reponse";
import BarreReactions from "@/components/barre-reactions";
import type { ReactionCounts } from "@/lib/reactions";

type Auteur = { id: number; nom: string; slug: string; ville: string; pays: string };

type Reponse = {
  id: number;
  postId: number;
  corps: string;
  author: Auteur;
  parentId?: number | null;
  deletedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  likedByMe?: boolean;
  reactions?: ReactionCounts;
  _count: { likes: number };
};

type Props = {
  replies: Reponse[];
  postId: number;
  userId: number | null;
  hasReplyLiked: (replyId: number) => boolean;
  connecte: boolean;
};

/** Affiche récursivement l'arbre de réponses (Reddit-like). */
export default function ArbreReponses({ replies, postId, userId, hasReplyLiked, connecte }: Props) {
  const racines = replies.filter((r) => !r.parentId);
  return (
    <ul className="flex flex-col gap-3">
      {racines.map((r) => (
        <Noeud key={r.id} reply={r} replies={replies} postId={postId} userId={userId} hasReplyLiked={hasReplyLiked} connecte={connecte} />
      ))}
    </ul>
  );
}

function Noeud({ reply, replies, postId, userId, hasReplyLiked, connecte }: { reply: Reponse; replies: Reponse[]; postId: number; userId: number | null; hasReplyLiked: (id: number) => boolean; connecte: boolean }) {
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);

  const estAuteur = userId !== null && reply.author.id === userId;
  const enfants = replies.filter((r) => r.parentId === reply.id);

  return (
    <li className="rounded-xl border border-cx-border bg-cx-card/30 px-5 py-4">
      <p className="text-xs tabular-nums text-cx-muted-fg">
        {reply.author.nom} · {reply.author.ville}, {reply.author.pays} ·{" "}
        {new Date(reply.createdAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
        {reply.createdAt !== reply.updatedAt ? " · édité" : ""}
      </p>
      <div className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
        {reply.deletedAt ? "[message supprimé]" : reply.corps}
      </div>
      <ActionsReponse
        replyId={reply.id}
        postId={postId}
        corpsInitial={reply.corps}
        estAuteur={estAuteur}
        connecte={connecte}
        likedByMe={hasReplyLiked(reply.id)}
        likes={reply._count.likes}
      />
      {reply.reactions ? (
        <div className="mt-2">
          <BarreReactions
            kind="reply"
            targetId={reply.id}
            initial={reply.reactions}
            connecte={connecte}
            compact
          />
        </div>
      ) : null}
      {connecte ? (
        <button
          type="button"
          onClick={() => setAfficherFormulaire((v) => !v)}
          className="mt-2 text-xs font-medium text-cx-primary hover:underline"
        >
          {afficherFormulaire ? "Annuler" : "Répondre"}
        </button>
      ) : null}
      {afficherFormulaire ? (
        <FormulaireReponse postId={postId} parentId={reply.id} />
      ) : null}
      {enfants.length > 0 ? (
        <div className="mt-3 border-l-2 border-cx-border pl-3 sm:pl-4">
          <ArbreReponses replies={enfants} postId={postId} userId={userId} hasReplyLiked={hasReplyLiked} connecte={connecte} />
        </div>
      ) : null}
    </li>
  );
}
