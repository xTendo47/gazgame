# Архитектура GAZ Game

## Главная идея

**Контент отделён от кода.** Тесты и игры — это JSON-файлы. Движок один, и он не знает ни одного конкретного теста.
Новый тест = новый файл в `packages/content/data/`, без изменения кода.

У продукта три входа: веб (PWA), Telegram Mini App и Telegram-бот. Контент и логика у них общие.

## Монорепо

npm workspaces + Turborepo. Весь код на TypeScript (strict).

```
gazgame/
├── apps/
│   ├── web/        Next.js (App Router): PWA + Telegram Mini App. Ядро продукта.
│   ├── bot/        Telegram-бот (grammY): вход, каталог, кнопка Mini App.
│   ├── api/        ЗАРЕЗЕРВИРОВАНО: оплата, профили, ИИ-агенты. Только README.
│   └── ultimate/   ЗАРЕЗЕРВИРОВАНО: отдельное приложение «Становление». Только README.
├── packages/
│   ├── content/    JSON-контент (data/) + zod-схемы (src/schema.ts) + загрузчик.
│   ├── engine/     Чистая логика: подсчёт тестов, механики игр, тиры, прогресс.
│   ├── ui/         React-компоненты дизайн-системы + токены Tailwind (theme.css).
│   ├── agents/     ЗАРЕЗЕРВИРОВАНО: типы и правила ИИ-персонажей.
│   └── config/     Общие tsconfig и ESLint (включая границы импортов).
└── docs/
```

Пакеты не собираются отдельно: они экспортируют исходники TypeScript, а Next.js, `tsx` и Vitest компилируют их на лету.

## Границы импортов

Закреплены правилом ESLint `no-restricted-imports` (`packages/config/eslint/index.mjs`). При нарушении `npm run lint` падает с объяснением.

```
content  ← ни от чего не зависит (только zod)
engine   ← content            (без React, DOM, Next.js; в tsconfig нет DOM-типов)
ui       ← только React       (не знает про Next.js, контент, движок, приложения)
agents   ← content, engine    (без React; вызовы моделей — только в apps/api)
bot      ← content, engine    (React, UI и агенты запрещены)
web      ← всё из packages/*
```

Почему так: движок и контент работают одинаково в браузере, боте и на будущем сервере. UI можно переиспользовать в Ultimate.

## Контент-модель

Схемы лежат в `packages/content/src/schema.ts`. Инструкция для редактора — в [CONTENT-GUIDE.md](CONTENT-GUIDE.md).

**Общие поля** (тест и игра): `id`, `slug`, `title`, `description`, `emoji`, `sections[]` (`pairs`/`company`/`solo`, можно несколько), `kind`, `tier` (`free`/`premium`/`supreme`), `ageRating` (`all`/`16+`/`18+`), `players {min,max}`, `durationMin`, `tags[]`, `related[]`, `status` (`draft`/`published`).

**Тест:** `scoring` (сейчас `types`), `questions[].options[]`. У каждого варианта есть `type` (+1 результату) или `scores` (баллы по шкалам). В `results[]` у каждого результата бесплатный `text` и закрытый `deepTeaser { tier, text }`. Расширенный формат: `scoring`-объект с `tieBreak` и `blend`, у результатов `paragraphs`/`strengths`/`watchOut`/`tip`, у теста `blendNotes` и `upsell` (см. CONTENT-GUIDE).

**Игра:** `mechanic` (`deck` | `vote` | `guess-partner`), `rules[]`, `decks[]`. У каждой колоды свои `tier` и `ageRating` (например, «Весело» free и «Глубоко» premium). Карточка: `text` и необязательные `type`, `award`, `options`, `source` (`official`/`community`).

**Проверка:** при загрузке каждый файл проходит zod-схему (строгую: опечатка в имени поля — это ошибка). Затем проверяются связи: уникальность `id` и `slug`, существование `related`, ссылки вариантов на результаты. Ошибки выводятся на русском с именем файла.

### Как расширять

| Что добавить | Где |
|---|---|
| Новая механика игры | `MECHANICS` и схема в `content/schema.ts` → редьюсер в `engine/src/mechanics/` → компонент в `web/components/games/` и строка в `GameScreen` |
| Новый способ подсчёта теста | `SCORING_METHODS` → ветка `switch` в `engine/test-runner.ts` |
| 18+ | Контент с `ageRating: "18+"` уже поддержан схемой. Показ — только после возрастного гейта (`allowAdult` в `VisibilityOptions`). В MVP 18+ нет |
| Пользовательские карточки | `source: "community"` у карточки. Приём и модерация — в `apps/api` |
| ИИ-агенты | `packages/agents`: контекст из результатов тестов (`buildAgentContext`) |

## Движок (`packages/engine`)

- `scoreTest(test, answers)` — подсчёт результата. При ничьей решают баллы за `tieBreak.lastQuestions`, затем порядок `scoring.types` (или `results`). Если второй тип отстал не больше чем на `blend.maxGap` — в ответе есть `blend` (смешанный результат, страница `/test/<slug>/result/<тип>/<второй тип>`). Подсчёт `scales`: баллы по шкалам, результат по сумме (`results[].range`), опора/зона роста или ровный профиль (`scaleBreakdown`). Баллы шкал передаются в адресе результата (`?шкала=балл`), страница остаётся статической.
- Механики — **чистые редьюсеры** (`deckReducer`, `voteReducer`, `guessPartnerReducer`): состояние + действие → новое состояние. В вебе используются через `useReducer`/`useState`, а в будущем могут работать на сервере для комнат по ссылке. Случайность можно передать снаружи, поэтому тесты детерминированы.
- `hasAccess(userTier, requiredTier)` — тиры. Пока у всех `DEFAULT_USER_TIER = "free"`.
- `ProgressStore` — интерфейс хранения прогресса. Сейчас `createProgressStore(localStorage)`, позже сервер. Экраны не меняются.
- `itemsForSection`, `relatedItems`, `itemPath` — запросы к каталогу, общие для сайта и бота.

## Веб (`apps/web`)

- Server Components по умолчанию. Клиентские (`"use client"`) — только интерактивные: `TestRunner`, игры, `ShareResult`, `DeeperButton`, `TelegramProvider`.
- Все страницы **статические** (создаются при сборке): разделы, тесты, каждый результат теста (`/test/<slug>/result/<id>` — этой ссылкой можно поделиться), игры.
- Контент читается с диска на сервере (`lib/catalog.ts`). В режиме разработки он перечитывается на каждый запрос, поэтому новый JSON виден после обновления страницы.
- Стили: Tailwind v4, токены — в `packages/ui/src/theme.css`.
- Анимации — `motion`, иконки — `lucide-react`.

### Сквозные функции

| Функция | Где |
|---|---|
| «Глубже 💎» → экран «Скоро» + событие `deeper_click` (`id`, `kind`, `source`) | `components/DeeperButton.tsx`, `lib/analytics.ts` |
| «Связанное» | `components/RelatedBlock.tsx` |
| Карточка для сторис 9:16 (html-to-image → PNG 1080×1920, Web Share API или скачивание) | `components/ShareResult.tsx`, `lib/share.ts`, `ui/ShareCard.tsx` |
| PWA: manifest, иконки, standalone, тема `#141217` | `app/manifest.ts`, `public/icons/`, `scripts/generate-icons.tsx` |
| Telegram Mini App: скрипт (грузится только при запуске из Telegram), `ready/expand`, цвета, системная кнопка «назад» | `components/TelegramProvider.tsx` |
| Шрифты Unbounded и Manrope — из пакетов Fontsource, без запросов к Google Fonts | `app/layout.tsx`, `app/globals.css` |
| Аналитика — только в продакшене; при разработке ничего не грузится и не отправляется | `app/layout.tsx`, `lib/analytics.ts` |
| Разработка: витрина контента `/dev/content` (в продакшене — 404) и автообновление страницы при правке JSON | `app/dev/content/`, `components/DevContentReload.tsx` |

## Бот (`apps/bot`)

grammY, long polling. Команды `/start` (меню разделов) и `/gaz` (открыть Mini App). В разделах — список из того же каталога с кнопками Mini App на конкретные игры и тесты. Токен — в `apps/bot/.env` (не коммитится, пример — `.env.example`).

## Безопасность и аудитория

- Секретов в коде нет. `.env*` в `.gitignore`, кроме `.env.example`.
- **Аудитория 16–25 и включает несовершеннолетних.** Поэтому:
  - контента 18+ в MVP нет, а в будущем он появится только через `ageRating` и возрастной гейт;
  - **знакомства и чаты между пользователями в MVP не делаем вообще.** Им нужны отдельная модерация, жалобы и блокировки, а также разделение по возрасту (несовершеннолетние не должны пересекаться со взрослыми). Это отдельный проект с юридической проверкой;
  - ИИ-агенты — только с обязательными правилами из `packages/agents` (ИИ-дисклеймер, «не врач», кризисный протокол, лимиты).
- Персональные данные (будущие профили, переписки с агентами) подпадают под 152-ФЗ: хранить в РФ, получать согласие, собирать минимум.

## Будущее (заложено, не реализовано)

`apps/api`: оплата (ЮKassa), подписки и тиры, профили, ачивки, стрики, шкала «насколько ты себя знаешь», комнаты по ссылке, ИИ-агенты. Подробнее — в `apps/api/README.md`.
