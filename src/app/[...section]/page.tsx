import { Metadata } from "next";
import { notFound } from "next/navigation";
import Page from "@/app/page";
import { SITE_URL } from "@/lib/site";

/**
 * Routes réelles par section (`/forum`, `/jobs`, `/annuaire`…).
 *
 * Chaque route rend la même application SPA — le store de navigation
 * (`syncFromRoute`) lit le chemin depuis `window.location.pathname` et
 * affiche la bonne section au montage. Les métadonnées, elles, sont
 * rendues côté serveur : chaque section a un titre et une description
 * indexables, ce que le hash `#forum` ne permettait pas.
 *
 * Les sections inconnues (`/foo`) renvoient une 404 plutôt qu'une SPA
 * vide : un crawler apprend que la route n'existe pas, il n'indexe pas
 * un `200` sur du contenu absent.
 */

const SECTION_META: Record<
  string,
  { title: string; description: string; keywords?: string[] }
> = {
  home: {
    title: "CodeXchange — La plateforme des développeurs africains",
    description:
      "Forum, jobs, projets, mentorat, tutos, events et annuaire — par les devs, pour les devs.",
  },
  forum: {
    title: "Forum tech — CodeXchange",
    description:
      "Questions, réponses et discussions entre développeurs africains. Forum tech par les devs, pour les devs.",
    keywords: ["forum dev", "questions tech", "developpeurs africains"],
  },
  jobs: {
    title: "Jobs dev — CodeXchange",
    description:
      "Offres d'emploi développeur en Afrique et dans la diaspora. Full-time, freelance, remote — par les devs pour les devs.",
    keywords: ["jobs dev afrique", "emploi developpeur", "remote dev"],
  },
  projects: {
    title: "Projets open-source — CodeXchange",
    description:
      "Projets communautaires à rejoindre : startup, open-source, hackathons. Trouve ta prochaine contribution.",
    keywords: ["open source", "projets dev", "communaute dev"],
  },
  mentorat: {
    title: "Mentorat — CodeXchange",
    description:
      "Mentors et mentees : sessions 1-1, aide carrière, revue de code. Développe tes compétences avec un pair expérimenté.",
    keywords: ["mentorat dev", "mentor developpeur", "aide carriere"],
  },
  tutos: {
    title: "Tutoriels — CodeXchange",
    description:
      "Guides techniques, tutoriels et ressources pour développeurs africains. Du junior au senior.",
    keywords: ["tutoriels dev", "guides techniques", "apprentissage code"],
  },
  annuaire: {
    title: "Annuaire devs — CodeXchange",
    description:
      "Trouve des développeurs par pays, ville, stack et niveau. Rejoins-toi avec des pairs et des recruteurs.",
    keywords: ["annuaire developpeurs", "repertoire dev", "reseaux dev"],
  },
  messages: {
    title: "Messages — CodeXchange",
    description: "Conversations privées entre membres de CodeXchange.",
  },
  admin: {
    title: "Administration — CodeXchange",
    description: "Console d'administration de CodeXchange.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string[] }>;
}): Promise<Metadata> {
  const { section } = await params;
  const name = section[0];
  const meta = SECTION_META[name];
  if (!meta) {
    return { title: "Page introuvable — CodeXchange" };
  }
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: { canonical: `/${section.join("/")}` },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${SITE_URL}/${section.join("/")}`,
      type: "website",
    },
  };
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string[] }>;
}) {
  const { section } = await params;
  if (!SECTION_META[section[0]]) {
    notFound();
  }
  return <Page />;
}
