// Схемы контента GAZ Game.
// Каждый JSON-файл в data/ проверяется этими схемами при загрузке.
// Если в файле ошибка — приложение покажет понятное сообщение с именем файла.
//
// Как расширять:
// - новая механика игры → добавь её в MECHANICS и опиши свою схему ниже;
// - новый способ подсчёта теста → добавь в SCORING_METHODS и реализуй в packages/engine;
// - новое необязательное поле → добавляй через .optional() или .default(), чтобы старые файлы не сломались.
import { z } from "zod";

export const SECTIONS = ["pairs", "company", "solo"] as const;
export const TIERS = ["free", "premium", "supreme"] as const;
export const AGE_RATINGS = ["all", "16+", "18+"] as const;
export const STATUSES = ["draft", "published"] as const;
export const KINDS = ["test", "game"] as const;
export const MECHANICS = ["deck", "vote", "guess-partner"] as const;
export const SCORING_METHODS = ["types"] as const;
/** Откуда карточка: наша или прислана через «Предложи своё». */
export const CARD_SOURCES = ["official", "community"] as const;

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "только маленькие латинские буквы, цифры и дефис, например: love-languages");

const text = z.string().trim().min(1, "текст не может быть пустым");

export const sectionSchema = z.enum(SECTIONS);
export const tierSchema = z.enum(TIERS);
export const ageRatingSchema = z.enum(AGE_RATINGS);

/** Поля, общие для тестов и игр. */
const itemBase = z.strictObject({
  /** Подсказка для редактора (VS Code) и заметка для себя. На логику не влияют. */
  _note: z.string().optional(),
  $schema: z.string().optional(),
  /** Постоянный идентификатор: по нему хранится прогресс и считается аналитика. Не меняй после публикации. */
  id: slug,
  /** Часть адреса страницы: /test/<slug> или /game/<slug>. */
  slug,
  title: text,
  description: text,
  emoji: text,
  sections: z.array(sectionSchema).min(1, "укажи хотя бы один раздел"),
  tier: tierSchema.default("free"),
  ageRating: ageRatingSchema.default("all"),
  players: z
    .strictObject({ min: z.int().min(1), max: z.int().min(1) })
    .refine((p) => p.min <= p.max, "players.min не может быть больше players.max"),
  durationMin: z.int().min(1),
  tags: z.array(text).default([]),
  /** id связанных тестов и игр — показываются в блоке «Связанное». */
  related: z.array(slug).default([]),
  status: z.enum(STATUSES).default("draft"),
});

// ---------- Тесты ----------

export const testOptionSchema = z
  .strictObject({
    /** Необязательный id варианта (для удобства редактора, на подсчёт не влияет). */
    id: z.string().optional(),
    text,
    /** Короткая запись: +1 балл результату с этим id. */
    type: z.string().optional(),
    /** Полная запись: сколько баллов дать каким результатам или шкалам. */
    scores: z.record(z.string(), z.number()).optional(),
  })
  .refine((o) => o.type !== undefined || o.scores !== undefined, "у варианта ответа должен быть type или scores");

export const testQuestionSchema = z.strictObject({
  /** id вопроса — нужен, чтобы сослаться на него в scoring.tieBreak.lastQuestions. */
  id: z.string().optional(),
  text,
  options: z.array(testOptionSchema).min(2, "у вопроса должно быть минимум 2 варианта"),
});

/** Закрытая часть: старый формат (у каждого результата свой deepTeaser). */
const deepTeaserSchema = z.strictObject({
  tier: z.enum(["premium", "supreme"]).default("premium"),
  text,
});

export const testResultSchema = z
  .strictObject({
    id: z.string().min(1),
    title: text,
    emoji: text,
    /** Короткая подпись под названием, например «Двигатель». */
    subtitle: text.optional(),
    /** Бесплатная часть результата одним абзацем (старый формат). */
    text: text.optional(),
    /** Бесплатная часть результата несколькими абзацами (новый формат). */
    paragraphs: z.array(text).min(1).optional(),
    /** Сильные стороны — показываются плашками. */
    strengths: z.array(text).optional(),
    /** «На что обратить внимание». */
    watchOut: text.optional(),
    /** Совет. */
    tip: text.optional(),
    /** Текст, который подставляется при «Поделиться». */
    shareText: text.optional(),
    /** Закрытая «глубокая» часть (старый формат; в новом — общий блок upsell у теста). */
    deepTeaser: deepTeaserSchema.optional(),
  })
  .refine((r) => r.text !== undefined || r.paragraphs !== undefined, "у результата должен быть text или paragraphs");

/** Подробные настройки подсчёта. Короткая запись "types" = { "type": "types" }. */
export const scoringConfigSchema = z.strictObject({
  type: z.enum(SCORING_METHODS),
  /** Порядок типов: по нему решается ничья, если остальное равно. По умолчанию — порядок results. */
  types: z.array(z.string()).optional(),
  /** Ничья: побеждает тип, набравший больше в этих вопросах. */
  tieBreak: z
    .strictObject({
      /** Описание правила для редактора. На подсчёт не влияет. */
      rule: z.string().optional(),
      lastQuestions: z.array(z.string()).min(1),
    })
    .optional(),
  /** Смешанный результат: «основной тип + нотки второго», если второй отстаёт не больше чем на maxGap баллов. */
  blend: z
    .strictObject({
      rule: z.string().optional(),
      maxGap: z.number().min(0),
    })
    .optional(),
});

/** Блок «Глубже»: одна кнопка → экран с premium (главный вариант) и supreme (мелкой строкой). */
export const upsellSchema = z.strictObject({
  /** Надпись на кнопке, например «Глубже 💎». */
  button: text,
  premium: z.strictObject({
    tier: z.literal("premium"),
    headline: text.optional(),
    text,
    primary: z.boolean().default(true),
  }),
  supreme: z
    .strictObject({
      tier: z.literal("supreme"),
      headline: text.optional(),
      text,
      primary: z.boolean().default(false),
    })
    .optional(),
});

export const testSchema = itemBase
  .extend({
    kind: z.literal("test"),
    scoring: z.union([z.enum(SCORING_METHODS), scoringConfigSchema]).default("types"),
    /** Мелкая оговорка, например «Тест для самопознания, а не диагноз». */
    disclaimer: text.optional(),
    /** Подсказка перед стартом. */
    intro: text.optional(),
    questions: z.array(testQuestionSchema).min(1),
    results: z.array(testResultSchema).min(1),
    /** Для смешанного результата: как звучат «нотки» каждого типа. Ключ — id результата. */
    blendNotes: z.record(z.string(), z.strictObject({ title: text, text })).optional(),
    upsell: upsellSchema.optional(),
  })
  .superRefine((test, ctx) => {
    const ids = new Set<string>();
    test.results.forEach((r, i) => {
      if (ids.has(r.id)) {
        ctx.addIssue({ code: "custom", path: ["results", i, "id"], message: `результат "${r.id}" повторяется` });
      }
      ids.add(r.id);
    });
    const known = `(есть: ${[...ids].join(", ")})`;
    test.questions.forEach((q, qi) =>
      q.options.forEach((o, oi) => {
        const keys = [...(o.type ? [o.type] : []), ...Object.keys(o.scores ?? {})];
        for (const key of keys) {
          if (!ids.has(key)) {
            ctx.addIssue({
              code: "custom",
              path: ["questions", qi, "options", oi],
              message: `нет результата с id "${key}" ${known}`,
            });
          }
        }
      }),
    );

    const questionIds = new Set<string>();
    test.questions.forEach((q, qi) => {
      if (q.id === undefined) return;
      if (questionIds.has(q.id)) {
        ctx.addIssue({ code: "custom", path: ["questions", qi, "id"], message: `вопрос "${q.id}" повторяется` });
      }
      questionIds.add(q.id);
    });

    if (typeof test.scoring === "object") {
      test.scoring.types?.forEach((type, i) => {
        if (!ids.has(type)) {
          ctx.addIssue({ code: "custom", path: ["scoring", "types", i], message: `нет результата с id "${type}" ${known}` });
        }
      });
      test.scoring.tieBreak?.lastQuestions.forEach((qid, i) => {
        if (!questionIds.has(qid)) {
          ctx.addIssue({
            code: "custom",
            path: ["scoring", "tieBreak", "lastQuestions", i],
            message: `нет вопроса с id "${qid}" — добавь "id" этому вопросу`,
          });
        }
      });
      if (test.scoring.blend && !test.blendNotes) {
        ctx.addIssue({ code: "custom", path: ["blendNotes"], message: "для scoring.blend нужны blendNotes" });
      }
    }
    for (const key of Object.keys(test.blendNotes ?? {})) {
      if (!ids.has(key)) {
        ctx.addIssue({ code: "custom", path: ["blendNotes", key], message: `нет результата с id "${key}" ${known}` });
      }
    }
  });

// ---------- Игры ----------

export const cardSchema = z.strictObject({
  text,
  /** Тип карточки, например "truth" или "dare" (для игр с выбором типа). */
  type: z.string().optional(),
  /** Звание победителю раунда (механика vote), например «Соня года 😴». */
  award: z.string().optional(),
  /** Варианты ответа (механика guess-partner). */
  options: z.array(text).min(2).optional(),
  source: z.enum(CARD_SOURCES).default("official"),
});

export const deckSchema = z.strictObject({
  id: slug,
  /** Название режима, например «Весело» или «Глубоко». */
  title: text,
  emoji: text,
  description: z.string().optional(),
  tier: tierSchema.default("free"),
  ageRating: ageRatingSchema.default("all"),
  cards: z.array(cardSchema).min(1, "в колоде должна быть хотя бы одна карточка"),
});

const gameBase = itemBase.extend({
  kind: z.literal("game"),
  /** Правила коротким списком — показываются перед игрой. */
  rules: z.array(text).default([]),
  decks: z.array(deckSchema).min(1),
});

/** «Я никогда не…», «Правда или действие»: тянем карточки по одной. */
export const deckGameSchema = gameBase.extend({
  mechanic: z.literal("deck"),
  /** Если заданы — игрок сам выбирает тип карточки (например, Правда / Действие). */
  cardTypes: z.array(z.strictObject({ id: z.string().min(1), title: text, emoji: text })).optional(),
});

/** «Кто из компании?»: все тайно голосуют за игрока. */
export const voteGameSchema = gameBase.extend({
  mechanic: z.literal("vote"),
});

/** «Насколько хорошо вы знаете друг друга»: отвечаешь про себя и угадываешь партнёра. */
export const guessPartnerGameSchema = gameBase.extend({
  mechanic: z.literal("guess-partner"),
  /** Звания по проценту совпадения. Берётся первое, где процент ≥ minPercent. */
  ranks: z
    .array(z.strictObject({ minPercent: z.number().min(0).max(100), title: text, emoji: text, text }))
    .min(1),
});

export const gameSchema = z
  .discriminatedUnion("mechanic", [deckGameSchema, voteGameSchema, guessPartnerGameSchema])
  .superRefine((game, ctx) => {
    game.decks.forEach((deck, di) =>
      deck.cards.forEach((card, ci) => {
        const path = ["decks", di, "cards", ci];
        if (game.mechanic === "guess-partner" && !card.options) {
          ctx.addIssue({ code: "custom", path, message: "в этой игре у карточки должны быть options (варианты ответа)" });
        }
        if (game.mechanic === "deck" && game.cardTypes) {
          const types = game.cardTypes.map((t) => t.id);
          if (!card.type || !types.includes(card.type)) {
            ctx.addIssue({ code: "custom", path, message: `у карточки должен быть type: ${types.join(" или ")}` });
          }
        }
      }),
    );
    if (game.mechanic === "guess-partner" && !game.ranks.some((r) => r.minPercent === 0)) {
      ctx.addIssue({ code: "custom", path: ["ranks"], message: "нужно звание с minPercent: 0 — на случай любого результата" });
    }
  });

export type Section = z.infer<typeof sectionSchema>;
export type Tier = z.infer<typeof tierSchema>;
export type AgeRating = z.infer<typeof ageRatingSchema>;
export type Test = z.infer<typeof testSchema>;
export type TestQuestion = z.infer<typeof testQuestionSchema>;
export type TestOption = z.infer<typeof testOptionSchema>;
export type TestResult = z.infer<typeof testResultSchema>;
export type ScoringConfig = z.infer<typeof scoringConfigSchema>;
export type Upsell = z.infer<typeof upsellSchema>;
export type BlendNote = NonNullable<Test["blendNotes"]>[string];
export type Card = z.infer<typeof cardSchema>;
export type Deck = z.infer<typeof deckSchema>;
export type Game = z.infer<typeof gameSchema>;
export type DeckGame = z.infer<typeof deckGameSchema>;
export type VoteGame = z.infer<typeof voteGameSchema>;
export type GuessPartnerGame = z.infer<typeof guessPartnerGameSchema>;
export type Mechanic = Game["mechanic"];
export type ContentItem = Test | Game;

/** Весь контент приложения. */
export interface Catalog {
  tests: Test[];
  games: Game[];
}
