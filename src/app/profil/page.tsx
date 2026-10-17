import Link from "next/link";
import { redirect } from "next/navigation";
import Avatar from "@/components/avatar";
import LogoTechno from "@/components/logo-techno";
import { drapeau } from "@/lib/drapeaux";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import FormulaireAvatar from "./formulaire-avatar";
import ParcoursDev from "@/components/parcours-dev";
import { parcoursUtilisateur } from "@/lib/parcours";
import { localeCourante, t } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon profil" };

export default async function PageProfil() {
  const userId = await getSessionUserId();
  if (userId === null) redirect("/connexion");

  const membre = await prisma.user.findUnique({
    where: { id: userId },
    select: { nom: true, slug: true, titre: true, ville: true, pays: true, bio: true, avatar: true, stack: true, role: true, github: true, linkedin: true, site: true },
  });
  if (!membre) redirect("/connexion");
  const postsDuMembre = await prisma.post.findMany({ where: { authorId: userId }, select: { id: true, titre: true }, orderBy: { createdAt: "desc" }, take: 1 });
  const postEpingle = postsDuMembre[0] ?? null;
  const karma = (await prisma.like.aggregate({ _sum: { valeur: true }, where: { postId: { in: postsDuMembre.map((p) => p.id) } } }))._sum.valeur ?? 0;
  const [postsCreations, reponsesCrees, reactionsDonnees, favorisSauves] = await Promise.all([
    prisma.post.count({ where: { authorId: userId } }),
    prisma.reply.count({ where: { authorId: userId } }),
    prisma.reaction.count({ where: { userId } }),
    prisma.favorite.count({ where: { userId } }),
  ]);
  const locale = await localeCourante();
  const parcours = await parcoursUtilisateur(userId);

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-black tracking-tight">{t(locale, "profile.title")}</h1>

      <section className="overflow-hidden rounded-2xl border border-cx-border">
        {/* Bannière déterministe à partir du slug (pas de champ supplémentaire). */}
        <div
          className="h-32 w-full bg-cx-primary/10"
          aria-hidden
        />
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-end sm:gap-5">
          <div className="-mt-12 shrink-0">
            <Avatar slug={membre.slug} nom={membre.nom} taille="lg" avatar={membre.avatar || undefined} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xl font-bold">{membre.nom}</p>
            <p className="text-sm text-cx-muted-fg">@{membre.slug}</p>
            <p className="text-sm text-cx-muted-fg">
              {membre.titre} · {drapeau(membre.pays)} {membre.ville}, {membre.pays}
            </p>
            <p className="text-sm text-cx-muted-fg">Karma : {karma}</p>
          </div>
        </div>
        <div className="px-5 pb-5">
          <FormulaireAvatar avatarActuel={membre.avatar} />
        </div>
      </section>

      {(membre.github || membre.linkedin || membre.site) ? (
        <section className="rounded-xl border border-cx-border px-5 py-5 text-sm">
          <h2 className="font-semibold">Liens</h2>
          <ul className="mt-2 flex flex-wrap gap-3">
            {membre.github ? (
              <li>
                <a href={membre.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cx-primary hover:underline">
                  GitHub
                </a>
              </li>
            ) : null}
            {membre.linkedin ? (
              <li>
                <a href={membre.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cx-primary hover:underline">
                  LinkedIn
                </a>
              </li>
            ) : null}
            {membre.site ? (
              <li>
                <a href={membre.site} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cx-primary hover:underline">
                  Site web
                </a>
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}

      {postEpingle ? (
        <section className="rounded-xl border border-cx-border px-5 py-5 text-sm">
          <h2 className="font-semibold">Sujet épinglé</h2>
          <Link href={`/forum/${postEpingle.id}`} className="mt-2 block font-medium text-cx-primary hover:underline">
            {postEpingle.titre}
          </Link>
        </section>
      ) : null}

      <section className="rounded-xl border border-cx-border px-5 py-5 text-sm">
        <h2 className="font-semibold">{t(locale, "profile.bio")}</h2>
        <p className="mt-2 whitespace-pre-line text-cx-muted-fg">
          {membre.bio || t(locale, "profile.bio_empty")}
        </p>
      </section>

      <ParcoursDev etapes={parcours} />

      <section className="rounded-xl border border-cx-border px-5 py-5 text-sm">
        <h2 className="font-semibold">{t(locale, "profile.stack")}</h2>
        {membre.stack.trim() ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {membre.stack.split(",").map((tech) => tech.trim()).filter(Boolean).map((tech) => (
              <li
                key={tech}
                className="inline-flex items-center gap-1 rounded-full bg-cx-primary/5 px-2.5 py-0.5 text-xs font-semibold text-cx-primary"
              >
                <LogoTechno nom={tech} className="size-3.5" />
                {tech}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-cx-muted-fg">{t(locale, "profile.stack_empty")}</p>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Sujets créés", postsCreations],
          ["Réponses", reponsesCrees],
          ["Réactions", reactionsDonnees],
          ["Favoris", favorisSauves],
        ].map(([label, valeur]) => (
          <div key={label} className="rounded-xl border border-cx-border bg-cx-card px-4 py-3 text-center">
            <p className="text-2xl font-black text-cx-primary tabular-nums">{valeur}</p>
            <p className="text-xs text-cx-muted-fg">{label}</p>
          </div>
        ))}
      </section>

      <Link href="/parametres" className="text-sm text-cx-primary">
        Modifier mon profil
      </Link>
      <Link href={`/membres/${membre.slug}`} className="text-sm text-cx-primary">
        {t(locale, "profile.public")}
      </Link>
    </div>
  );
}
