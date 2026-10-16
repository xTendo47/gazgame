// «Объясни 🪧» (Alias + Крокодил): чистые функции над ExplainState, как у остальных механик.
// Один объясняет слово, своя команда угадывает. Свайп вправо: +1, влево: пропуск (−1, если штраф включён).
// Время вышло: «Последнее слово» (может угадать любая команда) → итог раунда с исправлением тапом → следующая команда.
// Победа проверяется после полного круга (все команды сходили поровну); ничья на вершине — ещё круг.
import type { RandomFn } from "../random";

export const EXPLAIN_MIN_TEAMS = 2;
export const EXPLAIN_MAX_TEAMS = 4;
export const EXPLAIN_TIMES = [30, 60, 90] as const;
/** Игра до: 30, 50 очков или 0 — без лимита. */
export const EXPLAIN_GOALS = [30, 50, 0] as const;

export type ExplainMode = "words" | "gestures";

export interface ExplainSettings {
  mode: ExplainMode;
  levelId: string;
  /** 2–4 команды. */
  teams: string[];
  /** Секунд на ход. */
  time: number;
  /** До скольких очков; 0 — без лимита (игру заканчивают кнопкой). */
  goal: number;
  /** Пропуск отнимает очко. */
  penalty: boolean;
}

export const defaultExplainSettings = (levelId: string, teams: readonly string[]): ExplainSettings => ({
  mode: "words",
  levelId,
  teams: teams.slice(0, EXPLAIN_MIN_TEAMS),
  time: 60,
  goal: 30,
  penalty: true,
});

/** Слово раунда и что с ним сделали свайпом (ok — угадали). */
export interface ExplainWord {
  word: string;
  ok: boolean;
}

/** turn — «Ход команды», play — игра, last — «Последнее слово», round — итог раунда, win — победа. */
export type ExplainPhase = "turn" | "play" | "last" | "round" | "win";

export interface ExplainState {
  settings: ExplainSettings;
  scores: number[];
  /** Какая команда ходит. */
  cur: number;
  phase: ExplainPhase;
  /** Слово на верхней карте. */
  word: string;
  round: ExplainWord[];
  /** Кто угадал последнее слово: номер команды, null — никто, undefined — ещё не выбрали. */
  lastBy?: number | null;
  /** Слова, показанные в текущем круге колоды уровня (хранятся на устройстве). */
  used: string[];
  /** Ничья на вершине после круга: «Ничья! Ещё круг». */
  tie: boolean;
  winner?: number;
  /** Сколько раундов сыграно. */
  rounds: number;
}

/** Случайное имя команды для 🎲: из тех, что ещё не заняты (все заняты — любое). */
export function randomTeamName(names: readonly string[], taken: readonly string[], random: RandomFn = Math.random): string {
  const free = names.filter((n) => !taken.includes(n));
  const pool = free.length > 0 ? free : names;
  return pool[Math.floor(random() * pool.length)] as string;
}

/**
 * Следующее слово без повторов: пока в колоде уровня есть непоказанные, берём из них; колода кончилась — новый круг
 * (первое слово нового круга не равно последнему старого). used — слова текущего круга.
 */
export function drawWord(words: readonly string[], used: readonly string[], random: RandomFn = Math.random): { word: string; used: string[] } {
  if (words.length === 0) throw new Error("В уровне нет слов");
  const last = used.at(-1);
  let rest = words.filter((w) => !used.includes(w));
  let base = [...used];
  if (rest.length === 0) {
    base = [];
    rest = words.length > 1 ? words.filter((w) => w !== last) : [...words];
  }
  const word = rest[Math.floor(random() * rest.length)] as string;
  return { word, used: [...base, word] };
}

/** Новая игра: счёт 0, ходит первая команда. used — слова, показанные раньше (с устройства). */
export function startExplain(settings: ExplainSettings, used: readonly string[] = []): ExplainState {
  return { settings, scores: settings.teams.map(() => 0), cur: 0, phase: "turn", word: "", round: [], used: [...used], tie: false, rounds: 0 };
}

/** «Старт ⏱»: ход начался, на карте первое слово. */
export function beginTurn(state: ExplainState, words: readonly string[], random?: RandomFn): ExplainState {
  const next = drawWord(words, state.used, random);
  return { ...state, phase: "play", round: [], lastBy: undefined, tie: false, word: next.word, used: next.used };
}

/** Свайп или кнопка: слово угадали (ok) или пропустили; на карте следующее. */
export function answerWord(state: ExplainState, ok: boolean, words: readonly string[], random?: RandomFn): ExplainState {
  if (state.phase !== "play") return state;
  const next = drawWord(words, state.used, random);
  return { ...state, round: [...state.round, { word: state.word, ok }], word: next.word, used: next.used };
}

/** Время вышло: текущее слово становится последним, его может угадать любая команда. */
export function timeUp(state: ExplainState): ExplainState {
  return state.phase === "play" ? { ...state, phase: "last" } : state;
}

/** «Кто угадал?»: номер команды или null («Никто»). Очко получит выбранная команда. */
export function chooseLastWinner(state: ExplainState, by: number | null): ExplainState {
  if (state.phase !== "last") return state;
  return { ...state, lastBy: by, phase: "round" };
}

/** Тап по слову в итоге раунда меняет отметку ✓ / ✗. */
export function toggleWord(state: ExplainState, index: number): ExplainState {
  if (state.phase !== "round" || !state.round[index]) return state;
  return { ...state, round: state.round.map((w, i) => (i === index ? { ...w, ok: !w.ok } : w)) };
}

/** Очки раунда команды: угаданные минус пропущенные (если штраф включён). Последнее слово — отдельно. */
export function roundPoints(state: ExplainState): number {
  const ok = state.round.filter((w) => w.ok).length;
  return ok - (state.settings.penalty ? state.round.length - ok : 0);
}

/** Счёт с учётом раунда: команда не опускается ниже 0; последнее слово +1 выбранной команде. */
export function scoresAfterRound(state: ExplainState): number[] {
  const scores = [...state.scores];
  scores[state.cur] = Math.max(0, (scores[state.cur] ?? 0) + roundPoints(state));
  if (typeof state.lastBy === "number") scores[state.lastBy] = (scores[state.lastBy] ?? 0) + 1;
  return scores;
}

/** Круг закончен: сходила последняя команда. */
export const circleDone = (state: ExplainState): boolean => state.cur === state.settings.teams.length - 1;

/** Команды-лидеры (с наибольшим счётом). */
function leaders(scores: readonly number[]): number[] {
  const max = Math.max(...scores);
  return scores.flatMap((s, i) => (s === max ? [i] : []));
}

/**
 * Итог раунда принят («Ход команды …»): счёт записан. Победу проверяем только после полного круга:
 * кто набрал цель и впереди — победил; ничья на вершине — ещё круг. Без лимита победы здесь нет (игру заканчивают кнопкой).
 */
export function finishRound(state: ExplainState): ExplainState {
  if (state.phase !== "round") return state;
  const scores = scoresAfterRound(state);
  const base: ExplainState = { ...state, scores, rounds: state.rounds + 1, round: [], lastBy: undefined, word: "" };
  if (circleDone(state) && state.settings.goal > 0 && Math.max(...scores) >= state.settings.goal) {
    const top = leaders(scores);
    if (top.length === 1) return { ...base, phase: "win", winner: top[0] as number, tie: false };
    return { ...base, phase: "turn", cur: 0, tie: true };
  }
  return { ...base, phase: "turn", cur: (state.cur + 1) % state.settings.teams.length, tie: false };
}

/** Итог раунда ведёт к победе? (чтобы подписать кнопку «Итоги» вместо «Ход команды …»). */
export const roundEndsGame = (state: ExplainState): boolean => finishRound(state).phase === "win";

/**
 * «Закончить» в игре без лимита: победа по очкам. Доступно после полного круга. Ничья — игра продолжается («Ещё круг»).
 */
export function endExplain(state: ExplainState): ExplainState {
  if (state.phase !== "turn" || state.cur !== 0 || state.rounds === 0) return state;
  const top = leaders(state.scores);
  if (top.length === 1) return { ...state, phase: "win", winner: top[0] as number, tie: false };
  return { ...state, tie: true };
}

/** «Реванш 🔥»: те же настройки и команды, счёт с нуля; слова продолжают колоду без повторов. */
export const rematchExplain = (state: ExplainState): ExplainState => startExplain(state.settings, state.used);
