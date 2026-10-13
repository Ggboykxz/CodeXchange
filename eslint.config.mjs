import { defineConfig, globalIgnores } from "eslint/config";
import { FlatCompat } from "@eslint/eslintrc";

// eslint-config-next@15 livre encore des configs « eslintrc » : FlatCompat
// les convertit en config plate pour ESLint 9.
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  globalIgnores([".next/**", "node_modules/**", "out/**", "build/**", "next-env.d.ts"]),
]);
