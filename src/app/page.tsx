import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/button";
import { localeCourante, t } from "@/lib/i18n";
import { getSessionUserId } from "@/lib/session";
import VisuelAccueil from "@/components/visuel-accueil";
import Avatar from "@/components/avatar";
import { topHashtags } from "@/lib/hashtags";
import { listPosts } from "@/lib/forum";
import { parcoursUtilisateur } from "@/lib/parcours";
import ParcoursDev from "@/components/parcours-dev";
import Composeur from "@/components/composeur";
import SelecteurTri from "@/components/selecteur-tri";
import FilAccueil from "@/components/fil-accueil";
import { Icone } from "@/components/icones";



export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ tri?: string }> }) {
  const paramsTri = await searchParams;
  const triDemande = paramsTri.tri;
  const tri: "hot" | "new" | "top" | "recent" | "populaire" =
    triDemande === "new" || triDemande === "top" || triDemande === "recent" || triDemande === "populaire"
      ? triDemande
      : "hot";
  const userId = await getSessionUserId();
  const membres = await prisma.user.count();
  const me = userId !== null ? await prisma.user.findUnique({ where: { id: userId }, select: { nom: true, slug: true, avatar: true } }) : null;
  const [posts, projets, membresRecents, feedReddit] = await Promise.all([
    prisma.post.count(),
    prisma.project.count(),
    prisma.user.findMany({ take: 8, orderBy: { createdAt: "desc" }, select: { id: true, nom: true, slug: true, avatar: true } }),
    listPosts({ page: 1, pageSize: 10, tri, userId: userId == null ? undefined : userId }),
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
  const parcours = await parcoursUtilisateur(userId);

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
            <p className="mt-3 max-w-[60ch] text-sm text-slate-300 sm:text-base">
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
                <span className="font-bold tabular-nums text-orange-400">{membres}</span> membres
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {/* Visuel signature (desktop) : la carte membre + la conversation tendance,
          alimentées par les vraies données (réponses récentes, hashtags). */}
      <div className="mt-8 hidden justify-center lg:flex">
        <VisuelAccueil
          membres={membresRecents.slice(0, 4).map((m) => ({ slug: m.slug, nom: m.nom, avatar: m.avatar }))}
          tendance={tendances[0]?.tag}
          conversation={
            dernieres[0]
              ? {
                  titre: dernieres[0].post.titre,
                  auteur: dernieres[0].author.nom,
                  extrait: dernieres[0].corps.replace(/\s+/g, " ").slice(0, 96),
                }
              : undefined
          }
        />
      </div>

      {/* Parcours — jauge masquée pour les visiteurs anonymes (zéro « 0 % »
          culpabilisant : le hero et le fil font office d'invitation). */}
      {userId !== null ? <ParcoursDev etapes={parcours} /> : null}
      <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,600px)_minmax(0,320px)] lg:justify-center">
        <div className="flex min-w-0 flex-col">
          <Composeur locale={locale} connecte={userId !== null} me={me} />
          <div className="sticky top-0 z-10 mt-4 bg-cx-bg/85 backdrop-blur">
            <SelecteurTri
              basePath="/"
              params={{}}
              actuelle={tri}
              options={[
                { valeur: "hot", cle: "hot" },
                { valeur: "new", cle: "new" },
                { valeur: "top", cle: "top" },
              ]}
              libelles={{
                tri: t(locale, "sort.label"),
                hot: t(locale, "sort.hot"),
                new: t(locale, "sort.new"),
                top: t(locale, "sort.top"),
              }}
            />
          </div>
          <FilAccueil items={feedReddit.items} locale={locale} connecte={userId !== null} />
          <div className="mt-4 text-center lg:hidden">
            <Link href="/forum" className="inline-flex rounded-full border border-cx-border px-4 py-2 text-sm text-cx-muted-fg hover:bg-cx-muted">
              Voir tout le fil →
            </Link>
          </div>
        </div>

        <aside className="sticky top-24 hidden space-y-4 self-start lg:block">
          <div className="rounded-2xl border border-cx-border bg-cx-card/60 p-4">
            <p className="text-sm font-bold">Créer un sujet</p>
            <p className="mt-1 text-xs text-cx-muted-fg">Partage un retour, demande de l’aide, trouve des contributeurs.</p>
            <Link
              href="/forum/nouveau"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-cx-primary px-4 py-2 text-sm font-bold text-cx-primary-fg hover:opacity-90 active:scale-[0.97]"
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