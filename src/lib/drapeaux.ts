/**
 * Drapeaux de l'annuaire — **calculés côté serveur** depuis le pays du membre
 * (exigence Task 7 : aucun emoji dérivé côté client, pas de dépendance
 * externe). Le mappage couvre les pays du seed à venir (spec : prénoms et
 * villes d'Afrique francophone et anglophone) ; tout pays hors mappage tombe
 * sur le globe 🌍.
 */

const DRAPEAUX: Record<string, string> = {
  Gabon: "🇬🇦",
  Cameroun: "🇨🇲",
  "Côte d'Ivoire": "🇨🇮",
  Sénégal: "🇸🇳",
  Mali: "🇲🇱",
  "Burkina Faso": "🇧🇫",
  Niger: "🇳🇪",
  Tchad: "🇹🇩",
  RDC: "🇨🇩",
  Congo: "🇨🇬",
  Rwanda: "🇷🇼",
  Kenya: "🇰🇪",
  Ghana: "🇬🇭",
  Maroc: "🇲🇦",
  Tunisie: "🇹🇳",
  "Afrique du Sud": "🇿🇦",
  Nigéria: "🇳🇬",
  Bénin: "🇧🇯",
  Togo: "🇹🇬",
  Guinée: "🇬🇳",
  Maurice: "🇲🇺",
} as const;

/** Fallback universel pour un pays absent du mappage. */
export const DRAPEAU_INCONNU = "🌍";

/** Normalisation : casse, accents et ponctuation ignorés à la comparaison. */
function cle(pays: string): string {
  return pays
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const PAR_CLE = new Map<string, string>(
  Object.entries(DRAPEAUX).map(([pays, emoji]) => [cle(pays), emoji]),
);

/** Emoji du pays (`"Gabon"` → `"🇬🇦"`), 🌍 si le pays n'est pas dans le mappage. */
export function drapeau(pays: string): string {
  return PAR_CLE.get(cle(pays)) ?? DRAPEAU_INCONNU;
}
