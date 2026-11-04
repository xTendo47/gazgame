// Раздел GAZ 🚀: «Мне скучно», Газ-рулетка, «в процессе», челлендж недели.
// Чистые функции над GazData: состояние + действие → новое состояние. Хранит их ProgressStore.
// Граница дня везде 00:00 по Москве (МСК = UTC+3, без перехода на летнее время).
import type { GazBoredTask, GazFile, GazRouletteTask, GazTask } from "@gazgame/content";
import type { RandomFn } from "./random";

export type GazWho = GazRouletteTask["who"];
export type GazTime = GazRouletteTask["time"];
export type GazWhere = GazRouletteTask["where"];

/** Откуда карта: «Мне скучно», рулетка, ссылка друга («Вызов 👆») или «Задание дня» в «Сегодня». */
export type GazSource = "bored" | "roulette" | "dare" | "daily";

/** Сколько раз можно крутить рулетку на одно задание. */
export const GAZ_SPINS = 3;
/** Дней в челлендже недели: 5 из 7 — карта, все 7 — золотая. */
export const CHALLENGE_DAYS = 7;
export const CHALLENGE_CARD_FROM = 5;

/** Сделанное задание — ровно то, что потом покажет Коллекция: id, дата (по МСК), золотая или нет. */
export interface GazDone {
  id: string;
  /** «2026-10-12» по Москве. */
  date: string;
  gold: boolean;
}

/** Карта на столе или «в процессе». day — день по МСК, когда её взяли: после 00:00 МСК она тихо исчезает. */
export interface GazCard {
  id: string;
  source: GazSource;
  day: string;
}

export interface GazChips {
  who: GazWho;
  time: GazTime;
  where: GazWhere;
}

export interface GazData {
  /** Сделанные задания, старые первыми. */
  done: GazDone[];
  /** id «Мне скучно», показанные в текущем круге колоды. */
  shownBored: string[];
  /** id рулетки, показанные в текущем круге своего сочетания. */
  shownRoulette: string[];
  lastChips?: GazChips;
  /** Прокрутки рулетки за день. */
  spins?: { day: string; used: number };
  /** Задание «в процессе»: переживает перезагрузку до 00:00 МСК. */
  active?: GazCard;
  /** Карта, которую сейчас показываем (ещё не взяли). */
  table?: GazCard;
  /** Отметки челленджа по неделям: ключ недели → номера дней (1 = понедельник). */
  challenge: Record<string, number[]>;
}

export const DEFAULT_CHIPS: GazChips = { who: "solo", time: "15", where: "home" };

export const emptyGaz = (): GazData => ({ done: [], shownBored: [], shownRoulette: [], challenge: {} });

/** Любой разобранный из хранилища объект приводим к полному GazData. */
export function normalizeGaz(raw: Partial<GazData> | undefined): GazData {
  return { ...emptyGaz(), ...raw, challenge: raw?.challenge ?? {} };
}

// ---------- Время (МСК) ----------

const DAY_MS = 86_400_000;
const MSK_OFFSET_MS = 3 * 3_600_000;

/** Номер дня по Москве от 1970-01-01. */
export function mskDayNumber(now: Date): number {
  return Math.floor((now.getTime() + MSK_OFFSET_MS) / DAY_MS);
}

/** «2026-10-12»: день по Москве. Меняется ровно в 00:00 МСК. */
export function mskDay(now: Date): string {
  return new Date(mskDayNumber(now) * DAY_MS).toISOString().slice(0, 10);
}

/** День недели по Москве: 1 — понедельник … 7 — воскресенье. */
export function mskWeekday(now: Date): number {
  // 1970-01-05 (день 4) — понедельник
  return ((((mskDayNumber(now) - 4) % 7) + 7) % 7) + 1;
}

/** Номер недели (неделя с понедельника 00:00 МСК). Из него выбирается челлендж и ключ отметок. */
export function mskWeekNumber(now: Date): number {
  return Math.floor((mskDayNumber(now) - 4) / 7);
}

// ---------- Подбор заданий ----------

/** Задание по id среди «Мне скучно» и рулетки. */
export function findGazTask(file: Pick<GazFile, "bored" | "roulette">, id: string): GazTask | undefined {
  return file.bored.find((t) => t.id === id) ?? file.roulette.find((t) => t.id === id);
}

/** Из колоды «Мне скучно»: без повторов, пока не прошли всю колоду, потом по кругу (новый круг не начинается с последнего). */
export function pickBored(
  deck: readonly GazBoredTask[],
  shown: readonly string[],
  random: RandomFn = Math.random,
): { task: GazBoredTask; shown: string[] } {
  if (deck.length === 0) throw new Error("Колода «Мне скучно» пуста");
  const last = shown.at(-1);
  let rest = deck.filter((t) => !shown.includes(t.id));
  let base = [...shown];
  if (rest.length === 0) {
    base = [];
    rest = deck.length > 1 ? deck.filter((t) => t.id !== last) : [...deck];
  }
  const task = rest[Math.floor(random() * rest.length)] as GazBoredTask;
  return { task, shown: [...base, task.id] };
}

/** Рулетка: точное совпадение кто + время + где, без повтора подряд и без повторов, пока в сочетании есть непоказанные. */
export function pickRoulette(
  tasks: readonly GazRouletteTask[],
  chips: GazChips,
  shown: readonly string[],
  random: RandomFn = Math.random,
): { task: GazRouletteTask; shown: string[] } | null {
  const pool = tasks.filter((t) => t.who === chips.who && t.time === chips.time && t.where === chips.where);
  if (pool.length === 0) return null;
  const last = shown.at(-1);
  let rest = pool.filter((t) => !shown.includes(t.id));
  let base = [...shown];
  if (rest.length === 0) {
    // все задания сочетания показаны: начинаем круг заново, только что показанное не повторяем подряд
    const ids = new Set(pool.map((t) => t.id));
    base = base.filter((id) => !ids.has(id));
    rest = pool.length > 1 ? pool.filter((t) => t.id !== last) : [...pool];
  } else if (rest.length > 1 && last !== undefined) {
    rest = rest.filter((t) => t.id !== last);
  }
  const task = rest[Math.floor(random() * rest.length)] as GazRouletteTask;
  return { task, shown: [...base, task.id] };
}

/** Задание дня для «Сегодня»: индекс (i×7) % длина колоды. i — номер дня. */
export function dailyBored<T>(deck: readonly T[], i: number): T | undefined {
  if (deck.length === 0) return undefined;
  return deck[(((i * 7) % deck.length) + deck.length) % deck.length];
}

// ---------- Состояние ----------

/** Сколько прокруток осталось сегодня (на новый день — снова 3). */
export function spinsLeft(data: GazData, now: Date): number {
  const used = data.spins?.day === mskDay(now) ? data.spins.used : 0;
  return Math.max(0, GAZ_SPINS - used);
}

/** Задание «в процессе», если оно взято сегодня. */
export function activeCard(data: GazData, now: Date): GazCard | undefined {
  return data.active?.day === mskDay(now) ? data.active : undefined;
}

/** Карта на столе, если она показана сегодня. */
export function tableCard(data: GazData, now: Date): GazCard | undefined {
  return data.table?.day === mskDay(now) ? data.table : undefined;
}

/** Показали карту «Мне скучно». */
export function showBored(data: GazData, task: GazBoredTask, shown: string[], now: Date): GazData {
  return { ...data, shownBored: shown, table: { id: task.id, source: "bored", day: mskDay(now) } };
}

/** Крутили рулетку: прокрутка списана, карта на столе. */
export function showRoulette(data: GazData, task: GazRouletteTask, shown: string[], chips: GazChips, now: Date): GazData {
  const day = mskDay(now);
  const used = data.spins?.day === day ? data.spins.used : 0;
  return { ...data, shownRoulette: shown, lastChips: chips, spins: { day, used: used + 1 }, table: { id: task.id, source: "roulette", day } };
}

/** «Беру!» / «Принимаю»: карта становится «в процессе». */
export function takeCard(data: GazData, card: { id: string; source: GazSource }, now: Date): GazData {
  const { table: _table, ...rest } = data;
  return { ...rest, active: { id: card.id, source: card.source, day: mskDay(now) } };
}

/** «Сделано»: карта уходит в список сделанных, рулетка снова на 3 прокрутки. */
export function finishCard(data: GazData, id: string, gold: boolean, now: Date): GazData {
  const { active: _active, table: _table, ...rest } = data;
  return { ...rest, done: [...data.done, { id, date: mskDay(now), gold }], spins: { day: mskDay(now), used: 0 } };
}

// ---------- Челлендж недели ----------

/** Челлендж этой недели: по номеру недели, по кругу. */
export function weeklyChallenge<T>(challenges: readonly T[], now: Date): T | undefined {
  return challengeForWeek(challenges, mskWeekNumber(now));
}

/** Челлендж недели с данным номером (для карт за прошлые недели в Коллекции). */
export function challengeForWeek<T>(challenges: readonly T[], weekNumber: number): T | undefined {
  if (challenges.length === 0) return undefined;
  return challenges[((weekNumber % challenges.length) + challenges.length) % challenges.length];
}

/** Дни этой недели, которые отмечены. */
export function markedDays(data: GazData, now: Date): number[] {
  return data.challenge[`w${mskWeekNumber(now)}`] ?? [];
}

/** Сегодняшний день уже отмечен? Прошлые пропущенные дни отметить нельзя: отмечается только сегодня. */
export function isTodayMarked(data: GazData, now: Date): boolean {
  return markedDays(data, now).includes(mskWeekday(now));
}

export function markToday(data: GazData, now: Date): GazData {
  if (isTodayMarked(data, now)) return data;
  const key = `w${mskWeekNumber(now)}`;
  return { ...data, challenge: { ...data.challenge, [key]: [...markedDays(data, now), mskWeekday(now)] } };
}

/** Итог недели: 5–6 отметок — карта челленджа, 7 — золотая. */
export function challengeOutcome(marks: number): "none" | "card" | "gold" {
  if (marks >= CHALLENGE_DAYS) return "gold";
  return marks >= CHALLENGE_CARD_FROM ? "card" : "none";
}
