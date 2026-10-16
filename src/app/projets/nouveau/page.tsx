import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import FormulaireProjet from "./formulaire-projet";

export const metadata = { title: "Lancer un projet" };

/** /projets/nouveau — réservé aux membres : sans session, redirection /connexion. */
export default async function PageNouveauProjet() {
  const userId = await getSessionUserId();
  if (userId === null) redirect("/connexion");

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-6 py-10">
      <header>
        <Link href="/projets" className="text-sm text-cx-accent">
          ← Retour aux projets
        </Link>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Lancer un projet</h1>
        <p className="mt-1 text-sm text-cx-muted-fg">
          Décrivez l&apos;idée et ce que vous cherchez : un designer, un mobile, un backend… Les
          membres qui rejoignent apparaissent sur la page du projet.
        </p>
      </header>

      <FormulaireProjet />
    </div>
  );
}
