import { prisma } from "./db";

/**
 * Parcours « dev & web » : les 7 étapes qui font un développeur complet.
 * Chaque étape est cochée si l'utilisateur connecté a réellement accompli
 * l'action (données réelles en base). Servant de fil rouge sur l'accueil
 * et le profil.
 */

export type EtapeParcours = {
  id: string;
  libelle: string;
  description: string;
  href: string;
  fait: boolean;
};

type ActionsParcours = {
  sujet: boolean;
  reponse: boolean;
  projet: boolean;
  offre: boolean;
  mentorat: boolean;
  evenement: boolean;
};

const ETAPES_DE_BASE: Array<Omit<EtapeParcours, "fait">> = [
  {
    id: "sujet",
    libelle: "Publier un sujet",
    description: "Poser une question ou partager un retour sur le forum.",
    href: "/forum/nouveau",
  },
  {
    id: "reponse",
    libelle: "Répondre à la communauté",
    description: "Aider les autres avec une réponse ou un commentaire.",
    href: "/forum",
  },
  {
    id: "projet",
    libelle: "Lancer un projet",
    description: "Créer un projet et recruter ses premiers co-fondateurs.",
    href: "/projets/nouveau",
  },
  {
    id: "offre",
    libelle: "Candidater à une offre",
    description: "Poster sa candidature à un CDI, freelance ou stage.",
    href: "/jobs",
  },
  {
    id: "mentorat",
    libelle: "Trouver un mentor",
    description: "Demander un accompagnement ciblé à un mentor vérifié.",
    href: "/mentorat",
  },
  {
    id: "evenement",
    libelle: "Participer à un événement",
    description: "Confirmer ta présence à un meetup ou hackathon.",
    href: "/evenements",
  },
];

/** Construit le parcours à partir de l'état réel des actions (testable sans BDD). */
export function construireParcours(actions: ActionsParcours): EtapeParcours[] {
  const actionsIndex = actions as Record<string, boolean>;
  return ETAPES_DE_BASE.map((e) => ({ ...e, fait: Boolean(actionsIndex[e.id]) }));
}

/** Charge le parcours d'un membre (ou liste vide si anonyme). */
export async function parcoursUtilisateur(userId: number | null): Promise<EtapeParcours[]> {
  if (userId === null) return construireParcours({ sujet: false, reponse: false, projet: false, offre: false, mentorat: false, evenement: false });

  const [sujets, reponses, projets, offres, mentorats, evenements] = await Promise.all([
    prisma.post.count({ where: { authorId: userId } }),
    prisma.reply.count({ where: { authorId: userId } }),
    prisma.project.count({ where: { OR: [{ authorId: userId }, { membres: { some: { userId } } }] } }),
    prisma.application.count({ where: { userId } }),
    prisma.mentorRequest.count({ where: { requesterId: userId } }),
    prisma.rsvp.count({ where: { userId } }),
  ]);

  return construireParcours({
    sujet: sujets > 0,
    reponse: reponses > 0,
    projet: projets > 0,
    offre: offres > 0,
    mentorat: mentorats > 0,
    evenement: evenements > 0,
  });
}
