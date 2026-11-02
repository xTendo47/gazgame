// Каталог контента для серверных компонентов.
// Читает JSON из packages/content/data. Импортировать только в серверном коде (страницы без "use client").
import type { Catalog } from "@gazgame/content";
import { loadCatalog } from "@gazgame/content/node";
import type { VisibilityOptions } from "@gazgame/engine";
import { stripEmoji } from "./text";

let cached: Catalog | undefined;

/** Поля со значком (рисуются SVG через Glyph) и тексты сообщений для чатов: их эмодзи не трогаем. */
const KEEP_FIELDS = new Set(["emoji", "emoji2", "emojis", "howToLoveMeEmoji", "share", "$schema"]);
const HAS_EMOJI = /\p{Extended_Pictographic}/u;

/**
 * Для экранов: эмодзи внутри текстов убираем (значки в интерфейсе — только SVG), поля-значки и тексты шеринга остаются.
 * Ребусы «Угадай по эмодзи» не трогаем: там эмодзи — содержимое игры. Пустой результат не допускаем: строка остаётся как была.
 */
function uiText<T>(value: T, key = ""): T {
  if (typeof value === "string") {
    if (KEEP_FIELDS.has(key) || !HAS_EMOJI.test(value)) return value;
    const clean = stripEmoji(value);
    return (clean === "" ? value : clean) as T;
  }
  if (Array.isArray(value)) return value.map((v) => uiText(v, key)) as T;
  if (value && typeof value === "object") {
    if ((value as { mechanic?: unknown }).mechanic === "rebus") return value;
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, uiText(v, KEEP_FIELDS.has(k) ? k : k)])) as T;
  }
  return value;
}

/** В разработке читаем файлы заново на каждый запрос — новый тест виден после обновления страницы. */
export function getCatalog(): Catalog {
  if (process.env.NODE_ENV !== "production") return uiText(loadCatalog());
  cached ??= uiText(loadCatalog());
  return cached;
}

/** Что показываем. GAZ_HIDE_DRAFTS=1 — скрыть черновики (когда появится настоящий контент). 18+ в MVP нет. */
export const visibility: VisibilityOptions = {
  includeDrafts: process.env.GAZ_HIDE_DRAFTS !== "1",
  allowAdult: false,
};
