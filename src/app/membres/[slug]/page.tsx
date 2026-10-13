import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/avatar";
import { drapeau } from "@/lib/drapeaux";
import { getMemberBySlug, type MembreDetail } from "@/lib/members";

type Props = { params: Promise<{ slug: string }> };

async function lireMembre(slug: string): Promise<MembreDetail | null> {
  return getMemberBySlug(decodeURIComponent(slug));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const membre = await lireMembre(slug);
  return { title: membre ? `${membre.nom} — Annuaire` : "Membre introuvable" };
}

/** Lien externe du profil (github, linkedin ou site) avec libellé FR. */
function LienExterne({ url, libelle }: { url: string; libelle: string }) {
  return (
    <li>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-lg border border-[var(--cx-muted)]/40 px-4 py-2.5 text-sm font-medium hover:border-[var(--cx-accent)]"
      >
        {libelle} ↗
      </a>
    </li>
  );
}

/** /membres/[slug] — profil public complet : bio, stack, liens, rôle. */
export default async function PageMembre({ params }: Props) {
  const { slug } = await params;
  const membre = await lireMembre(slug);
  if (!membre) notFound(); // 404 soignée FR via `src/app/not-found.tsx`

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <Link href="/annuaire" className="text-sm text-[var(--cx-accent)]">
        ← Retour à l&apos;annuaire
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Avatar slug={membre.slug} nom={membre.nom} taille="lg" />
        <div className="min-w-0">
          <h1 className="text-2xl font-black leading-snug tracking-tight sm:text-3xl">
            {membre.nom}
          </h1>
          <p className="mt-1 text-sm text-[var(--cx-muted)]">
            {membre.titre} · {drapeau(membre.pays)} {membre.ville}, {membre.pays}
          </p>
          {membre.role === "MENTOR" && (
            <p className="mt-3">
              <Link
                href="/mentorat"
                className="inline-block rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-500/20 dark:text-amber-400"
              >
                Mentor · Demander un mentorat →
              </Link>
            </p>
          )}
        </div>
      </header>

      <section className="rounded-xl border border-[var(--cx-muted)]/25 px-5 py-5 text-sm">
        <h2 className="font-semibold">À propos</h2>
        {membre.bio ? (
          <p className="mt-2 whitespace-pre-line leading-relaxed text-[var(--cx-muted)]">
            {membre.bio}
          </p>
        ) : (
          <p className="mt-2 text-[var(--cx-muted)]">
            Ce membre n&apos;a pas encore rempli sa bio — écrivez-lui après l&apos;avoir trouvé
            dans l&apos;annuaire.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-[var(--cx-muted)]/25 px-5 py-5 text-sm">
        <h2 className="font-semibold">Stack</h2>
        {membre.stack.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {membre.stack.map((technologie) => (
              <li
                key={technologie}
                className="rounded-full bg-[var(--cx-accent)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--cx-accent)]"
              >
                {technologie}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[var(--cx-muted)]">Pas encore de stack renseignée.</p>
        )}
      </section>

      {(membre.github || membre.linkedin || membre.site) && (
        <section className="rounded-xl border border-[var(--cx-muted)]/25 px-5 py-5 text-sm">
          <h2 className="font-semibold">Liens</h2>
          <ul className="mt-3 flex flex-wrap gap-3">
            {membre.github && <LienExterne url={membre.github} libelle="GitHub" />}
            {membre.linkedin && <LienExterne url={membre.linkedin} libelle="LinkedIn" />}
            {membre.site && <LienExterne url={membre.site} libelle="Site personnel" />}
          </ul>
        </section>
      )}
    </main>
  );
}
