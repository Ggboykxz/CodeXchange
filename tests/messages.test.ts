import { describe, expect, it } from "vitest";
import {
  isParticipant,
  messagePreview,
  pairOf,
  peerOf,
} from "@/lib/messages";

const A = "aaa";
const B = "bbb";

describe("pairOf", () => {
  it("normalise dans les deux sens (une seule conversation par binôme)", () => {
    expect(pairOf(A, B)).toEqual([A, B]);
    expect(pairOf(B, A)).toEqual([A, B]);
  });

  it("refuse un auto-message", () => {
    expect(() => pairOf(A, A)).toThrow("self-conversation");
  });

  it("reste déterministe sur des ids de longueurs différentes", () => {
    expect(pairOf("user_10", "user_2")).toEqual(["user_10", "user_2"]);
    expect(pairOf("user_2", "user_10")).toEqual(["user_10", "user_2"]);
  });
});

describe("isParticipant / peerOf", () => {
  const conv = { userAId: A, userBId: B };

  it("les deux membres participent, un tiers non", () => {
    expect(isParticipant(conv, A)).toBe(true);
    expect(isParticipant(conv, B)).toBe(true);
    expect(isParticipant(conv, "ccc")).toBe(false);
  });

  it("peerOf renvoie le bon bout, null pour un tiers", () => {
    expect(peerOf(conv, A)).toBe(B);
    expect(peerOf(conv, B)).toBe(A);
    expect(peerOf(conv, "ccc")).toBe(null);
  });
});

describe("messagePreview", () => {
  it("tasse tous les espaces en une ligne", () => {
    expect(messagePreview("Salut\n  comment  ça va ?")).toBe("Salut comment ça va ?");
  });

  it("tronque proprement au maximum", () => {
    const long = "x".repeat(200);
    const out = messagePreview(long, 80);
    expect(out).toHaveLength(80);
    expect(out.endsWith("…")).toBe(true);
  });

  it("ne touche pas un texte déjà court", () => {
    expect(messagePreview("OK")).toBe("OK");
  });
});
