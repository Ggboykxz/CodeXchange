import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/button";

const sections = [
  {
    href: "/forum",
    titre: "Forum",
    desc: "Pose tes questions, partage tes retours, discute avec des devs qui savent.",
    icon: (
      <path
        d="M5 6h14M5 12h10M5 18h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    ),
  },
  {
    href: "/jobs",
    titre: "Emplois & missions",
    desc: "CDI, freelance, stages — remote ou sur place en Afrique.",
    icon: (
      <path
        d="M3 7h18v13H3zM8 7V4h8v3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/projets",
    titre: "Projets",
    desc: "Lance un projet et recrute ses premiers co-fondateurs.",
    icon: (
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/annuaire",
    titre: "Annuaire",
    desc: "Trouve un dev par pays, par stack, ou par ville.",
    icon: (
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    ),
  },
  {
    href: "/tutos",
    titre: "Tutos",
    desc: "Guides courts, écrits par des devs pour des devs.",
    icon: (
      <path
        d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    ),
  },
  {
    href: "/evenements",
    titre: "Événements & mentorat",
    desc: "Meetups, ateliers, et mentors prêts à te guider.",
    icon: (
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    ),
  },
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [membres, sujets, offres] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.job.count(),
  ]);
  const derniersSujets = await prisma.post.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
    select: { id: true, titre: true, tags: true },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="py-12 text-center sm:py-20">
        <p className="inline-flex rounded-full border border-cx-border bg-cx-card px-3 py-1 text-xs font-semibold text-cx-muted-fg">
          Fait par des devs africains, pour des devs africains
        </p>
        <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight sm:text-6xl">
          CodeXchange — la plateforme des{" "}
          <span className="text-cx-primary">développeurs africains</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-cx-muted-fg">
          Pose une question sur le forum, trouve une mission, recrute des
          co-fondateurs, découvre des mentors et des événements locaux. Tout en
          français, sur mobile.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button variant="primary" href="/inscription">
            Rejoindre la communauté
          </Button>
          <Button variant="ghost" href="/forum">
            Parcourir le forum →
          </Button>
        </div>
        <p className="mt-6 text-sm text-cx-muted-fg">
          {membres} membres · {sujets} sujets · {offres} offres en ligne
        </p>
      </section>

      {/* Sections */}
      <section className="mt-6">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Tout ce dont tu as besoin
        </h2>
        <p className="mt-2 max-w-2xl text-cx-muted-fg">
          Six espaces, un seul compte. Conçu pour la démo sur mobile.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group rounded-xl border border-cx-border bg-cx-card p-5 transition hover:-translate-y-0.5 hover:border-cx-primary/60 hover:shadow-sm"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7 text-cx-primary"
                aria-hidden="true"
              >
                {s.icon}
              </svg>
              <h3 className="mt-3 text-lg font-semibold">{s.titre}</h3>
              <p className="mt-1 text-sm text-cx-muted-fg">{s.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Derniers sujets */}
      {derniersSujets.length > 0 ? (
        <section className="mt-12">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Derniers sujets
            </h2>
            <Link
              href="/forum"
              className="text-sm font-semibold text-cx-primary hover:underline"
            >
              Tout voir →
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-cx-border rounded-xl border border-cx-border bg-cx-card">
            {derniersSujets.map((s) => (
              <li key={s.id}>
                <Link href={`/forum/${s.id}`} className="block px-4 py-3 text-sm hover:bg-cx-muted">
                  <span className="font-medium">{s.titre}</span>
                  {s.tags ? (
                    <span className="ml-2 text-cx-muted-fg">· {s.tags}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* CTA */}
      <section className="mx-auto mt-16 max-w-3xl rounded-2xl border border-cx-border bg-cx-card px-6 py-12 text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Rejoins les bâtisseurs africains
        </h2>
        <p className="mt-3 text-cx-muted-fg">
          Gratuit, en français, sur mobile. Ton premier sujet ou ton premier
          projet en moins de deux minutes.
        </p>
        <div className="mt-6">
          <Button variant="accent" href="/inscription">
            Créer mon compte
          </Button>
        </div>
      </section>
    </div>
  );
}
