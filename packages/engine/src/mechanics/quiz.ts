// Механика «квиз» (раздел GAZ GAME $HOW): вопрос с четырьмя вариантами или с вводом ответа, таймер, экран ответа, очки, итоги.
// Вопрос с вводом: ответ печатают, он засчитывается без учёта регистра, пробелов, «ё» и знаков препинания и с одной опечаткой у длинных слов.
// Режимы: соло; вдвоём (команда: игроки отвечают по очереди, счёт общий и у каждого); компания (телефон по кругу, у каждого свой счёт).
// Раунд категории — по одному вопросу на каждый уровень сложности (1 → 2 → 3). Супер-квиз — лестница вопросов по возрастанию уровня.
// Подсказки: «50:50» убирает два неверных, «спроси зал» и «дай телефон другу» — напоминания (считаются использованными),
// «риск ×2» — раз на игрока за раунд: верный ответ даёт два очка. «Суд присяжных»: верного ответа нет, очко — за совпадение с большинством.
import type { QuizCategory, QuizCourt, QuizInputQuestion, QuizQuestion, QuizSuper } from "@gazgame/content";
import { dayIndex } from "../today";

export type QuizMode = "solo" | "duo" | "party";

/** Банк вопросов: категория или артист (id — slug артиста). */
export interface QuizBank {
  id: string;
  questions: readonly QuizQuestion[];
}

/** Сколько вопросов каждого уровня в раунде про артиста: 5 лёгких → 5 средних → 5 сложных. */
export const ARTIST_PER_LEVEL = 5;

/** Секунд на обычный вопрос с вариантами; у вопроса с вводом своё время (time). */
export const QUIZ_TIME = 15;

export function isInputQuestion(q: QuizQuestion): q is QuizInputQuestion {
  return q.type === "input";
}

/** Сколько секунд на этот вопрос. */
export function quizTime(q: QuizQuestion): number {
  return isInputQuestion(q) ? q.time : QUIZ_TIME;
}

/** Ответ для сравнения: без регистра, «ё» = «е», без кавычек и знаков препинания, лишние пробелы убраны. */
export function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Расстояние Левенштейна не больше 1: одна лишняя, пропущенная или неверная буква. */
function withinOneTypo(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : b.slice(i + 1) === a.slice(i);
}

/** Верен ли введённый ответ: совпадает с любым из answers; у ответов длиннее 5 букв прощаем одну опечатку. */
export function checkAnswer(q: QuizInputQuestion, typed: string): boolean {
  const t = normalizeAnswer(typed);
  if (t === "") return false;
  return q.answers.some((raw) => {
    const a = normalizeAnswer(raw);
    if (a === t) return true;
    return a.replaceAll(" ", "").length > 5 && withinOneTypo(t, a);
  });
}
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

/** Перемешивает варианты ответа при показе; верный находим по тексту, а не по позиции в файле. */
export function shuffleOptions(question: QuizQuestion, random: Random = Math.random): QuizQuestion {
  if (isInputQuestion(question)) return question;
  const rightText = question.options[question.correct];
  const options = [...question.options];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [options[i], options[j]] = [options[j] as string, options[i] as string];
  }
  const correct = options.indexOf(rightText as string);
  return { ...question, options, correct: correct >= 0 ? correct : question.correct };
}

/** Вопросы уровня; из них показанные раньше (seen) пропускаем, пока есть непоказанные. Банк кончился — берём весь уровень заново. */
function pickFresh(pool: readonly QuizQuestion[], seen: ReadonlySet<string>, taken: ReadonlySet<string>, random: Random): QuizQuestion | undefined {
  const fresh = pool.filter((q) => !seen.has(q.id) && !taken.has(q.id));
  const source = fresh.length > 0 ? fresh : pool.filter((q) => !taken.has(q.id));
  return source[Math.floor(random() * source.length)];
}

/** Раунд категории: по одному случайному вопросу каждого уровня из банка, без показанных раньше. Порядок вариантов перемешан. */
export function buildRound(category: QuizBank, random: Random = Math.random, seen: ReadonlySet<string> = new Set()): QuizQuestion[] {
  const round: QuizQuestion[] = [];
  for (const level of QUIZ_LEVELS) {
    const pick = pickFresh(category.questions.filter((q) => q.level === level), seen, new Set(), random);
    if (pick) round.push(shuffleOptions(pick, random));
  }
  return round;
}

/**
 * Раунд про артиста: 5 лёгких → 5 средних → 5 сложных, случайные из банка артиста, без показанных раньше (пока есть непоказанные).
 * Если вопросов уровня меньше пяти (заглушки), берём сколько есть, без повторов. Порядок вариантов перемешан.
 */
export function buildArtistRound(artist: QuizBank, random: Random = Math.random, seen: ReadonlySet<string> = new Set()): QuizQuestion[] {
  const round: QuizQuestion[] = [];
  for (const level of QUIZ_LEVELS) {
    const pool = artist.questions.filter((q) => q.level === level);
    const taken = new Set<string>();
    for (let i = 0; i < ARTIST_PER_LEVEL; i++) {
      const pick = pickFresh(pool, seen, taken, random);
      if (!pick) break;
      taken.add(pick.id);
      round.push(shuffleOptions(pick, random));
    }
  }
  return round;
}

/** Звание по проценту верных ответов: с наибольшим minPercent, который не больше процента игрока. */
export function pickRank<T extends { minPercent: number }>(ranks: readonly T[], percent: number): T | undefined {
  return [...ranks].sort((a, b) => b.minPercent - a.minPercent).find((r) => percent >= r.minPercent);
}

/** Вопросы супер-квиза из банков категорий from: ступени идут по возрастанию уровня (треть на каждый), категории чередуются, без повторов и показанных раньше. */
export function buildSuperRound(file: QuizSuper, categories: readonly QuizCategory[], random: Random = Math.random, seen: ReadonlySet<string> = new Set()): QuizQuestion[] {
  const banks = file.from.map((id) => categories.find((c) => c.id === id)).filter((c): c is QuizCategory => !!c);
  const taken = new Set<string>();
  const round: QuizQuestion[] = [];
  for (let i = 0; i < file.count && banks.length > 0; i++) {
    const level = Math.min(QUIZ_LEVELS.length, 1 + Math.floor((i * QUIZ_LEVELS.length) / file.count));
    const bank = banks[i % banks.length] as QuizCategory;
    const pick = pickFresh(bank.questions.filter((q) => q.level === level), seen, taken, random) ?? pickFresh(bank.questions, seen, taken, random);
    if (!pick) continue;
    taken.add(pick.id);
    round.push(shuffleOptions(pick, random));
  }
  return round;
}

/**
 * Какие id считать показанными после раунда. Если банк уровня был исчерпан (все вопросы уровня уже показаны), он начинается заново:
 * старые отметки этого уровня сбрасываются, и остаётся только что показанный вопрос.
 */
export function nextSeen(categories: readonly QuizBank[], round: readonly QuizQuestion[], seen: ReadonlySet<string>): Set<string> {
  const next = new Set(seen);
  for (const q of round) {
    const bank = categories.find((c) => c.questions.some((x) => x.id === q.id));
    const level = bank?.questions.filter((x) => x.level === q.level) ?? [];
    if (level.length > 0 && level.every((x) => next.has(x.id))) for (const x of level) next.delete(x.id);
    next.add(q.id);
  }
  return next;
}

/** Вопрос дня: один и тот же у всех в этот день, по кругу по всем вопросам банков. Варианты перемешиваются при показе (shuffleOptions). */
export function dailyQuestion(categories: readonly QuizBank[], now: Date): QuizQuestion | undefined {
  const every = categories.flatMap((c) => c.questions);
  // заглушки (draft) в «Вопрос дня» не попадают, пока есть настоящие вопросы
  const real = every.filter((q) => q.draft !== true);
  const all = real.length > 0 ? real : every;
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
  /** Выбранный вариант на экране ответа; -1 — время вышло; у вопроса с вводом: 0 — верно, -2 — неверно (сам ответ в typed). */
  picked: number | null;
  /** Что напечатали в ответ на вопрос с вводом (пустая строка — время вышло). */
  typed: string | null;
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
    typed: null,
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

/** Засчитать ответ текущему игроку: +1 очко (+2 при «риске ×2»), если верно. */
function settle(state: QuizState, right: boolean, picked: number, typed: string | null): QuizState {
  const player = currentPlayer(state);
  const scores = state.scores.map((s, i) => (i === player && right ? s + (state.riskArmed ? 2 : 1) : s));
  const riskUsed = state.riskUsed.map((used, i) => (i === player && state.riskArmed ? true : used));
  return { ...state, phase: "answer", picked, typed, scores, results: [...state.results, right], riskArmed: false, riskUsed };
}

/** Ответ игрока вариантом; choice −1 — время вышло (у вопроса с вводом это тоже «мимо»). */
export function answerQuiz(state: QuizState, choice: number): QuizState {
  const q = currentQuestion(state);
  if (state.phase !== "question" || !q) return state;
  if (isInputQuestion(q)) return choice === -1 ? settle(state, false, -1, "") : state;
  if (choice >= 0 && state.hidden.includes(choice)) return state;
  return settle(state, choice === q.correct, choice, null);
}

/** Ответ игрока на вопрос с вводом (печатный текст). На вопросе с вариантами не действует. */
export function answerText(state: QuizState, text: string): QuizState {
  const q = currentQuestion(state);
  if (state.phase !== "question" || !q || !isInputQuestion(q)) return state;
  const right = checkAnswer(q, text);
  return settle(state, right, right ? 0 : -2, text.trim());
}

/** С экрана ответа — к следующему вопросу или к итогам. */
export function nextQuiz(state: QuizState): QuizState {
  if (state.phase !== "answer") return state;
  const index = state.index + 1;
  if (index >= state.questions.length) return { ...state, index, phase: "done", picked: null, typed: null, hidden: [] };
  return { ...state, index, phase: "question", picked: null, typed: null, hidden: [], riskArmed: false };
}

/** «50:50»: убирает два неверных варианта. Один раз за раунд. */
export function fiftyFifty(state: QuizState, random: Random = Math.random): QuizState {
  const q = currentQuestion(state);
  if (state.phase !== "question" || !q || isInputQuestion(q) || state.helps.fifty) return state;
  const left = [0, 1, 2, 3].filter((i) => i !== q.correct);
  const hidden: number[] = [];
  while (hidden.length < 2 && left.length > 0) {
    const i = Math.floor(random() * left.length);
    hidden.push(left.splice(i, 1)[0] as number);
  }
  return { ...state, hidden, helps: { ...state.helps, fifty: true } };
}

/** «Спроси зал» и «дай телефон другу»: подсказки-напоминания, один раз за раунд. «Спроси зал» на вопросе с вводом недоступна. */
export function takeHelp(state: QuizState, help: "hall" | "friend"): QuizState {
  const q = currentQuestion(state);
  if (state.phase !== "question" || state.helps[help]) return state;
  if (help === "hall" && q && isInputQuestion(q)) return state;
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
export type CourtCase = QuizCourt["cases"][number];

/** Дело для суда: случайное из непоказанных (id в seen); когда все показаны — снова из всех. */
export function pickCourtCase(cases: readonly CourtCase[], seen: ReadonlySet<string>, random: Random = Math.random): CourtCase | undefined {
  const fresh = cases.filter((c) => !seen.has(c.id));
  const source = fresh.length > 0 ? fresh : cases;
  return source[Math.floor(random() * source.length)];
}

/** Какие дела считать показанными после этого: круг закончился — отметки сбрасываются, остаётся только что показанное дело. */
export function nextCourtSeen(cases: readonly CourtCase[], picked: CourtCase, seen: ReadonlySet<string>): Set<string> {
  const next = new Set(seen);
  if (cases.length > 0 && cases.every((c) => next.has(c.id))) for (const c of cases) next.delete(c.id);
  next.add(picked.id);
  return next;
}

export interface CourtVerdict {
  /** Сколько голосов «виновен» и «оправдан». */
  guilty: number;
  free: number;
  /** Решение присяжных. «tie» — голоса поровну (очков нет), «none» — большинства нет (один игрок и нет настоящих голосов). */
  majority: CourtVote | "tie" | "none";
  /** У каждого игрока: совпал ли голос с большинством (за это очко). */
  matched: boolean[];
}

/**
 * Итог голосования по делу. Очко получает тот, чей голос совпал с большинством. Голоса поровну — ничья, очков нет.
 * Один игрок: большинства нет, если у дела нет guiltyPercent (настоящих голосов); с ним сравнивается голос игрока.
 */
export function courtVerdict(votes: readonly CourtVote[], guiltyPercent?: number): CourtVerdict {
  const guilty = votes.filter((v) => v === "guilty").length;
  const free = votes.length - guilty;
  let majority: CourtVerdict["majority"];
  if (votes.length === 1 && guiltyPercent === undefined) majority = "none";
  else if (votes.length === 1 && guiltyPercent !== undefined) majority = guiltyPercent === 50 ? "tie" : guiltyPercent > 50 ? "guilty" : "free";
  else majority = guilty === free ? "tie" : guilty > free ? "guilty" : "free";
  return { guilty, free, majority, matched: votes.map((v) => (majority === "guilty" || majority === "free") && v === majority) };
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
