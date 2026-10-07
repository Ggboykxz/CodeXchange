import { describe, expect, it } from "vitest";
import { timeAgo, timeAgoLong } from "@/lib/time";

/**
 * Le fil d'affiche une date relative à côté de chaque publication : c'est le
 * réflexe « à quel point c'est récent ? » de tout réseau social. Le format est
 * court (`3h`) parce qu'il est répété des dizaines de fois par écran.
 */
describe("timeAgo", () => {
  const secondsAgo = (s: number) => new Date(Date.now() - s * 1000).toISOString();

  it("affiche « now » sous une minute", () => {
    expect(timeAgo(secondsAgo(0))).toBe("now");
    expect(timeAgo(secondsAgo(59))).toBe("now");
  });

  it("passe aux minutes, puis aux heures, puis aux jours", () => {
    expect(timeAgo(secondsAgo(60))).toBe("1m");
    expect(timeAgo(secondsAgo(59 * 60))).toBe("59m");
    expect(timeAgo(secondsAgo(60 * 60))).toBe("1h");
    expect(timeAgo(secondsAgo(23 * 60 * 60))).toBe("23h");
    expect(timeAgo(secondsAgo(24 * 60 * 60))).toBe("1j");
    expect(timeAgo(secondsAgo(29 * 24 * 60 * 60))).toBe("29j");
  });

  it("retombe sur une date au-delà de 30 jours", () => {
    const out = timeAgo(secondsAgo(40 * 24 * 60 * 60));
    expect(out).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
  });

  it("n'affiche jamais de valeur négative si l'horloge part en avance", () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    expect(timeAgo(future)).toBe("now");
  });
});

describe("timeAgoLong", () => {
  it("produit une phrase lisible (utilisée dans les titres/aria)", () => {
    const d = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    expect(timeAgoLong(d)).toBe("il y a 3 h");
  });

  it("couvre le cas « à l'instant »", () => {
    expect(timeAgoLong(new Date().toISOString())).toBe("à l'instant");
  });
});
