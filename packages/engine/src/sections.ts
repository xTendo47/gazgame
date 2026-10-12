// Разделы в одном формате (data/sections.json): куда ведёт карточка и фильтр «Сколько вас?».
import type { Catalog, SectionItem, SectionLayout } from "@gazgame/content";
import { findGame, findTest, type VisibilityOptions } from "./catalog";

/** Куда ведёт карточка: адрес, шторка превью платного теста или «скоро» (нет в контенте или soon). */
export type SectionTarget = { kind: "link"; href: string } | { kind: "locked-test"; slug: string } | { kind: "soon" };

export function sectionTarget(catalog: Catalog, item: SectionItem, options?: VisibilityOptions): SectionTarget {
  const ref = item.ref;
  if (item.soon || !ref) return { kind: "soon" };
  if (ref.game) {
    const game = findGame(catalog, ref.game, options);
    return game ? { kind: "link", href: `/game/${game.slug}` } : { kind: "soon" };
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

/** Выбранный вариант «Сколько вас?»: сохранённый, если он есть среди вариантов, иначе по умолчанию. */
export function peopleOption(section: SectionLayout, saved: string | null | undefined) {
  const people = section.people;
  if (!people) return undefined;
  return people.options.find((o) => o.id === saved) ?? people.options.find((o) => o.id === people.default) ?? people.options[0];
}

/** Игре не хватает людей: ей нужно больше, чем верхняя граница выбранного варианта. */
export function tooFewPeople(item: SectionItem, max: number | undefined): boolean {
  return max !== undefined && item.min !== undefined && item.min > max;
}

/** «**сколько вас**» → куски текста с флагом жирного. */
export function boldParts(text: string): { text: string; bold: boolean }[] {
  return text.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((part) =>
    part.startsWith("**") && part.endsWith("**") ? { text: part.slice(2, -2), bold: true } : { text: part, bold: false },
  );
}
