// «Коллекция 🃏»: всё, что человек сделал в GAZ, превращается в карту. Ничего нового не хранится,
// кроме «что новое»: карты собираются из того, что уже лежит на устройстве (итоги тестов, сделанные задания GAZ,
// награды серии из «Сегодня», челленджи недели GAZ). Чистые функции, как в gaz.ts и today.ts.
import type { Catalog, TodayLadderStep } from "@gazgame/content";
import { isVisible, type VisibilityOptions } from "./catalog";
import { challengeForWeek, challengeOutcome, CHALLENGE_DAYS, mskWeekNumber, type GazData } from "./gaz";
import { pluralDays, type TodayData } from "./today";

/** Редкость видна по рамке: обычная (серая), редкая (оранжевая), золотая (с бликом). */
export type Rarity = "common" | "rare" | "gold";

/** Карта на ощупь: что нарисовать и как поделиться. */
export interface CollectionCard {
  /** Один ключ на карту: test:<id теста> | gaz:<id задания> | award:<id награды> | award:week-<номер недели>. */
  key: string;
  emoji: string;
  /** Второй эмодзи при ничьей в тесте: «Аналитик 🔬 + Визионер 🌌». */
  emoji2?: string;
  title: string;
  /** Мелкая подпись снизу: название теста / «Задание GAZ · 11 окт» / «Награда · 3 дня». */
  caption: string;
  rarity: Rarity;
  /** «×2»: задание сделано повторно. */
  count?: number;
  /** У карты теста: куда ведёт «Пройти ещё раз». */
  retakeSlug?: string;
  /** Параметры картинки для сторис: /share/card?<share>. */
  share: string;
}

/** Что показать во «вспышке» новой карты. Нужны только поля лица карты. */
export type CardSnap = Pick<CollectionCard, "key" | "emoji" | "emoji2" | "title" | "caption" | "rarity" | "share">;

/** Что хранится про Коллекцию: какие карты уже известны, какие ещё «новые» (оранжевая точка) и очередь вспышек. */
export interface CollectionData {
  /** Карты, о которых Коллекция уже знает. Нет — ещё ни разу не открывали: всё, что собрано до этого, не считаем новым. */
  known?: string[];
  /** Ключи карт, которые ещё не открыли. Пока список не пуст, на плитке главной горит точка. */
  newKeys: string[];
  /** Вспышки «Новая карта в Коллекции 🃏», которые ещё не показали. */
  flash: CardSnap[];
}

export const emptyCollection = (): CollectionData => ({ newKeys: [], flash: [] });

export function normalizeCollection(raw: Partial<CollectionData> | undefined): CollectionData {
  return {
    ...(raw?.known ? { known: raw.known } : {}),
    newKeys: raw?.newKeys ?? [],
    flash: raw?.flash ?? [],
  };
}

// ---------- Карты из контента ----------

/** Только то, что нужно Коллекции от контента (на экран уходит это, а не весь каталог). */
export interface CollectionContent {
  /** По порядку полки «Я». */
  tests: { id: string; slug: string; title: string; results: { id: string; title: string; emoji: string }[] }[];
  /** Платные тесты: слоты 💎. */
  locked: { id: string; slug: string; title: string }[];
  tasks: { id: string; emoji: string; text: string }[];
  challenges: { id: string; emoji: string; title: string }[];
  ladder: TodayLadderStep[];
}

/**
 * Контент для Коллекции. Порядок полки «Я»: тесты раздела «Познай себя» как в sections.json, потом остальные тесты
 * (например, «Тип привязанности»), потом платные тесты. Видимость — как в каталоге.
 */
export function collectionContent(catalog: Catalog, options?: VisibilityOptions): CollectionContent {
  const visible = catalog.tests.filter((t) => isVisible(t, options));
  const layout = catalog.sectionLayouts?.sections.find((s) => s.id === "solo");
  const refs = (layout?.tabs ?? []).flatMap((tab) => tab.items.map((i) => i.ref));
  const soloOrder = refs.flatMap((r) => (r?.test ? [r.test] : []));
  const lockedOrder = refs.flatMap((r) => (r?.lockedTest ? [r.lockedTest] : []));
  const rank = (slug: string) => {
    const i = soloOrder.indexOf(slug);
    return i === -1 ? soloOrder.length : i;
  };
  const tests = [...visible].sort((a, b) => rank(a.slug) - rank(b.slug));
  const lockedAll = catalog.lockedTests ?? [];
  const lockedRank = (slug: string) => {
    const i = lockedOrder.indexOf(slug);
    return i === -1 ? lockedOrder.length : i;
  };
  return {
    tests: tests.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      results: t.results.map((r) => ({ id: r.id, title: r.title, emoji: r.emoji })),
    })),
    locked: [...lockedAll].sort((a, b) => lockedRank(a.slug) - lockedRank(b.slug)).map((t) => ({ id: t.id, slug: t.slug, title: t.title })),
    tasks: [...catalog.gaz?.bored ?? [], ...catalog.gaz?.roulette ?? []].map((t) => ({ id: t.id, emoji: t.emoji, text: t.text })),
    challenges: (catalog.gaz?.challenges ?? []).map((c) => ({ id: c.id, emoji: c.emoji, title: c.title })),
    ladder: catalog.today?.ladder ?? [],
  };
}

const MONTHS = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

/** «2026-10-11» → «11 окт». */
export function shortDate(day: string): string {
  const [, month, date] = day.split("-");
  const name = MONTHS[Number(month) - 1];
  return name && date ? `${Number(date)} ${name}` : "";
}

/** Карта итога теста. Ничья: на карте оба итога. null — итога нет в контенте. */
export function testCard(test: CollectionContent["tests"][number], resultId: string, tieId?: string): CollectionCard | null {
  const first = test.results.find((r) => r.id === resultId);
  if (!first) return null;
  const second = tieId && tieId !== resultId ? test.results.find((r) => r.id === tieId) : undefined;
  return {
    key: `test:${test.id}`,
    emoji: first.emoji,
    ...(second ? { emoji2: second.emoji } : {}),
    title: second ? `${first.title} + ${second.title}` : first.title,
    caption: test.title,
    rarity: "common",
    retakeSlug: test.slug,
    share: `k=test&id=${test.id}&r=${resultId}${second ? `&r2=${second.id}` : ""}`,
  };
}

/** Карта сделанного задания GAZ. С усложнением 🌶️ золотая. date пустая — подпись без даты (для картинки). */
export function gazTaskCard(task: { id: string; emoji: string; text: string }, info: { count: number; gold: boolean; date: string }): CollectionCard {
  const date = info.date ? shortDate(info.date) : "";
  return {
    key: `gaz:${task.id}`,
    emoji: task.emoji,
    title: task.text,
    caption: date ? `Задание GAZ · ${date}` : "Задание GAZ",
    rarity: info.gold ? "gold" : "common",
    ...(info.count > 1 ? { count: info.count } : {}),
    share: `k=gaz&id=${task.id}&g=${info.gold ? 1 : 0}`,
  };
}

/** Карта за серию в «Сегодня» (3 и 7 дней): рамка из today.json. null — у ступеньки нет карты. */
export function streakCard(step: TodayLadderStep): CollectionCard | null {
  if (!step.card) return null;
  return {
    key: `award:${step.card.id}`,
    emoji: step.emoji,
    title: step.card.title,
    caption: `Награда · ${step.days} ${pluralDays(step.days)}`,
    rarity: step.card.rarity,
    share: `k=streak&id=${step.card.id}`,
  };
}

/** Карта челленджа недели: 5–6 отметок из 7 редкая, 7 из 7 золотая. */
export function weekCard(challenge: { id: string; emoji: string; title: string }, weekNumber: number, marks: number): CollectionCard | null {
  const outcome = challengeOutcome(marks);
  if (outcome === "none") return null;
  return {
    key: `award:week-${weekNumber}`,
    emoji: challenge.emoji,
    title: challenge.title,
    caption: `Челлендж · ${marks} из ${CHALLENGE_DAYS}`,
    rarity: outcome === "gold" ? "gold" : "rare",
    share: `k=week&id=${challenge.id}&n=${marks}`,
  };
}

// ---------- Что показать на экране ----------

/** Одна клетка полки: карта, пустой слот «???» или закрытый платный тест 💎. */
export type CollectionSlot =
  | { kind: "card"; card: CollectionCard }
  | { kind: "empty"; label: string; test?: string; gaz?: true }
  | { kind: "locked"; label: string; slug: string };

export interface CollectionView {
  me: CollectionSlot[];
  meOwned: number;
  meTotal: number;
  /** Сделанные задания, новые первыми. */
  tasks: CollectionCard[];
  awards: CollectionSlot[];
  awardsOwned: number;
  awardsTotal: number;
  /** Всего карт: «Собрано N карт». */
  total: number;
  /** Рекорд серии. */
  best: number;
  /** Все собранные карты (для поиска новых). */
  cards: CollectionCard[];
}

/** Тест пройден: последний итог лежит в ProgressData.tests (там же, где «Мои результаты»), ничья — в tieId. */
export interface TestRecordLike {
  resultId: string;
  tieId?: string;
}

export function buildCollection(
  content: CollectionContent,
  progress: { tests: Record<string, TestRecordLike>; gaz?: GazData; today?: TodayData },
  now: Date,
): CollectionView {
  // Я: по карте на каждый тест, пустой слот «???», закрытые платные тесты
  const me: CollectionSlot[] = content.tests.map((t) => {
    const rec = progress.tests[t.id];
    const card = rec ? testCard(t, rec.resultId, rec.tieId) : null;
    return card ? { kind: "card", card } : { kind: "empty", label: t.title, test: t.slug };
  });
  for (const t of content.locked) me.push({ kind: "locked", label: t.title, slug: t.slug });
  const meOwned = me.filter((s) => s.kind === "card").length;

  // Задания GAZ: каждое задание одной картой, повтор — «×2»; с усложнением хоть раз — золотая; новые первыми
  const done = progress.gaz?.done ?? [];
  const byTask = new Map<string, { count: number; gold: boolean; date: string; last: number }>();
  done.forEach((d, i) => {
    const prev = byTask.get(d.id);
    byTask.set(d.id, { count: (prev?.count ?? 0) + 1, gold: (prev?.gold ?? false) || d.gold, date: d.date, last: i });
  });
  const tasks = [...byTask.entries()]
    .sort((a, b) => b[1].last - a[1].last)
    .flatMap(([id, info]) => {
      const task = content.tasks.find((t) => t.id === id);
      return task ? [gazTaskCard(task, info)] : [];
    });

  // Награды: карты за серию (получены или пустой слот «N дней подряд») и челленджи недели
  const owned = new Set((progress.today?.cards ?? []).map((c) => c.id));
  const streakOwned: CollectionCard[] = [];
  const streakEmpty: CollectionSlot[] = [];
  for (const step of content.ladder) {
    const card = step.card && owned.has(step.card.id) ? streakCard(step) : null;
    if (card) streakOwned.push(card);
    else streakEmpty.push({ kind: "empty", label: `${step.days} ${pluralDays(step.days)} подряд` });
  }
  // Итог недели считается в конце недели; 7 из 7 — сразу
  const current = mskWeekNumber(now);
  const weeks = Object.entries(progress.gaz?.challenge ?? {})
    .map(([key, days]) => ({ week: Number(key.slice(1)), marks: new Set(days).size }))
    .filter((w) => Number.isFinite(w.week) && (w.week < current || w.marks >= CHALLENGE_DAYS))
    .sort((a, b) => b.week - a.week)
    .flatMap((w) => {
      const challenge = challengeForWeek(content.challenges, w.week);
      const card = challenge ? weekCard(challenge, w.week, w.marks) : null;
      return card ? [card] : [];
    });
  const awardCards = [...streakOwned, ...weeks];
  const awards: CollectionSlot[] = [...awardCards.map((card): CollectionSlot => ({ kind: "card", card })), ...streakEmpty];

  const cards = [...me.flatMap((s) => (s.kind === "card" ? [s.card] : [])), ...tasks, ...awardCards];
  return {
    me,
    meOwned,
    meTotal: me.length,
    tasks,
    awards,
    awardsOwned: awardCards.length,
    awardsTotal: content.ladder.length + weeks.length,
    total: cards.length,
    best: progress.today?.best ?? 0,
    cards,
  };
}

// ---------- Новые карты ----------

export const cardSnap = (c: CollectionCard): CardSnap => ({
  key: c.key,
  emoji: c.emoji,
  ...(c.emoji2 ? { emoji2: c.emoji2 } : {}),
  title: c.title,
  caption: c.caption,
  rarity: c.rarity,
  share: c.share,
});

/** Появилась новая карта (итог теста, задание, награда): точка на плитке и вспышка. Та же карта ещё не открыта — вспышка одна. */
export function addNewCard(data: CollectionData, card: CollectionCard): CollectionData {
  const snap = cardSnap(card);
  return {
    ...data,
    known: data.known ? (data.known.includes(card.key) ? data.known : [...data.known, card.key]) : data.known,
    newKeys: data.newKeys.includes(card.key) ? data.newKeys : [...data.newKeys, card.key],
    flash: [...data.flash.filter((f) => f.key !== card.key), snap],
  };
}

/** Вспышку показали (или закрыли): следующая в очереди. */
export const dismissFlash = (data: CollectionData): CollectionData => ({ ...data, flash: data.flash.slice(1) });

/** Карту открыли: она больше не «новая». */
export const openCardKey = (data: CollectionData, key: string): CollectionData => ({
  ...data,
  newKeys: data.newKeys.filter((k) => k !== key),
});

/**
 * Сверка с тем, что собрано: при первом открытии всё собранное раньше считается известным (не «новым»).
 * Дальше любая неизвестная карта (например, челлендж, неделя которого закончилась) становится новой со вспышкой.
 * Возвращает тот же объект, если ничего не поменялось.
 */
export function syncCollection(data: CollectionData, cards: readonly CollectionCard[]): CollectionData {
  if (!data.known) return { ...data, known: cards.map((c) => c.key) };
  const known = data.known;
  const fresh = cards.filter((c) => !known.includes(c.key));
  if (fresh.length === 0) return data;
  let next: CollectionData = { ...data, known: [...known, ...fresh.map((c) => c.key)] };
  for (const card of fresh) if (!next.newKeys.includes(card.key)) next = addNewCard(next, card);
  return next;
}
