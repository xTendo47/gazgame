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
export const TIERS = ["free", "premium"] as const;
export const AGE_RATINGS = ["all", "16+", "18+"] as const;
export const STATUSES = ["draft", "published"] as const;
export const KINDS = ["test", "game"] as const;
export const MECHANICS = ["deck", "vote", "guess-partner", "mafia", "spy"] as const;
export const SCORING_METHODS = ["types", "scales"] as const;
/** Откуда карточка: наша или прислана через «Предложи своё». */
export const CARD_SOURCES = ["official", "community"] as const;
/** Цвет карточки и финала в игре раундами: салатовый, оранжевый или тёмный с голубым свечением (как «Подписка»). */
export const DECK_ACCENTS = ["lime", "orange", "blue"] as const;
/** «Костюмы» карточки для шеринга: средний блок картинки у каждого теста свой. */
export const SHARE_STYLES = ["composition", "batteries", "receipt", "hero", "device", "player", "messenger"] as const;

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
    /** Подсчёт "scales": сколько баллов вариант даёт шкале своего вопроса (обычно 0–3). */
    score: z.number().min(0).optional(),
  })
  .refine(
    (o) => o.type !== undefined || o.scores !== undefined || o.score !== undefined,
    "у варианта ответа должен быть type, scores или score",
  );

/**
 * Подмена текста вопроса для одной версии теста (например, для парня): text — новый текст вопроса,
 * options — новые тексты ответов по их id. Баллы, id и порядок ответов всегда берутся из базового вопроса.
 */
export const questionAudienceSchema = z.strictObject({
  text: text.optional(),
  options: z.record(z.string(), text).optional(),
});

export const testQuestionSchema = z.strictObject({
  /** id вопроса — нужен, чтобы сослаться на него в scoring.tieBreak.lastQuestions. */
  id: z.string().optional(),
  /** Тексты для версий теста (ключ — id версии из audience теста). Нет версии — базовый текст. */
  audience: z.record(z.string(), questionAudienceSchema).optional(),
  /** Подсчёт "scales": к какой шкале относится вопрос. */
  scale: z.string().optional(),
  text,
  options: z.array(testOptionSchema).min(2, "у вопроса должно быть минимум 2 варианта"),
});

/** Закрытая часть: старый формат (у каждого результата свой deepTeaser). */
/** Диапазон баллов [от, до] включительно. */
const rangeSchema = z
  .tuple([z.number().min(0), z.number().min(0)])
  .refine(([from, to]) => from <= to, "в диапазоне [от, до] первое число не может быть больше второго");

const deepTeaserSchema = z.strictObject({
  tier: z.enum(["premium"]).default("premium"),
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
    /** «Как меня любить»: список, который можно скопировать и отправить своему человеку. */
    howToLoveMe: z.array(text).min(1).optional(),
    /** Мягкая забота под советом, например «поговори с близким или психологом». */
    care: text.optional(),
    /**
     * Для карточки шеринга (костюм теста — share.style): line — фирменная строка результата,
     * duo и danger — id других результатов («Идеальный дуэт», «Опасно тусить с»; danger может указывать на себя).
     */
    share: z.strictObject({ line: text.optional(), duo: z.string().optional(), danger: z.string().optional() }).optional(),
    /** Подсчёт "scales": при какой сумме баллов [от, до] показывается этот результат. */
    range: rangeSchema.optional(),
    /** Текст, который подставляется при «Поделиться». */
    shareText: text.optional(),
    /** Закрытая «глубокая» часть (старый формат; в новом — общий блок upsell у теста). */
    deepTeaser: deepTeaserSchema.optional(),
  })
  .refine((r) => r.text !== undefined || r.paragraphs !== undefined, "у результата должен быть text или paragraphs");

/** Подсчёт "types": побеждает тип с наибольшим счётом. Короткая запись "types" = { "type": "types" }. */
export const typesScoringSchema = z.strictObject({
  type: z.literal("types"),
  /** Описание правила для редактора. На подсчёт не влияет. */
  rule: z.string().optional(),
  /** Порядок типов: по нему решается ничья, если остальное равно. По умолчанию — порядок results. */
  types: z.array(z.string()).optional(),
  /** Ничья: побеждает тип, набравший больше в этих вопросах. */
  tieBreak: z
    .strictObject({
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
  /** Показать на экране результата все типы полосками от сильного к слабому. */
  showRanking: z.boolean().optional(),
  /** Описание для редактора. На подсчёт не влияет. */
  rankingRule: z.string().optional(),
});

/**
 * Подсчёт "scales": каждый вопрос относится к шкале, вариант даёт ей score.
 * Сумма всех шкал выбирает результат по results[].range, по каждой шкале — уровень из scaleLevels.
 */
export const scalesScoringSchema = z.strictObject({
  type: z.literal("scales"),
  rule: z.string().optional(),
  scales: z
    .array(z.strictObject({ id: z.string().min(1), title: text, emoji: text, max: z.number().min(1) }))
    .min(1),
  /** Максимум суммы. Если указан — проверяется, что он равен сумме max всех шкал. */
  totalMax: z.number().min(1).optional(),
  /** Уровни шкалы: { "low": [0, 5], "mid": [6, 8], "high": [9, 12] }. */
  scaleLevels: z.record(z.string(), rangeSchema),
  /** Если все шкалы отличаются не больше чем на flatGap, профиль «ровный»: вместо опоры и зоны роста — profileBlocks.flatProfile. */
  flatGap: z.number().min(0).default(0),
});

export const scoringConfigSchema = z.discriminatedUnion("type", [typesScoringSchema, scalesScoringSchema]);

/** Блок «Глубже»: одна кнопка → экран с предложением подписки premium (она одна на весь продукт). */
export const upsellSchema = z.strictObject({
  /** Надпись на кнопке, например «Глубже 💎». */
  button: text,
  premium: z.strictObject({
    tier: z.literal("premium"),
    headline: text.optional(),
    text,
    primary: z.boolean().default(true),
  }),
});

export const testSchema = itemBase
  .extend({
    kind: z.literal("test"),
    /** Короткая запись "types" или полная: { "type": "types" | "scales", ... }. */
    scoring: z.union([z.literal("types"), scoringConfigSchema]).default("types"),
    /** Мелкая оговорка, например «Тест для самопознания, а не диагноз». */
    disclaimer: text.optional(),
    /** Подсказка перед стартом. */
    intro: text.optional(),
    /**
     * Версии теста: перед первым вопросом спрашиваем «Кто проходит?» (например, «Парень» / «Девушка»).
     * Итоги, баллы и подсчёт общие; у вопросов можно подменить тексты для версии (question.audience).
     */
    audience: z
      .strictObject({
        title: text,
        options: z.array(z.strictObject({ id: slug, label: text })).min(2, "нужно минимум две версии"),
      })
      .optional(),
    questions: z.array(testQuestionSchema).min(1),
    results: z.array(testResultSchema).min(1),
    /** Для смешанного результата: как звучат «нотки» каждого типа. Ключ — id результата. */
    blendNotes: z.record(z.string(), z.strictObject({ title: text, text })).optional(),
    /** Подсчёт "scales": текст для каждой шкалы и уровня: zones.<шкала>.<уровень>. */
    zones: z.record(z.string(), z.record(z.string(), text)).optional(),
    /** Подсчёт "scales": заголовки «Твоя опора» / «Твоя зона роста» и текст для ровного профиля. */
    profileBlocks: z.strictObject({ strongest: text, weakest: text, flatProfile: text }).optional(),
    /** Заголовки дополнительных блоков результата. */
    resultBlocks: z
      .strictObject({
        /** Заголовок блока howToLoveMe, например «Как меня любить». */
        howToLoveMe: text.optional(),
        /** Подсказка под заголовком, например «Скинь это своему человеку 😉». */
        howToLoveMeHint: text.optional(),
        /** Эмодзи заголовка и маркер пунктов, например «🗝️». Нет — 💌 и ♥ (как у «Языков любви»). */
        howToLoveMeEmoji: text.optional(),
        /** Текст кнопки копирования, например «Скопировать в общий чат». Нет — «Скопировать для своего человека». */
        howToLoveMeCopy: text.optional(),
      })
      .optional(),
    upsell: upsellSchema.optional(),
    /**
     * Шеринг итога: надпись на кнопке «Куда кидаем?» и текст сообщения в чат.
     * Плейсхолдеры: {title} {emoji} {pct} {scale} {link}. Нет share — «Пофлексить 🧊» и shareText результата.
     */
    share: z.strictObject({ button: text, text, style: z.enum(SHARE_STYLES).optional() }).optional(),
    /** Выход на «Совместимость 💎» после блока «Как со мной встречаться»: заголовок, текст и кнопка с замком. */
    compat: z.strictObject({ title: text, text, button: text }).optional(),
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
    // Версии теста: ключи у вопросов — из audience теста, id ответов в подмене — существующие
    const versions = new Set(test.audience?.options.map((o) => o.id) ?? []);
    test.questions.forEach((q, qi) => {
      for (const [version, override] of Object.entries(q.audience ?? {})) {
        if (!versions.has(version)) {
          ctx.addIssue({
            code: "custom",
            path: ["questions", qi, "audience", version],
            message: test.audience
              ? `нет версии "${version}" в audience теста (есть: ${[...versions].join(", ")})`
              : `у вопроса есть audience, а у теста нет поля audience с версиями`,
          });
        }
        const optionIds = new Set(q.options.map((o) => o.id).filter((id): id is string => id !== undefined));
        for (const optionId of Object.keys(override.options ?? {})) {
          if (!optionIds.has(optionId)) {
            ctx.addIssue({
              code: "custom",
              path: ["questions", qi, "audience", version, "options", optionId],
              message: `нет ответа с id "${optionId}" в этом вопросе (есть: ${[...optionIds].join(", ")})`,
            });
          }
        }
      }
    });
    test.results.forEach((r, ri) => {
      for (const key of ["duo", "danger"] as const) {
        const ref = r.share?.[key];
        if (ref !== undefined && !ids.has(ref)) {
          ctx.addIssue({ code: "custom", path: ["results", ri, "share", key], message: `нет результата с id "${ref}" ${known}` });
        }
      }
    });
    if (typeof test.scoring === "object" && test.scoring.type === "scales") {
      checkScales(test, test.scoring, ctx);
      return;
    }
    test.questions.forEach((q, qi) =>
      q.options.forEach((o, oi) => {
        if (o.type === undefined && o.scores === undefined) {
          ctx.addIssue({ code: "custom", path: ["questions", qi, "options", oi], message: "у варианта должен быть type или scores" });
        }
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

interface ScalesTestInput {
  questions: TestQuestion[];
  results: TestResult[];
  zones?: Record<string, Record<string, string>>;
}

/** Проверки для подсчёта "scales": шкалы у вопросов, score у вариантов, диапазоны без дыр и пересечений. */
function checkScales(test: ScalesTestInput, scoring: ScalesScoring, ctx: z.RefinementCtx) {
  const scaleIds = scoring.scales.map((sc) => sc.id);
  const scaleList = `(есть: ${scaleIds.join(", ")})`;
  const realMax: Record<string, number> = {};

  test.questions.forEach((q, qi) => {
    if (!q.scale || !scaleIds.includes(q.scale)) {
      ctx.addIssue({
        code: "custom",
        path: ["questions", qi, "scale"],
        message: q.scale ? `нет шкалы "${q.scale}" ${scaleList}` : `у вопроса должно быть поле scale ${scaleList}`,
      });
      return;
    }
    q.options.forEach((o, oi) => {
      if (o.score === undefined) {
        ctx.addIssue({ code: "custom", path: ["questions", qi, "options", oi], message: "у варианта должен быть score" });
      }
    });
    realMax[q.scale] = (realMax[q.scale] ?? 0) + Math.max(...q.options.map((o) => o.score ?? 0));
  });

  scoring.scales.forEach((sc, si) => {
    if ((realMax[sc.id] ?? 0) !== sc.max) {
      ctx.addIssue({
        code: "custom",
        path: ["scoring", "scales", si, "max"],
        message: `по вопросам у шкалы "${sc.id}" максимум ${realMax[sc.id] ?? 0}, а указано ${sc.max}`,
      });
    }
  });
  const total = scoring.scales.reduce((sum, sc) => sum + sc.max, 0);
  if (scoring.totalMax !== undefined && scoring.totalMax !== total) {
    ctx.addIssue({
      code: "custom",
      path: ["scoring", "totalMax"],
      message: `сумма max шкал — ${total}, а totalMax — ${scoring.totalMax}`,
    });
  }

  const resultRanges: [number, number][] = [];
  test.results.forEach((r, ri) => {
    if (r.range) resultRanges.push(r.range);
    else ctx.addIssue({ code: "custom", path: ["results", ri, "range"], message: "у результата должен быть range: [от, до]" });
  });
  const gap = findGap(resultRanges, total);
  if (resultRanges.length === test.results.length && gap) {
    ctx.addIssue({ code: "custom", path: ["results"], message: `диапазоны range: ${gap} (сумма бывает от 0 до ${total})` });
  }

  const levels = Object.keys(scoring.scaleLevels);
  const maxScale = Math.max(...scoring.scales.map((sc) => sc.max));
  const levelGap = findGap(Object.values(scoring.scaleLevels), maxScale);
  if (levelGap) {
    ctx.addIssue({
      code: "custom",
      path: ["scoring", "scaleLevels"],
      message: `уровни шкал: ${levelGap} (баллы шкалы — от 0 до ${maxScale})`,
    });
  }

  for (const [scale, byLevel] of Object.entries(test.zones ?? {})) {
    if (!scaleIds.includes(scale)) {
      ctx.addIssue({ code: "custom", path: ["zones", scale], message: `нет шкалы "${scale}" ${scaleList}` });
      continue;
    }
    for (const level of Object.keys(byLevel)) {
      if (!levels.includes(level)) {
        ctx.addIssue({
          code: "custom",
          path: ["zones", scale, level],
          message: `нет уровня "${level}" (есть: ${levels.join(", ")})`,
        });
      }
    }
  }
}

/** Проверяет, что целые числа от 0 до max покрыты диапазонами ровно по одному разу. Возвращает описание проблемы. */
function findGap(ranges: [number, number][], max: number): string | null {
  for (let n = 0; n <= max; n++) {
    const hits = ranges.filter(([from, to]) => from <= n && n <= to).length;
    if (hits === 0) return `число ${n} не попадает ни в один диапазон`;
    if (hits > 1) return `число ${n} попадает сразу в несколько диапазонов`;
  }
  return null;
}

// ---------- Игры ----------

export const cardSchema = z.strictObject({
  text,
  /** Тип карточки, например "truth" или "dare" (для игр с выбором типа). */
  type: z.string().optional(),
  /** Звание победителю раунда (механика vote), например «Соня года 😴». */
  award: z.string().optional(),
  /** Варианты ответа (механика guess-partner). */
  options: z.array(text).min(2).optional(),
  /** guess-partner: вопрос для того, кто отвечает про себя («Ты…»). В text — форма для угадывающего с {name}. */
  selfText: text.optional(),
  /** guess-partner: варианты в форме «про себя», в том же порядке, что options. */
  selfOptions: z.array(text).min(2).optional(),
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
  /** Сколько вопросов брать из колоды за одну игру (guess-partner). */
  questionsPerGame: z.int().min(1).optional(),
  /** Закрытая колода: «скоро» или «по подписке». Может быть без карточек. */
  locked: z.strictObject({ reason: z.enum(["soon", "subscription"]), text }).optional(),
  /** id другой колоды этой игры: эта откроется, когда пара хоть раз доиграет ту до финала (запоминается на устройстве). */
  unlockAfter: slug.optional(),
  /** Строка под финалом игры, зовёт в следующую колоду, например «Слишком мило? Попробуйте Без тормозов 💎». */
  upsellText: text.optional(),
  /** Цвет карточки и финала (игра раундами). По умолчанию orange. */
  accent: z.enum(DECK_ACCENTS).optional(),
  cards: z.array(cardSchema),
}).refine((d) => d.locked !== undefined || d.cards.length > 0, {
  message: "в колоде должна быть хотя бы одна карточка",
  path: ["cards"],
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
  /**
   * Игра раундами («Кто из нас?»): столько карточек за раунд. Перед первой карточкой — экран правил,
   * после каждой — экран handoffText, в конце раунда — finale. Без повторов, пока колода не кончится.
   */
  roundSize: z.int().min(1).optional(),
  /** Экран после каждой карточки, например «Передай телефон соседу справа 👉». */
  handoffText: text.optional(),
  /** Маленькая кнопка на карточке, например «Рассказывай! 👀»: на секунду весёлая анимация, ничего не считает. */
  cardButton: text.optional(),
  /** Финал раунда. */
  finale: z
    .strictObject({
      emoji: text,
      title: text,
      text,
      /** Кнопка, которая показывает случайную подсказку из hints, например «Нет идей? 🎲». */
      hintButton: text,
      hints: z.array(text).min(1, "нужна хотя бы одна подсказка"),
      /** Текст для «Пофлексить 🧊». */
      flexText: text,
    })
    .optional(),
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

// ---------- Мафия ----------

/** Роль в «Мафии». side: mafia — команда мафии, city — город, host — ведущий (не играет). */
export const mafiaRoleSchema = z.strictObject({
  id: slug,
  emoji: text,
  title: text,
  side: z.enum(["mafia", "city", "host"]),
  /** Что делает роль — показывается на карте роли. */
  text,
  min: z.int().min(0).optional(),
  max: z.int().min(0).optional(),
  /** Считается сама как остаток (мирные жители). Такая роль одна. */
  auto: z.boolean().optional(),
});

/**
 * «Мафия»: раздатчик ролей, таймер и подсчёт победы. Колод нет.
 * defaults — состав по числу игроков БЕЗ ведущего (from..to включительно), мирные — остаток.
 */
export const mafiaGameSchema = itemBase.extend({
  kind: z.literal("game"),
  mechanic: z.literal("mafia"),
  rules: z.array(text).default([]),
  /** Подпись под выбором числа игроков. */
  playersHint: text,
  /** Подсказка к выбору «ведущий 0 или 1». */
  hostHint: text,
  roles: z.array(mafiaRoleSchema).min(2),
  defaults: z
    .array(z.strictObject({ from: z.int().min(1), to: z.int().min(1), roles: z.record(z.string(), z.int().min(0)) }))
    .min(1),
  /** Роли и темы под замком (по подписке). */
  lockedExtras: z.array(z.strictObject({ emoji: text, title: text, kind: z.enum(["role", "theme"]) })).default([]),
  lockedText: text,
  /** Шпаргалка ведущему на ночь — по шагам. */
  nightScript: z.array(text).min(1),
  morningHint: text,
  /** Таймер обсуждения: длительность по умолчанию и шаг, в секундах. */
  timer: z.strictObject({ defaultSec: z.int().min(10), stepSec: z.int().min(5) }),
  texts: z.strictObject({
    start: text,
    /** {n} — номер игрока, {total} — сколько всего. */
    deal: text,
    pass: text,
    dealt: text,
    hostButton: text,
    hostConfirm: text,
    cityWins: text,
    mafiaWins: text,
    flexCity: text,
    flexMafia: text,
    /** Надпись на рубашке карты. */
    cardBack: text,
  }),
});

type MafiaGameInput = z.infer<typeof mafiaGameSchema>;

/** Проверки «Мафии»: id ролей, одна auto-роль мирных, есть мафия, defaults ссылаются на роли и покрывают всех игроков. */
function checkMafia(game: MafiaGameInput, ctx: z.RefinementCtx) {
  const ids = new Set<string>();
  game.roles.forEach((r, i) => {
    if (ids.has(r.id)) ctx.addIssue({ code: "custom", path: ["roles", i, "id"], message: `роль "${r.id}" повторяется` });
    ids.add(r.id);
    if (r.min !== undefined && r.max !== undefined && r.min > r.max) {
      ctx.addIssue({ code: "custom", path: ["roles", i], message: "min не может быть больше max" });
    }
  });
  const autos = game.roles.filter((r) => r.auto);
  if (autos.length !== 1) {
    ctx.addIssue({ code: "custom", path: ["roles"], message: `нужна ровно одна роль с "auto": true (мирные как остаток), сейчас ${autos.length}` });
  }
  if (autos.some((r) => r.side !== "city")) {
    ctx.addIssue({ code: "custom", path: ["roles"], message: 'роль с "auto": true должна быть на стороне "city"' });
  }
  if (!game.roles.some((r) => r.side === "mafia")) {
    ctx.addIssue({ code: "custom", path: ["roles"], message: 'нужна хотя бы одна роль с "side": "mafia"' });
  }
  const configurable = new Set(game.roles.filter((r) => !r.auto && r.side !== "host").map((r) => r.id));
  game.defaults.forEach((d, di) => {
    if (d.from > d.to) ctx.addIssue({ code: "custom", path: ["defaults", di], message: "from не может быть больше to" });
    for (const id of Object.keys(d.roles)) {
      if (!configurable.has(id)) {
        ctx.addIssue({
          code: "custom",
          path: ["defaults", di, "roles", id],
          message: `в defaults можно указывать только роли без auto и не ведущего (есть: ${[...configurable].join(", ")})`,
        });
      }
    }
  });
  for (let n = game.players.min; n <= game.players.max; n++) {
    const hits = game.defaults.filter((d) => d.from <= n && n <= d.to).length;
    if (hits !== 1) {
      ctx.addIssue({
        code: "custom",
        path: ["defaults"],
        message: `для ${n} игроков ${hits === 0 ? "нет состава" : "несколько составов"} в defaults (нужно ровно по одному на ${game.players.min}–${game.players.max})`,
      });
      break;
    }
  }
}

// ---------- Шпион ----------

/** Карта «Шпиона»: слово, которое знают все, кроме шпиона. */
export const spyCardSchema = z.strictObject({ id: slug, emoji: text, title: text });

/** Набор карт «Шпиона», например «Места». examples — примеры вопросов мелко под плиткой. */
export const spyDeckSchema = z.strictObject({
  id: slug,
  emoji: text,
  title: text,
  examples: z.array(text).default([]),
  cards: z.array(spyCardSchema).min(1, "в наборе должна быть хотя бы одна карта"),
});

/**
 * «Шпион»: у всех одна карта из выбранного набора, у шпиона (или двух) — «Ты шпион». Один телефон, имён нет.
 * mix — режим «Всё вперемешку»: карта из любого набора.
 */
export const spyGameSchema = itemBase.extend({
  kind: z.literal("game"),
  mechanic: z.literal("spy"),
  rules: z.array(text).default([]),
  /** Подпись под выбором числа игроков. */
  playersHint: text,
  /** Шпионов 1 или max; с twoFrom игроков по умолчанию 2. */
  spies: z.strictObject({ max: z.int().min(1).max(2), twoFrom: z.int().min(1), hint: text }),
  /** Таймер: по умолчанию perPlayerSec × игроков в пределах minSec–maxSec, шаг stepSec. */
  timer: z.strictObject({
    perPlayerSec: z.int().min(10),
    minSec: z.int().min(10),
    maxSec: z.int().min(10),
    stepSec: z.int().min(5),
  }),
  decks: z.array(spyDeckSchema).min(1),
  mix: z.strictObject({ id: slug, emoji: text, title: text }),
  /** Наборы под замком (по подписке). */
  lockedExtras: z.array(z.strictObject({ emoji: text, title: text })).default([]),
  lockedText: text,
  texts: z.strictObject({
    start: text,
    pickDeck: text,
    /** {n} — номер игрока, {total} — сколько всего. */
    deal: text,
    hide: text,
    pass: text,
    wordHint: text,
    spyTitle: text,
    spyHint: text,
    /** {n} — кто начинает. */
    dealt: text,
    starts: text,
    /** {title}, {emoji} — набор карты этой партии. */
    deckLabel: text,
    vote: text,
    voteHint: text,
    isSpy: text,
    notSpy: text,
    oneCaught: text,
    reveal: text,
    revealWho: text,
    revealNotSpy: text,
    revealSay: text,
    guessed: text,
    missed: text,
    timeUp: text,
    noVote: text,
    cityWins: text,
    spyWins: text,
    wrongVote: text,
    /** {emoji}, {title} — карта партии. */
    finalCard: text,
    /** {n} — номер шпиона. */
    finalSpy: text,
    /** {a}, {b} — номера двух шпионов. */
    finalSpies: text,
    again: text,
    changeDeck: text,
    flexCity: text,
    flexSpy: text,
    /** Надпись на рубашке карты. */
    cardBack: text,
  }),
});

type SpyGameInput = z.infer<typeof spyGameSchema>;

/** Проверки «Шпиона»: id наборов (и mix) и id карт внутри набора не повторяются, таймер и шпионы в своих пределах. */
function checkSpy(game: SpyGameInput, ctx: z.RefinementCtx) {
  const deckIds = new Set<string>([game.mix.id]);
  game.decks.forEach((deck, di) => {
    if (deckIds.has(deck.id)) {
      ctx.addIssue({ code: "custom", path: ["decks", di, "id"], message: `набор "${deck.id}" повторяется (или совпадает с mix)` });
    }
    deckIds.add(deck.id);
    const cardIds = new Set<string>();
    deck.cards.forEach((card, ci) => {
      if (cardIds.has(card.id)) {
        ctx.addIssue({ code: "custom", path: ["decks", di, "cards", ci, "id"], message: `карта "${card.id}" повторяется в наборе "${deck.id}"` });
      }
      cardIds.add(card.id);
    });
  });
  const { minSec, maxSec } = game.timer;
  if (minSec > maxSec) ctx.addIssue({ code: "custom", path: ["timer"], message: "minSec не может быть больше maxSec" });
  if (game.players.min < 3) ctx.addIssue({ code: "custom", path: ["players", "min"], message: "в «Шпиона» играют минимум втроём" });
}

export const gameSchema = z
  .discriminatedUnion("mechanic", [deckGameSchema, voteGameSchema, guessPartnerGameSchema, mafiaGameSchema, spyGameSchema])
  .superRefine((game, ctx) => {
    if (game.mechanic === "mafia") {
      checkMafia(game, ctx);
      return;
    }
    if (game.mechanic === "spy") {
      checkSpy(game, ctx);
      return;
    }
    const deckIds = game.decks.map((d) => d.id);
    game.decks.forEach((deck, di) => {
      if (deck.unlockAfter === deck.id) {
        ctx.addIssue({ code: "custom", path: ["decks", di, "unlockAfter"], message: "колода не может открываться после самой себя" });
      } else if (deck.unlockAfter && !deckIds.includes(deck.unlockAfter)) {
        ctx.addIssue({
          code: "custom",
          path: ["decks", di, "unlockAfter"],
          message: `нет колоды с id "${deck.unlockAfter}" (есть: ${deckIds.join(", ")})`,
        });
      }
    });
    game.decks.forEach((deck, di) =>
      deck.cards.forEach((card, ci) => {
        const path = ["decks", di, "cards", ci];
        if (game.mechanic === "guess-partner" && !card.options) {
          ctx.addIssue({ code: "custom", path, message: "в этой игре у карточки должны быть options (варианты ответа)" });
        }
        if (card.selfOptions && card.selfOptions.length !== card.options?.length) {
          ctx.addIssue({
            code: "custom",
            path: [...path, "selfOptions"],
            message: `в selfOptions должно быть столько же вариантов, сколько в options (${card.options?.length ?? 0}), сейчас ${card.selfOptions.length}`,
          });
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

// ---------- Платные тесты под замком ----------

/**
 * Тест «под замком» (data/locked-tests.json): только карточка — название, обложка, «что узнаешь».
 * Вопросов нет. Нажатие на карточку и на «Открыть по подписке 💎» считается как «Глубже 💎».
 */
export const lockedTestSchema = z.strictObject({
  id: slug,
  /** Часть адреса экрана с описанием: /locked/<slug>. */
  slug,
  title: text,
  emoji: text,
  description: text,
  /** Список «Что узнаешь». */
  learn: z.array(text).min(1, "добавь хотя бы один пункт в learn («Что узнаешь»)"),
  /** Мелкая оговорка, например «Это не диагноз». */
  disclaimer: text.optional(),
  durationMin: z.int().min(1),
  tags: z.array(text).default([]),
  sections: z.array(sectionSchema).min(1, "укажи хотя бы один раздел"),
  tier: tierSchema.default("premium"),
  locked: z.strictObject({ reason: z.enum(["soon", "subscription"]), text }),
});

/** Файл data/locked-tests.json. */
export const lockedTestsFileSchema = z.strictObject({
  _note: z.string().optional(),
  $schema: z.string().optional(),
  lockedTests: z.array(lockedTestSchema),
});

export type Section = z.infer<typeof sectionSchema>;
export type Tier = z.infer<typeof tierSchema>;
export type AgeRating = z.infer<typeof ageRatingSchema>;
export type Test = z.infer<typeof testSchema>;
export type TestQuestion = z.infer<typeof testQuestionSchema>;
export type TestOption = z.infer<typeof testOptionSchema>;
export type TestResult = z.infer<typeof testResultSchema>;
export type ScoringConfig = z.infer<typeof scoringConfigSchema>;
export type TypesScoring = z.infer<typeof typesScoringSchema>;
export type ScalesScoring = z.infer<typeof scalesScoringSchema>;
export type Scale = ScalesScoring["scales"][number];
export type Upsell = z.infer<typeof upsellSchema>;
export type BlendNote = NonNullable<Test["blendNotes"]>[string];
export type ShareStyle = (typeof SHARE_STYLES)[number];
export type Card = z.infer<typeof cardSchema>;
export type Deck = z.infer<typeof deckSchema>;
export type Game = z.infer<typeof gameSchema>;
export type DeckGame = z.infer<typeof deckGameSchema>;
export type VoteGame = z.infer<typeof voteGameSchema>;
export type GuessPartnerGame = z.infer<typeof guessPartnerGameSchema>;
export type MafiaGame = z.infer<typeof mafiaGameSchema>;
export type MafiaRole = MafiaGame["roles"][number];
export type SpyGame = z.infer<typeof spyGameSchema>;
export type SpyDeck = SpyGame["decks"][number];
export type SpyCard = SpyDeck["cards"][number];
/** Игры с колодами карточек (все механики, кроме «Мафии» и «Шпиона»). */
export type DeckBasedGame = Exclude<Game, MafiaGame | SpyGame>;
export type Mechanic = Game["mechanic"];
export type LockedTest = z.infer<typeof lockedTestSchema>;
export type ContentItem = Test | Game;

/** Весь контент приложения. */
export interface Catalog {
  tests: Test[];
  games: Game[];
  /** Платные тесты под замком (data/locked-tests.json). Нет файла — пусто. */
  lockedTests?: LockedTest[];
}
