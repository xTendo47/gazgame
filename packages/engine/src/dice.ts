// Умный 🎲 на главной: «Сколько вас?» + «Какой настрой?» → одна случайная готовая игра или тест.
// Списки по людям и настрою лежат в data/sections.json (dice), здесь только подбор.
import type { RandomFn } from "./random";

/** Готовая игра или тест, из которых выбираем (без «скоро»). */
export interface DiceItem {
  slug: string;
  kind: "game" | "test";
  emoji: string;
  title: string;
  /** Короткая подпись под названием в карточке результата. */
  text: string;
  href: string;
}

/** Список из конфига: slug игры или теста; "*tests" — все тесты. */
export const ALL_TESTS = "*tests";

export interface DiceConfig {
  sizes: { id: string; items: readonly string[] }[];
  moods: { id: string; items: readonly string[] }[];
}

export interface DicePick {
  size: string;
  mood: string;
}

/** Slug из конфига → готовые элементы (неизвестных и «скоро» просто нет). */
function expand(slugs: readonly string[], items: readonly DiceItem[]): DiceItem[] {
  const out: DiceItem[] = [];
  for (const slug of slugs) {
    const found = slug === ALL_TESTS ? items.filter((i) => i.kind === "test") : items.filter((i) => i.slug === slug);
    for (const item of found) if (!out.includes(item)) out.push(item);
  }
  return out;
}

/**
 * Случайная готовая игра или тест из подходящих по числу людей и настрою. Пустая выборка — любая подходящая по людям.
 * lastSlug — что выпало в прошлый раз: подряд одно и то же не повторяем, если есть из чего выбрать.
 * null — для такого числа людей ничего нет.
 */
export function pickDice(
  config: DiceConfig,
  items: readonly DiceItem[],
  pick: DicePick,
  random: RandomFn = Math.random,
  lastSlug?: string,
): DiceItem | null {
  const bySize = expand(config.sizes.find((s) => s.id === pick.size)?.items ?? [], items);
  const byMood = expand(config.moods.find((m) => m.id === pick.mood)?.items ?? [], items);
  const both = bySize.filter((i) => byMood.includes(i));
  let pool = both.length > 0 ? both : bySize;
  if (pool.length > 1 && lastSlug) pool = pool.filter((i) => i.slug !== lastSlug);
  return pool.length > 0 ? (pool[Math.floor(random() * pool.length)] as DiceItem) : null;
}

/** Выбор пришёл из хранилища: если такого варианта в конфиге уже нет — берём значения по умолчанию. */
export function validDicePick(config: DiceConfig, saved: Partial<DicePick> | null | undefined, fallback: DicePick): DicePick {
  return {
    size: config.sizes.some((s) => s.id === saved?.size) ? (saved?.size as string) : fallback.size,
    mood: config.moods.some((m) => m.id === saved?.mood) ? (saved?.mood as string) : fallback.mood,
  };
}
