/**
 * Avatar de l'annuaire : pastille de couleur **déterministe** dérivée du slug
 * (même slug → même couleur, à chaque rendu et sur chaque appareil) avec les
 * initiales du membre en blanc. Palette d'hex fixes (pas de classes Tailwind
 * dynamiques, qui seraient purgées à la compilation).
 */

const PALETTE = [
  "#E4572E", // terracotta
  "#F4A259", // ocre
  "#2A9D8F", // vert profond
  "#6A4C93", // prune
  "#BC6C25", // brun chaud
  "#457B9D", // bleu savane
  "#D90429", // rouge kola
  "#40916C", // vert mangue
] as const;

/** Empreinte FNV-1a 32 bits du slug (stable, sans dépendance). */
function empreinte(texte: string): number {
  let h = 0x811c9dc5;
  for (const caractere of texte.toLowerCase()) {
    h ^= caractere.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** Couleur hexadécimale déterministe d'un slug (exportée pour les tests). */
export function couleurDuSlug(slug: string): string {
  return PALETTE[empreinte(slug) % PALETTE.length];
}

/** Initiales : jusqu'à 2 mots, première lettre de chacun, en majuscules. */
function initiales(nom: string): string {
  const mots = nom.trim().split(/\s+/).filter(Boolean);
  const lettres = mots.slice(0, 2).map((mot) => [...mot][0] ?? "");
  return lettres.join("").toUpperCase() || "?";
}

type Props = {
  /** Slug unique du membre (source de la couleur). */
  slug: string;
  /** Nom complet, source des initiales. */
  nom: string;
  /** Taille du pastille : `sm` (carte d'annuaire) ou `lg` (profil). */
  taille?: "sm" | "lg";
  /** Data URL (base64) de l'avatar téléversé, ou absent. */
  avatar?: string;
};

/** Pastille Avatar réutilisable (annuaire, profils publics). */
export default function Avatar({ slug, nom, taille = "sm", avatar }: Props) {
  const dimension = taille === "lg" ? "h-20 w-20 text-2xl" : "h-11 w-11 text-sm";
  if (avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatar}
        alt=""
        aria-hidden="true"
        className={`inline-flex shrink-0 items-center justify-center rounded-full object-cover ${dimension}`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ${dimension}`}
      style={{ backgroundColor: couleurDuSlug(slug) }}
    >
      {initiales(nom)}
    </span>
  );
}
