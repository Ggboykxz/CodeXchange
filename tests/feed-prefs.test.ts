import { beforeEach, describe, expect, it } from "vitest";
import { useFeedPrefsStore } from "@/store/feed-prefs-store";

/*
 * Même logique de fil que Reddit, testée sans DOM : la suite tourne en
 * `node`, donc `localStorage` est absent — `persist` retombe sur un état en
 * mémoire, ce qui suffit pour vérifier les transitions.
 */
const STORE = useFeedPrefsStore;

describe("feed-prefs-store — sauvegardes / masquages", () => {
  beforeEach(() => {
    STORE.setState({ saved: [], hidden: [] });
  });

  it("ajoute puis retire des sauvegardes", () => {
    STORE.getState().toggleSave("a");
    expect(STORE.getState().saved).toEqual(["a"]);
    STORE.getState().toggleSave("b");
    expect(STORE.getState().saved).toEqual(["a", "b"]);
    STORE.getState().toggleSave("a");
    expect(STORE.getState().saved).toEqual(["b"]);
  });

  it("masque puis restaure une publication", () => {
    STORE.getState().hide("x");
    expect(STORE.getState().hidden).toEqual(["x"]);
    STORE.getState().restore("x");
    expect(STORE.getState().hidden).toEqual([]);
  });

  it("ne duplique pas un masquage répété", () => {
    STORE.getState().hide("x");
    STORE.getState().hide("x");
    expect(STORE.getState().hidden).toEqual(["x"]);
  });

  it("« Tout réafficher » vide les masquages", () => {
    STORE.getState().hide("a");
    STORE.getState().hide("b");
    STORE.getState().restoreAll();
    expect(STORE.getState().hidden).toEqual([]);
  });

  it("les masquages et les sauvegardes restent indépendants", () => {
    STORE.getState().toggleSave("a");
    STORE.getState().hide("a");
    expect(STORE.getState().saved).toEqual(["a"]);
    expect(STORE.getState().hidden).toEqual(["a"]);
  });
});
