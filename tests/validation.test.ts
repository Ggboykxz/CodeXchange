import { expect, test } from "vitest";
import { validerEmail, validerMotDePasse, validerObligatoire, premiereErreur } from "../src/lib/validation";

test("validerEmail accepte les e-mails valides et rejette les autres", () => {
  expect(validerEmail("aicha@example.com")).toBeNull();
  expect(validerEmail("a.b+c@sub.example.co")).toBeNull();
  expect(validerEmail("")).not.toBeNull();
  expect(validerEmail("pas-un-email")).not.toBeNull();
  expect(validerEmail("a@b")).not.toBeNull();
});

test("validerMotDePasse exige 8+ caractères, lettres et chiffres", () => {
  expect(validerMotDePasse("CodeXchange2026!")).toBeNull();
  expect(validerMotDePasse("court")).not.toBeNull();
  expect(validerMotDePasse("toutenlettres")).not.toBeNull();
  expect(validerMotDePasse("12345678")).not.toBeNull();
  expect(validerMotDePasse("")).not.toBeNull();
});

test("validerObligatoire vérifie présence et bornes", () => {
  expect(validerObligatoire("Gabon", "Le pays", 2, 80)).toBeNull();
  expect(validerObligatoire("  ", "Le pays", 2, 80)).not.toBeNull();
  expect(validerObligatoire("A", "Le nom", 2, 80)).not.toBeNull();
  expect(validerObligatoire("x".repeat(81), "Le nom", 2, 80)).not.toBeNull();
});

test("premiereErreur renvoie la première erreur non nulle", () => {
  expect(premiereErreur([null, "deuxième", null])).toBe("deuxième");
  expect(premiereErreur([null, null])).toBeNull();
});
