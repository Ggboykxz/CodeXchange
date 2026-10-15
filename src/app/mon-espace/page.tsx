import Link from "next/link";
import { redirect } from "next/navigation";
import Avatar from "@/components/avatar";
import { localeCourante, t } from "@/lib/i18n";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon activité" };

type Props = { searchParams: Promise<{ onglet?: string }> };

const ONGLETS = ["sujets", "candidatures", "projets", "favoris"] as const;
type Onglet = (typeof ONGLETS)[number];

export default async function PageMonEspace({ searchParams }: Props) {
  const userId = await getSessionUserId();
  if (userId === null) redirect("/connexion");

  const params = await searchParams;
  const onglet: Onglet = ONGLETS.includes(params.onglet as Onglet) ? (params.onglet as Onglet) : "sujets";
  const locale = await localeCourante();

  const [membre, mesSujets, mesCandidatures, mesProjets, mesFavoris] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { nom: true, slug: true, titre: true, avatar: true },
    }),
    prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        titre: true,
        createdAt: true,
        _count: { select: { replies: true, likes: true } },
      },
    }),
    prisma.application.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        createdAt: true,
        job: { select: { id: true, titre: true, entreprise: true, pays: true } },
      },
    }),
    prisma.project.findMany({
      where: { OR: [{ authorId: userId }, { membres: { some: { userId } } }] },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        titre: true,
        authorId: true,
        _count: { select: { membres: true } },
      },
    }),
    prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { kind: true, targetId: true },
    }),
  ]);

  if (!membre) redirect("/connexion");

  const compteFavoris = mesFavoris.length;

  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar slug={membre.slug} nom={membre.nom} taille="lg" avatar={membre.avatar || undefined} />
          <div>
            <h1 className="text-3xl font-black tracking-tight">{t(locale, "activity.title")}</h1>
            <p className="mt-1 text-sm text-cx-muted-fg">
              {membre.nom} · {membre.titre}
            </p>
          </div>
        </div>
        <Link href={`/membres/${membre.slug}`} className="text-sm font-medium text-cx-primary hover:underline">
          {t(locale, "profile.public")}
        </Link>
      </header>

      <nav aria-label="Sections" className="flex flex-wrap gap-2 border-b border-cx-border pb-3">
        {ONGLETS.map((valeur) => (
          <Link
            key={valeur}
            href={`/mon-espace?onglet=${valeur}`}
            aria-current={onglet === valeur ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              onglet === valeur
                ? "bg-cx-primary text-cx-primary-fg"
                : "text-cx-muted-fg hover:bg-cx-muted"
            }`}
          >
            {t(locale, `activity.tab_${valeur}`)}
          </Link>
        ))}
      </nav>

      {onglet === "sujets" ? (
        mesSujets.length === 0 ? (
          <p className="rounded-xl border border-dashed border-cx-border px-5 py-10 text-center text-sm text-cx-muted-fg">
            {t(locale, "activity.no_posts")}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {mesSujets.map((sujet) => (
              <li key={sujet.id}>
                <Link
                  href={`/forum/${sujet.id}`}
                  className="block rounded-xl border border-cx-border bg-cx-card px-5 py-4 transition hover:border-cx-primary/60"
                >
                  <h2 className="font-semibold leading-snug">{sujet.titre}</h2>
                  <p className="mt-1 text-xs text-cx-muted-fg">
                    {sujet._count.replies} {t(locale, "forum.answers_many")} · {sujet._count.likes} ·
                    {" "}
                    {new Date(sujet.createdAt).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {onglet === "candidatures" ? (
        mesCandidatures.length === 0 ? (
          <p className="rounded-xl border border-dashed border-cx-border px-5 py-10 text-center text-sm text-cx-muted-fg">
            {t(locale, "activity.no_applications")}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {mesCandidatures.map((candidature) => (
              <li key={`${candidature.job.id}-${candidature.createdAt.toISOString()}`}>
                <Link
                  href={`/jobs/${candidature.job.id}`}
                  className="block rounded-xl border border-cx-border bg-cx-card px-5 py-4 transition hover:border-cx-primary/60"
                >
                  <h2 className="font-semibold leading-snug">{candidature.job.titre}</h2>
                  <p className="mt-1 text-xs text-cx-muted-fg">
                    {candidature.job.entreprise} · {candidature.job.pays} ·{" "}
                    {new Date(candidature.createdAt).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {onglet === "projets" ? (
        mesProjets.length === 0 ? (
          <p className="rounded-xl border border-dashed border-cx-border px-5 py-10 text-center text-sm text-cx-muted-fg">
            {t(locale, "activity.no_projects")}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {mesProjets.map((projet) => (
              <li key={projet.id}>
                <Link
                  href={`/projets/${projet.id}`}
                  className="block rounded-xl border border-cx-border bg-cx-card px-5 py-4 transition hover:border-cx-primary/60"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-semibold leading-snug">{projet.titre}</h2>
                    <span className="shrink-0 rounded-full bg-cx-muted px-2.5 py-0.5 text-xs font-semibold text-cx-muted-fg">
                      {projet.authorId === userId ? t(locale, "projects.owner") : t(locale, "projects.joined")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-cx-muted-fg">
                    {projet._count.membres}{" "}
                    {projet._count.membres > 1
                      ? t(locale, "projects.members_many")
                      : t(locale, "projects.members_one")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {onglet === "favoris" ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-cx-muted-fg">
            {compteFavoris === 0
              ? t(locale, "favorites.none")
              : `${compteFavoris} ${t(locale, "favorites.count_many")}`}
          </p>
          <Link
            href="/favoris"
            className="self-start rounded-lg border border-cx-border bg-cx-card px-4 py-2 text-sm font-medium hover:bg-cx-muted"
          >
            {t(locale, "nav.favorites")} →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
