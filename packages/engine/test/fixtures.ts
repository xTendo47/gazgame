// Тестовые данные. Пропускаем через настоящие схемы — так получаем значения по умолчанию.
import { gameSchema, testSchema, type DeckGame, type GuessPartnerGame, type Test, type VoteGame } from "@gazgame/content";

const base = {
  description: "описание",
  emoji: "🧪",
  players: { min: 1, max: 10 },
  durationMin: 1,
};

export const temperamentLike: Test = testSchema.parse({
  ...base,
  id: "t",
  slug: "t",
  kind: "test",
  title: "Тест",
  sections: ["solo"],
  questions: [
    { text: "1", options: [{ text: "a", type: "a" }, { text: "b", type: "b" }, { text: "c", type: "c" }] },
    { text: "2", options: [{ text: "a", type: "a" }, { text: "b", type: "b" }, { text: "c", type: "c" }] },
    { text: "3", options: [{ text: "a", type: "a" }, { text: "b+c", scores: { b: 1, c: 2 } }] },
  ],
  results: ["a", "b", "c"].map((id) => ({ id, title: id, emoji: "✨", text: id, deepTeaser: { text: id } })),
});

/** Новый формат: баллы по типам, ничья по последнему вопросу, смешанный результат. */
const q = (id: string, withMixed = true) => ({
  id,
  text: id,
  options: [
    { text: "a", scores: { a: 2 } },
    { text: "b", scores: { b: 2 } },
    { text: "c", scores: { c: 2 } },
    ...(withMixed ? [{ text: "a+b", scores: { a: 1, b: 1 } }] : []),
  ],
});

export const temperamentBlend: Test = testSchema.parse({
  ...base,
  id: "tb",
  slug: "tb",
  kind: "test",
  title: "Тест со смесью",
  sections: ["solo"],
  scoring: {
    type: "types",
    // Порядок нарочно не совпадает с results: при полной ничьей побеждает "b".
    types: ["b", "a", "c"],
    tieBreak: { lastQuestions: ["q4"] },
    blend: { maxGap: 2 },
  },
  questions: [q("q1"), q("q2"), q("q3"), q("q4", false)],
  results: ["a", "b", "c"].map((id) => ({ id, title: id, emoji: "✨", paragraphs: [id] })),
  blendNotes: {
    a: { title: "с нотками a", text: "a" },
    b: { title: "с нотками b", text: "b" },
  },
});

/** Подсчёт "scales": 3 шкалы по 2 вопроса, вариант i даёт 3 - i баллов (максимум шкалы — 6). */
const scaleQuestion = (id: string, scale: string) => ({
  id,
  scale,
  text: id,
  options: [3, 2, 1, 0].map((score) => ({ text: String(score), score })),
});

export const selfEsteemLike: Test = testSchema.parse({
  ...base,
  id: "se",
  slug: "se",
  kind: "test",
  title: "Шкалы",
  sections: ["solo"],
  scoring: {
    type: "scales",
    scales: [
      { id: "a", title: "Шкала А", emoji: "🅰️", max: 6 },
      { id: "b", title: "Шкала Б", emoji: "🅱️", max: 6 },
      { id: "c", title: "Шкала В", emoji: "🌀", max: 6 },
    ],
    totalMax: 18,
    scaleLevels: { low: [0, 2], mid: [3, 4], high: [5, 6] },
    flatGap: 1,
  },
  // Порядок вопросов: a, b, c, a, b, c
  questions: [
    scaleQuestion("q1", "a"),
    scaleQuestion("q2", "b"),
    scaleQuestion("q3", "c"),
    scaleQuestion("q4", "a"),
    scaleQuestion("q5", "b"),
    scaleQuestion("q6", "c"),
  ],
  results: [
    { id: "low", range: [0, 6], title: "low", emoji: "🌧️", paragraphs: ["low"] },
    { id: "mid", range: [7, 12], title: "mid", emoji: "🌤️", paragraphs: ["mid"] },
    { id: "high", range: [13, 18], title: "high", emoji: "🧱", paragraphs: ["high"] },
  ],
  zones: Object.fromEntries(
    ["a", "b", "c"].map((sc) => [sc, { low: `${sc}-low`, mid: `${sc}-mid`, high: `${sc}-high` }]),
  ),
  profileBlocks: { strongest: "Опора", weakest: "Зона роста", flatProfile: "Ровно" },
});

export const truthOrDare = gameSchema.parse({
  ...base,
  id: "tod",
  slug: "tod",
  kind: "game",
  mechanic: "deck",
  title: "Правда или действие",
  sections: ["pairs"],
  cardTypes: [
    { id: "truth", title: "Правда", emoji: "🗣️" },
    { id: "dare", title: "Действие", emoji: "⚡" },
  ],
  decks: [
    {
      id: "fun",
      title: "Весело",
      emoji: "😜",
      cards: [
        { type: "truth", text: "t1" },
        { type: "truth", text: "t2" },
        { type: "dare", text: "d1" },
      ],
    },
  ],
}) as DeckGame;

export const whoInCompany = gameSchema.parse({
  ...base,
  id: "who",
  slug: "who",
  kind: "game",
  mechanic: "vote",
  title: "Кто из компании?",
  sections: ["company"],
  decks: [
    {
      id: "classic",
      title: "Классика",
      emoji: "🎉",
      cards: [
        { text: "Кто проспит?", award: "Соня" },
        { text: "Кто разбогатеет?", award: "Олигарх" },
      ],
    },
  ],
}) as VoteGame;

export const knowEachOther = gameSchema.parse({
  ...base,
  id: "know",
  slug: "know",
  kind: "game",
  mechanic: "guess-partner",
  title: "Знаете друг друга?",
  sections: ["pairs"],
  decks: [
    {
      id: "basics",
      title: "Основы",
      emoji: "💞",
      cards: [
        { text: "Время суток?", options: ["Утро", "Ночь"] },
        { text: "Отдых?", options: ["Море", "Горы"] },
      ],
    },
  ],
  ranks: [
    { minPercent: 85, title: "Телепаты", emoji: "🧠", text: "т" },
    { minPercent: 30, title: "Ещё знакомитесь", emoji: "🔍", text: "т" },
    { minPercent: 0, title: "Загадки", emoji: "❓", text: "т" },
  ],
}) as GuessPartnerGame;
