import { estTheme, themeEffectif } from "../src/lib/theme";

test("estTheme accepte light/dark/auto", () => {
  expect(estTheme("light")).toBe(true);
  expect(estTheme("dark")).toBe(true);
  expect(estTheme("auto")).toBe(true);
  expect(estTheme("nope")).toBe(false);
  expect(estTheme(undefined)).toBe(false);
});

test("themeEffectif résout auto en light sans window", () => {
  expect(themeEffectif("light")).toBe("light");
  expect(themeEffectif("dark")).toBe("dark");
  expect(themeEffectif("auto")).toBe("light");
});
