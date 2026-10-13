import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { parseId } from "@/lib/forum";
import { estMembre, getProject } from "@/lib/projects";
import { getSessionUserId } from "@/lib/session";
import BoutonRejoindre from "./bouton-rejoindre";

type Props = { params: Promise<{ id: string }> };

const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

async function lireProjet(id: string) {
  const projectId = parseId(id);
  if (projectId === null) return null;
  return getProject(projectId);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const projet = await lireProjet(id);
  return { title: projet ? `${projet.titre} — Projets` : "Projet introuvable" };
}

/** /projets/[id] — détail d'un projet : stack, « cherche … », membres, bouton rejoindre. */
export default async function PageProjet({ params }: Props) {
  const { id } = await params;
  const projectId = parseId(id);
  if (projectId === null) notFound();
  const projet = await getProject(projectId);
  if (!projet) notFound();

  const userId = await getSessionUserId();
  const estAuteur = userId !== null && projet.authorId === userId;
  const dejaMembre = userId === null ? false : await estMembre(userId, projectId);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <Link href="/projets" className="text-sm text-[var(--cx-accent)]">
        ← Retour aux projets
      </Link>

      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-black leading-snug tracking-tight sm:text-3xl">
          {projet.titre}
        </h1>
        <p className="text-sm text-[var(--cx-muted)]">
          Lancé par {projet.author.nom} · {projet.author.ville}, {projet.author.pays} ·{" "}
          {DATE.format(projet.createdAt)} ·{" "}
          {projet._count.membres} {projet._count.membres > 1 ? "membres" : "membre"}
        </p>
        {projet.cherche.length > 0 && (
          <p className="text-sm font-medium">
            Recherche&nbsp;:{" "}
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
              {projet.cherche.join(", ")}
            </span>
          </p>
        )}
        <div>
          <BoutonRejoindre
            projectId={projectId}
            connecte={userId !== null}
            estAuteur={estAuteur}
            dejaMembre={dejaMembre}
            compteur={projet._count.membres}
          />
        </div>
        {userId === null && (
          <p className="text-sm text-[var(--cx-muted)]">
            <Link href="/connexion" className="font-medium text-[var(--cx-accent)]">
              Connectez-vous
            </Link>{" "}
            pour rejoindre ce projet.
          </p>
        )}
      </header>

      <section className="rounded-xl border border-[var(--cx-muted)]/25 px-5 py-5 text-sm">
        <h2 className="font-semibold">À propos du projet</h2>
        <p className="mt-2 whitespace-pre-line leading-relaxed text-[var(--cx-muted)]">
          {projet.description}
        </p>
      </section>

      {projet.stack.length > 0 && (
        <section className="rounded-xl border border-[var(--cx-muted)]/25 px-5 py-5 text-sm">
          <h2 className="font-semibold">Stack technique</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {projet.stack.map((technologie) => (
              <li
                key={technologie}
                className="rounded-full bg-[var(--cx-accent)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--cx-accent)]"
              >
                {technologie}
              </li>
            ))}
          </ul>
        </section>
      )}

      {projet.lien && (
        <section className="rounded-xl border border-[var(--cx-muted)]/25 px-5 py-5 text-sm">
          <h2 className="font-semibold">Suivre le projet</h2>
          <a
            href={projet.lien}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block rounded-lg border border-[var(--cx-muted)]/40 px-4 py-2.5 font-medium hover:border-[var(--cx-accent)]"
          >
            Ouvrir le lien du projet ↗
          </a>
        </section>
      )}
    </main>
  );
}
