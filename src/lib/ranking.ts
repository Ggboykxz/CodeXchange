/**
 * Classement du fil — les formules de Reddit, implémentées telles quelles.
 *
 * Tout est **pur** (aucun accès base, aucun `Date.now()` caché) : c'est ce
 * qui permet de le tester pièce par pièce, et la seule raison pour laquelle
 * `/api/threads` sait trier « chaud » ou « en croissance » sans SQL brut.
 *
 * Lexique Reddit repris à l'identique :
 *   hot     — score pondéré par l'ancienneté (l'algorithme historique) ;
 *   new     — chrono, les plus récentes d'abord ;
 *   top     — score brut, éventuellement borné à une fenêtre (t=day…) ;
 *   active  — le plus de réponses : ici, le signal « la discussion vit » ;
 *   rising  — ce qui progresse **maintenant** (votes des dernières 24 h).
 */

export const SORTS = ["hot", "new", "top", "active", "rising"] as const;
export type Sort = (typeof SORTS)[number];

export const DEFAULT_SORT: Sort = "hot";

export const TIME_WINDOWS = ["hour", "day", "week", "month", "year", "all"] as const;
export type TimeWindow = (typeof TIME_WINDOWS)[number];

/** Fenêtre de `?t=` — consommée par le tri `top`, comme sur Reddit. */
const WINDOW_MS: Record<TimeWindow, number | null> = {
  hour: 3_600_000,
  day: 86_400_000,
  week: 7 * 86_400_000,
  month: 30 * 86_400_000,
  year: 365 * 86_400_000,
  all: null,
};

/** L'invalide retombe sur le défaut plutôt que de faire échouer la page. */
export function parseSort(value: string | null | undefined): Sort {
  return (SORTS as readonly string[]).includes(value ?? "")
    ? (value as Sort)
    : DEFAULT_SORT;
}

export function parseWindow(value: string | null | undefined): TimeWindow {
  return (TIME_WINDOWS as readonly string[]).includes(value ?? "")
    ? (value as TimeWindow)
    : "all";
}

/** Début de fenêtre, ou `null` = « tout l'espace temps ». */
export function windowStart(window: TimeWindow, now: Date = new Date()): Date | null {
  const ms = WINDOW_MS[window];
  return ms === null ? null : new Date(now.getTime() - ms);
}

/**
 * Époque de Reddit (2005-12-08) : elle ne fait qu'ajouter une constante aux
 * scores sans jamais changer leur ordre — garder la même rend les valeurs
 * comparables à celles documentées par Reddit.
 */
const REDDIT_EPOCH_MS = Date.UTC(2005, 11, 8, 7, 46, 12);

/** Secondes correspondant à ~1,3 jour : le diviseur de l'algorithme hot. */
const HOT_DIVISOR = 113_486;

/**
 * « hot » = `log10(max(|score|, 1)) + 1`, appliqué avec le signe du score,
 * plus le rang temporel divisé par 113486 s (~1,3 jour) : gagner un jour de
 * fraîcheur vaut à peu près un cran de score, et un post à 100 points ne
 * devance un post du jour que s'il est moins d'1,5 jour plus ancien.
 *
 * Variante par rapport à la formule d'origine de Reddit : celle-ci classe
 * `s < 0` par `log10(|s|) - 1`, ce qui fait remonter un post à **-100 points
 * au-dessus d'un post à 0**. On applique donc `-magnitude` : le classement
 * reste strictement croissant en fonction du score, y compris négatif.
 */
export function hotScore(net: number, createdAt: Date | string): number {
  const magnitude = Math.log10(Math.max(Math.abs(net), 1)) + 1;
  const order = net > 0 ? magnitude : net < 0 ? -magnitude : 0;
  const seconds = new Date(createdAt).getTime() / 1000 - REDDIT_EPOCH_MS / 1000;
  return order + seconds / HOT_DIVISOR;
}

export type RankableThread = {
  id: string;
  pinned: boolean;
  /** Score **net** (↑ − ↓) : c'est celui que Reddit affiche. */
  upvotes: number;
  createdAt: Date | string;
  /** Nombre de réponses (`_count.posts`). */
  comments: number;
};

export type RankOptions = {
  /** Votes ↑ reçus dans les dernières 24 h, alimenté pour `rising`. */
  recentVotes?: ReadonlyMap<string, number>;
};

/** Du plus récent au plus ancien : le départage systématique. */
function newestFirst<T extends RankableThread>(a: T, b: T): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

/**
 * Applique un tri aux candidats déjà chargés, puis remet les épinglées en
 * tête — les « sticky » de Reddit restent en haut quel que soit le tri.
 * La partition est stable : l'ordre interne de chaque groupe est préservé.
 */
export function rankThreads<T extends RankableThread>(
  threads: readonly T[],
  sort: Sort,
  options: RankOptions = {}
): T[] {
  const recent = options.recentVotes;
  const ranked = [...threads];

  switch (sort) {
    case "new":
      ranked.sort(newestFirst);
      break;

    case "top":
      ranked.sort((a, b) => b.upvotes - a.upvotes || newestFirst(a, b));
      break;

    case "active":
      ranked.sort((a, b) => b.comments - a.comments || newestFirst(a, b));
      break;

    case "rising":
      // Momentum : ce qui reçoit des votes *en ce moment*, puis le score,
      // puis la fraîcheur. Un score acquis hier ne suffit plus à monter.
      ranked.sort(
        (a, b) =>
          (recent?.get(b.id) ?? 0) - (recent?.get(a.id) ?? 0) ||
          b.upvotes - a.upvotes ||
          newestFirst(a, b)
      );
      break;

    case "hot":
    default:
      ranked.sort(
        (a, b) =>
          hotScore(b.upvotes, b.createdAt) - hotScore(a.upvotes, a.createdAt) ||
          newestFirst(a, b)
      );
      break;
  }

  return [...ranked.filter((t) => t.pinned), ...ranked.filter((t) => !t.pinned)];
}
