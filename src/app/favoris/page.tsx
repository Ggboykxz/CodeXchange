import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { listFavorites } from "@/lib/favorites";
import { localeCourante, t } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Favoris" };

export default async function PageFavoris() {
  const userId = await getSessionUserId();
  if (userId === null) redirect("/connexion");

  const [f, locale] = await Promise.all([listFavorites(userId), localeCourante()]);
  const sections = [
    { libelle: t(locale, "favorites.group_forum"), items: f.posts.map((x) => ({ id: x.id, libelle: x.titre, href: x.href })) },
    { libelle: t(locale, "favorites.group_jobs"), items: f.jobs.map((x) => ({ id: x.id, libelle: x.titre, href: x.href })) },
    { libelle: t(locale, "favorites.group_projects"), items: f.projets.map((x) => ({ id: x.id, libelle: x.titre, href: x.href })) },
    { libelle: t(locale, "favorites.group_tutorials"), items: f.tutos.map((x) => ({ id: x.id, libelle: x.titre, href: x.href })) },
    { libelle: t(locale, "favorites.group_events"), items: f.events.map((x) => ({ id: x.id, libelle: x.titre, href: x.href })) },
    { libelle: t(locale, "favorites.group_members"), items: f.membres.map((x) => ({ id: x.id, libelle: x.nom, href: x.href })) },
  { libelle: "Commentaires", items: f.commentaires.map((x) => ({ id: x.id, libelle: x.titre, href: x.href })) },
  ].filter((s) => s.items.length > 0);

  const total = sections.reduce((acc, s) => acc + s.items.length, 0);

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-6 py-10">
      <header>
        <h1 className="text-3xl font-black tracking-tight">{t(locale, "favorites.title")}</h1>
        <p className="mt-1 text-sm text-cx-muted-fg">
          {total === 0
            ? t(locale, "favorites.none")
            : `${total} ${t(locale, "favorites.count_many")}`}
        </p>
      </header>

      {sections.length === 0 ? (
        <section className="rounded-xl border border-cx-border px-6 py-12 text-center">
          <p className="text-lg font-semibold">{t(locale, "favorites.empty_title")}</p>
          <p className="mt-2 text-sm text-cx-muted-fg">
            Utilisez l&apos;icône étoile sur les pages des sujets, offres, projets, tutos, événements ou membres.
          </p>
          <Link href="/forum" className="mt-5 inline-block min-h-[44px] rounded-lg bg-cx-accent px-5 py-2.5 text-sm font-semibold text-cx-accent-fg transition active:scale-[0.97]">
            {t(locale, "favorites.discover")}
          </Link>
        </section>
      ) : (
        <div className="flex flex-col gap-6">
          {sections.map((section) => (
            <section key={section.libelle}>
              <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-cx-muted-fg">{section.libelle}</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <Link href={item.href} className="block rounded-lg border border-cx-border px-4 py-3 transition hover:border-cx-primary">
                      <span className="font-medium">{item.libelle}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
