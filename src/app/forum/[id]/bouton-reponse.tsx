"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";

type Props = {
  replyId: number;
  postId: number;
  corpsInitial: string;
  estAuteur: boolean;
  connecte: boolean;
  likedByMe: boolean;
  likes: number;
};

export default function ActionsReponse({
  replyId,
  postId,
  corpsInitial,
  estAuteur,
  connecte,
  likedByMe,
  likes,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [liked, setLiked] = useState(likedByMe);
  const [compteur, setCompteur] = useState(likes);
  const [enEdition, setEnEdition] = useState(false);
  const [texte, setTexte] = useState(corpsInitial);
  const [busy, setBusy] = useState(false);

  async function basculerLike() {
    if (!connecte) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/forum/${postId}/replies/${replyId}/like`, { method: "POST" });
      const data = await r.json();
      if (typeof data.like === "boolean") {
        setLiked(data.like);
        setCompteur((c) => (data.like ? c + 1 : Math.max(0, c - 1)));
      }
      if (data.error) toast.erreur("Action impossible", data.message);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function supprimer() {
    if (!estAuteur || busy) return;
    if (!confirm("Supprimer cette réponse ?")) return;
    setBusy(true);
    try {
      await fetch(`/api/forum/${postId}/replies/${replyId}`, { method: "DELETE" });
      toast.succes("Réponse supprimée");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function enregistrer() {
    if (!estAuteur) return;
    setBusy(true);
    try {
      await fetch(`/api/forum/${postId}/replies/${replyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ corps: texte }),
      });
      setEnEdition(false);
      toast.succes("Réponse modifiée");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
      <button
        type="button"
        onClick={basculerLike}
        disabled={!connecte || busy}
        className={`rounded-md px-2 py-1 transition ${liked ? "bg-cx-primary/10 text-cx-primary" : "text-cx-muted-fg hover:bg-cx-muted"}`}
      >
        {liked ? "★" : "☆"} {compteur}
      </button>
      {estAuteur ? (
        <>
          <button
            type="button"
            onClick={() => setEnEdition((v) => !v)}
            className="rounded-md px-2 py-1 text-cx-muted-fg hover:bg-cx-muted"
          >
            {enEdition ? "Annuler" : "Éditer"}
          </button>
          <button
            type="button"
            onClick={supprimer}
            className="rounded-md px-2 py-1 text-red-500 hover:bg-red-500/10"
          >
            Supprimer
          </button>
        </>
      ) : null}
      {enEdition ? (
        <div className="mt-1 w-full flex flex-col gap-2">
          <textarea
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-cx-border bg-transparent p-2 text-sm outline-none focus:border-cx-primary"
          />
          <button
            type="button"
            onClick={enregistrer}
            disabled={busy}
            className="self-start rounded-lg bg-cx-primary px-3 py-1.5 text-xs font-semibold text-cx-primary-fg"
          >
            Enregistrer
          </button>
        </div>
      ) : null}
    </div>
  );
}
