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
export const MECHANICS = ["deck", "vote", "guess-partner", "mafia", "spy", "match", "explain", "ladder", "timer-deck"] as const;
export const SCORING_METHODS = ["types", "scales"] as const;
/** Откуда карточка: наша или прислана через «Предложи своё». */
export const CARD_SOURCES = ["official", "community"] as const;
/** Цвет карточки и финала в игре раундами: салатовый, оранжевый, фиолетовый (#B58CFF) или тёмный с голубым свечением (как «Подписка»). */
export const DECK_ACCENTS = ["lime", "orange", "blue", "violet"] as const;
/** «Костюмы» карточки для шеринга: средний блок картинки у каждого теста свой. */
export const SHARE_STYLES = ["composition", "batteries", "receipt", "hero", "device", "player", "messenger"] as const;

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "только маленькие латинские буквы, цифры и дефис, например: love-languages");

const text = z.string().trim().min(1, "текст не может быть пустым");

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "цвет в формате #RRGGBB, например #FF5A1F");

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
    /** Для «Флаг-метра» (test.flagMeter): насколько ответ «красный», 0–3. На подсчёт итога не влияет. */
    flag: z.number().min(0).optional(),
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
  /** «Ценности пары» (test.pair): к какой зоне относится вопрос. */
  zone: z.string().optional(),
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
    /** Цвет карточки итога (hex), например «#FF5A1F»: шапка результата красится в него. */
    acc: hex.optional(),
    /** Рамка и свечение карточки, если цвет почти сливается с фоном (чёрный бархат: «#C9C2CF»). */
    accBorder: hex.optional(),
    /** Маленький чип под названием итога, например «по-научному: интроверт». */
    tag: text.optional(),
    /** «Соц-батарейка»: на сколько хватает, подставляется в test.battery.caption как {hours}, например «1–2 часа». */
    battery: text.optional(),
    /** «Маршрут на выходные»: три точки — Утро, День, Вечер (label — «☀️ Утро»). */
    route: z.array(z.strictObject({ label: text, text })).min(1).optional(),
    /** «Вайб-борд»: мини-мудборд — три эмодзи, градиент из двух цветов, три настроения музыки, локация и звук. */
    board: z
      .strictObject({
        emojis: z.array(text).length(3),
        colors: z.tuple([hex, hex]),
        moods: z.array(text).length(3),
        place: text,
        sound: text,
      })
      .optional(),
    /** «Вайб-совместимость»: с кем совпадаешь и кто разряжает (целые строки: «🧸 Cozy: тихий вечер вместе»). */
    compat: z.strictObject({ match: text, drain: text }).optional(),
    /** Текст, когда этот итог оказался вторым по баллам: «Что добавляет второй цвет» (палитра), «Город-пара». */
    asSecond: text.optional(),
    /** Мягкая забота под советом, например «поговори с близким или психологом». */
    care: text.optional(),
    /**
     * Кнопка-ссылка в конце итога, например «Пройти «Здоровые ли у вас отношения? 🚦» →».
     * test — slug теста, куда ведёт кнопка; пока теста нет, ставь soon: true (тап считается как «скоро»).
     */
    button: z
      .strictObject({ label: text, test: slug.optional(), soon: z.boolean().optional() })
      .refine((b) => b.test !== undefined || b.soon === true, "у кнопки должен быть test или soon: true")
      .optional(),
    /** Тёплая строка с ❤️ последним блоком итога, например «Рядом с тобой людям становится светлее». */
    heart: text.optional(),
    /** Строка-крючок для карточки Swag 😎 при шеринге, от первого лица: «Паника? Не мой жанр». */
    swag: text.optional(),
    /**
     * Для карточки шеринга (костюм теста — share.style): line — фирменная строка результата,
     * duo и danger — id других результатов («Идеальный дуэт», «Опасно тусить с»; danger может указывать на себя).
     */
    share: z.strictObject({ line: text.optional(), duo: z.string().optional(), danger: z.string().optional() }).optional(),
    /** Подсчёт "scales": при какой сумме баллов [от, до] показывается этот результат. */
    range: rangeSchema.optional(),
    /** Текст, который подставляется при «Поделиться». */
    shareText: text.optional(),
    /**
     * Фишки теста: дополнительные блоки итога («Твоя сцена», «Профессии под тебя», «Шанс дожить до финала»).
     * title — заголовок (эмодзи по желанию), дальше text, список items или крупное значение big. after — после «Совета», иначе перед «Сильными сторонами».
     */
    extras: z
      .array(
        z
          .strictObject({
            emoji: text.optional(),
            title: text,
            text: text.optional(),
            items: z.array(text).min(1).optional(),
            big: text.optional(),
            after: z.boolean().optional(),
            /** items показываются чипами (плашками), а не списком: «Где тебя видно». */
            chips: z.boolean().optional(),
          })
          .refine((e) => e.text !== undefined || e.items !== undefined || e.big !== undefined, "у фишки должен быть text, items или big"),
      )
      .optional(),
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
  /**
   * Ничья: побеждает тип, набравший больше в вопросах lastQuestions. hash — одна из равных выбирается по хэшу ответов
   * (сумма (номер_варианта+1)×(номер_вопроса+7) по модулю числа равных): одинаковые ответы дают одинаковый итог, а ни один тип не в выигрыше.
   */
  tieBreak: z
    .strictObject({
      rule: z.string().optional(),
      lastQuestions: z.array(z.string()).min(1).optional(),
      hash: z.boolean().optional(),
    })
    .refine((t) => t.lastQuestions !== undefined || t.hash === true, "в tieBreak нужны lastQuestions или hash")
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
    /** Запасной текст одним абзацем — на экране показываем items, если они есть. */
    text,
    /** «Что ты получишь»: пункты списком с голубыми точками. Плейсхолдеры как в text ({weakestScale}). */
    items: z.array(text).min(1).optional(),
    primary: z.boolean().default(true),
  }),
});

const pairSchema = z.strictObject({
  zones: z.array(z.strictObject({ id: slug, emoji: text, title: text, same: text, differ: text })).min(1),
  names: z
    .array(z.strictObject({ minPercent: z.number().min(0).max(100), emoji: text, title: text, text }))
    .min(1)
    .refine((n) => n.some((x) => x.minPercent === 0), "нужно название с minPercent: 0"),
  /** Бесплатная строка: {value} — первая общая ценность из двух топ-3. */
  shared: text,
  noShared: text,
  /** Заголовки блоков Premium 💎: «Шесть зон вашей пары» и «Разговор на эту неделю». */
  zonesTitle: text,
  talkTitle: text,
});

const languagesSchema = z.strictObject({
  title: text,
  datesTitle: text.optional(),
  items: z.array(z.strictObject({ id: slug, emoji: text, title: text, text })).min(2),
  dates: z.record(z.string(), z.record(z.string(), text)).optional(),
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
    /**
     * Как показать шкалы (подсчёт "scales"): hidden — не показывать вовсе (шкала одна и служит только суммой);
     * title — заголовок блока; levels — подписи и цвет уровней (tone: good — зелёный, warn — жёлтый, bad — красный);
     * tips — «Что помогает именно тебе»: советы для шкалы с самой большой суммой (при равенстве первая по порядку).
     */
    scalesPanel: z
      .strictObject({
        hidden: z.boolean().optional(),
        title: text.optional(),
        levels: z
          .record(z.string(), z.strictObject({ label: text, emoji: text.optional(), tone: z.enum(["good", "warn", "bad", "neutral"]) }))
          .optional(),
        /** Вместо полоски — ползунок на шкале «слева ↔ справа» (интро ↔ экстра): подписи краёв. */
        slider: z.strictObject({ low: text, high: text }).optional(),
        tips: z.strictObject({ title: text, byScale: z.record(z.string(), z.array(text).min(1)) }).optional(),
      })
      .optional(),
    /**
     * «Флаг-метр» 🚩💚: сумма flag у выбранных вариантов (максимум max) → красный процент и подпись по bands.
     * bands — по возрастанию верхней границы красного (30, 50, 70, 100): первая, куда попал процент.
     */
    flagMeter: z
      .strictObject({
        title: text,
        max: z.number().min(1),
        bands: z.array(z.strictObject({ upTo: z.number().min(0).max(100), emoji: text, title: text, text })).min(1),
      })
      .optional(),
    /**
     * Второй набор типов к подсчёту "scales": «язык романтики». У вариантов type — id языка; выигрывает чаще выбранный
     * (ничья — по хэшу ответов). dates[id результата][id языка] — «Идеальное свидание для тебя».
     */
    languages: languagesSchema.optional(),
    /**
     * «Своя карта»: все типы полосками (баллы / outOf), top первых подсвечены. Порядок при ничьей — по хэшу ответов
     * (едет в адресе как order). Нужна для «Ценностей пары».
     */
    valueMap: z.strictObject({ title: text, top: z.int().min(1), outOf: z.number().min(1) }).optional(),
    /**
     * Сравнение пары: зоны вопросов (question.zone), названия пары по проценту и строка про общую ценность.
     * Процент = 50% × сходство карт + 50% × доля одинаковых ответов. Тексты зон: same — совпали, differ — вопрос для разговора.
     */
    pair: pairSchema.optional(),
    /** «Соц-батарейка»: большая батарейка, заполнение = сумма / максимум (подсчёт "scales"); caption с {hours} из result.battery. */
    battery: z.strictObject({ title: text, caption: text }).optional(),
    /** Пограничный итог: сумма в 1 балле от границы соседнего итога → строка с {title} соседа. */
    borderline: text.optional(),
    /**
     * «Твоя палитра»: карточка-градиент из цвета итога и второго по баллам (result.acc), строка о том, что добавляет
     * второй (result.asSecond), и полоска со всеми долями. Порядок при ничьей — по хэшу (order в адресе).
     */
    palette: z.strictObject({ title: text, barTitle: text }).optional(),
    /** «Город-пара»: всегда показываем второй по баллам итог с его result.asSecond. title — «А ещё тебе подойдёт». */
    pairBlock: z.strictObject({ title: text }).optional(),
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
        /** Заголовок «Твой маршрут на выходные» (result.route). */
        route: text.optional(),
        /** Заголовки вайб-борда (result.board): общий, «📍 Локация», «🔊 Звук». */
        board: text.optional(),
        boardPlace: text.optional(),
        boardSound: text.optional(),
        /** «Вайб-совместимость» (result.compat): общий заголовок и подписи «Совпадаешь» / «Разряжает». */
        compat: text.optional(),
        compatMatch: text.optional(),
        compatDrain: text.optional(),
      })
      .optional(),
    upsell: upsellSchema.optional(),
    /** Варианты ответов показываются в случайном порядке (каждый раз новом); подсчёт и хэш ничьей идут по порядку в файле. */
    shuffleOptions: z.boolean().optional(),
    /**
     * Шеринг итога: надпись на кнопке «Куда кидаем?» и текст сообщения в чат.
     * Плейсхолдеры: {title} {emoji} {pct} {scale} {link}. Нет share — «Пофлексить 🧊» и shareText результата.
     */
    share: z.strictObject({ button: text, text: text.optional(), style: z.enum(SHARE_STYLES).optional() }).optional(),
    /** «Сравниться с партнёром 💎» после списка для партнёра: кнопка ведёт в «Для пар» → «Совместимость». Заголовок и текст по желанию. */
    compat: z.strictObject({ title: text.optional(), text: text.optional(), button: text }).optional(),
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
    if (test.languages) checkLanguages(test, test.languages, ids, ctx);
    if (test.pair) checkPair(test, test.pair, ctx);
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
      test.scoring.tieBreak?.lastQuestions?.forEach((qid, i) => {
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

/** «Ценности пары»: у каждого вопроса zone из pair.zones, в каждой зоне хотя бы один вопрос. */
function checkPair(test: { questions: TestQuestion[] }, pair: z.infer<typeof pairSchema>, ctx: z.RefinementCtx) {
  const zoneIds = pair.zones.map((z0) => z0.id);
  test.questions.forEach((q, qi) => {
    if (!q.zone || !zoneIds.includes(q.zone)) {
      ctx.addIssue({ code: "custom", path: ["questions", qi, "zone"], message: `у вопроса должно быть поле zone (есть: ${zoneIds.join(", ")})` });
    }
  });
  for (const id of zoneIds) {
    if (!test.questions.some((q) => q.zone === id)) ctx.addIssue({ code: "custom", path: ["pair", "zones"], message: `в зоне "${id}" нет вопросов` });
  }
}

/** «Язык романтики»: у вариантов type из languages, в dates известные результаты и языки. */
function checkLanguages(
  test: { questions: TestQuestion[] },
  languages: z.infer<typeof languagesSchema>,
  resultIds: Set<string>,
  ctx: z.RefinementCtx,
) {
  const langIds = new Set(languages.items.map((l) => l.id));
  test.questions.forEach((q, qi) =>
    q.options.forEach((o, oi) => {
      if (o.type === undefined || !langIds.has(o.type)) {
        ctx.addIssue({
          code: "custom",
          path: ["questions", qi, "options", oi, "type"],
          message: `у варианта должен быть type — язык (есть: ${[...langIds].join(", ")})`,
        });
      }
    }),
  );
  for (const [resultId, byLang] of Object.entries(languages.dates ?? {})) {
    if (!resultIds.has(resultId)) ctx.addIssue({ code: "custom", path: ["languages", "dates", resultId], message: `нет результата с id "${resultId}"` });
    for (const lang of Object.keys(byLang)) {
      if (!langIds.has(lang)) ctx.addIssue({ code: "custom", path: ["languages", "dates", resultId, lang], message: `нет языка "${lang}"` });
    }
  }
}

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
  /** «Лесенка» (36 вопросов): вопрос, на который отвечаете вместе, — вместо «Начинает: Игрок N» строка «Отвечаете вместе». */
  together: z.boolean().optional(),
  /** «Лесенка»: у вопроса есть кнопка таймера на столько секунд (например, 240 — «Расскажи историю жизни за 4 минуты»). */
  timerSec: z.int().min(10).optional(),
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
  /** Маленькая строка под финалом игры раундами именно этой колоды, например «Если что-то задело, это повод поговорить, а не поссориться 🤍». */
  finaleNote: text.optional(),
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
      /** Мелкая строка под текстом финала, например «Если у нескольких поровну больше всех: …». */
      note: text.optional(),
      /** Кнопка, которая показывает случайную подсказку из hints, например «Нет идей? 🎲». */
      hintButton: text,
      hints: z.array(text).min(1, "нужна хотя бы одна подсказка"),
      /** Текст для «Пофлексить 🧊». */
      flexText: text,
    })
    .optional(),
});

/**
 * «Лесенка» («36 вопросов»): уровни-колоды идут в фиксированном порядке (без перемешивания), без раундов.
 * Карточка: «Начинает: Игрок 1/2» (чередуется по номеру вопроса в игре) или «Отвечаете вместе» (card.together),
 * кнопки «Пас» и «Дальше →», у вопроса с card.timerSec — таймер. Между уровнями экран levelDone,
 * после последнего уровня — finale: таймер «глаза в глаза», затем after и шеринг.
 */
export const ladderGameSchema = gameBase.extend({
  mechanic: z.literal("ladder"),
  /** Плашка-факт на старте. */
  fact: text,
  texts: z.strictObject({
    /** Имена по очереди: «Игрок 1», «Игрок 2». */
    players: z.tuple([text, text]),
    /** Строка на карточке, {player} — кто начинает. */
    starts: text,
    together: text,
    pass: text,
    next: text,
    /** Кнопка таймера у вопроса (card.timerSec). */
    timer: text,
    /** Кнопка таймера, пока он идёт, и после паузы. */
    pause: text,
    resume: text,
  }),
  /** Экран между уровнями. {level} — название следующего уровня. */
  levelDone: z.strictObject({ emoji: text, title: text, text, next: text, later: text }),
  /** Финал после последнего уровня. */
  finale: z.strictObject({
    emoji: text,
    title: text,
    note: text,
    seconds: z.int().min(10),
    start: text,
    pause: text,
    resume: text,
    skip: text,
    after: z.strictObject({ emoji: text, title: text, text }),
    /** Текст для «Пофлексить 🧊». */
    flexText: text,
  }),
});

/** Итог игры «5 секунд»: заголовок, эмодзи и текст для победителя, ничьей и последнего места. */
const finaleCaseSchema = z.strictObject({ title: text, emoji: text, text });

/**
 * «5 секунд» (timer-deck): колода как у deck + таймер на ответ + очки по игрокам. Один телефон идёт по кругу:
 * «Ход: имя» → «Старт» → карта и кольцо таймера (timerSec) → «Засчитано / Не засчитано» (+1 очко) → следующий.
 * Карт на игрока — на выбор из cardsPerPlayer. «Цепочка»: при «Не засчитано» та же карта уходит следующему игроку.
 */
export const timerDeckGameSchema = gameBase.extend({
  mechanic: z.literal("timer-deck"),
  /** Секунд на ответ. */
  timerSec: z.int().min(1),
  /** Сколько карт на игрока можно выбрать в настройках, и какое выбрано по умолчанию. */
  cardsPerPlayer: z.array(z.int().min(1)).min(1),
  cardsPerPlayerDefault: z.int().min(1),
  /** «Цепочка» включена по умолчанию? */
  chainRuleDefault: z.boolean().default(false),
  /** Строка над заданием на карте: «Назови за 5 секунд». */
  cardPrompt: text,
  /** Экран хода, {name} — чей ход: «Передай телефон: ход {name} 👉». */
  handoffText: text,
  buttons: z.strictObject({ yes: text, no: text }),
  finale: z.strictObject({ winner: finaleCaseSchema, tie: finaleCaseSchema, last: finaleCaseSchema }),
  /** Подписи экранов: настройки, правила, ход, финал. {name} — имя (в flexText — победитель или победители). */
  texts: z.strictObject({
    playersTitle: text,
    addPlayer: text,
    cardsPerPlayer: text,
    deck: text,
    chainSwitch: text,
    rulesTitle: text,
    rulesOk: text,
    go: text,
    start: text,
    timeUp: text,
    chain: text,
    scoreTitle: text,
    again: text,
    changeDeck: text,
    flexText: text,
  }),
}).refine((g) => g.cardsPerPlayer.includes(g.cardsPerPlayerDefault), {
  message: "cardsPerPlayerDefault должно быть одним из cardsPerPlayer",
  path: ["cardsPerPlayerDefault"],
});

/** «Кто из компании?»: все тайно голосуют за игрока. */
export const voteGameSchema = gameBase.extend({
  mechanic: z.literal("vote"),
});

/** «Насколько хорошо вы знаете друг друга»: отвечаешь про себя и угадываешь партнёра. */
/** Звания по проценту совпадения. Берётся первое, где процент ≥ minPercent; нужно звание с minPercent: 0. */
const ranksSchema = z.array(z.strictObject({ minPercent: z.number().min(0).max(100), title: text, emoji: text, text })).min(1);

export const guessPartnerGameSchema = gameBase.extend({
  mechanic: z.literal("guess-partner"),
  ranks: ranksSchema,
});

/**
 * «Совпадём?» (это или то): оба по очереди тайно отвечают на одни и те же questionsPerGame вопросов колоды.
 * У карточки ровно 2 options — две половины экрана; text — короткий вопрос для «Где разошлись» / «Где совпали».
 * Плейсхолдеры в texts: {a} — кто отвечает сейчас, {b} — второй игрок, {pct} — процент, {link} — ссылка.
 */
export const matchGameSchema = gameBase.extend({
  mechanic: z.literal("match"),
  ranks: ranksSchema,
  texts: z.strictObject({
    pickLevel: text,
    turnTitle: text,
    turnHint: text,
    start: text,
    /** Круглая плашка между половинами, «ИЛИ». */
    or: text,
    pass: text,
    passHint: text,
    passButton: text,
    diverged: text,
    divergedHint: text,
    divergedEmpty: text,
    matched: text,
    show: text,
    hide: text,
    again: text,
    next: text,
    flexText: text,
  }),
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
    /** Большой экран после раздачи: «Игра началась 🕵️». */
    started: text,
    /** Под ним: «Спрашивайте друг друга в любом порядке. Начинает {name}». */
    startedHint: text,
    /** Подпись под таймером — сложность: 1–2 мин, 3–5 мин, 6–10 мин. */
    timerEasy: text,
    timerFair: text,
    timerHard: text,
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


// ---------- Объясни 🪧 (Alias + Крокодил) ----------

/** Уровень «Объясни»: название и слова. Тяжёлый — Premium 💎 (замок: тап считается как «Глубже 💎»). */
export const explainLevelSchema = z.strictObject({
  id: slug,
  title: text,
  emoji: text,
  tier: tierSchema.default("free"),
  /** Слова режима «Словами». */
  words: z.array(text).min(1, "в уровне должно быть хотя бы одно слово"),
  /** Колода режима «Жестами» (слова, которые можно показать руками; подмножество words). Нет — режим «Жестами» на этом уровне недоступен («Только словами»). */
  gestures: z.array(text).min(1).optional(),
});

/**
 * «Объясни»: колода слов, один объясняет слово, не называя его, своя команда угадывает. Режимы Словами и Жестами —
 * на одной базе слов. Один телефон, 2–4 команды. teamNames — имена для кнопки 🎲, первые два — команды по умолчанию.
 */
export const explainGameSchema = itemBase.extend({
  kind: z.literal("game"),
  mechanic: z.literal("explain"),
  rules: z.array(text).default([]),
  teamNames: z.array(text).min(4, "для 🎲 нужно минимум 4 имени команд (команд до четырёх)"),
  levels: z.array(explainLevelSchema).min(1),
});

type ExplainGameInput = z.infer<typeof explainGameSchema>;

/** Проверки «Объясни»: id уровней, повторы слов внутри уровня (без учёта регистра) и имён команд, от 4 человек. */
function checkExplain(game: ExplainGameInput, ctx: z.RefinementCtx) {
  const levelIds = new Set<string>();
  /** Слово без учёта регистра и ё/е. */
  const norm = (w: string) => w.toLowerCase().replace(/ё/g, "е");
  const wordOwner = new Map<string, string>();
  game.levels.forEach((level, li) => {
    if (levelIds.has(level.id)) ctx.addIssue({ code: "custom", path: ["levels", li, "id"], message: `уровень "${level.id}" повторяется` });
    levelIds.add(level.id);
    const seen = new Set<string>();
    level.words.forEach((word, wi) => {
      const key = norm(word);
      if (seen.has(key)) ctx.addIssue({ code: "custom", path: ["levels", li, "words", wi], message: `слово "${word}" повторяется в уровне "${level.id}"` });
      else if (wordOwner.has(key)) {
        ctx.addIssue({ code: "custom", path: ["levels", li, "words", wi], message: `слово "${word}" уже есть в уровне "${wordOwner.get(key)}": между уровнями слова не повторяются` });
      }
      seen.add(key);
      if (!wordOwner.has(key)) wordOwner.set(key, level.id);
    });
    // «Жестами»: слова колоды должны быть в words уровня и не повторяться
    const gestureSeen = new Set<string>();
    level.gestures?.forEach((word, gi) => {
      const key = norm(word);
      if (!seen.has(key)) ctx.addIssue({ code: "custom", path: ["levels", li, "gestures", gi], message: `слово "${word}" есть в gestures, но нет в words уровня "${level.id}"` });
      if (gestureSeen.has(key)) ctx.addIssue({ code: "custom", path: ["levels", li, "gestures", gi], message: `слово "${word}" повторяется в gestures уровня "${level.id}"` });
      gestureSeen.add(key);
    });
  });
  const names = new Set<string>();
  game.teamNames.forEach((name, i) => {
    if (names.has(name.toLowerCase())) ctx.addIssue({ code: "custom", path: ["teamNames", i], message: `имя команды "${name}" повторяется` });
    names.add(name.toLowerCase());
  });
  if (game.players.min < 4) ctx.addIssue({ code: "custom", path: ["players", "min"], message: "в «Объясни» играют минимум вчетвером (2 команды по 2)" });
  if (game.levels[0]?.tier === "premium") ctx.addIssue({ code: "custom", path: ["levels", 0, "tier"], message: "первый уровень должен быть бесплатным: он открыт по умолчанию" });
}

export const gameSchema = z
  .discriminatedUnion("mechanic", [deckGameSchema, voteGameSchema, guessPartnerGameSchema, matchGameSchema, mafiaGameSchema, spyGameSchema, explainGameSchema, ladderGameSchema, timerDeckGameSchema])
  .superRefine((game, ctx) => {
    if (game.mechanic === "mafia") {
      checkMafia(game, ctx);
      return;
    }
    if (game.mechanic === "spy") {
      checkSpy(game, ctx);
      return;
    }
    if (game.mechanic === "explain") {
      checkExplain(game, ctx);
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
    if (game.mechanic === "match") {
      game.decks.forEach((deck, di) => {
        deck.cards.forEach((card, ci) => {
          if (card.options?.length !== 2) {
            ctx.addIssue({
              code: "custom",
              path: ["decks", di, "cards", ci, "options"],
              message: `в «это или то» у карточки ровно 2 options, сейчас ${card.options?.length ?? 0}`,
            });
          }
        });
        if (deck.questionsPerGame !== undefined && deck.cards.length > 0 && deck.questionsPerGame > deck.cards.length) {
          ctx.addIssue({
            code: "custom",
            path: ["decks", di, "questionsPerGame"],
            message: `questionsPerGame (${deck.questionsPerGame}) больше, чем карточек в колоде (${deck.cards.length})`,
          });
        }
      });
    }
    if ((game.mechanic === "guess-partner" || game.mechanic === "match") && !game.ranks.some((r) => r.minPercent === 0)) {
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
  /** Превью в шторке: «Зачем этот тест» и примеры вопросов (первый виден, второй размыт). */
  preview: z
    .strictObject({
      why: text,
      questions: z
        .array(z.strictObject({ text, options: z.array(text).min(2) }))
        .min(2, "в превью нужно минимум 2 вопроса: первый виден, второй размыт"),
    })
    .optional(),
});

/** Файл data/locked-tests.json. */
export const lockedTestsFileSchema = z.strictObject({
  _note: z.string().optional(),
  $schema: z.string().optional(),
  lockedTests: z.array(lockedTestSchema),
});

// ---------- Карточные игры (памятка правил) ----------

/** Одна игра для обычной колоды: только тексты правил, механики нет. */
export const cardGameSchema = z.strictObject({
  id: slug,
  emoji: text,
  title: text,
  /** «она же «Пьяница»» — мелко под названием. */
  aka: text.optional(),
  /** Для фильтра «Нас: N»: игра подходит, если min ≤ N ≤ max. */
  players: z.strictObject({ min: z.int().min(1), max: z.int().min(1) }),
  /** «15 мин», «10–30 мин». */
  minutes: text,
  /** Сколько карт в колоде: пояснение берётся из decks["36"] или decks["52"]. */
  deck: z.union([z.literal(36), z.literal(52)]),
  /** Мелко под названием, например «Играем на фишки, спички или конфеты». */
  note: text.optional(),
  intro: text.optional(),
  goal: text,
  deal: text,
  moves: z.array(text).min(1),
  /** Дополнительные блоки со своим заголовком, например «Комбинации». */
  extra: z.array(z.strictObject({ title: text, items: z.array(text).min(1) })).optional(),
  /** «Частые споры» — свёрнуты по умолчанию. */
  disputes: z.array(text).optional(),
});

/** Файл data/card-games.json: плитка «Карточные игры 🃏» и правила 8 игр. */
export const cardGamesFileSchema = z
  .strictObject({
    _note: z.string().optional(),
    $schema: z.string().optional(),
    id: slug,
    /** Адрес списка: /<slug>. */
    slug,
    title: text,
    emoji: text,
    sections: z.array(sectionSchema).min(1, "укажи хотя бы один раздел"),
    subtitle: text,
    /** Чипсы «Нас: 1 · 2 · … · 6+». Последнее значение — «и больше» (игры, где max ≥ value). */
    filter: z.strictObject({
      label: text,
      options: z.array(z.strictObject({ value: z.int().min(1), label: text })).min(1),
    }),
    decks: z.strictObject({ "36": text, "52": text }),
    labels: z.strictObject({
      players: text,
      minutes: text,
      deck: text,
      goal: text,
      deal: text,
      moves: text,
      disputes: text,
      back: text,
      empty: text,
    }),
    games: z.array(cardGameSchema).min(1),
  })
  .superRefine((file, ctx) => {
    const ids = new Set<string>();
    file.games.forEach((g, i) => {
      if (ids.has(g.id)) ctx.addIssue({ code: "custom", path: ["games", i, "id"], message: `игра "${g.id}" повторяется` });
      ids.add(g.id);
      if (g.players.min > g.players.max) {
        ctx.addIssue({ code: "custom", path: ["games", i, "players"], message: "min не может быть больше max" });
      }
    });
  });

// ---------- Premium ----------

/**
 * На что указывает пункт шторки раздела на экране «Premium». Найден в контенте — 💎, нет — «скоро».
 * game + deck — колода игры; game + extras — роли и темы под замком; compat — «Совместимость» у теста;
 * lockedTests — платные тесты под замком; always — всегда есть.
 */
export const premiumRefSchema = z.strictObject({
  game: slug.optional(),
  deck: slug.optional(),
  extras: z.literal(true).optional(),
  compat: slug.optional(),
  lockedTests: z.literal(true).optional(),
  always: z.literal(true).optional(),
});

/** Файл data/premium.json: тексты экрана «Premium» 💎. */
export const premiumFileSchema = z.strictObject({
  _note: z.string().optional(),
  $schema: z.string().optional(),
  /** Плитка на главной. */
  tile: z.strictObject({ title: text, subtitle: text }),
  header: text,
  badge: text,
  title: text,
  lead: text,
  sections: z
    .array(
      z.strictObject({
        id: z.string().min(1),
        emoji: text,
        title: text,
        line: text,
        items: z.array(z.strictObject({ label: text, ref: premiumRefSchema.optional() })).min(1),
      }),
    )
    .min(1),
  soon: text,
  sheetClose: text,
  fresh: z.strictObject({ emoji: text, text, accent: text }),
  cta: text,
  paySheet: z.strictObject({ title: text, text, button: text, done: text }),
  code: z.strictObject({ link: text, title: text, placeholder: text, button: text, cancel: text, wrong: text }),
  fine: text,
  /** Тексты, когда Premium включён. */
  on: z.strictObject({ title: text, lead: text, tileState: text, cta: text, fine: text }),
  /** Шторка превью платного теста. */
  preview: z.strictObject({ why: text, learn: text, example: text, unlock: text, close: text }),
});

/** Файл data/ultimate.json: тизер Ultimate 🔱 — плитка на главной и экран /ultimate. */
export const ultimateFileSchema = z.strictObject({
  _note: z.string().optional(),
  $schema: z.string().optional(),
  /** Плитка на главной. */
  tile: z.strictObject({ title: text, subtitle: text }),
  header: text,
  badge: text,
  title: text,
  lead: text,
  /** Плитки 2×2: что будет в Ultimate. */
  tiles: z.array(z.strictObject({ emoji: text, title: text, text })).min(1),
  /** «Хочу первым 🔔». */
  cta: text,
  /** Плашка после нажатия. */
  done: z.strictObject({ title: text, text }),
  fine: text,
});

// ---------- Раздел GAZ 🚀 (data/gaz.json) ----------

export const GAZ_WHO = ["solo", "duo", "crew"] as const;
export const GAZ_TIME = ["15", "eve", "wk"] as const;
export const GAZ_WHERE = ["home", "out"] as const;

const gazId = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "id: маленькие латинские буквы, цифры и дефис, например: b01 или s-15-h-1");

/**
 * Файл data/gaz.json. bored — колода «Мне скучно» (отдельный список: из неё же берётся «Задание дня» в «Сегодня»,
 * индекс (i×7)%длина колоды). roulette — Газ-рулетка: у каждого из 18 сочетаний (кто × время × где) минимум 2 задания.
 */
export const gazFileSchema = z
  .strictObject({
    _note: z.string().optional(),
    $schema: z.string().optional(),
    bored: z.array(z.strictObject({ id: gazId, emoji: text, text })).min(1),
    roulette: z
      .array(
        z.strictObject({
          id: gazId,
          who: z.enum(GAZ_WHO),
          time: z.enum(GAZ_TIME),
          where: z.enum(GAZ_WHERE),
          emoji: text,
          text,
          /** «Усложнение 🌶️»: с ним карта золотая. */
          twist: text.optional(),
        }),
      )
      .min(1),
    challenges: z.array(z.strictObject({ id: gazId, emoji: text, title: text, text })).min(1),
    /** Наборы 💎: в MVP у всех «Скоро». */
    packs: z.array(z.strictObject({ id: gazId, emoji: text, title: text, text })).min(1),
  })
  .superRefine((file, ctx) => {
    // id заданий уникальны сразу в двух списках: по id работают «Вызов» и сохранённые задания
    const seen = new Set<string>();
    for (const list of ["bored", "roulette"] as const) {
      file[list].forEach((task, i) => {
        if (seen.has(task.id)) ctx.addIssue({ code: "custom", path: [list, i, "id"], message: `id "${task.id}" повторяется` });
        seen.add(task.id);
      });
    }
    for (const list of ["challenges", "packs"] as const) {
      const ids = new Set<string>();
      file[list].forEach((item, i) => {
        if (ids.has(item.id)) ctx.addIssue({ code: "custom", path: [list, i, "id"], message: `id "${item.id}" повторяется` });
        ids.add(item.id);
      });
    }
    // Задание дня = индекс (i×7)%длина: колода должна обходиться целиком, поэтому длина не кратна 7
    if (file.bored.length % 7 === 0) {
      ctx.addIssue({ code: "custom", path: ["bored"], message: `в колоде ${file.bored.length} заданий, число делится на 7: «Задание дня» будет повторяться. Добавь или убери задание` });
    }
    // Рулетке нужно хотя бы 2 задания в каждом сочетании: иначе «без повтора подряд» не сработает
    for (const who of GAZ_WHO) {
      for (const time of GAZ_TIME) {
        for (const where of GAZ_WHERE) {
          const count = file.roulette.filter((t) => t.who === who && t.time === time && t.where === where).length;
          if (count < 2) {
            ctx.addIssue({ code: "custom", path: ["roulette"], message: `для сочетания «${who} · ${time} · ${where}» заданий ${count}, нужно минимум 2 (в спеке 3)` });
          }
        }
      }
    }
  });

// ---------- «Сегодня 🔥» (data/today.json) ----------

const todayId = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "id: маленькие латинские буквы, цифры и дефис, например: bt01");
const todayOption = z.strictObject({ emoji: text, label: text });

/**
 * Файл data/today.json. battles и questions идут по кругу: индекс дня = число дней от 13.10.2026 по МСК, % длина.
 * Задание дня берётся из колоды «Мне скучно» (gaz.json). ladder — награды за серию дней.
 */
export const todayFileSchema = z
  .strictObject({
    _note: z.string().optional(),
    $schema: z.string().optional(),
    battles: z.array(z.strictObject({ id: todayId, question: text, a: todayOption, b: todayOption })).min(1),
    questions: z.array(z.strictObject({ id: todayId, text })).min(1),
    ladder: z
      .array(
        z.strictObject({
          /** Сколько дней серии. */
          days: z.number().int().positive(),
          emoji: text,
          text,
          /** Карта, которая выдаётся сразу и уходит в Коллекцию. */
          card: z.strictObject({ id: todayId, title: text, /** Редкость рамки карты в Коллекции. */ rarity: z.enum(["common", "rare", "gold"]).default("common") }).optional(),
          /** +1 заморозка (копится максимум до 2). */
          freeze: z.boolean().optional(),
          /** Premium-ступень: пока только показываем, не выдаём (начисление — вместе с сервером). */
          premium: z.boolean().optional(),
        }),
      )
      .min(1),
  })
  .superRefine((file, ctx) => {
    for (const list of ["battles", "questions"] as const) {
      const ids = new Set<string>();
      file[list].forEach((item, i) => {
        if (ids.has(item.id)) ctx.addIssue({ code: "custom", path: [list, i, "id"], message: `id "${item.id}" повторяется` });
        ids.add(item.id);
      });
    }
    file.ladder.forEach((step, i) => {
      if (i > 0 && step.days <= (file.ladder[i - 1]?.days ?? 0)) {
        ctx.addIssue({ code: "custom", path: ["ladder", i, "days"], message: "ступеньки должны идти по возрастанию дней" });
      }
    });
  });

// ---------- Разделы: три плитки-вкладки и карточки (data/sections.json) ----------

/** Куда ведёт карточка: игра, тест, платный тест (шторка превью) или «Карточные игры». Нет такого — «скоро». */
export const sectionRefSchema = z.strictObject({
  game: slug.optional(),
  test: slug.optional(),
  lockedTest: slug.optional(),
  cards: z.literal(true).optional(),
});

/** Карточка в списке раздела: эмодзи, название, подпись, уровни чипами. */
export const sectionItemSchema = z.strictObject({
  emoji: text,
  title: text,
  text,
  /** Уровни чипами; premium — голубой чип с 💎, free — салатовый «Всегда бесплатно». */
  levels: z.array(z.strictObject({ label: text, premium: z.boolean().optional(), free: z.boolean().optional(), compare: z.boolean().optional() })).optional(),
  /** «скоро» салатовой плашкой: тап — «Скоро! Тап засчитан 🔥», считаем. */
  soon: z.boolean().optional(),
  /** Premium-карточка (голубая рамка): тап как замки 💎. */
  premium: z.boolean().optional(),
  /** Группа внутри плитки (id из kinds вкладки): список разбит на группы с заголовками, мини-кнопка оставляет одну. */
  kind: slug.optional(),
  ref: sectionRefSchema.optional(),
});

/** Вкладка раздела: плитка сверху и список под ней. */
export const sectionTabSchema = z.strictObject({
  id: slug,
  emoji: text,
  name: text,
  /** Третья плитка — Premium с голубым свечением. */
  premium: z.boolean().optional(),
  /** Подпись под названием плитки: «2–3 человека», «от 4». Нет — «бесплатно» (у Premium — «Premium»). */
  tag: text.optional(),
  /** Три мини-кнопки «во что» под плитками: тап оставляет одну группу, повторный возвращает все. Карточки привязаны через kind. */
  kinds: z.array(z.strictObject({ id: slug, emoji: text, name: text })).min(2).optional(),
  /** Заголовок списка и подпись серым справа (если нужны; в формате с группами не нужны). */
  head: text.optional(),
  side: text.optional(),
  items: z.array(sectionItemSchema).min(1),
  /** Плашка-пояснение; **жирный** — выделение. У Premium-плитки — пунктирная голубая сверху списка. */
  note: text.optional(),
});

export const sectionLayoutSchema = z.strictObject({
  id: sectionSchema,
  title: text,
  /** Строка под заголовком; **жирный** — выделение. */
  lead: text,
  tabs: z.array(sectionTabSchema).length(3, "в разделе три плитки: две бесплатные и Premium"),
});

/** Файл data/sections.json: один формат для всех разделов. */
export const sectionsFileSchema = z
  .strictObject({
    _note: z.string().optional(),
    $schema: z.string().optional(),
    texts: z.strictObject({
      free: text,
      premium: text,
      soon: text,
      soonToast: text,
      /** Подсказка под мини-кнопками: ничего не выбрано / выбрана одна группа. */
      kindsAll: text,
      kindsOne: text,
      /** Шторка «Как играть за 10 секунд»: заголовок, кнопки. */
      rulesTitle: text,
      play: text,
      later: text,
      /** Всплывашки по тапу на голубой уровень 💎 и на чип «Сравниться 💎». */
      premiumHint: text,
      compareHint: text,
    }),
    /** «Как играть за 10 секунд»: три строки по id игры; cards — «Карточные игры», test — любой тест. */
    rules: z.record(slug, z.array(text).length(3, "в правилах за 10 секунд ровно три строки")),
    /** Умный 🎲: «Сколько вас?» и «Какой настрой?». items — slug игр и тестов; "*tests" — все тесты. */
    dice: z.strictObject({
      title: text,
      sub: text,
      askSize: text,
      askMood: text,
      roll: text,
      again: text,
      play: text,
      /** Если для выбранного состава ничего нет. */
      empty: text,
      default: z.strictObject({ size: slug, mood: slug }),
      sizes: z.array(z.strictObject({ id: slug, label: text, items: z.array(z.string().min(1)).min(1) })).min(2),
      moods: z.array(z.strictObject({ id: slug, label: text, items: z.array(z.string().min(1)).min(1) })).min(2),
    }),
    sections: z.array(sectionLayoutSchema).min(1),
  })
  .superRefine((file, ctx) => {
    const d = file.dice;
    if (!d.sizes.some((x) => x.id === d.default.size)) ctx.addIssue({ code: "custom", path: ["dice", "default", "size"], message: "default.size должен быть id одного из sizes" });
    if (!d.moods.some((x) => x.id === d.default.mood)) ctx.addIssue({ code: "custom", path: ["dice", "default", "mood"], message: "default.mood должен быть id одного из moods" });
    for (const key of ["sizes", "moods"] as const) {
      const ids = d[key].map((x) => x.id);
      if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", path: ["dice", key], message: "id повторяются" });
    }
    file.sections.forEach((s, si) => {
      const ids = new Set<string>();
      s.tabs.forEach((t, ti) => {
        if (ids.has(t.id)) ctx.addIssue({ code: "custom", path: ["sections", si, "tabs", ti, "id"], message: `вкладка "${t.id}" повторяется` });
        ids.add(t.id);
        // Мини-кнопки «во что»: карточка вкладки с kinds обязана быть в одной из групп, без kinds групп нет
        const kindIds = new Set((t.kinds ?? []).map((k) => k.id));
        if (t.kinds && kindIds.size !== t.kinds.length) {
          ctx.addIssue({ code: "custom", path: ["sections", si, "tabs", ti, "kinds"], message: "id мини-кнопок повторяются" });
        }
        t.items.forEach((item, ii) => {
          const path = ["sections", si, "tabs", ti, "items", ii, "kind"];
          if (t.kinds && (!item.kind || !kindIds.has(item.kind))) {
            ctx.addIssue({ code: "custom", path, message: `у карточки «${item.title}» нужен kind из мини-кнопок вкладки (${[...kindIds].join(", ")})` });
          }
          if (!t.kinds && item.kind) ctx.addIssue({ code: "custom", path, message: "kind есть, а у вкладки нет kinds (мини-кнопок)" });
        });
      });
    });
  });

/** Файл data/premium-codes.json: SHA-256 кодов Premium (сами коды в git не попадают). */
export const premiumCodesFileSchema = z.strictObject({
  _note: z.string().optional(),
  hashes: z.array(z.string().regex(/^[0-9a-f]{64}$/, "SHA-256: 64 символа 0-9 a-f")),
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
export type MatchGame = z.infer<typeof matchGameSchema>;
export type LadderGame = z.infer<typeof ladderGameSchema>;
export type TimerDeckGame = z.infer<typeof timerDeckGameSchema>;
export type MafiaGame = z.infer<typeof mafiaGameSchema>;
export type MafiaRole = MafiaGame["roles"][number];
export type SpyGame = z.infer<typeof spyGameSchema>;
export type SpyDeck = SpyGame["decks"][number];
export type SpyCard = SpyDeck["cards"][number];
/** Игры с колодами карточек (все механики, кроме «Мафии» и «Шпиона»). */
export type ExplainGame = z.infer<typeof explainGameSchema>;
export type ExplainLevel = ExplainGame["levels"][number];
export type DeckBasedGame = Exclude<Game, MafiaGame | SpyGame | ExplainGame>;
export type Mechanic = Game["mechanic"];
export type LockedTest = z.infer<typeof lockedTestSchema>;
export type CardGamesFile = z.infer<typeof cardGamesFileSchema>;
export type PremiumFile = z.infer<typeof premiumFileSchema>;
export type PremiumRef = z.infer<typeof premiumRefSchema>;
export type UltimateFile = z.infer<typeof ultimateFileSchema>;
export type GazFile = z.infer<typeof gazFileSchema>;
export type TodayFile = z.infer<typeof todayFileSchema>;
export type TodayBattle = TodayFile["battles"][number];
export type TodayLadderStep = TodayFile["ladder"][number];
export type GazBoredTask = GazFile["bored"][number];
export type GazRouletteTask = GazFile["roulette"][number];
export type GazTask = GazBoredTask | GazRouletteTask;
export type SectionsFile = z.infer<typeof sectionsFileSchema>;
export type SectionLayout = SectionsFile["sections"][number];
export type SectionTab = SectionLayout["tabs"][number];
export type SectionItem = SectionTab["items"][number];
export type CardGame = CardGamesFile["games"][number];
export type ContentItem = Test | Game;

/** Весь контент приложения. */
export interface Catalog {
  tests: Test[];
  games: Game[];
  /** Платные тесты под замком (data/locked-tests.json). Нет файла — пусто. */
  lockedTests?: LockedTest[];
  /** Памятка «Карточные игры 🃏» (data/card-games.json). Нет файла — undefined. */
  cardGames?: CardGamesFile;
  /** Тексты экрана «Premium» (data/premium.json). */
  premium?: PremiumFile;
  /** SHA-256 кодов Premium (data/premium-codes.json). */
  premiumCodes?: string[];
  /** Тизер Ultimate 🔱 (data/ultimate.json). */
  ultimate?: UltimateFile;
  /** Раздел GAZ 🚀: задания, рулетка, челленджи, наборы (data/gaz.json). */
  gaz?: GazFile;
  /** «Сегодня 🔥»: батлы, вопросы, награды за серию (data/today.json). */
  today?: TodayFile;
  /** Разделы: плитки-вкладки и карточки (data/sections.json). */
  sectionLayouts?: SectionsFile;
}
