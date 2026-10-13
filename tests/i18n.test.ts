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
