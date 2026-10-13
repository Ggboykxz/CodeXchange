/**
 * i18n minimal (FR par défaut, EN partiel).
 *
 * La couche UI commune (nav, header, footer, landing, actions) est traduite.
 * Les contenus métier (forum, offres, descriptifs) restent en français — leur
 * traduction ferait exploser le volume de clés sans gain pour la démo.
 */

export type Locale = "fr" | "en";

export const LOCALES: Locale[] = ["fr", "en"];
export const LOCALE_PAR_DEFAUT: Locale = "fr";

const TRADUCTIONS: Record<Locale, Record<string, string>> = {
  fr: {
    "nav.forum": "Forum",
    "nav.jobs": "Emplois",
    "nav.projects": "Projets",
    "nav.directory": "Annuaire",
    "nav.tutorials": "Tutos",
    "nav.events": "Événements",
    "nav.mentorship": "Mentorat",
    "nav.notifications": "Notifications",
    "nav.favorites": "Favoris",
    "nav.messages": "Messagerie",
    "nav.profile": "Mon profil",
    "nav.admin": "Admin",
    "nav.search": "Rechercher",
    "nav.login": "Connexion",
    "nav.join": "Rejoindre",
    "nav.logout": "Déconnexion",
    "common.favorite": "Favori",
    "common.send": "Envoyer",
    "common.cancel": "Annuler",
    "common.back_home": "Retour à l'accueil",
    "footer.tagline": "La communauté des développeurs d'Afrique.",
    "home.badge": "Fait par des devs africains, pour des devs africains",
    "home.hero_prefix": "CodeXchange — la plateforme des",
    "home.hero_highlight": "développeurs africains",
    "home.hero_sub":
      "Pose une question sur le forum, trouve une mission, recrute des co-fondateurs, découvre des mentors et des événements locaux. Tout en français, sur mobile.",
    "home.cta_join": "Rejoindre la communauté",
    "home.cta_forum": "Parcourir le forum →",
    "home.stats": "membres · sujets · offres en ligne",
  },
  en: {
    "nav.forum": "Forum",
    "nav.jobs": "Jobs",
    "nav.projects": "Projects",
    "nav.directory": "Directory",
    "nav.tutorials": "Tutorials",
    "nav.events": "Events",
    "nav.mentorship": "Mentorship",
    "nav.notifications": "Notifications",
    "nav.favorites": "Favorites",
    "nav.messages": "Messages",
    "nav.profile": "My profile",
    "nav.admin": "Admin",
    "nav.search": "Search",
    "nav.login": "Log in",
    "nav.join": "Join",
    "nav.logout": "Log out",
    "common.favorite": "Favorite",
    "common.send": "Send",
    "common.cancel": "Cancel",
    "common.back_home": "Back to home",
    "footer.tagline": "The African developers community.",
    "home.badge": "Made by African devs, for African devs",
    "home.hero_prefix": "CodeXchange — the platform for",
    "home.hero_highlight": "African developers",
    "home.hero_sub":
      "Ask a question on the forum, find a mission, recruit co-founders, discover mentors and local events. All in French, mobile-first.",
    "home.cta_join": "Join the community",
    "home.cta_forum": "Browse the forum →",
    "home.stats": "members · posts · open jobs",
  },
};

export function estLocale(valeur: string | undefined): valeur is Locale {
  return valeur === "fr" || valeur === "en";
}

/** Traduit une clé dans la locale demandée (retombe sur FR si absente). */
export function t(locale: Locale, cle: string): string {
  return TRADUCTIONS[locale][cle] ?? TRADUCTIONS[LOCALE_PAR_DEFAUT][cle] ?? cle;
}

/**
 * Lit la locale courante depuis le cookie `cx_locale`.
 * Retombe sur FR hors contexte de requête (tests, rendu statique).
 */
export async function localeCourante(): Promise<Locale> {
  try {
    const { cookies } = await import("next/headers");
    const valeur = (await cookies()).get("cx_locale")?.value;
    return estLocale(valeur) ? valeur : LOCALE_PAR_DEFAUT;
  } catch {
    return LOCALE_PAR_DEFAUT;
  }
}
