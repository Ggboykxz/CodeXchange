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
import { formatDureeLecture } from "@/lib/lecture";
import BoutonSondage from "./bouton-sondage";
import ArbreReponses from "./arbre-reponses";
import TexteRepliable from "@/components/texte-repliable";
import RenduMarkdown from "@/components/rendu-markdown";
/* Le détail passe à un en-tête façon X ; FilAriane reste pour les autres pages. */
import { getSessionUserId } from "@/lib/session";
import BoutonLike from "./bouton-like";
import FormulaireReponse from "./formulaire-reponse";
import Traduction from "@/components/traduction";
import BoutonPartager from "@/components/bouton-partager";
import Tendances from "@/components/tendances";
import Avatar from "@/components/avatar";
import { BadgeVerification } from "@/components/badges-membre";
import { Icone } from "@/components/icones";

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
    <div className="mx-auto grid min-h-dvh max-w-6xl grid-cols-1 gap-x-8 gap-y-6 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,600px)_300px] lg:justify-center">
      {/* Colonne détail façon X. */}
      <div className="flex min-w-0 flex-col">
      {/* Barre collante : retour + titre + (signaler vit dans la barre d'actions). */}
      <header className="sticky top-0 z-10 -mx-4 mb-2 flex items-center gap-2 bg-cx-bg/85 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <Link
          href="/forum"
          aria-label={t(locale, "forum.retour")}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full transition hover:bg-cx-muted"
        >
          <Icone nom="chevron" className="size-5 -rotate-90" />
        </Link>
        <p className="min-w-0 flex-1 truncate text-[17px] font-extrabold">{t(locale, "forum.detail_titre")}</p>
      </header>

      {/* Carte du sujet façon X : en-tête auteur, corps indenté (52px), actions. */}
      <article className="flex flex-col pb-2">
        <div className="flex items-start gap-3">
          <Link
            href={`/membres/${sujet.author.slug}`}
            className="mt-0.5 shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cx-primary"
            aria-label={t(locale, "forum.by") + " " + sujet.author.nom}
          >
            <Avatar slug={sujet.author.slug} nom={sujet.author.nom} avatar={sujet.author.avatar ?? undefined} taille="md" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-1.5 text-sm leading-5">
              <Link
                href={`/membres/${sujet.author.slug}`}
                className="min-w-0 max-w-[13rem] truncate font-bold hover:underline sm:max-w-[16rem]"
              >
                {sujet.author.nom}
              </Link>
              {sujet.author.verified ? <BadgeVerification /> : null}
              <span className="min-w-0 max-w-[11rem] truncate text-xs text-cx-muted-fg">@{sujet.author.slug}</span>
              <span aria-hidden className="text-xs text-cx-muted-fg">
                ·
              </span>
              <time dateTime={new Date(sujet.createdAt).toISOString()} suppressHydrationWarning className="text-xs text-cx-muted-fg">
                {DATE.format(sujet.createdAt)}
              </time>
            </p>
            <h1 className="mt-0.5 text-[19px] font-extrabold leading-snug tracking-tight sm:text-xl">
              {sujet.titre}
            </h1>
          </div>
        </div>

        <div className="mt-2 pl-[52px]">
          {sujet.tags && (
            <ul className="flex flex-wrap gap-1.5">
              {sujet.tags.split(",").map((mot) => (
                <li key={mot}>
                  <Link
                    href={`/forum?tag=${encodeURIComponent(mot.trim())}`}
                    className="rounded-full bg-cx-primary/5 px-2.5 py-0.5 text-xs font-semibold text-cx-primary hover:bg-cx-primary/20"
                  >
                    {logoTechno(mot.trim()) && <LogoTechno nom={mot.trim()} className="mr-1 inline-block size-3" />}
                    {mot.trim()}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {sujet.poll ? (
            <div className="mt-3">
              <BoutonSondage postId={postId} question={sujet.poll.question} options={sujet.poll.options} total={sujet.poll.total} userVoted={sujet.poll.userVoted} connecte={userId !== null} />
            </div>
          ) : null}

          <div className="mt-2 text-[15px] leading-relaxed">
            <TexteRepliable texte={sujet.corps}><RenduMarkdown texte={sujet.corps} /><Traduction texte={sujet.corps} locale={locale} /></TexteRepliable>
          </div>

          {/* Ligne méta façon X (date + temps de lecture). */}
          <p className="mt-3 flex flex-wrap items-center gap-x-1 text-xs tabular-nums text-cx-muted-fg">
            <time suppressHydrationWarning>{DATE.format(sujet.createdAt)}</time>
            <span aria-hidden>·</span>
            <span>{formatDureeLecture(sujet.corps)} de lecture</span>
          </p>
        </div>

        {/* Barre d'actions façon X : équirépartition sous le sujet. */}
        <div className="mt-2 flex max-w-[30rem] items-center justify-between gap-1 pl-[52px]">
          <Link
            href="#repondre"
            className="inline-flex min-h-[33px] items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-cx-muted-fg transition hover:bg-cx-primary/10 hover:text-cx-primary"
          >
            <Icone nom="forum" className="size-4" />
            <span className="tabular-nums">{sujet.replies.length}</span>
          </Link>
          <BoutonVote postId={postId} initialVote={sujet.userVote} initialScore={sujet.score} connecte={userId !== null} variante="action" />
          <BoutonRepost postId={postId} initial={etatRepost} connecte={userId !== null} variante="action" />
          <BoutonLike postId={postId} connecte={userId !== null} likedByMe={likedByMe} compteur={sujet._count.likes} variante="action" />
          <BoutonFavori kind="post" targetId={postId} initial={favoriDuSujet} connecte={userId !== null} variante="action" />
          <BoutonPartager path={`/forum/${postId}`} />
          <BoutonSignaler kind="post" targetId={postId} libelle="" />
        </div>

        {/* Réactions (charte) : pastilles, sous la barre d'actions. */}
        <div className="mt-3 rounded-xl border border-cx-border bg-cx-card/60 px-4 py-3">
          <BarreReactions
            kind="post"
            targetId={postId}
            initial={sujet.reactions}
            connecte={userId !== null}
          />
        </div>
      </article>

      <section id="repondre" className="flex scroll-mt-16 flex-col gap-4 border-t border-cx-border pt-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-cx-muted-fg">
          {sujet.replies.length === 0
            ? t(locale, "forum.answers_zero")
            : sujet.replies.length === 1
              ? t(locale, "forum.answers_one")
              : `${sujet.replies.length} ${t(locale, "forum.answers_many")}`}
        </h2>

        {/* Boîte de réponse juste sous le sujet (façon X). */}
        <div className="rounded-2xl border border-cx-border bg-cx-card/40 px-4 py-3">
          {userId === null ? (
            <p className="text-sm text-cx-muted-fg">
              <Link href="/connexion" className="font-semibold text-cx-primary underline-offset-4 hover:underline">
                {t(locale, "auth.login_link")}
              </Link>{" "}
              pour répondre à ce sujet.
            </p>
          ) : (
            <FormulaireReponse postId={postId} />
          )}
        </div>

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
            locale={locale}
          />
        )}
      </section>
      </div>

      {/* Rail façon X : tendances. */}
      <aside className="hidden lg:sticky lg:top-6 lg:self-start lg:block">
        <Tendances limite={6} />
      </aside>
    </div>
  );
}
