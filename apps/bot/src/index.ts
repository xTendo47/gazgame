// Запуск бота: npm run dev:bot (из корня). Настройки — в apps/bot/.env (пример: .env.example).
import { loadCatalog } from "@gazgame/content/node";
import { createBot } from "./bot";

const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL || undefined;

if (!token) {
  console.error(
    [
      "❌ Не задан BOT_TOKEN.",
      "1. Получи токен у @BotFather в Telegram (команда /newbot).",
      "2. Скопируй apps/bot/.env.example в apps/bot/.env и впиши токен.",
    ].join("\n"),
  );
  process.exit(1);
}

if (webAppUrl && !webAppUrl.startsWith("https://")) {
  console.error("❌ WEBAPP_URL должен начинаться с https:// — так требует Telegram для Mini App.");
  process.exit(1);
}

const bot = createBot(
  { token, webAppUrl, visibility: { includeDrafts: process.env.GAZ_HIDE_DRAFTS !== "1", allowAdult: false } },
  loadCatalog(),
);

await bot.api.setMyCommands([
  { command: "start", description: "Главное меню" },
  { command: "gaz", description: "Открыть GAZ Game" },
]);
if (webAppUrl) {
  // Кнопка «GAZ» рядом с полем ввода — открывает Mini App
  await bot.api.setChatMenuButton({ menu_button: { type: "web_app", text: "GAZ", web_app: { url: webAppUrl } } });
}

process.once("SIGINT", () => bot.stop());
process.once("SIGTERM", () => bot.stop());

console.log(`🤖 Бот запущен${webAppUrl ? `, Mini App: ${webAppUrl}` : " (без Mini App — WEBAPP_URL не задан)"}`);
await bot.start();
