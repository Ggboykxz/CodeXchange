"use client";

import { useState } from "react";
import ActionsReponse from "./bouton-reponse";
import RenduMarkdown from "@/components/rendu-markdown";
import FormulaireReponse from "./formulaire-reponse";
import BarreReactions from "@/components/barre-reactions";
import Traduction from "@/components/traduction";
import type { Locale } from "@/lib/i18n";
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
  /** Ids des réponses aimées par le membre (données sérialisables, pas de fonction). */
  likesReponses: number[];
  connecte: boolean;
  locale: Locale;
};

/** Affiche récursivement l'arbre de réponses (Reddit-like). */
export default function ArbreReponses({ replies, postId, userId, likesReponses, connecte, locale }: Props) {
  // Racines de CE niveau : sans parent, ou dont le parent n'est pas dans la
  // liste passée (appel récursif sur une sous-branche d'enfants).
  const ids = new Set(replies.map((r) => r.id));
  const racines = replies.filter((r) => !r.parentId || !ids.has(r.parentId));
  const likes = new Set(likesReponses);
  return (
    <ul className="flex flex-col gap-3">
      {racines.map((r) => (
        <Noeud key={r.id} reply={r} replies={replies} postId={postId} userId={userId} likes={likes} connecte={connecte} locale={locale} />
      ))}
    </ul>
  );
}

function Noeud({ reply, replies, postId, userId, likes, connecte, locale }: { reply: Reponse; replies: Reponse[]; postId: number; userId: number | null; likes: Set<number>; connecte: boolean; locale: Locale }) {
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [afficheEnfants, setAfficheEnfants] = useState(true);

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
        {reply.deletedAt ? "[message supprimé]" : <RenduMarkdown texte={reply.corps} />}
      </div>
      {reply.deletedAt ? null : <Traduction texte={reply.corps} locale={locale} />}
      <ActionsReponse
        replyId={reply.id}
        postId={postId}
        corpsInitial={reply.corps}
        estAuteur={estAuteur}
        connecte={connecte}
        likedByMe={likes.has(reply.id)}
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
        <div className="mt-3">
          {enfants.length > 1 ? (
            <button
              type="button"
              onClick={() => setAfficheEnfants((v) => !v)}
              aria-expanded={afficheEnfants}
              aria-controls={`reponses-${reply.id}`}
              className="rounded-full px-2 py-1 text-xs font-medium text-cx-muted-fg hover:bg-cx-muted hover:text-cx-fg"
            >
              {afficheEnfants ? `▾ Masquer ${enfants.length} réponses` : `▸ Afficher ${enfants.length} réponses`}
            </button>
          ) : null}
          {afficheEnfants ? (
            <div id={`reponses-${reply.id}`} className="mt-2 ml-3 border-l-2 border-cx-border pl-3 sm:pl-4">
              <ArbreReponses replies={enfants} postId={postId} userId={userId} likesReponses={[...likes]} connecte={connecte} locale={locale} />
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
