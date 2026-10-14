import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { localeCourante, t } from "@/lib/i18n";
import FormulaireParametres from "./formulaire-parametres";

export const dynamic = "force-dynamic";
export const metadata = { title: "Paramètres" };

export default async function PageParametres() {
  const userId = await getSessionUserId();
  if (userId === null) redirect("/connexion");
  const membre = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nom: true,
      titre: true,
      ville: true,
      pays: true,
      bio: true,
      stack: true,
      github: true,
      linkedin: true,
      site: true,
      notifEmail: true,
      privacy: true,
    },
  });
  if (!membre) redirect("/connexion");
  const locale = await localeCourante();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <header>
        <Link href="/mon-espace" className="text-sm text-cx-primary">
          ← Mon activité
        </Link>
        <h1 className="mt-2 text-3xl font-black tracking-tight">{t(locale, "settings.title")}</h1>
      </header>
      <FormulaireParametres profil={{ ...membre, privacy: membre.privacy ?? "PUBLIC" }} />
    </main>
  );
}
