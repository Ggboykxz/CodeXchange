/**
 * Lecture des chaînes de salaire (G5).
 *
 * `Job.salary` reste une chaîne d'affichage libre (`"3-5K EUR / month"`) :
 * on n'introduit PAS de taux de change fictif — il n'existe pas de cours
 * officiel sans fournisseur FX. Le livrable honnête : extraire le code de
 * devise réellement écrit dans la chaîne pour (a) afficher un badge, (b)
 * alimenter le filtre `?currency=` de `GET /api/jobs` sur du LIKE exact.
 */

/** Codes réellement portés par les offres du site (seed + saisie libellée). */
const CURRENCY_CODES = [
  "EUR",
  "USD",
  "GBP",
  "CHF",
  "CAD",
  "AUD",
  "XOF",
  "XAF",
  "MAD",
  "DZD",
  "TND",
  "NGN",
  "GHS",
  "KES",
  "UGX",
  "TZS",
  "RWF",
  "EGP",
  "ZAR",
  "INR",
  "AED",
] as const;

/**
 * Code de devise écrit dans un salaire, ou `null`.
 *
 * Ordre : littéraux explicites d'abord (un « CAD » ne doit jamais se
 * faire voler par le `$`), puis symboles (`€` → EUR, `$` → USD).
 */
export function salaryCurrency(salary: string | null | undefined): string | null {
  if (!salary) return null;
  const upper = salary.toUpperCase();
  const literal = CURRENCY_CODES.find((code) =>
    new RegExp(`\\b${code}\\b`).test(upper)
  );
  if (literal) return literal;
  // « FCFA » = XOF (franc CFA, zone BCEAO) : le seed l'écrit en toutes
  // lettres, on normalise vers le code ISO — le filtre API connaît l'alias.
  if (upper.includes("FCFA")) return "XOF";
  if (upper.includes("€")) return "EUR";
  if (upper.includes("$")) return "USD";
  return null;
}

/**
 * Termes à chercher dans `Job.salary` pour un filtre `?currency=`.
 * Un code peut porter des alias littéraux (XOF ⇄ FCFA) : le LIKE doit
 * couvrir les deux graphies, sinon « 150K FCFA / month » resterait
 * invisible derrière la puce « XOF ».
 */
export function currencyTerms(code: string): string[] {
  const upper = code.toUpperCase();
  if (upper === "XOF") return ["XOF", "FCFA"];
  return [upper];
}

/**
 * Codes présents dans une liste de salaires, triés, sans doublon ni vide.
 * C'est la source des puces de filtre de la section Jobs.
 */
export function salaryCurrencies(salaries: Array<string | null | undefined>): string[] {
  const codes = new Set<string>();
  for (const salary of salaries) {
    const code = salaryCurrency(salary);
    if (code) codes.add(code);
  }
  return [...codes].sort();
}
