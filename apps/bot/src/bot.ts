// Telegram-бот GAZ Game: вход и каталог. Сами игры и тесты открываются в Mini App (apps/web).
// Контент и логика — общие с сайтом: @gazgame/content и @gazgame/engine.
import { Bot, InlineKeyboard } from "grammy";
import { SECTION_LABELS, type Catalog, type Section } from "@gazgame/content";
import { itemPath, itemsForSection, type VisibilityOptions } from "@gazgame/engine";

export interface BotConfig {
  token: string;
  /** Адрес веб-приложения (https). Без него кнопки Mini App не показываются. */
  webAppUrl?: string;
  visibility?: VisibilityOptions;
}

// Названия разделов — из общего конфига packages/content/src/sections.ts.
const SECTIONS: { id: Section; title: string }[] = (["pairs", "company", "solo"] as const).map((id) => ({
  id,
  title: `${SECTION_LABELS[id].emoji} ${SECTION_LABELS[id].title}`,
}));

const GREETING = [
  "Йо! Это <b>GAZ Game</b> 🔥",
  "",
  "Игры и тесты для пар, компаний и соло — всё в одном.",
  "<i>Не сиди. Не тупи. Газ!</i>",
].join("\n");

/** Экранирование для parse_mode HTML: контент может содержать & < >. */
const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function mainMenu(webAppUrl?: string): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  for (const s of SECTIONS) keyboard.text(s.title, `section:${s.id}`).row();
  if (webAppUrl) keyboard.webApp("🚀 Открыть GAZ", webAppUrl);
  return keyboard;
}

export function sectionMenu(catalog: Catalog, section: Section, config: Pick<BotConfig, "webAppUrl" | "visibility">) {
  const items = itemsForSection(catalog, section, config.visibility);
  const keyboard = new InlineKeyboard();
  for (const item of items) {
    const label = `${item.emoji} ${item.title}`;
    if (config.webAppUrl) keyboard.webApp(label, new URL(itemPath(item), config.webAppUrl).toString()).row();
  }
  keyboard.text("← Назад", "menu");
  const title = SECTIONS.find((s) => s.id === section)?.title ?? "";
  const list = items.map((i) => `${i.emoji} <b>${escapeHtml(i.title)}</b> — ${escapeHtml(i.description)}`).join("\n");
  const text = `${title}\n\n${list || "Скоро здесь что-то появится 👀"}`;
  return { text, keyboard };
}

export function createBot(config: BotConfig, catalog: Catalog): Bot {
  const bot = new Bot(config.token);
  const html = { parse_mode: "HTML" } as const;

  bot.command("start", (ctx) => ctx.reply(GREETING, { ...html, reply_markup: mainMenu(config.webAppUrl) }));

  bot.command("gaz", (ctx) =>
    config.webAppUrl
      ? ctx.reply("Погнали! 🔥", { reply_markup: new InlineKeyboard().webApp("🚀 Газ!", config.webAppUrl) })
      : ctx.reply("Приложение скоро будет доступно 👀"),
  );

  bot.callbackQuery("menu", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(GREETING, { ...html, reply_markup: mainMenu(config.webAppUrl) });
  });

  bot.callbackQuery(/^section:(pairs|company|solo)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const { text, keyboard } = sectionMenu(catalog, ctx.match[1] as Section, config);
    await ctx.editMessageText(text, { ...html, reply_markup: keyboard });
  });

  bot.catch((error) => console.error("Ошибка в боте:", error.error));
  return bot;
}
