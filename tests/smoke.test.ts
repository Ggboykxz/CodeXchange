import { expect, test } from "vitest";

test("la couche métier est importable et expose AppError", async () => {
  const lib = await import("../src/lib/errors");
  expect(Object.keys(lib)).toContain("AppError");
});
