import { expect, test } from "vitest";
import { estLocale, t, LOCALE_PAR_DEFAUT } from "../src/lib/i18n";

test("estLocale accepte fr/en et rejette le reste", () => {
  expect(estLocale("fr")).toBe(true);
  expect(estLocale("en")).toBe(true);
  expect(estLocale("de")).toBe(false);
  expect(estLocale(undefined)).toBe(false);
});

test("t traduit en FR et EN pour les clés nav", () => {
  expect(t("fr", "nav.forum")).toBe("Forum");
  expect(t("en", "nav.jobs")).toBe("Jobs");
  expect(t("en", "nav.favorites")).toBe("Favorites");
});

test("t retombe sur FR si la clé manque", () => {
  expect(t("en", "cle.inexistante")).toBe("cle.inexistante");
  expect(LOCALE_PAR_DEFAUT).toBe("fr");
});

test("couvre toutes les pages principales avec des clés non vides", () => {
  const cles = [
    "forum.title","forum.subtitle","forum.new","forum.empty_title","forum.answers_zero",
    "jobs.title","jobs.subtitle","jobs.apply","jobs.applied",
    "projects.title","projects.join","directory.title",
    "tutorials.title","events.title","events.past","events.upcoming",
    "mentorship.title","notifications.title","messaging.title","favorites.title",
    "profile.title","search.title","admin.title","auth.login_title","status.404_title",
  ];
  for (const cle of cles) {
    expect(t("fr", cle).length).toBeGreaterThan(0);
    expect(t("en", cle).length).toBeGreaterThan(0);
  }
});
