<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# GAZ Game — правила для ИИ-агентов

Игры и психологические тесты для пар, компаний и соло. Аудитория 16–25, Россия и СНГ. Слоган: «Не сиди. Не тупи. Газ!».
Подробная архитектура — в `docs/ARCHITECTURE.md`.

## Стек

- npm workspaces + Turborepo, TypeScript strict (TS 6.0: 7.x пока не поддерживается typescript-eslint), ESLint 9.
- `apps/web`: Next.js 16 (App Router, Turbopack), React 19, Tailwind v4, motion, lucide-react.
- `apps/bot`: grammY, запуск через `tsx`.
- Пакеты отдают исходники `.ts` (без сборки). Тесты — Vitest.

## Команды (из корня)

```
npm run dev            # сайт, http://localhost:3000
npm run dev:bot        # бот (apps/bot/.env)
npm run check          # lint + typecheck + test + build — запускать перед тем, как сказать «готово»
npm run content:check  # проверить JSON-контент
npm run schema --workspace=@gazgame/content   # обновить JSON Schema после правки schema.ts
npm run icons --workspace=@gazgame/web        # перегенерировать иконки PWA
```

## Границы импортов (ESLint no-restricted-imports — не обходить)

- `content`: ни от чего не зависит (только zod).
- `engine`: только `content`. Без React, DOM, Next.js (в tsconfig нет DOM-типов).
- `ui`: React. Не импортирует Next.js, content, engine, apps. Ссылки делаются так: `<Link className={buttonVariants()}>` или `<Link className="group block"><Tile/></Link>`.
- `agents`: `content` + `engine`, без React. Никаких вызовов моделей и ключей — только в будущем `apps/api`.
- `apps/bot`: только `content` и `engine`.
- `apps/web`: всё из `packages/*`.

## Правила контента

- Новый тест или игра = новый JSON в `packages/content/data/{tests,games}/`. Код движка не меняется.
- Схемы — `packages/content/src/schema.ts` (zod, `strictObject`). Новые поля добавляй только как `.optional()` или `.default()`, чтобы старые файлы не ломались.
- Новая механика: схема → редьюсер в `engine/src/mechanics/` + тесты → компонент в `apps/web/components/games/` + ветка в `GameScreen`.
- Стартовый контент — черновики (`status: "draft"`, пометка `[черновик]`). Настоящий контент пишет основатель. Не выдумывай «финальные» тексты.
- 18+ — только через `ageRating` и возрастной гейт. В MVP контента 18+ нет.

## Правила работы

- Весь интерфейс на русском. Тон дерзкий и дружелюбный («Газ!» вместо «Начать»).
- Mobile-first: крупные кнопки (min-h 48–64px), без горизонтального скролла, aria-метки, видимый фокус.
- Server Components по умолчанию. `"use client"` — только где нужна интерактивность.
- Прогресс — только через `ProgressStore` (`apps/web/lib/progress.ts`), не через прямой `localStorage`.
- События аналитики — только через `apps/web/lib/analytics.ts`, без личных данных.
- Секреты — только в `.env` (в `.gitignore`), пример — в `.env.example`.
- Не добавляй функции сверх MVP: запиши идею в `docs/IDEAS.md`.
- Знакомства и чаты между пользователями не делаем (несовершеннолетние в аудитории).
- Пользователь работает на Windows (PowerShell). Команды для него — под PowerShell.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
