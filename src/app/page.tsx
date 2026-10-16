import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/button";
import { localeCourante, t } from "@/lib/i18n";
import { getSessionUserId } from "@/lib/session";
import VisuelAccueil from "@/components/visuel-accueil";

const ICONES = [
  <path key="f" d="M5 6h14M5 12h10M5 18h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  <path key="j" d="M3 7h18v13H3zM8 7V4h8v3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  <path key="p" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  <path key="a" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  <path key="t" d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  <path key="e" d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" strokeWidth="2" />,
];

const SECTIONS = [
  { href: "/forum", cle: "nav.forum", descFr: "Pose tes questions, partage tes retours, discute avec des devs qui savent.", descEn: "Ask questions, share feedback, and talk with developers who know." },
  { href: "/jobs", cle: "nav.jobs", descFr: "CDI, freelance, stages — remote ou sur place en Afrique.", descEn: "Full-time, freelance, internships — remote or onsite across Africa." },
  { href: "/projets", cle: "nav.projects", descFr: "Lance un projet et recrute ses premiers co-fondateurs.", descEn: "Start a project and recruit its first co-founders." },
  { href: "/annuaire", cle: "nav.directory", descFr: "Trouve un profil, un mentor, un prochain co-fondateur.", descEn: "Find a profile, a mentor, your next co-founder." },
  { href: "/tutos", cle: "nav.tutorials", descFr: "Des articles courts et pratiques par la communauté.", descEn: "Short, practical articles from the community." },
  { href: "/evenements", cle: "nav.events", descFr: "Meetups et hackathons : confirme ta présence.", descEn: "Meetups and hackathons: confirm you'll be there." },
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const userId = await getSessionUserId();
  const membres = await prisma.user.count();

  let sujetsPourToi: { id: number; titre: string; tags: string }[] = [];
  if (userId !== null) {
    const follows = await prisma.tagFollow.findMany({ where: { userId }, select: { tag: true } });
    const tagsSuivis = follows.map((f) => f.tag);
    if (tagsSuivis.length > 0) {
      sujetsPourToi = (await prisma.post.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        select: { id: true, titre: true, tags: true },
      })).filter((p) =>
        p.tags.split(",").map((t) => t.trim().toLowerCase()).some((tag) => tagsSuivis.includes(tag)),
      ).slice(0, 3);
    } else {
      const moi = await prisma.user.findUnique({ where: { id: userId }, select: { pays: true } });
      if (moi?.pays) {
        sujetsPourToi = await prisma.post.findMany({
          take: 3,
          orderBy: { createdAt: "desc" },
          where: { author: { pays: moi.pays } },
          select: { id: true, titre: true, tags: true },
        });
      }
    }
  }

  const derniersSujets = await prisma.post.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
    select: { id: true, titre: true, tags: true },
  });

  const locale = await localeCourante();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero : deux colonnes dès `lg` (texte à gauche, visuel à droite). */}
      <section className="py-12 sm:py-20">
        <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-12">
          <div className="text-center lg:text-left">
            <p className="inline-flex rounded-full border border-cx-border bg-cx-card px-3 py-1 text-xs font-semibold text-cx-muted-fg">
              {t(locale, "home.badge")}
            </p>
            <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight sm:text-6xl">
              {t(locale, "home.hero_prefix")}{" "}
              <span className="text-cx-primary">{t(locale, "home.hero_highlight")}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-cx-muted-fg lg:mx-0">
              {t(locale, "home.hero_sub")}
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              {/* L'unique action accentuée de la vue. */}
              <Button variant="accent" href="/inscription">
                {t(locale, "home.cta_join")}
              </Button>
              <Button variant="ghost" href="/forum">
                {t(locale, "home.cta_forum")}
              </Button>
            </div>
            <p className="mt-6 text-sm tabular-nums text-cx-muted-fg">
              {membres} {t(locale, "home.stats")}
            </p>
          </div>
          <VisuelAccueil />
        </div>
      </section>

      {/* Sections */}
      <section className="mt-6">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t(locale, "home.sections_title")}
        </h2>
        <p className="mt-2 max-w-2xl text-cx-muted-fg">
          {t(locale, "home.sections_sub")}
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s, index) => (
            <Link
              key={s.href}
              href={s.href}
              className="group rounded-xl border border-cx-border bg-cx-card p-5 transition hover:-translate-y-0.5 hover:border-cx-primary/60 hover:shadow-sm"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-7 text-cx-primary"
                aria-hidden="true"
              >
                {ICONES[index]}
              </svg>
              <h3 className="mt-3 text-lg font-semibold">{t(locale, s.cle)}</h3>
              <p className="mt-1 text-sm text-cx-muted-fg">{locale === "en" ? s.descEn : s.descFr}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Derniers sujets */}
      {derniersSujets.length > 0 ? (
        <section className="mt-12">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t(locale, "home.latest_title")}
            </h2>
            <Link
              href="/forum"
              className="text-sm font-semibold text-cx-primary hover:underline"
            >
              {t(locale, "home.cta_forum")}
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

      {userId !== null && sujetsPourToi.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Pour toi
          </h2>
          <p className="mt-2 text-cx-muted-fg">
            Sujets postés par des développeurs de ton pays.
          </p>
          <ul className="mt-4 divide-y divide-cx-border rounded-xl border border-cx-border bg-cx-card">
            {sujetsPourToi.map((s) => (
              <li key={s.id}>
                <Link href={`/forum/${s.id}`} className="block px-4 py-3 text-sm hover:bg-cx-muted">
                  <span className="font-medium">{s.titre}</span>
                  {s.tags ? <span className="ml-2 text-cx-muted-fg">· {s.tags}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* CTA */}
      <section className="mx-auto mt-16 max-w-3xl rounded-xl border border-cx-border bg-cx-card px-6 py-12 text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t(locale, "home.cta_join_title")}
        </h2>
        <p className="mt-3 text-cx-muted-fg">
          {t(locale, "home.cta_join_sub")}
        </p>
        <div className="mt-6">
          <Button variant="primary" href="/inscription">
            {t(locale, "home.cta_join")}
          </Button>
        </div>
      </section>
    </div>
  );
}
