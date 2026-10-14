import Link from "next/link";
import { redirect } from "next/navigation";
import Avatar from "@/components/avatar";
import { drapeau } from "@/lib/drapeaux";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import FormulaireAvatar from "./formulaire-avatar";
import { localeCourante, t } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon profil" };

export default async function PageProfil() {
  const userId = await getSessionUserId();
  if (userId === null) redirect("/connexion");

  const membre = await prisma.user.findUnique({
    where: { id: userId },
    select: { nom: true, slug: true, titre: true, ville: true, pays: true, bio: true, avatar: true, stack: true, role: true },
  });
  if (!membre) redirect("/connexion");
  const postsDuMembre = await prisma.post.findMany({ where: { authorId: userId }, select: { id: true } });
  const karma = (await prisma.like.aggregate({ _sum: { valeur: true }, where: { postId: { in: postsDuMembre.map((p) => p.id) } } }))._sum.valeur ?? 0;
  const locale = await localeCourante();

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-black tracking-tight">{t(locale, "profile.title")}</h1>

      <section className="flex flex-col gap-4 rounded-xl border border-[var(--cx-muted)]/25 px-5 py-5">
        <div className="flex items-center gap-4">
          <Avatar slug={membre.slug} nom={membre.nom} taille="lg" avatar={membre.avatar || undefined} />
          <div>
            <p className="text-lg font-semibold">{membre.nom}</p>
            <p className="text-sm text-cx-muted-fg">Karma : {karma}</p>
            <p className="text-sm text-cx-muted-fg">
              {membre.titre} · {drapeau(membre.pays)} {membre.ville}, {membre.pays}
            </p>
          </div>
        </div>
        <FormulaireAvatar avatarActuel={membre.avatar} />
      </section>

      <section className="rounded-xl border border-[var(--cx-muted)]/25 px-5 py-5 text-sm">
        <h2 className="font-semibold">{t(locale, "profile.bio")}</h2>
        <p className="mt-2 whitespace-pre-line text-cx-muted-fg">
          {membre.bio || t(locale, "profile.bio_empty")}
        </p>
      </section>

      <section className="rounded-xl border border-[var(--cx-muted)]/25 px-5 py-5 text-sm">
        <h2 className="font-semibold">{t(locale, "profile.stack")}</h2>
        <p className="mt-2 text-cx-muted-fg">{membre.stack || t(locale, "profile.stack_empty")}</p>
      </section>

      <Link href="/parametres" className="text-sm text-cx-accent">
        Modifier mon profil
      </Link>
      <Link href={`/membres/${membre.slug}`} className="text-sm text-[var(--cx-accent)]">
        {t(locale, "profile.public")}
      </Link>
    </div>
  );
}
