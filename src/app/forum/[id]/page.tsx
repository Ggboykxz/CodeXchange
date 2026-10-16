import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { aLike, getPost, hasReplyLiked, parseId } from "@/lib/forum";
import { isFavorite } from "@/lib/favorites";
import { localeCourante, t } from "@/lib/i18n";
import BoutonFavori from "@/components/bouton-favori";
import BoutonSignaler from "@/components/bouton-signaler";
import BoutonVote from "@/components/bouton-vote";
import BarreReactions from "@/components/barre-reactions";
import LogoTechno, { logoTechno } from "@/components/logo-techno";
import BoutonRepost from "@/components/bouton-repost";
import { getEtatRepost } from "@/lib/reposts";
import BoutonSondage from "./bouton-sondage";
import ArbreReponses from "./arbre-reponses";
import TexteRepliable from "@/components/texte-repliable";
import RenduMarkdown from "@/components/rendu-markdown";
import FilAriane from "@/components/fil-ariane";
import { getSessionUserId } from "@/lib/session";
import BoutonLike from "./bouton-like";
import FormulaireReponse from "./formulaire-reponse";

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
  const [userId, locale] = await Promise.all([getSessionUserId(), localeCourante()]);
  const sujet = await getPost(postId, userId ?? undefined);
  if (!sujet) notFound();
  const likedByMe = userId === null ? false : await aLike(userId, postId);
  const favoriDuSujet = userId === null ? false : await isFavorite(userId, "post", postId);
  const etatRepost = await getEtatRepost(postId, userId ?? undefined);

  // État « aimé » par réponse : uniquement des données sérialisables passées
  // au composant client (jamais de fonctions — cf. tests/serialisation.test.ts).
  const likesReponses: number[] = [];
  if (userId !== null) {
    await Promise.all(
      sujet.replies.map(async (reponse) => {
        if (await hasReplyLiked(userId, reponse.id)) likesReponses.push(reponse.id);
      })
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-6 py-10">
      <FilAriane
        items={[
          { label: t(locale, "nav.home"), href: "/" },
          { label: t(locale, "nav.forum"), href: "/forum" },
          { label: sujet.titre },
        ]}
      />

      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-black leading-snug tracking-tight sm:text-3xl">
          {sujet.titre}
        </h1>
        <p className="text-sm text-cx-muted-fg">
          {sujet.author.nom} · {sujet.author.ville}, {sujet.author.pays} ·{" "}
          {DATE.format(sujet.createdAt)}
        </p>
        {sujet.tags && (
          <ul className="flex flex-wrap gap-2">
            {sujet.tags.split(",").map((mot) => (
              <li key={mot}>
                <Link
                  href={`/forum?tag=${encodeURIComponent(mot.trim())}`}
                  className="rounded-full bg-cx-primary/5 px-2.5 py-0.5 text-xs font-medium text-cx-primary"
                >
                  {logoTechno(mot.trim()) && <LogoTechno nom={mot.trim()} className="mr-1 inline-block size-3" />}
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

      <div className="flex gap-4">
        <BoutonVote postId={postId} initialVote={sujet.userVote} initialScore={sujet.score} connecte={userId !== null} />
        <div className="flex-1 space-y-4">
          {sujet.poll ? (
            <BoutonSondage postId={postId} question={sujet.poll.question} options={sujet.poll.options} total={sujet.poll.total} userVoted={sujet.poll.userVoted} connecte={userId !== null} />
          ) : null}
          <article className="rounded-xl border border-cx-border px-5 py-5 text-sm leading-relaxed whitespace-pre-wrap">
            <TexteRepliable texte={sujet.corps}><RenduMarkdown texte={sujet.corps} /></TexteRepliable>
          </article>
          <div className="rounded-xl border border-cx-border bg-cx-card px-4 py-3">
            <BarreReactions
              kind="post"
              targetId={postId}
              initial={sujet.reactions}
              connecte={userId !== null}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <BoutonRepost postId={postId} initial={etatRepost} connecte={userId !== null} />
        <BoutonSignaler kind="post" targetId={postId} />
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tabular-nums">
          {sujet.replies.length === 0
            ? t(locale, "forum.answers_zero")
            : sujet.replies.length === 1
              ? t(locale, "forum.answers_one")
              : `${sujet.replies.length} ${t(locale, "forum.answers_many")}`}
        </h2>

        {sujet.replies.length === 0 ? (
          <p className="rounded-xl border border-dashed border-cx-border px-5 py-6 text-sm text-cx-muted-fg">
            {userId === null
              ? t(locale, "forum.no_answer_cta")
              : t(locale, "forum.no_answer")}
          </p>
        ) : (
          <ArbreReponses
            replies={sujet.replies as unknown as Parameters<typeof ArbreReponses>[0]["replies"]}
            postId={postId}
            userId={userId}
            likesReponses={likesReponses}
            connecte={userId !== null}
          />
        )}
      </section>

      <section className="rounded-xl border border-cx-border px-5 py-5">
        <h2 className="text-lg font-semibold">{t(locale, "forum.your_answer")}</h2>
        {userId === null ? (
          <p className="mt-3 text-sm text-cx-muted-fg">
            <Link href="/connexion" className="font-medium text-cx-primary underline-offset-4 hover:underline">
              Connectez-vous
            </Link>{" "}
            pour répondre à ce sujet.
          </p>
        ) : (
          <FormulaireReponse postId={postId} />
        )}
      </section>
    </div>
  );
}
