// Механика «квиз» (раздел GAZ GAME $HOW): вопрос с четырьмя вариантами и таймером, экран ответа, очки, итоги.
// Режимы: соло; вдвоём (команда: игроки отвечают по очереди, счёт общий и у каждого); компания (телефон по кругу, у каждого свой счёт).
// Раунд категории — по одному вопросу на каждый уровень сложности (1 → 2 → 3). Супер-квиз — лестница вопросов по возрастанию уровня.
// Подсказки: «50:50» убирает два неверных, «спроси зал» и «дай телефон другу» — напоминания (считаются использованными),
// «риск ×2» — раз на игрока за раунд: верный ответ даёт два очка. «Суд присяжных»: верного ответа нет, очко — за совпадение с большинством.
import type { QuizCategory, QuizCourt, QuizQuestion, QuizSuper } from "@gazgame/content";
import { dayIndex } from "../today";

export type QuizMode = "solo" | "duo" | "party";

/** Секунд на вопрос. */
export const QUIZ_TIME = 15;
export const QUIZ_PARTY_MIN = 3;
export const QUIZ_PARTY_MAX = 8;
export const QUIZ_LEVELS = [1, 2, 3] as const;

type Random = () => number;

/** Сколько игроков в режиме (компания — party, остальные — 1 или 2). */
export function quizPlayers(mode: QuizMode, party = QUIZ_PARTY_MIN): number {
  if (mode === "solo") return 1;
  if (mode === "duo") return 2;
  return Math.min(QUIZ_PARTY_MAX, Math.max(QUIZ_PARTY_MIN, Math.round(party)));
}

/** Раунд категории: по одному вопросу каждого уровня, при нескольких — случайный из них. */
export function buildRound(category: QuizCategory, random: Random = Math.random): QuizQuestion[] {
  const round: QuizQuestion[] = [];
  for (const level of QUIZ_LEVELS) {
    const pool = category.questions.filter((q) => q.level === level);
    const pick = pool[Math.floor(random() * pool.length)];
    if (pick) round.push(pick);
  }
  return round;
}

/** Вопросы супер-квиза: из категорий from по возрастанию уровня (при равном уровне — по порядку категорий), первые count штук. */
export function buildSuperRound(file: QuizSuper, categories: readonly QuizCategory[]): QuizQuestion[] {
  const pool: { q: QuizQuestion; order: number }[] = [];
  file.from.forEach((id, order) => {
    const category = categories.find((c) => c.id === id);
    for (const q of category?.questions ?? []) pool.push({ q, order });
  });
  pool.sort((a, b) => a.q.level - b.q.level || a.order - b.order);
  return pool.slice(0, file.count).map((p) => p.q);
}

/** Вопрос дня: один и тот же у всех в этот день, по кругу по всем вопросам категорий. */
export function dailyQuestion(categories: readonly QuizCategory[], now: Date): QuizQuestion | undefined {
  const all = categories.flatMap((c) => c.questions);
  if (all.length === 0) return undefined;
  const i = dayIndex(now);
  return all[((i % all.length) + all.length) % all.length];
}

export type QuizPhase = "question" | "answer" | "done";

export interface QuizHelps {
  fifty: boolean;
  hall: boolean;
  friend: boolean;
}

export interface QuizState {
  mode: QuizMode;
  players: number;
  questions: QuizQuestion[];
  index: number;
  phase: QuizPhase;
  /** Выбранный вариант на экране ответа; -1 — время вышло. */
  picked: number | null;
  /** Убранные подсказкой «50:50» варианты текущего вопроса. */
  hidden: number[];
  /** Очки по игрокам. */
  scores: number[];
  /** Верно ли ответили на каждый вопрос (по порядку). */
  results: boolean[];
  /** Какие подсказки уже брали в раунде. */
  helps: QuizHelps;
  /** «Риск ×2» включён на текущем вопросе. */
  riskArmed: boolean;
  /** Кто уже потратил «риск ×2». */
  riskUsed: boolean[];
}

export function startQuiz(questions: QuizQuestion[], mode: QuizMode, players = quizPlayers(mode)): QuizState {
  return {
    mode,
    players,
    questions,
    index: 0,
    phase: questions.length > 0 ? "question" : "done",
    picked: null,
    hidden: [],
    scores: Array.from({ length: players }, () => 0),
    results: [],
    helps: { fifty: false, hall: false, friend: false },
    riskArmed: false,
    riskUsed: Array.from({ length: players }, () => false),
  };
}

/** Кто отвечает на текущий вопрос: игроки идут по кругу. */
export function currentPlayer(state: QuizState): number {
  return state.index % state.players;
}

export function currentQuestion(state: QuizState): QuizQuestion | undefined {
  return state.questions[state.index];
}

/** Ответ игрока; choice −1 — время вышло. Верно: +1 очко (+2 при «риске ×2»). */
export function answerQuiz(state: QuizState, choice: number): QuizState {
  const q = currentQuestion(state);
  if (state.phase !== "question" || !q) return state;
  if (choice >= 0 && state.hidden.includes(choice)) return state;
  const player = currentPlayer(state);
  const right = choice === q.correct;
  const scores = state.scores.map((s, i) => (i === player && right ? s + (state.riskArmed ? 2 : 1) : s));
  const riskUsed = state.riskUsed.map((used, i) => (i === player && state.riskArmed ? true : used));
  return { ...state, phase: "answer", picked: choice, scores, results: [...state.results, right], riskArmed: false, riskUsed };
}

/** С экрана ответа — к следующему вопросу или к итогам. */
export function nextQuiz(state: QuizState): QuizState {
  if (state.phase !== "answer") return state;
  const index = state.index + 1;
  if (index >= state.questions.length) return { ...state, index, phase: "done", picked: null, hidden: [] };
  return { ...state, index, phase: "question", picked: null, hidden: [], riskArmed: false };
}

/** «50:50»: убирает два неверных варианта. Один раз за раунд. */
export function fiftyFifty(state: QuizState, random: Random = Math.random): QuizState {
  const q = currentQuestion(state);
  if (state.phase !== "question" || !q || state.helps.fifty) return state;
  const left = [0, 1, 2, 3].filter((i) => i !== q.correct);
  const hidden: number[] = [];
  while (hidden.length < 2 && left.length > 0) {
    const i = Math.floor(random() * left.length);
    hidden.push(left.splice(i, 1)[0] as number);
  }
  return { ...state, hidden, helps: { ...state.helps, fifty: true } };
}

/** «Спроси зал» и «дай телефон другу»: подсказки-напоминания, один раз за раунд. */
export function takeHelp(state: QuizState, help: "hall" | "friend"): QuizState {
  if (state.phase !== "question" || state.helps[help]) return state;
  return { ...state, helps: { ...state.helps, [help]: true } };
}

/** «Риск ×2»: включить или снять на текущем вопросе. У каждого игрока — один раз за раунд. */
export function toggleRisk(state: QuizState): QuizState {
  if (state.phase !== "question" || state.riskUsed[currentPlayer(state)]) return state;
  return { ...state, riskArmed: !state.riskArmed };
}

export interface QuizSummary {
  /** Сумма очков всех игроков. */
  total: number;
  /** Сколько вопросов в раунде. */
  max: number;
  /** Верных ответов. */
  correct: number;
  scores: number[];
  /** Номера победителей (только в режиме компании). */
  winners: number[];
}

export function quizSummary(state: QuizState): QuizSummary {
  const total = state.scores.reduce((a, b) => a + b, 0);
  const top = Math.max(...state.scores);
  const winners = state.mode === "party" && top > 0 ? state.scores.flatMap((s, i) => (s === top ? [i] : [])) : [];
  return { total, max: state.questions.length, correct: state.results.filter(Boolean).length, scores: state.scores, winners };
}

// ---------- Суд присяжных ----------

export type CourtVote = "guilty" | "free";

export interface CourtResult {
  /** Процент «виновен». */
  guiltyPercent: number;
  freePercent: number;
  majority: CourtVote;
  /** Совпал ли голос с большинством — за это очко. */
  withMajority: boolean;
}

/** Итог голоса по делу: проценты берутся из дела (демо), очко — за совпадение с большинством. */
export function courtResult(item: QuizCourt["cases"][number], vote: CourtVote): CourtResult {
  const majority: CourtVote = item.guiltyPercent >= 50 ? "guilty" : "free";
  return { guiltyPercent: item.guiltyPercent, freePercent: 100 - item.guiltyPercent, majority, withMajority: vote === majority };
}

// ---------- Вопрос дня: что хранится на устройстве ----------

export interface ShowData {
  /** Номер дня (dayIndex), в который ответили на вопрос дня. */
  lastDay?: number;
  /** Верно ли ответили в тот день. */
  lastCorrect?: boolean;
  /** Сколько дней подряд отвечали. */
  streak: number;
  best: number;
}

export const emptyShow = (): ShowData => ({ streak: 0, best: 0 });

export function normalizeShow(raw: Partial<ShowData> | undefined): ShowData {
  return { ...emptyShow(), ...raw };
}

/** Серия на сегодня: если вчера не отвечали — серия оборвана. */
export function showStreak(data: ShowData, now: Date): number {
  const today = dayIndex(now);
  return data.lastDay !== undefined && data.lastDay >= today - 1 ? data.streak : 0;
}

/** Ответили ли уже на вопрос дня сегодня. */
export function dailyAnswered(data: ShowData, now: Date): boolean {
  return data.lastDay === dayIndex(now);
}

/** Записать ответ на вопрос дня (за один день считается один раз). */
export function recordDaily(data: ShowData, correct: boolean, now: Date): ShowData {
  const today = dayIndex(now);
  if (data.lastDay === today) return data;
  const streak = showStreak(data, now) + 1;
  return { lastDay: today, lastCorrect: correct, streak, best: Math.max(data.best, streak) };
}
