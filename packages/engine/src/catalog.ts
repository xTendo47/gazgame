// Запросы к каталогу: что показать в разделе, найти по адресу, «Связанное».
import type { Catalog, ContentItem, Game, Section, Test } from "@gazgame/content";

export interface VisibilityOptions {
  /** Показывать черновики (status: "draft"). В MVP — да, весь контент пока черновой. */
  includeDrafts?: boolean;
  /** Показывать 18+. Только после возрастного гейта — в MVP всегда false. */
  allowAdult?: boolean;
}

export function isVisible(item: ContentItem, { includeDrafts = true, allowAdult = false }: VisibilityOptions = {}) {
  if (!includeDrafts && item.status === "draft") return false;
  if (item.ageRating === "18+" && !allowAdult) return false;
  return true;
}

export function allItems(catalog: Catalog): ContentItem[] {
  return [...catalog.games, ...catalog.tests];
}

export function itemsForSection(catalog: Catalog, section: Section, options?: VisibilityOptions): ContentItem[] {
  return allItems(catalog).filter((item) => item.sections.includes(section) && isVisible(item, options));
}

export function findTest(catalog: Catalog, slug: string, options?: VisibilityOptions): Test | undefined {
  return catalog.tests.find((t) => t.slug === slug && isVisible(t, options));
}

export function findGame(catalog: Catalog, slug: string, options?: VisibilityOptions): Game | undefined {
  return catalog.games.find((g) => g.slug === slug && isVisible(g, options));
}

export function findById(catalog: Catalog, id: string): ContentItem | undefined {
  return allItems(catalog).find((item) => item.id === id);
}

/** Блок «Связанное»: элементы из поля related, в том же порядке. */
export function relatedItems(catalog: Catalog, item: ContentItem, options?: VisibilityOptions): ContentItem[] {
  return item.related
    .map((id) => findById(catalog, id))
    .filter((rel): rel is ContentItem => rel !== undefined && isVisible(rel, options));
}

/** Адрес страницы элемента — общий для сайта и бота. */
export function itemPath(item: ContentItem): string {
  return item.kind === "test" ? `/test/${item.slug}` : `/game/${item.slug}`;
}
