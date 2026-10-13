import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { aLike, getPost, hasReplyLiked, parseId } from "@/lib/forum";
import { isFavorite } from "@/lib/favorites";
import BoutonFavori from "@/components/bouton-favori";
import BoutonSignaler from "@/components/bouton-signaler";
import { getSessionUserId } from "@/lib/session";
import BoutonLike from "./bouton-like";
import FormulaireReponse from "./formulaire-reponse";
import ActionsReponse from "./bouton-reponse";

type Props = { params: Promise<{ id: string }> };

const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

async function lireSujet(id: string) {
  const postId = parseId(id);
  if (postId === null) return null;
  return getPost(postId);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const sujet = await lireSujet(id);
  return { title: sujet ? sujet.titre : "Sujet introuvable" };
}

/** /forum/[id] — détail d'un sujet : réponses, likes, formulaire de réponse. */
export default async function PageSujet({ params }: Props) {
  const { id } = await params;
  const postId = parseId(id);
  if (postId === null) notFound();
  const sujet = await getPost(postId);
  if (!sujet) notFound();

  const userId = await getSessionUserId();
  const likedByMe = userId === null ? false : await aLike(userId, postId);
  const favoriDuSujet = userId === null ? false : await isFavorite(userId, "post", postId);

  const likesParReponse = new Map<number, boolean>();
  if (userId !== null) {
    await Promise.all(
      sujet.replies.map(async (reponse) => {
        const a = await hasReplyLiked(userId, reponse.id);
        likesParReponse.set(reponse.id, a);
      })
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <Link href="/forum" className="text-sm text-[var(--cx-accent)]">
        ← Retour au forum
      </Link>

      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-black leading-snug tracking-tight sm:text-3xl">
          {sujet.titre}
        </h1>
        <p className="text-sm text-[var(--cx-muted)]">
          {sujet.author.nom} · {sujet.author.ville}, {sujet.author.pays} ·{" "}
          {DATE.format(sujet.createdAt)}
        </p>
        {sujet.tags && (
          <ul className="flex flex-wrap gap-2">
            {sujet.tags.split(",").map((mot) => (
              <li key={mot}>
                <Link
                  href={`/forum?tag=${encodeURIComponent(mot.trim())}`}
                  className="rounded-full bg-[var(--cx-accent)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--cx-accent)]"
                >
                  {mot.trim()}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          <BoutonLike
            postId={postId}
            connecte={userId !== null}
            likedByMe={likedByMe}
            compteur={sujet._count.likes}
          />
          <BoutonFavori
            kind="post"
            targetId={postId}
            initial={favoriDuSujet}
            connecte={userId !== null}
          />
        </div>
      </header>

      <article className="rounded-xl border border-[var(--cx-muted)]/25 px-5 py-5 text-sm leading-relaxed whitespace-pre-wrap">
        {sujet.corps}
      </article>

      <div className="flex justify-end">
        <BoutonSignaler kind="post" targetId={postId} />
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">
          {sujet.replies.length === 0
            ? "Aucune réponse"
            : sujet.replies.length === 1
              ? "1 réponse"
              : `${sujet.replies.length} réponses`}
        </h2>

        {sujet.replies.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--cx-muted)]/40 px-5 py-6 text-sm text-[var(--cx-muted)]">
            {userId === null
              ? "Connectez-vous pour donner le premier coup de main."
              : "Soyez le premier à répondre."}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {sujet.replies.map((reponse) => (
              <li
                key={reponse.id}
                className="rounded-xl border border-[var(--cx-muted)]/25 px-5 py-4"
              >
                <p className="text-xs text-[var(--cx-muted)]">
                  {reponse.author.nom} · {reponse.author.ville}, {reponse.author.pays} ·{" "}
                  {DATE.format(reponse.createdAt)}
                  {reponse.createdAt !== reponse.updatedAt ? " · édité" : ""}
                </p>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                  {reponse.deletedAt ? "[message supprimé]" : reponse.corps}
                </p>
                {reponse.deletedAt === null ? (
                  <ActionsReponse
                    replyId={reponse.id}
                    postId={postId}
                    corpsInitial={reponse.corps}
                    estAuteur={userId !== null && userId === reponse.authorId}
                    connecte={userId !== null}
                    likedByMe={likesParReponse.get(reponse.id) === true}
                    likes={reponse._count?.likes ?? 0}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-[var(--cx-muted)]/25 px-5 py-5">
        <h2 className="text-lg font-semibold">Votre réponse</h2>
        {userId === null ? (
          <p className="mt-3 text-sm text-[var(--cx-muted)]">
            <Link href="/connexion" className="font-medium text-[var(--cx-accent)]">
              Connectez-vous
            </Link>{" "}
            pour répondre à ce sujet.
          </p>
        ) : (
          <FormulaireReponse postId={postId} />
        )}
      </section>
    </main>
  );
}
