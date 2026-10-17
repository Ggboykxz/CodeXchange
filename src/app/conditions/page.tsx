import type { Metadata } from "next";

export const metadata: Metadata = { title: "Conditions" };

/** /conditions — règles d'usage concises (audit design : liens légaux). */
export default function Page() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Conditions d&apos;usage</h1>
      <p className="text-sm text-cx-muted-fg">
        Les règles tiennent en une page — c&apos;est voulu.
      </p>
      <section className="rounded-xl border border-cx-border bg-cx-card p-5 text-sm">
        <h2 className="font-semibold">Respect</h2>
        <p className="mt-2 text-cx-muted-fg">
          Pas de harcèlement, pas de discrimination, pas de spam. Les
          discussions techniques peuvent être vives : restez sur le code, pas
          sur les personnes.
        </p>
      </section>
      <section className="rounded-xl border border-cx-border bg-cx-card p-5 text-sm">
        <h2 className="font-semibold">Contenu authentique</h2>
        <p className="mt-2 text-cx-muted-fg">
          Publiez des contenus que vous avez le droit de partager. Mentionnez
          vos sources. Les offres d&apos;emploi réelles uniquement — pas
          d&apos;annonces fictives ou d&apos;arnaques.
        </p>
      </section>
      <section className="rounded-xl border border-cx-border bg-cx-card p-5 text-sm">
        <h2 className="font-semibold">Modération</h2>
        <p className="mt-2 text-cx-muted-fg">
          Chaque publication peut être signalée. Les signalements sont traités
          par l&apos;équipe ; en cas de violation répétée, le compte est
          désactivé.
        </p>
      </section>
      <p className="text-xs text-cx-muted-fg">
        Dernière mise à jour : octobre 2026.
      </p>
    </div>
  );
}
