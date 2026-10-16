import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/button";
import { localeCourante, t } from "@/lib/i18n";
import { getSessionUserId } from "@/lib/session";
import VisuelAccueil from "@/components/visuel-accueil";
import Avatar from "@/components/avatar";
import CarteSujet from "@/components/carte-sujet";
import CompteurAnime from "@/components/compteur-anime";
import { topHashtags } from "@/lib/hashtags";
import { listPosts } from "@/lib/forum";
import { Icone } from "@/components/icones";

const ICONES = [
  <path key="f" d="M5 6h14M5 12h10M5 18h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  <path key="j" d="M3 7h18v13H3zM8 7V4h8v3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  <path key="p" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  <path key="a" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  <path key="t" d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  <path key="e" d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" strokeWidth="2" />,
];

const SECTIONS = [
  { href: "/forum", cle: "nav.forum", descFr: "Discute avec des devs qui savent.", descEn: "Talk with developers who know." },
  { href: "/jobs", cle: "nav.jobs", descFr: "Offres remote ou sur place.", descEn: "Remote or onsite jobs." },
  { href: "/projets", cle: "nav.projects", descFr: "Lance et recrute.", descEn: "Start and recruit." },
  { href: "/annuaire", cle: "nav.directory", descFr: "Trouve ton prochain co-dev.", descEn: "Find your next dev." },
  { href: "/tutos", cle: "nav.tutorials", descFr: "Articles courts et pratiques.", descEn: "Short, practical posts." },
  { href: "/evenements", cle: "nav.events", descFr: "Meetups et hackathons.", descEn: "Meetups & hackathons." },
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const userId = await getSessionUserId();
  const membres = await prisma.user.count();
  const me = userId !== null ? await prisma.user.findUnique({ where: { id: userId }, select: { nom: true, slug: true } }) : null;
  const [posts, projets, evenements, membresRecents, feedReddit] = await Promise.all([
    prisma.post.count(),
    prisma.project.count(),
    prisma.event.count(),
    prisma.user.findMany({ take: 8, orderBy: { createdAt: "desc" }, select: { id: true, nom: true, slug: true, avatar: true } }),
    listPosts({ page: 1, pageSize: 10, tri: "hot", userId: userId == null ? undefined : userId }),
  ]);
  const [dernieres, prochainEvenement, tendances] = await Promise.all([
    prisma.reply.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { nom: true, slug: true } },
        post: { select: { id: true, titre: true } },
      },
    }),
    prisma.event.findFirst({
      where: { date: { gte: new Date() } },
      orderBy: { date: "asc" },
    }),
    topHashtags(6),
  ]);

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

  const locale = await localeCourante();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Hero compact (sobre, coût zéro). */}
      <section className="relative overflow-hidden rounded-3xl border border-cx-border bg-slate-950 px-6 py-10 text-white shadow-xl sm:py-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle at 22% 18%, rgba(255,255,255,.14) 1px, transparent 1px), radial-gradient(circle at 78% 72%, rgba(255,255,255,.10) 1px, transparent 1px)",
            backgroundSize: "26px 26px, 34px 34px",
          }}
        />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
              {me ? `👋 ${me.nom}` : t(locale, "home.badge")}
            </p>
            <h1 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              La communauté africaine des devs, <span className="text-orange-400">à portée de main</span>.
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
              {t(locale, "home.hero_sub")}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="accent" href="/inscription">
                Créer un compte
              </Button>
              <Button variant="ghost" href="/forum">
                Explorer le fil
              </Button>
            </div>
          </div>
          {membresRecents.length > 0 ? (
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {membresRecents.slice(0, 6).map((m) => (
                  <Link key={m.id} href={`/membres/${m.slug}`} className="ring-2 ring-white/20">
                    <Avatar slug={m.slug} nom={m.nom} avatar={m.avatar ?? undefined} />
                  </Link>
                ))}
              </div>
              <p className="text-sm text-slate-200">
                <span className="font-bold tabular-nums text-orange-400">{membres}</span> membres actifs
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {/* Fil façon Reddit. */}
      <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-cx-border pb-2">
            <div className="flex flex-wrap gap-1">
              <Link href="/forum" className="rounded-full bg-cx-primary px-3 py-1 text-xs font-semibold text-cx-primary-fg">
                Accueil
              </Link>
              <Link href="/forum?tri=hot" className="rounded-full px-3 py-1 text-xs font-semibold text-cx-muted-fg transition hover:bg-cx-muted">
                Tendance
              </Link>
              <Link href="/forum?tri=new" className="rounded-full px-3 py-1 text-xs font-semibold text-cx-muted-fg transition hover:bg-cx-muted">
                Nouveau
              </Link>
              <Link href="/forum?tri=top" className="rounded-full px-3 py-1 text-xs font-semibold text-cx-muted-fg transition hover:bg-cx-muted">
                Top
              </Link>
            </div>
            <Link href="/forum/nouveau" className="inline-flex items-center gap-1.5 rounded-full bg-cx-accent px-3 py-1 text-xs font-bold text-cx-accent-fg hover:opacity-90 active:scale-[0.97]">
              <Icone nom="plus" className="size-3.5" />
              Sujet
            </Link>
          </div>
          <ul className="space-y-3">
            {feedReddit.items.map((sujet, index) => (
              <li key={sujet.id} className="animate-fade-up" style={{ animationDelay: `${index * 55}ms` }}>
                <CarteSujet sujet={sujet} locale={locale} connecte={userId !== null} />
              </li>
            ))}
          </ul>
          <div className="mt-6 text-center">
            <Link href="/forum" className="inline-flex rounded-full border border-cx-border px-4 py-2 text-sm text-cx-muted-fg hover:bg-cx-muted">
              Voir tout le fil →
            </Link>
          </div>
        </div>

        <aside className="sticky top-24 hidden space-y-4 self-start lg:block">
          <div className="rounded-2xl border border-cx-border bg-cx-card/60 p-4">
            <p className="text-sm font-bold">Créer un sujet</p>
            <p className="mt-1 text-xs text-cx-muted-fg">Partage un retour, demande de l'aide, trouve des contributeurs.</p>
            <Link
              href="/forum/nouveau"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-cx-accent px-4 py-2 text-sm font-bold text-cx-accent-fg hover:opacity-90 active:scale-[0.97]"
            >
              <Icone nom="plus" className="size-4" />
              Écrire un sujet
            </Link>
          </div>
          <div className="rounded-2xl border border-cx-border bg-cx-card/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-cx-muted-fg">
              Communautés tendances
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {tendances.map((trend) => (
                <Link
                  key={trend.tag}
                  href={`/forum?tag=${encodeURIComponent(trend.tag)}`}
                  className="rounded-full bg-cx-primary/5 px-2.5 py-0.5 text-xs font-semibold text-cx-primary hover:bg-cx-primary/10"
                >
                  c/{trend.tag}
                </Link>
              ))}
            </div>
          </div>
          {userId !== null && sujetsPourToi.length > 0 ? (
            <div className="rounded-2xl border border-cx-border bg-cx-card/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-cx-muted-fg">
                Pour toi
              </p>
              <ul className="mt-2 space-y-2 text-sm">
                {sujetsPourToi.slice(0, 4).map((s) => (
                  <li key={s.id}>
                    <Link href={`/forum/${s.id}`} className="block text-sm text-cx-muted-fg hover:text-cx-primary">
                      {s.titre}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {prochainEvenement && (
            <div className="rounded-2xl border border-cx-border bg-cx-card/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-cx-muted-fg">Prochain événement</p>
              <p className="mt-1 text-sm font-bold">{prochainEvenement.titre}</p>
              <p className="mt-1 text-xs text-cx-muted-fg">
                {prochainEvenement.format} · {prochainEvenement.date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              </p>
            </div>
          )}
          <div className="rounded-2xl border border-cx-border bg-cx-card/60 p-4 text-xs text-cx-muted-fg">
            <p className="font-bold text-cx-fg">CodeXchange</p>
            <p className="mt-1">{membres} membres · {posts} sujets · {projets} projets</p>
            <p className="mt-2">Par les devs, pour les devs.</p>
          </div>
        </aside>
      </section>

      {/* Compteurs. */}
      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Membres", membres],
          ["Sujets", posts],
          ["Projets", projets],
          ["Événements", evenements],
        ].map(([label, valeur]) => (
          <div key={label as string} className="rounded-xl border border-cx-border bg-cx-card px-4 py-3 text-center">
            <p className="text-2xl font-black text-cx-primary tabular-nums">
              <CompteurAnime value={valeur as number} />
            </p>
            <p className="text-xs text-cx-muted-fg">{label}</p>
          </div>
        ))}
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