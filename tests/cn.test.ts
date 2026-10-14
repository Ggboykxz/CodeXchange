import { expect, test } from "vitest";
import { cn } from "../src/lib/cn";

test("cn: la dernière classe gagne sur un même utilitaire Tailwind", () => {
  expect(cn("p-2", "p-4")).toBe("p-4");
});

test("cn: ignore les valeurs falsy (false && \"p-4\")", () => {
  const cond = false;
  expect(cn("p-2", cond && "p-4")).toBe("p-2");
});

test("cn: accepte les objets de conditions (clsx)", () => {
  expect(cn("rounded-lg", [{ "rounded-xl": true }])).toBe("rounded-xl");
});
