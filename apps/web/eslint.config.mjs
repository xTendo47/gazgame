import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { boundaries } from "@gazgame/config/eslint";

// apps/web может импортировать всё из packages/*, но не код других приложений.
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  boundaries("apps"),
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
