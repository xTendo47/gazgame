# GAZ Game

**Не сиди. Не тупи. Газ!** Игры и психологические тесты «всё в одном» для пар, компаний и соло.

Веб (PWA) + Telegram Mini App + Telegram-бот. Монорепо: npm workspaces + Turborepo, TypeScript.

## Быстрый старт (Windows, PowerShell)

Нужен Node.js 22.12 или новее (проверить: `node -v`).

```powershell
npm install        # установить зависимости (один раз и после изменений package.json)
npm run dev        # запустить сайт → http://localhost:3000
```

Остановить сервер: `Ctrl + C`.

## Как запустить и посмотреть

```powershell
npm run dev
```

При запуске в окне PowerShell появятся адреса:

| Что | Адрес |
|---|---|
| Сайт на компьютере | http://localhost:3000 |
| Сайт на телефоне (тот же Wi-Fi) | `http://<IP компьютера>:3000` — точный адрес напечатан в строке «Телефон» |
| Витрина контента (только при разработке) | http://localhost:3000/dev/content |

**Что обновляется само, без перезапуска сервера:**

- код в `apps/web`, `packages/ui`, `packages/engine` — страница обновится сама;
- JSON в `packages/content/data` — страница обновится сама, ответы в открытом тесте не сбросятся.
  На `/dev/content` сразу видно, прошёл ли новый файл проверку, в каком поле ошибка и нет ли битых ссылок в `related`.

**Перезапуск (`Ctrl + C`, потом `npm run dev`) нужен**, только если меняешь `next.config.ts`, `package.json` или ставишь новые пакеты.

**Телефон не открывает сайт?**

- Телефон и компьютер должны быть в одной Wi-Fi сети. Узнать IP компьютера: `ipconfig` → строка «IPv4-адрес» вида `192.168.x.x`.
- При первом запуске Windows спросит про брандмауэр для Node.js — разреши доступ в **частных** сетях.
- VPN на компьютере может мешать: адрес вида `198.18.x.x` — это VPN, с телефона он не откроется.

**Где смотреть логи и ошибки:**

- окно PowerShell, где запущен `npm run dev`, — ошибки сервера и список запросов;
- файл `apps/web/.next/dev/logs/next-development.log` — тот же лог сервера плюс сообщения из браузера;
- в браузере: `F12` → вкладка Console; при разработке ошибки ещё и всплывают кружком Next.js в углу страницы;
- проблемы в контенте: `/dev/content` или команда `npm run content:check`.

**«Another next dev server is already running»** — сервер уже запущен в другом окне. Открой http://localhost:3000
или останови старый: команда из сообщения (`taskkill /PID <номер> /F`), потом снова `npm run dev`.

## Команды

| Команда | Что делает |
|---|---|
| `npm run dev` | Сайт в режиме разработки (http://localhost:3000) |
| `npm run dev:bot` | Telegram-бот (нужен `apps/bot/.env`, см. ниже) |
| `npm run content:check` | Проверить все файлы контента |
| `npm run build` | Собрать сайт для продакшена |
| `npm run lint` | Проверить код и границы импортов |
| `npm run typecheck` | Проверить типы TypeScript |
| `npm test` | Юнит-тесты (Vitest) |
| `npm run check` | Всё сразу: lint + typecheck + test + build |

## Где что лежит

```
apps/web          сайт (Next.js): PWA + Telegram Mini App
apps/bot          Telegram-бот (grammY)
apps/api          будущий бэкенд — пока только README
apps/ultimate     будущее приложение Ultimate — пока только README
packages/content  ВЕСЬ КОНТЕНТ: data/tests/*.json, data/games/*.json + схемы
packages/engine   логика: подсчёт тестов, механики игр, тиры, прогресс
packages/ui       дизайн-система: кнопки, карточки, цвета
packages/agents   будущие ИИ-персонажи — пока только типы и правила
packages/config   общие настройки TypeScript и ESLint
docs/             документация
```

## Документация

- [Как добавить тест или игру](docs/CONTENT-GUIDE.md) — без программирования
- [Архитектура](docs/ARCHITECTURE.md)
- [Дорожная карта](docs/ROADMAP.md)
- [Идеи](docs/IDEAS.md)

## Telegram-бот

1. Создай бота у [@BotFather](https://t.me/BotFather) (команда `/newbot`) и получи токен.
2. Скопируй пример настроек:
   ```powershell
   Copy-Item apps/bot/.env.example apps/bot/.env
   ```
3. Открой `apps/bot/.env` и впиши `BOT_TOKEN`. В `WEBAPP_URL` впиши адрес сайта с https (после деплоя).
4. `npm run dev:bot`.

Файл `.env` с токеном в Git не попадает.

## Деплой сайта (Vercel)

В настройках проекта на Vercel укажи **Root Directory: `apps/web`**. Остальное Vercel определит сам.
Аналитика (`deeper_click`) начнёт собираться после деплоя: включи Web Analytics в панели Vercel.
Учти, что custom events в Vercel доступны только на тарифе Pro.
