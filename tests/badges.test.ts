import { describe, expect, it } from "vitest";
import {
  BADGES,
  badgeKey,
  computeBadges,
  reputationLevel,
} from "@/lib/badges";

const EMPTY = { threads: 0, posts: 0, accepted: 0, mentorships: 0 };

describe("reputationLevel", () => {
  it("classe les seuils croissants", () => {
    expect(reputationLevel(0).id).toBe("novice");
    expect(reputationLevel(49).id).toBe("novice");
    expect(reputationLevel(50).id).toBe("contributeur");
    expect(reputationLevel(199).id).toBe("contributeur");
    expect(reputationLevel(200).id).toBe("expert");
    expect(reputationLevel(499).id).toBe("expert");
    expect(reputationLevel(500).id).toBe("legende");
    expect(reputationLevel(10_000).id).toBe("legende");
  });

  it("retombe sur novice pour un score négatif", () => {
    expect(reputationLevel(-12).id).toBe("novice");
  });

  it("expose la clé i18n du palier", () => {
    expect(reputationLevel(250).key).toBe("tier.expert");
  });
});

describe("computeBadges", () => {
  it("ne mérite rien avec des compteurs à zéro", () => {
    expect(computeBadges(EMPTY)).toEqual([]);
  });

  it("ouvre les jalons de première contribution", () => {
    expect(computeBadges({ ...EMPTY, threads: 1 })).toEqual(["question"]);
    expect(computeBadges({ ...EMPTY, posts: 1 })).toEqual(["reponse"]);
    expect(computeBadges({ ...EMPTY, accepted: 1 })).toEqual(["acceptee"]);
    expect(computeBadges({ ...EMPTY, mentorships: 1 })).toEqual(["mentor"]);
  });

  it("garde l'ordre du catalogue et ne compte pas les sous-seuils", () => {
    const badges = computeBadges({ threads: 3, posts: 24, accepted: 2, mentorships: 0 });
    expect(badges).toEqual(["question", "reponse", "acceptee"]);
    // 25 réponses = palier « plume » franchi.
    expect(computeBadges({ ...EMPTY, posts: 25 })).toEqual(["reponse", "plume"]);
  });

  it("combine tous les jalons atteints", () => {
    expect(
      computeBadges({ threads: 1, posts: 30, accepted: 4, mentorships: 1 })
    ).toEqual(["question", "reponse", "acceptee", "plume", "mentor"]);
  });
});

describe("badgeKey", () => {
  it("résout la clé i18n depuis le catalogue", () => {
    expect(BADGES.length).toBeGreaterThan(0);
    for (const b of BADGES) expect(badgeKey(b.id)).toBe(b.key);
    expect(badgeKey("inconnu" as never)).toBe("badge.inconnu");
  });
});
