import { describe, expect, it } from "vitest";
import {
  DEFAULT_SORT,
  hotScore,
  parseSort,
  parseWindow,
  rankThreads,
  windowStart,
  type RankableThread,
} from "@/lib/ranking";

const NOW = new Date("2026-10-07T12:00:00.000Z");
const H = 3_600_000;
const DAY = 24 * H;

/** Construction compacte : score, âge en heures, réponses, épinglage. */
const thread = (
  id: string,
  upvotes: number,
  hoursAgo: number,
  comments = 0,
  pinned = false
): RankableThread => ({
  id,
  pinned,
  upvotes,
  comments,
  createdAt: new Date(NOW.getTime() - hoursAgo * H).toISOString(),
});

const ids = (list: RankableThread[]) => list.map((t) => t.id);

/* ------------------------------------------------------------------ */
/* Paramètres                                                          */
/* ------------------------------------------------------------------ */

describe("parseSort / parseWindow", () => {
  it.each(["hot", "new", "top", "active", "rising"])("accepte le tri %s", (s) => {
    expect(parseSort(s)).toBe(s);
  });

  it.each([null, undefined, "", "best", "controversial", "HOT"])(
    "retombe sur %s → tri par défaut",
    (s) => {
      expect(parseSort(s)).toBe(DEFAULT_SORT);
    }
  );

  it.each(["hour", "day", "week", "month", "year", "all"])(
    "accepte la fenêtre %s",
    (w) => {
      expect(parseWindow(w)).toBe(w);
    }
  );

  it.each([null, "", "century", "DAY"])("fenêtre inconnue → all (%s)", (w) => {
    expect(parseWindow(w)).toBe("all");
  });
});

describe("windowStart", () => {
  it("`all` ne borne rien (null = tout l'espace temps)", () => {
    expect(windowStart("all", NOW)).toBeNull();
  });

  it("borne exactement la fenêtre demandée", () => {
    expect(windowStart("hour", NOW)?.getTime()).toBe(NOW.getTime() - H);
    expect(windowStart("day", NOW)?.getTime()).toBe(NOW.getTime() - DAY);
    expect(windowStart("week", NOW)?.getTime()).toBe(NOW.getTime() - 7 * DAY);
    expect(windowStart("month", NOW)?.getTime()).toBe(NOW.getTime() - 30 * DAY);
    expect(windowStart("year", NOW)?.getTime()).toBe(NOW.getTime() - 365 * DAY);
  });

  it("le résultat est strictement antérieur à `now`", () => {
    expect(windowStart("day", NOW)!.getTime()).toBeLessThan(NOW.getTime());
  });
});

/* ------------------------------------------------------------------ */
/* hot                                                                 */
/* ------------------------------------------------------------------ */

describe("hotScore — l'algorithme chaud de Reddit", () => {
  it("croît avec le score, à date égale", () => {
    const at = new Date(NOW);
    expect(hotScore(10, at)).toBeGreaterThan(hotScore(1, at));
    expect(hotScore(100, at)).toBeGreaterThan(hotScore(10, at));
  });

  it("reste strictement croissant du négatif au positif", () => {
    // La formule d'origine de Reddit classait -100 points AU-DESSUS de 0 :
    // notre variante doit être monotone.
    const at = new Date(NOW);
    expect(hotScore(0, at)).toBeGreaterThan(hotScore(-100, at));
    expect(hotScore(0, at)).toBeGreaterThan(hotScore(-10, at));
    expect(hotScore(-10, at)).toBeGreaterThan(hotScore(-100, at));
  });

  it("favorise la fraîcheur : même score, plus récent = plus haut", () => {
    const recent = new Date(NOW.getTime() - 1 * H);
    const old = new Date(NOW.getTime() - 5 * DAY);
    expect(hotScore(5, recent)).toBeGreaterThan(hotScore(5, old));
  });

  it("la fraîcheur vaut ~1 jour de score : un carton du jour passe devant", () => {
    const today = new Date(NOW.getTime() - 2 * H);
    const lastWeek = new Date(NOW.getTime() - 7 * DAY);
    // 1 000 points vieux d'une semaine vs 0 point publié aujourd'hui.
    expect(hotScore(0, today)).toBeGreaterThan(hotScore(1000, lastWeek));
  });

  it("est déterministe (pas d'horloge cachée)", () => {
    const at = new Date(NOW);
    expect(hotScore(7, at)).toBe(hotScore(7, at));
  });
});

/* ------------------------------------------------------------------ */
/* rankThreads                                                         */
/* ------------------------------------------------------------------ */

describe("rankThreads", () => {
  const pool = [
    thread("ancien-populaire", 90, 24 * 6, 12),
    thread("recent", 4, 2, 1),
    thread("moyen", 30, 24, 5),
    thread("zero", 0, 1, 0),
  ];

  it("new : du plus récent au plus ancien", () => {
    expect(ids(rankThreads(pool, "new", { }))).toEqual([
      "zero",
      "recent",
      "moyen",
      "ancien-populaire",
    ]);
  });

  it("top : du meilleur score au plus mauvais, puis le plus récent", () => {
    expect(ids(rankThreads(pool, "top"))).toEqual([
      "ancien-populaire",
      "moyen",
      "recent",
      "zero",
    ]);
  });

  it("active : le plus de réponses d'abord", () => {
    expect(ids(rankThreads(pool, "active"))).toEqual([
      "ancien-populaire",
      "moyen",
      "recent",
      "zero",
    ]);
  });

  it("hot : un carton ancien perd contre du récent, mais pas contre rien", () => {
    const ranked = ids(rankThreads(pool, "hot"));
    expect(ranked[0]).toBe("moyen"); // 30 pts d'hier bat 90 pts d'il y a 6 jours
    expect(ranked).toContain("ancien-populaire");
    expect(ranked.indexOf("zero")).toBeGreaterThan(ranked.indexOf("moyen"));
  });

  it("rising : ce qui reçoit des votes *maintenant* passe devant", () => {
    const recentVotes = new Map([
      ["ancien-populaire", 2],
      ["zero", 9],
    ]);
    expect(ids(rankThreads(pool, "rising", { recentVotes }))).toEqual([
      "zero",
      "ancien-populaire",
      "moyen", // pas de vote récent → départage par score (30 > 4)
      "recent",
    ]);
  });

  it("rising sans signal récent retombe sur le score", () => {
    expect(ids(rankThreads(pool, "rising"))).toEqual(ids(rankThreads(pool, "top")));
  });

  it("les épinglées passent en tête, quel que soit le tri", () => {
    const withPinned = [...pool, thread("epingle", 1, 24 * 30, 0, true)];
    for (const sort of ["hot", "new", "top", "active", "rising"] as const) {
      expect(ids(rankThreads(withPinned, sort))[0]).toBe("epingle");
    }
  });

  it("une épinglée ne gâche pas l'ordre du reste du groupe", () => {
    const withPinned = [
      thread("a", 1, 3, 0, true),
      ...pool,
      thread("b", 2, 4, 0, true),
    ];
    expect(ids(rankThreads(withPinned, "new"))).toEqual([
      "a",
      "b",
      "zero",
      "recent",
      "moyen",
      "ancien-populaire",
    ]);
  });

  it("ne mutate pas le tableau d'entrée", () => {
    const input = [...pool];
    rankThreads(input, "top");
    expect(ids(input)).toEqual(ids(pool));
  });

  it("accepte une entrée vide", () => {
    expect(rankThreads([], "hot")).toEqual([]);
  });

  it("détient un id non exposé : pas de fuite d'identifiant interne", () => {
    expect(rankThreads([thread("x", 1, 1)], "hot")).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ */
/* Fenêtres de temps appliquées au tri top                             */
/* ------------------------------------------------------------------ */

describe("fenêtre de temps × top", () => {
  const items = [
    thread("aujourdhui", 5, 3),
    thread("cette-semaine", 50, 3 * DAY / H),
    thread("ce-mois", 500, 20 * DAY / H),
  ];

  const within = (window: "day" | "week" | "month" | "all") => {
    const start = windowStart(window, NOW);
    return items.filter(
      (t) => !start || new Date(t.createdAt).getTime() >= start.getTime()
    );
  };

  it("t=day ne garde que la journée, puis top classe dedans", () => {
    expect(ids(rankThreads(within("day"), "top"))).toEqual(["aujourdhui"]);
  });

  it("t=week inclut la semaine mais pas le mois", () => {
    expect(ids(rankThreads(within("week"), "top"))).toEqual([
      "cette-semaine",
      "aujourdhui",
    ]);
  });

  it("t=all garde tout, du meilleur score au moins bon", () => {
    expect(ids(rankThreads(within("all"), "top"))).toEqual([
      "ce-mois",
      "cette-semaine",
      "aujourdhui",
    ]);
  });
});
