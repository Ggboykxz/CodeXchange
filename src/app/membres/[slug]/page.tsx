import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/avatar";
import { drapeau } from "@/lib/drapeaux";
import { getSessionUserId } from "@/lib/session";
import { getMemberBySlug, type MembreDetail } from "@/lib/members";
import { isFavorite } from "@/lib/favorites";
import { getCompteursSuivi } from "@/lib/follows";
import { localeCourante, t } from "@/lib/i18n";
import BoutonFavori from "@/components/bouton-favori";
import BoutonSignaler from "@/components/bouton-signaler";
import BoutonSuivre from "@/components/bouton-suivre";
import BoutonBloquer from "@/components/bouton-bloquer";
import { BadgeNiveau, BadgeVerification } from "@/components/badges-membre";
import { isBlocked } from "@/lib/blocks";
import { visibiliteProfil } from "@/lib/privacy";
import { prisma } from "@/lib/db";
import FilAriane from "@/components/fil-ariane";

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
        className="inline-block rounded-lg border border-cx-border px-4 py-2.5 text-sm font-medium hover:border-cx-primary"
      >
        {libelle} ↗
      </a>
    </li>
  );
}

/** /membres/[slug] — profil public complet : bio, stack, liens, rôle. */
export default async function PageMembre({ params }: Props) {
  const { slug } = await params;
  const [membre, userId, locale] = await Promise.all([lireMembre(slug), getSessionUserId(), localeCourante()]);
  if (!membre) notFound(); // 404 soignée FR via `src/app/not-found.tsx`
  const favoriDuMembre = userId === null ? false : await isFavorite(userId, "membre", membre.id);
  const compteursSuivi = await getCompteursSuivi(membre.id, userId ?? undefined);
  const estBloque = userId === null ? false : await isBlocked(userId, membre.id);
  const visibilite = await visibiliteProfil(membre.id, userId ?? undefined);
  const karmaMembre =
    (
      await prisma.like.aggregate({
        _sum: { valeur: true },
        where: { post: { authorId: membre.id } },
      })
    )._sum.valeur ?? 0;

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-6 py-10">
      <Link href="/annuaire" className="text-sm text-cx-primary">
        <FilAriane
          items={[
            { label: t(locale, "nav.home"), href: "/" },
            { label: t(locale, "nav.directory"), href: "/annuaire" },
            { label: membre.nom },
          ]}
        />
      </Link>

      {/* Bannière de couverture : aplat (baseline : pas de dégradé). */}
      <div
        aria-hidden="true"
        className="relative -mx-6 h-32 overflow-hidden bg-cx-primary sm:h-40"
      >
        <div className="absolute inset-0 bg-cx-bg/20" />
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:16px_16px] text-white" />
      </div>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Avatar slug={membre.slug} nom={membre.nom} taille="lg" avatar={membre.avatar || undefined} />
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-2xl font-black leading-snug tracking-tight sm:text-3xl">
            {membre.nom}
            {membre.verified ? <BadgeVerification /> : null}
          </h1>
          <div className="mt-2">
            <BadgeNiveau karma={karmaMembre} />
          </div>
          <p className="mt-1 text-sm text-cx-muted-fg">
            {membre.titre} · {drapeau(membre.pays)} {membre.ville}, {membre.pays}
          </p>
          {membre.role === "MENTOR" && (
            <p className="mt-3">
              <Link
                href="/mentorat"
                className="inline-block rounded-full bg-cx-warning/5 px-3 py-1 text-xs font-semibold text-cx-warning hover:bg-cx-warning/20"
              >
                {t(locale, "directory.mentor_cta")}
              </Link>
            </p>
          )}
          {userId !== null && userId !== membre.id && (
            <p className="mt-3 flex flex-wrap items-start gap-2">
              <BoutonSuivre
                cibleId={membre.id}
                initial={compteursSuivi}
                connecte={userId !== null}
              />
              <Link
                href={`/messagerie?with=${membre.id}`}
                className="inline-flex min-h-[40px] items-center rounded-lg border border-cx-border bg-cx-card px-4 py-2 text-xs font-semibold text-cx-card-fg hover:bg-cx-muted"
              >
                {t(locale, "directory.message")}
              </Link>
              <BoutonFavori kind="membre" targetId={membre.id} initial={favoriDuMembre} connecte={userId !== null} />
            </p>
          )}
          {userId === null && (
            <p className="mt-3">
              <span className="text-xs tabular-nums text-cx-muted-fg">
                {compteursSuivi.abonnes} abonné{compteursSuivi.abonnes > 1 ? "s" : ""} · {compteursSuivi.abonnements} abonnement{compteursSuivi.abonnements > 1 ? "s" : ""}
              </span>
            </p>
          )}
          {userId !== null && userId !== membre.id ? (
            <p className="mt-2 flex flex-wrap items-center gap-3">
              <BoutonSignaler kind="membre" targetId={membre.id} libelle={t(locale, "directory.report_member")} />
              <BoutonBloquer cibleId={membre.id} bloqueInitialement={estBloque} connecte={userId !== null} />
            </p>
          ) : null}
        </div>
      </header>

      {visibilite.complet ? (
        <>
          <section className="rounded-xl border border-cx-border px-5 py-5 text-sm">
            <h2 className="font-semibold">{t(locale, "directory.about")}</h2>
            {membre.bio ? (
              <p className="mt-2 whitespace-pre-line leading-relaxed text-cx-muted-fg">
                {membre.bio}
              </p>
            ) : (
              <p className="mt-2 text-cx-muted-fg">
                {t(locale, "directory.no_bio")}
              </p>
            )}
          </section>

          <section className="rounded-xl border border-cx-border px-5 py-5 text-sm">
            <h2 className="font-semibold">{t(locale, "directory.stack")}</h2>
            {membre.stack.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {membre.stack.map((technologie) => (
                  <li
                    key={technologie}
                    className="rounded-full bg-cx-primary/5 px-2.5 py-0.5 text-xs font-semibold text-cx-primary"
                  >
                    {technologie}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-cx-muted-fg">{t(locale, "directory.no_stack")}</p>
            )}
          </section>

          {(membre.github || membre.linkedin || membre.site) && (
            <section className="rounded-xl border border-cx-border px-5 py-5 text-sm">
              <h2 className="font-semibold">{t(locale, "directory.links")}</h2>
              <ul className="mt-3 flex flex-wrap gap-3">
                {membre.github && <LienExterne url={membre.github} libelle="GitHub" />}
                {membre.linkedin && <LienExterne url={membre.linkedin} libelle="LinkedIn" />}
                {membre.site && <LienExterne url={membre.site} libelle="Site personnel" />}
              </ul>
            </section>
          )}
        </>
      ) : (
        <section className="rounded-xl border border-dashed border-cx-border px-5 py-8 text-center text-sm text-cx-muted-fg">
          <p className="font-semibold text-cx-fg">Profil privé</p>
          <p className="mt-2">
            Suivez <span className="font-semibold">{membre.nom}</span> pour voir sa bio, sa stack et ses liens.
          </p>
        </section>
      )}
    </div>
  );
}
