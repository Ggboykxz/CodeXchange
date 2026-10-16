import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import FormulaireSujet from "./formulaire-sujet";

export const metadata = { title: "Écrire un sujet" };

/** /forum/nouveau — réservé aux membres : sans session, redirection /connexion. */
export default async function PageNouveauSujet() {
  const userId = await getSessionUserId();
  if (userId === null) redirect("/connexion");

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-6 py-10">
      <header>
        <Link href="/forum" className="text-sm text-cx-accent">
          ← Retour au forum
        </Link>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Écrire un sujet</h1>
        <p className="mt-1 text-sm text-cx-muted-fg">
          Un titre clair et 1 à 3 tags, c&apos;est ce qu&apos;il faut pour obtenir une réponse rapide.
        </p>
      </header>

      <FormulaireSujet />
    </div>
  );
}
