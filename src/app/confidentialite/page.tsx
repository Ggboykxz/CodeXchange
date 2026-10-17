import type { Metadata } from "next";

export const metadata: Metadata = { title: "Confidentialité" };

/** /confidentialite — page légale concise (audit design : liens légaux). */
export default function Page() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Confidentialité</h1>
      <p className="text-sm text-cx-muted-fg">
        CodeXchange est un projet de hackathon. Voici, sans jargon, ce que nous
        faisons de vos données.
      </p>
      <section className="rounded-xl border border-cx-border bg-cx-card p-5 text-sm">
        <h2 className="font-semibold">Ce que nous stockons</h2>
        <p className="mt-2 text-cx-muted-fg">
          Un compte : nom affiché, pseudonyme, e-mail, pays, ville et bio
          facultatifs. Vos publications (sujets, réponses, tutoriels,
          candidatures), les réactions et messages que vous envoyez, ainsi que
          les dates associées.
        </p>
      </section>
      <section className="rounded-xl border border-cx-border bg-cx-card p-5 text-sm">
        <h2 className="font-semibold">Ce que nous ne faisons pas</h2>
        <p className="mt-2 text-cx-muted-fg">
          Aucune publicité, aucune revente de données, aucun cookie de suivi.
          Les e-mails ne servent qu&apos;aux actions de compte (réinitialisation
          de mot de passe). Les mots de passe sont hachés (bcrypt), jamais
          stockés en clair.
        </p>
      </section>
      <section className="rounded-xl border border-cx-border bg-cx-card p-5 text-sm">
        <h2 className="font-semibold">Vos droits</h2>
        <p className="mt-2 text-cx-muted-fg">
          Vous pouvez supprimer votre contenu depuis la plateforme ou écrire à
          l&apos;équipe pour demander la suppression complète de votre compte.
        </p>
      </section>
      <p className="text-xs text-cx-muted-fg">
        Dernière mise à jour : octobre 2026.
      </p>
    </div>
  );
}
