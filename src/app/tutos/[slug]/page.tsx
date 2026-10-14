import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/avatar";
import { drapeau } from "@/lib/drapeaux";
import { renderMarkdown } from "@/lib/markdown";
import { getTutorial } from "@/lib/tutorials";
import { isFavorite } from "@/lib/favorites";
import { getSessionUserId } from "@/lib/session";
import { localeCourante, t } from "@/lib/i18n";
import BoutonFavori from "@/components/bouton-favori";
import FilAriane from "@/components/fil-ariane";

type Props = { params: Promise<{ slug: string }> };

async function lireTuto(slug: string) {
  return getTutorial(decodeURIComponent(slug));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tuto = await lireTuto(slug);
  return { title: tuto ? tuto.titre : "Tuto introuvable" };
}

/** /tutos/[slug] — article rendu en markdown + auteur lié à son profil. */
export default async function PageTuto({ params }: Props) {
  const { slug } = await params;
  const [tuto, userId, locale] = await Promise.all([lireTuto(slug), getSessionUserId(), localeCourante()]);
  if (!tuto) notFound();
  const favoriDuTuto = userId === null ? false : await isFavorite(userId, "tuto", tuto.id);

  // `renderMarkdown` échappe tout HTML d'entrée (Review Focus n°3) : le corps
  // affiche `<script>` en texte, il ne s'exécute jamais.
  const html = renderMarkdown(tuto.corps);

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <Link href="/tutos" className="text-sm text-[var(--cx-accent)]">
        <FilAriane
          items={[
            { label: t(locale, "nav.home"), href: "/" },
            { label: t(locale, "nav.tutorials"), href: "/tutos" },
            { label: tuto.titre },
          ]}
        />
      </Link>

      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-black leading-snug tracking-tight sm:text-3xl">
          {tuto.titre}
        </h1>
        <p className="text-sm text-cx-muted-fg">
          {tuto.author.nom} · {drapeau(tuto.author.pays)} {tuto.author.ville}, {tuto.author.pays}{" "}
          · ⏱ {tuto.dureeMin} {t(locale, "tutorials.reading")}
        </p>
        <ul className="flex flex-wrap gap-2">
          {tuto.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-[var(--cx-accent)]/5 px-2.5 py-0.5 text-xs font-semibold text-[var(--cx-accent)]"
            >
              {tag}
            </li>
          ))}
        </ul>
        <BoutonFavori kind="tuto" targetId={tuto.id} initial={favoriDuTuto} connecte={userId !== null} />
      </header>

      <article
        className="rounded-xl border border-[var(--cx-muted)]/25 px-5 py-5 leading-relaxed [&_a]:text-[var(--cx-accent)] [&_a]:underline [&_code]:rounded [&_code]:bg-[var(--cx-muted)]/15 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_li]:mt-1 [&_p]:mt-3 [&_pre]:mt-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-[var(--cx-muted)]/10 [&_pre]:p-4 [&_strong]:font-semibold [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <section className="rounded-xl border border-[var(--cx-muted)]/25 px-5 py-4 text-sm">
        <h2 className="font-semibold">{t(locale, "tutorials.author")}</h2>
        <Link href={`/membres/${tuto.author.slug}`} className="mt-3 flex items-center gap-3">
          <Avatar slug={tuto.author.slug} nom={tuto.author.nom} />
          <span>
            <span className="font-medium hover:text-[var(--cx-accent)]">{tuto.author.nom}</span>
            <span className="block text-xs text-cx-muted-fg">
              {t(locale, "tutorials.see_profile")}
            </span>
          </span>
        </Link>
      </section>
    </div>
  );
}
