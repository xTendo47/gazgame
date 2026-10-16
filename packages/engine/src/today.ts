// «Сегодня 🔥»: индекс дня, серия (стрик) с заморозкой, батл, дневник ответов, награды за серию.
// Чистые функции над TodayData, как в gaz.ts. Граница дня везде 00:00 по Москве.
import type { TodayFile, TodayLadderStep } from "@gazgame/content";
import { mskDay, mskDayNumber, mskWeekNumber } from "./gaz";

/** С этого дня (13.10.2026, 00:00 МСК) считается индекс дня. */
const START_MS = Date.UTC(2026, 9, 12, 21, 0, 0);
const DAY_MS = 86_400_000;
/** Заморозок копится не больше. */
export const MAX_FREEZES = 2;

/** Карта-награда. Та же форма, что у сделанного задания GAZ (id, дата по МСК, золотая или нет): Коллекция покажет и те, и другие. */
export interface TodayCard {
  id: string;
  date: string;
  gold: boolean;
}

export interface TodayAnswer {
  /** День по МСК, когда ответили. */
  day: string;
  /** Текст вопроса на тот момент: дневник не ломается, если вопросы в контенте поменяют. */
  question: string;
  text: string;
}

export type TodayChoice = "a" | "b";

export interface TodayNotice {
  /** freeze — «Заморозка сработала ❄️ Серия жива», restart — «Начнём заново? Огонь ждёт 🔥». */
  kind: "freeze" | "restart";
  day: string;
}

export interface TodayData {
  /** Текущая серия: дней подряд, в каждом из которых что-то сделано. */
  streak: number;
  /** Рекорд серии (виден в Коллекции). */
  best: number;
  /** Последний засчитанный день (по МСК). */
  lastDay?: string;
  freezes: number;
  /** Неделя, в которую выдавали недельную заморозку. */
  freezeWeek?: number;
  /** Голоса в батлах: день → выбор. Переголосовать нельзя. */
  votes: Record<string, TodayChoice>;
  /** Дневник «Мои ответы», старые первыми. */
  answers: TodayAnswer[];
  /** День, когда нажали «Не сегодня» у задания дня. */
  skipped?: string;
  /** Полученные карты за серию. */
  cards: TodayCard[];
  /** id карты, о которой ещё не показали «Новая карта в Коллекции 🃏». */
  pendingReward?: string;
  notice?: TodayNotice;
}

export const emptyToday = (): TodayData => ({ streak: 0, best: 0, freezes: 0, votes: {}, answers: [], cards: [] });

export function normalizeToday(raw: Partial<TodayData> | undefined): TodayData {
  return { ...emptyToday(), ...raw, votes: raw?.votes ?? {}, answers: raw?.answers ?? [], cards: raw?.cards ?? [] };
}

// ---------- Что показываем сегодня ----------

/** Число дней от 13.10.2026 по МСК (до этой даты — отрицательное). Одно и то же у всех. */
export function dayIndex(now: Date): number {
  return mskDayNumber(now) - mskDayNumber(new Date(START_MS));
}

const wrap = (i: number, length: number) => ((i % length) + length) % length;

/** Батл, вопрос и задание дня. Задание — из колоды «Мне скучно»: индекс (i×7) % длина, чтобы не совпадать с порядком батлов. */
export function todayPicks<B>(file: Pick<TodayFile, "battles" | "questions">, bored: readonly B[], now: Date) {
  const i = dayIndex(now);
  return {
    index: i,
    battle: file.battles[wrap(i, file.battles.length)] as TodayFile["battles"][number],
    question: file.questions[wrap(i, file.questions.length)] as TodayFile["questions"][number],
    task: bored[wrap(i * 7, bored.length)] as B,
  };
}

/** «день», «дня», «дней». */
export function pluralDays(n: number): string {
  const m = n % 10;
  const h = n % 100;
  if (m === 1 && h !== 11) return "день";
  return m >= 2 && m <= 4 && (h < 12 || h > 14) ? "дня" : "дней";
}

// ---------- Серия и заморозка ----------

const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);

/**
 * Приводит данные к сегодняшнему дню: недельная заморозка (раз в неделю, максимум 2), пропуски.
 * Пропущен ровно один день и заморозка есть: она тратится сама, серия жива. Иначе серия сгорает (рекорд остаётся).
 * Повторный вызов в тот же день ничего не меняет.
 */
export function settleToday(data: TodayData, now: Date): TodayData {
  const today = mskDay(now);
  const week = mskWeekNumber(now);
  const d: TodayData = { ...data };
  if (d.freezeWeek !== week) {
    d.freezes = Math.min(MAX_FREEZES, d.freezes + 1);
    d.freezeWeek = week;
  }
  if (d.lastDay && d.lastDay !== today && d.streak > 0) {
    const gap = daysBetween(d.lastDay, today);
    if (gap >= 2) {
      if (gap === 2 && d.freezes > 0) {
        d.freezes -= 1;
        d.lastDay = mskDay(new Date(now.getTime() - DAY_MS));
        d.notice = { kind: "freeze", day: today };
      } else {
        d.streak = 0;
        d.notice = { kind: "restart", day: today };
      }
    }
  }
  return d;
}

/** День уже засчитан? */
export function isDayCounted(data: TodayData, now: Date): boolean {
  return data.lastDay === mskDay(now);
}

/**
 * Засчитать сегодняшний день (голос в батле, ответ или «Сделано» у любого задания, в том числе из раздела GAZ).
 * Серия +1 и награда за ступеньку: карта (один раз) и заморозка. Premium-ступени ничего не выдают.
 * reward — на какой ступеньке (в днях) получили что-то новое.
 */
export function countToday(
  data: TodayData,
  now: Date,
  ladder: readonly TodayLadderStep[],
): { data: TodayData; counted: boolean; reward?: number } {
  const d = settleToday(data, now);
  if (isDayCounted(d, now)) return { data: d, counted: false };
  const today = mskDay(now);
  d.streak += 1;
  d.best = Math.max(d.best, d.streak);
  d.lastDay = today;
  let reward: number | undefined;
  const step = ladder.find((s) => s.days === d.streak);
  if (step && !step.premium) {
    if (step.card && !d.cards.some((c) => c.id === step.card?.id)) {
      d.cards = [...d.cards, { id: step.card.id, date: today, gold: false }];
      d.pendingReward = step.card.id;
      reward = step.days;
    }
    if (step.freeze) {
      d.freezes = Math.min(MAX_FREEZES, d.freezes + 1);
      reward ??= step.days;
    }
  }
  return { data: d, counted: true, ...(reward !== undefined ? { reward } : {}) };
}

/** Серия на сегодня с учётом заморозки и сгорания (для показа до записи). */
export function currentStreak(data: TodayData, now: Date): number {
  return settleToday(data, now).streak;
}

// ---------- Батл, ответ, задание ----------

/** Голос за сегодня. Уже голосовали — без изменений (переголосовать нельзя). */
export function voteToday(data: TodayData, choice: TodayChoice, now: Date): TodayData {
  const today = mskDay(now);
  if (data.votes[today]) return data;
  return { ...data, votes: { ...data.votes, [today]: choice } };
}

/** Ответ на вопрос дня в дневник. Пустой не сохраняем, второй за день тоже. */
export function saveAnswer(data: TodayData, question: string, text: string, now: Date): TodayData {
  const trimmed = text.trim();
  const today = mskDay(now);
  if (!trimmed || data.answers.some((a) => a.day === today)) return data;
  return { ...data, answers: [...data.answers, { day: today, question, text: trimmed }] };
}

export const answerFor = (data: TodayData, now: Date): TodayAnswer | undefined => data.answers.find((a) => a.day === mskDay(now));

export const skipTask = (data: TodayData, now: Date): TodayData => ({ ...data, skipped: mskDay(now) });

export function dismissReward(data: TodayData): TodayData {
  const { pendingReward: _gone, ...rest } = data;
  return rest;
}

/** Выборы за неделю (понедельник … воскресенье) для строки эмодзи «Твоя неделя в батлах»; undefined — не голосовали. */
export function weekChoices(data: TodayData, file: Pick<TodayFile, "battles">, now: Date, weekday: number) {
  return Array.from({ length: 7 }, (_, i) => {
    const at = new Date(now.getTime() - (weekday - 1 - i) * DAY_MS);
    const choice = data.votes[mskDay(at)];
    const battle = file.battles[wrap(dayIndex(at), file.battles.length)];
    return choice && battle ? battle[choice] : undefined;
  });
}

// ---------- Лесенка наград ----------

/** Заполнение полосы 0…1: ступеньки стоят по центрам колонок, между ними полоса растёт плавно. */
export function ladderProgress(streak: number, ladder: readonly TodayLadderStep[]): number {
  const n = ladder.length;
  let from = 0;
  let fromPos = 0;
  for (let i = 0; i < n; i++) {
    const step = ladder[i] as TodayLadderStep;
    const pos = (i + 0.5) / n;
    if (streak <= step.days) return fromPos + ((streak - from) / (step.days - from)) * (pos - fromPos);
    from = step.days;
    fromPos = pos;
  }
  return 1;
}

/** Ближайшая ступенька, до которой ещё не дошли. */
export const nextStep = (streak: number, ladder: readonly TodayLadderStep[]): TodayLadderStep | undefined =>
  ladder.find((s) => s.days > streak);
