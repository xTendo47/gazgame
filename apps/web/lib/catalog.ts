// Каталог контента для серверных компонентов.
// Читает JSON из packages/content/data. Импортировать только в серверном коде (страницы без "use client").
import type { Catalog } from "@gazgame/content";
import { loadCatalog } from "@gazgame/content/node";
import type { VisibilityOptions } from "@gazgame/engine";

let cached: Catalog | undefined;

/** В разработке читаем файлы заново на каждый запрос — новый тест виден после обновления страницы. */
export function getCatalog(): Catalog {
  if (process.env.NODE_ENV !== "production") return loadCatalog();
  cached ??= loadCatalog();
  return cached;
}

/** Что показываем. GAZ_HIDE_DRAFTS=1 — скрыть черновики (когда появится настоящий контент). 18+ в MVP нет. */
export const visibility: VisibilityOptions = {
  includeDrafts: process.env.GAZ_HIDE_DRAFTS !== "1",
  allowAdult: false,
};
