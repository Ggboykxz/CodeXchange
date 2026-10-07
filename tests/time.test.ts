import { describe, expect, it } from "vitest";
import { timeAgo, timeAgoLong } from "@/lib/time";

/**
 * Le fil affiche une date relative à côté de chaque publication : c'est le
 * réflexe « à quel point c'est récent ? » de tout réseau social. Le format est
 * court (`3h`) parce qu'il est répété des dizaines de fois par écran, et il
 * doit changer de langue comme le reste de l'interface.
 */
describe("timeAgo", () => {
  const secondsAgo = (s: number) => new Date(Date.now() - s * 1000).toISOString();

  it("affiche « maintenant » sous une minute, selon la locale", () => {
    expect(timeAgo(secondsAgo(0), "fr")).toBe("maintenant");
    expect(timeAgo(secondsAgo(59), "fr")).toBe("maintenant");
    expect(timeAgo(secondsAgo(0), "en")).toBe("now");
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
    const out = timeAgo(secondsAgo(40 * 24 * 60 * 60), "fr");
    expect(out).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
  });

  it("n'affiche jamais de valeur négative si l'horloge part en avance", () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    expect(timeAgo(future, "fr")).toBe("maintenant");
  });
});

describe("timeAgoLong", () => {
  it("produit une phrase lisible, dans la bonne langue", () => {
    // Intl insère des espaces insécables en français : on normalise avant
    // la comparaison pour ne pas tester l'espace plutôt que le texte.
    const norm = (s: string) => s.replace(/\s+/g, " ").trim();
    const d = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    expect(norm(timeAgoLong(d, "fr"))).toBe("il y a 3 h");
    expect(norm(timeAgoLong(d, "en"))).toBe("3 hr. ago");
  });

  it("couvre le cas « à l'instant »", () => {
    expect(timeAgoLong(new Date().toISOString(), "fr")).toBe("maintenant");
  });
});
