import Link from "next/link";
import Avatar from "@/components/avatar";
import Pagination from "@/components/pagination";
import { drapeau } from "@/lib/drapeaux";
import { normalizePage } from "@/lib/pagination";
import { localeCourante, t } from "@/lib/i18n";
import { listMentors, type MentorResume } from "@/lib/mentorat";
import { getSessionUserId } from "@/lib/session";
import FormulaireMentorat from "./formulaire-mentorat";

export const metadata = { title: "Mentorat" };

/** Lien discret vers les autres rubriques créées par la Task 8. */
/** Carte d'un mentor : avatar, titre, ville/pays, bio, stack, lien profil. */
function CarteMentor({ mentor }: { mentor: MentorResume }) {
  return (
    <li className="rounded-xl border border-[var(--cx-muted)]/25 px-5 py-4 transition hover:border-[var(--cx-accent)]/60">
      <div className="flex items-start gap-4">
        <Avatar slug={mentor.slug} nom={mentor.nom} avatar={mentor.avatar || undefined} />
        <div className="min-w-0">
          <Link href={`/membres/${mentor.slug}`}>
            <h2 className="truncate text-lg font-semibold leading-snug hover:text-[var(--cx-accent)]">
              {mentor.nom}
            </h2>
          </Link>
          <p className="truncate text-sm text-[var(--cx-muted)]">{mentor.titre}</p>
          <p className="mt-1 text-xs text-[var(--cx-muted)]">
            {drapeau(mentor.pays)} {mentor.ville}, {mentor.pays}
          </p>

          {mentor.bio && (
            <p className="mt-2 text-sm leading-relaxed text-[var(--cx-muted)]">{mentor.bio}</p>
          )}

          {mentor.stack.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {mentor.stack.map((technologie) => (
                <li
                  key={technologie}
                  className="rounded-full bg-[var(--cx-accent)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--cx-accent)]"
                >
                  {technologie}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}

type Props = { searchParams: Promise<{ page?: string }> };

/** /mentorat — cartes des mentors + formulaire « demander un mentorat ». */
export default async function PageMentorat({ searchParams }: Props) {
  const params = await searchParams;
  const page = normalizePage(params.page);
  const [resultat, userId, locale] = await Promise.all([
    listMentors({ page, pageSize: 12 }),
    getSessionUserId(),
    localeCourante(),
  ]);

  const mentors = resultat.items;
  const totalPages = resultat.totalPages;
  const pageActuelle = resultat.page;

  // Le membre connecté ne peut pas se demander lui-même : on le masque du choix.
  const choix = mentors
    .filter((mentor) => mentor.id !== userId)
    .map((mentor) => ({ id: mentor.id, nom: mentor.nom }));

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t(locale, "mentorship.title")}</h1>
          <p className="mt-1 text-sm text-[var(--cx-muted)]">
            {t(locale, "mentorship.subtitle")}
          </p>
        </div>
      </header>

      <FormulaireMentorat mentors={choix} connecte={userId !== null} />

      {mentors.length === 0 ? (
        <section className="rounded-xl border border-[var(--cx-muted)]/25 px-6 py-12 text-center">
          <p className="text-lg font-semibold">{t(locale, "mentorship.empty_title")}</p>
          <p className="mt-2 text-sm text-[var(--cx-muted)]">
            {t(locale, "mentorship.empty_desc")}
          </p>
          <Link
            href="/inscription"
            className="mt-5 inline-block rounded-lg bg-[var(--cx-accent)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            {t(locale, "auth.register_link")}
          </Link>
        </section>
      ) : (
        <>
          <h2 className="text-lg font-semibold">
            {mentors.length} {mentors.length > 1 ? t(locale, "nav.mentorship") : t(locale, "nav.mentorship")}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {mentors.map((mentor) => (
              <CarteMentor key={mentor.id} mentor={mentor} />
            ))}
          </ul>
        </>
      )}

      <Pagination
        page={pageActuelle}
        totalPages={totalPages}
        basePath="/mentorat"
      />
    </div>
  );
}
