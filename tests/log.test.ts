import { describe, expect, it } from "vitest";
import { buildLogEntry, formatLogLine } from "@/lib/log";

/* J8 — le format d'événement doit être exploitable par un agrégateur. */
const KEYS_RE = /^\{.*\}$/;

describe("log — formatage structuré", () => {
  it("produit du JSON sur une seule ligne", () => {
    const line = buildLogEntry("error", "Create post error", {
      error: "boom",
    });
    expect(KEYS_RE.test(line)).toBe(true);
    const parsed = JSON.parse(line);
    expect(parsed.level).toBe("error");
    expect(parsed.message).toBe("Create post error");
    expect(parsed.error).toBe("boom");
    expect(typeof parsed.ts).toBe("string");
  });

  it("élargit le contexte dans l'entrée", () => {
    const parsed = JSON.parse(
      buildLogEntry("info", "task done", { userId: "u1", took: 12 })
    );
    expect(parsed.userId).toBe("u1");
    expect(parsed.took).toBe(12);
  });

  it("en hors production, charge une ligne lisible avec le contexte", () => {
    const line = formatLogLine("warn", "slow", { ms: 430 });
    expect(line).toContain("[warn]");
    expect(line).toContain("slow");
    expect(line).toContain('"ms":430');
  });
});
