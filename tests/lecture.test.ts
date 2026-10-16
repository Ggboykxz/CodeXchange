import { describe, expect, it } from "vitest";

import { compterMots, formatDureeLecture, tempsDeLectureMin } from "@/lib/lecture";

describe("temps de lecture", () => {
  it("estime en minutes (200 mots/min, minimum 1)", () => {
    const court = "Un petit texte de démonstration pour vérifier le compteur de mots.";
    expect(tempsDeLectureMin(court)).toBe(1);

    const long = Array.from({ length: 200 }, (_, i) => `mot${i}`).join(" ");
    expect(tempsDeLectureMin(long)).toBe(1);
    expect(tempsDeLectureMin(long + " " + long)).toBe(2);
  });

  it("ignore le markdown et les URLs dans le comptage", () => {
    const texte = "# Titre\n\n```js\nconst a = 1;\n```\n\nhttps://exemple.dev\n\n- item";
    // Le bloc de code et l'URL ne comptent pas comme des mots lisibles.
    expect(compterMots(texte)).toBeLessThan(12);
    expect(compterMots(texte)).toBeGreaterThanOrEqual(2);
  });

  it("formate en « 3 min »", () => {
    const long = Array.from({ length: 600 }, (_, i) => `w${i}`).join(" ");
    expect(formatDureeLecture(long)).toBe("3 min");
  });
});
