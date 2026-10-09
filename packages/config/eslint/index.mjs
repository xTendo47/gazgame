// Общие правила ESLint для всего монорепо GAZ Game.
// Главное здесь — ГРАНИЦЫ ИМПОРТОВ: какой пакет от какого может зависеть.
// Если нарушить границу, `npm run lint` покажет ошибку с объяснением.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

/** Группы запрещённых импортов. */
const GROUPS = {
  react: {
    group: ["react", "react/*", "react-dom", "react-dom/*", "motion", "motion/*", "lucide-react"],
    message: "React здесь запрещён: этот пакет должен работать без интерфейса (бот, сервер, тесты).",
  },
  next: {
    group: ["next", "next/*", "@vercel/*"],
    message: "Next.js здесь запрещён: код должен работать вне веб-приложения.",
  },
  content: {
    group: ["@gazgame/content", "@gazgame/content/*"],
    message: "Этот пакет не должен зависеть от контента.",
  },
  engine: {
    group: ["@gazgame/engine", "@gazgame/engine/*"],
    message: "Этот пакет не должен зависеть от движка.",
  },
  ui: {
    group: ["@gazgame/ui", "@gazgame/ui/*"],
    message: "UI-компоненты можно использовать только в apps/web.",
  },
  agents: {
    group: ["@gazgame/agents", "@gazgame/agents/*"],
    message: "ИИ-агенты подключаются только на сервере (apps/api).",
  },
  apps: {
    group: ["@gazgame/web", "@gazgame/web/*", "@gazgame/bot", "@gazgame/bot/*", "**/apps/**"],
    message: "Пакеты (packages/*) и приложения не импортируют код других приложений.",
  },
};

/**
 * Правило границ: передай названия групп, которые запрещены в этом пакете.
 * @param {(keyof typeof GROUPS)[]} banned
 */
export function boundaries(...banned) {
  return {
    name: "gazgame/boundaries",
    rules: {
      "no-restricted-imports": ["error", { patterns: banned.map((name) => GROUPS[name]) }],
    },
  };
}

/** Базовые правила для TypeScript-пакетов. */
export const base = tseslint.config(
  { ignores: ["**/node_modules/**", "**/dist/**", "**/.next/**", "**/.turbo/**", "**/coverage/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    name: "gazgame/base",
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
);

/** Дополнительно для React-пакетов (packages/ui). */
export const react = [
  {
    name: "gazgame/react-hooks",
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
