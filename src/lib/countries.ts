/**
 * Liste unique des pays — formulaire d'inscription **et** filtre de
 * l'annuaire.
 *
 * Elle existait en trois endroits, qui s'étaient déviés l'un de l'autre :
 * 15 entrées dans `shared/auth-form.tsx`, 10 dans `sections/annuaire-section.tsx`,
 * 21 pays réellement présents au seed. Résultat : impossible de filtrer sur
 * la moitié du continent, et impossible de s'inscrire depuis sept pays que
 * l'annuaire affichait pourtant.
 *
 * Toute nouvelle valeur passe par ici, sinon les deux listes divergent de
 * nouveau. Le jour où les pays viendront de comptes réels ou d'exports,
 * c'est un `SELECT DISTINCT country` qui remplacera cette constante
 * (TODO déjà posé dans `annuaire-section.tsx`).
 */
export const AFRICAN_COUNTRIES = [
  "Afrique du Sud",
  "Bénin",
  "Burkina Faso",
  "Cameroun",
  "Côte d'Ivoire",
  "Egypt",
  "Éthiopie",
  "Gabon",
  "Ghana",
  "Guinée",
  "Kenya",
  "Mali",
  "Maroc",
  "Nigeria",
  "Ouganda",
  "RD Congo",
  "Rwanda",
  "Sénégal",
  "Tanzanie",
  "Tunisie",
  "Zambie",
] as const;

/**
 * Ce que propose l'inscription : la même liste, plus `Autre` — un membre
 * hors de ces pays (Maroc, Cameroun, diaspora…) doit pouvoir créer un
 * compte et compléter son profil plus tard.
 */
export const REGISTRATION_COUNTRIES: readonly string[] = [
  ...AFRICAN_COUNTRIES,
  "Autre",
];
