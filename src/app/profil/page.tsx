import Link from "next/link";
import { redirect } from "next/navigation";
import Avatar from "@/components/avatar";
import { drapeau } from "@/lib/drapeaux";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import FormulaireAvatar from "./formulaire-avatar";

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

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-black tracking-tight">Mon profil</h1>

      <section className="flex flex-col gap-4 rounded-xl border border-[var(--cx-muted)]/25 px-5 py-5">
        <div className="flex items-center gap-4">
          <Avatar slug={membre.slug} nom={membre.nom} taille="lg" avatar={membre.avatar || undefined} />
          <div>
            <p className="text-lg font-semibold">{membre.nom}</p>
            <p className="text-sm text-[var(--cx-muted)]">
              {membre.titre} · {drapeau(membre.pays)} {membre.ville}, {membre.pays}
            </p>
          </div>
        </div>
        <FormulaireAvatar avatarActuel={membre.avatar} />
      </section>

      <section className="rounded-xl border border-[var(--cx-muted)]/25 px-5 py-5 text-sm">
        <h2 className="font-semibold">Bio</h2>
        <p className="mt-2 whitespace-pre-line text-[var(--cx-muted)]">
          {membre.bio || "Aucune bio renseignée."}
        </p>
      </section>

      <section className="rounded-xl border border-[var(--cx-muted)]/25 px-5 py-5 text-sm">
        <h2 className="font-semibold">Stack</h2>
        <p className="mt-2 text-[var(--cx-muted)]">{membre.stack || "Non renseignée."}</p>
      </section>

      <Link href={`/membres/${membre.slug}`} className="text-sm text-[var(--cx-accent)]">
        Voir mon profil public →
      </Link>
    </main>
  );
}
