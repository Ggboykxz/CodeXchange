import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import FormulaireOffre from "./formulaire-offre";

export const metadata = { title: "Publier une offre" };

/** /jobs/nouveau — réservé aux membres : sans session, redirection /connexion. */
export default async function PageNouvelleOffre() {
  const userId = await getSessionUserId();
  if (userId === null) redirect("/connexion");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <header>
        <Link href="/jobs" className="text-sm text-[var(--cx-accent)]">
          ← Retour aux offres
        </Link>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Publier une offre</h1>
        <p className="mt-1 text-sm text-[var(--cx-muted)]">
          Un titre précis, un type de contrat et un lien direct : les candidatures arrivent plus
          vite.
        </p>
      </header>

      <FormulaireOffre />
    </main>
  );
}
