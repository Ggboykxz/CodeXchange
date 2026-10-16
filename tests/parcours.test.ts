import { describe, expect, it } from "vitest";

import { construireParcours } from "@/lib/parcours";

const actions = {
  sujet: true,
  reponse: true,
  projet: false,
  offre: false,
  mentorat: true,
  evenement: false,
};

describe("parcours dev (étapes)", () => {
  it("coche exactement les étapes accomplies", () => {
    const etapes = construireParcours(actions);
    expect(etapes).toHaveLength(6);
    expect(etapes.filter((e) => e.fait).map((e) => e.id)).toEqual(["sujet", "reponse", "mentorat"]);
  });

  it("décoche tout pour un anonyme", () => {
    const etapes = construireParcours({ sujet: false, reponse: false, projet: false, offre: false, mentorat: false, evenement: false });
    expect(etapes.every((e) => !e.fait)).toBe(true);
  });

  it("conserve les liens de destination", () => {
    const etapes = construireParcours(actions);
    expect(etapes[0].href).toBe("/forum/nouveau");
    expect(etapes[5].href).toBe("/evenements");
  });
});
