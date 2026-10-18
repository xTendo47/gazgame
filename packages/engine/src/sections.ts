// Разделы в одном формате (data/sections.json): куда ведёт карточка и фильтр «Сколько вас?».
import type { Catalog, SectionItem, SectionTab } from "@gazgame/content";
import { findGame, findTest, type VisibilityOptions } from "./catalog";

/** Куда ведёт карточка: адрес, шторка превью платного теста или «скоро» (нет в контенте или soon). */
export type SectionTarget = { kind: "link"; href: string } | { kind: "locked-test"; slug: string } | { kind: "soon" };

export function sectionTarget(catalog: Catalog, item: SectionItem, options?: VisibilityOptions): SectionTarget {
  const ref = item.ref;
  if (item.soon || !ref) return { kind: "soon" };
  if (ref.game) {
    const game = findGame(catalog, ref.game, options);
    return game ? { kind: "link", href: `/game/${game.slug}${ref.query ? `?${ref.query}` : ""}` } : { kind: "soon" };
  }
  if (ref.test) {
    const test = findTest(catalog, ref.test, options);
    return test ? { kind: "link", href: `/test/${test.slug}` } : { kind: "soon" };
  }
  if (ref.lockedTest) {
    const locked = catalog.lockedTests?.find((t) => t.slug === ref.lockedTest);
    return locked ? { kind: "locked-test", slug: locked.slug } : { kind: "soon" };
  }
  if (ref.cards) return catalog.cardGames ? { kind: "link", href: `/${catalog.cardGames.slug}` } : { kind: "soon" };
  return { kind: "soon" };
}

/** Группа карточек вкладки: заголовок мини-кнопки и карточки с номерами в tab.items (по номеру считается цель тапа). */
export interface SectionGroup {
  id: string;
  emoji: string;
  name: string;
  items: { item: SectionItem; index: number }[];
}

/**
 * Список вкладки по группам. selected — выбранная мини-кнопка («Тапни, чтобы оставить один тип»): остаётся одна группа;
 * нет такой или null — все группы подряд. Вкладка без kinds (Premium) групп не имеет — null, список идёт целиком.
 */
export function sectionGroups(tab: SectionTab, selected: string | null): SectionGroup[] | null {
  if (!tab.kinds) return null;
  const only = tab.kinds.some((k) => k.id === selected) ? selected : null;
  return tab.kinds
    .filter((k) => only === null || k.id === only)
    .map((k) => ({
      ...k,
      items: tab.items.flatMap((item, index) => (item.kind === k.id ? [{ item, index }] : [])),
    }));
}

/** Тап по мини-кнопке: выбрана другая — оставляем её, та же самая — возвращаем все. */
export const toggleKind = (current: string | null, tapped: string): string | null => (current === tapped ? null : tapped);

/** «**сколько вас**» → куски текста с флагом жирного. */
export function boldParts(text: string): { text: string; bold: boolean }[] {
  return text.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((part) =>
    part.startsWith("**") && part.endsWith("**") ? { text: part.slice(2, -2), bold: true } : { text: part, bold: false },
  );
}
