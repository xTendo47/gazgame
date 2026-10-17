import { describe, expect, it } from "vitest";
import { testSchema, type Test } from "@gazgame/content";
import jealousyJson from "@gazgame/content/data/tests/jealousy.json";
import romanceJson from "@gazgame/content/data/tests/romance-level.json";
import flagsJson from "@gazgame/content/data/tests/flags.json";
import loveNeedsJson from "@gazgame/content/data/tests/love-needs.json";
import breakupJson from "@gazgame/content/data/tests/breakup.json";
import { answersHash, FLAG_KEY, flagMeterOf, LANG_KEY, languageOf, scoreTest, seededRandom, shareMessage } from "../src/index";

const parse = (json: unknown) => testSchema.parse({ ...(json as object), related: [] });
const jealousy = parse(jealousyJson);
const romance = parse(romanceJson);
const flags = parse(flagsJson);
const loveNeeds = parse(loveNeedsJson);
const breakup = parse(breakupJson);
const typeTests: Test[] = [flags, loveNeeds, breakup];

const N = 60_000;
/** Доли результатов (в процентах) при случайных ответах. */
function randomShares(t: Test, seed: number, pick: (answers: number[]) => string): Record<string, number> {
  const random = seededRandom(seed);
  const wins: Record<string, number> = {};
  for (let n = 0; n < N; n++) {
    const answers = t.questions.map((q) => Math.floor(random() * q.options.length));
    const id = pick(answers);
    wins[id] = (wins[id] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(wins).map(([id, w]) => [id, (w / N) * 100]));
}
const near = (actual: number | undefined, expected: number, tol: number, label: string) => {
  expect(actual ?? 0, `${label}: ${(actual ?? 0).toFixed(2)}% (ждали ${expected}%)`).toBeGreaterThan(expected - tol);
  expect(actual ?? 0, `${label}: ${(actual ?? 0).toFixed(2)}% (ждали ${expected}%)`).toBeLessThan(expected + tol);
};

describe("5 личных тестов «Ты в любви»: содержимое и раздел", () => {
  it("12 вопросов по 4 варианта, раздел Романтика, бесплатно, 1 игрок, варианты перемешиваются", () => {
    for (const t of [jealousy, romance, flags, loveNeeds, breakup]) {
      expect(t.questions, t.id).toHaveLength(12);
      for (const q of t.questions) expect(q.options, `${t.id}: ${q.id}`).toHaveLength(4);
      expect(t.sections).toEqual(["pairs"]);
      expect(t.tier).toBe("free");
      expect(t.players).toEqual({ min: 1, max: 1 });
      expect(t.shuffleOptions, t.id).toBe(true);
      expect(t.ageRating).toBe("all");
    }
  });

  it("название, описание, подсказка и оговорка — из спек", () => {
    expect(jealousy.title).toBe("Насколько ты ревнуешь?");
    expect(jealousy.description).toBe("Лайки, бывшие, сторис: проверь, где у тебя кольнёт");
    expect(jealousy.disclaimer).toBe("Это игра, а не диагноз. Ревность бывает у всех, вопрос только в дозировке.");
    expect(romance.id).toBe("romance-level");
    expect(romance.description).toBe("Свечи и признания или «а зачем»? Узнай свой уровень романтики и идеальное свидание");
    expect(romance.intro).toBe("Отвечай, как есть, а не как в кино. Если сейчас никого нет, представь человека, который тебе нравится.");
    expect(flags.description).toBe("Какой у тебя главный зелёный флаг в отношениях и какой красный? Честно, с юмором и без приговоров.");
    expect(flags.disclaimer).toBe(
      "Тест для развлечения, красные флаги тут шуточные. Если в отношениях страшно или тебя контролируют, это уже не шутка: загляни в «Здоровые ли у вас отношения? 🚦».",
    );
    expect(loveNeeds.description).toBe("Не как ты любишь, а что тебе нужно в ответ. Узнаешь, кто тебе подходит и как понять это на первом свидании.");
    expect(breakup.intro).toBe("Если сейчас расставания нет, отвечай, как бывает обычно или как было в последний раз.");
  });

  it("в текстах нет мужского или женского рода от первого лица", () => {
    const bad = /(^|[^а-яё])(сама|готов|готова|рад|рада|уверен|уверена|должен|должна)(?=[^а-яё]|$)/i;
    for (const t of [jealousy, romance, flags, loveNeeds, breakup]) {
      const strings: string[] = [];
      (function walk(o: unknown) {
        if (typeof o === "string") strings.push(o);
        else if (o && typeof o === "object") Object.values(o).forEach(walk);
      })({ ...t, $schema: undefined });
      for (const s of strings) expect(s, `${t.id}: ${s}`).not.toMatch(bad);
    }
  });
});

describe("«Насколько ты ревнуешь? 💚»: шкалы по зонам, сумма → итог", () => {
  it("4 зоны по 3 вопроса, варианты 0/1/2/3, максимум 36; итоги 0–7 / 8–14 / 15–21 / 22–28 / 29–36", () => {
    expect(jealousy.results.map((r) => [r.id, r.range])).toEqual([
      ["ice", [0, 7]],
      ["trust", [8, 14]],
      ["watch", [15, 21]],
      ["fire", [22, 28]],
      ["detective", [29, 36]],
    ]);
    for (const zone of ["social", "exes", "friends", "time"]) {
      const qs = jealousy.questions.filter((q) => q.scale === zone);
      expect(qs, zone).toHaveLength(3);
      for (const q of qs) expect(q.options.map((o) => o.score)).toEqual([0, 1, 2, 3]);
    }
  });

  it("крайние ответы: все 0 → «Ледяное спокойствие», все 3 → «Детектив 24/7»", () => {
    expect(scoreTest(jealousy, jealousy.questions.map(() => 0)).resultId).toBe("ice");
    expect(scoreTest(jealousy, jealousy.questions.map(() => 3)).resultId).toBe("detective");
    const mid = scoreTest(jealousy, jealousy.questions.map(() => 1));
    expect(mid.scales?.total).toBe(12);
    expect(mid.resultId).toBe("trust");
  });

  it("зоны: 0–3 «спокойно», 4–6 «колет», 7–9 «триггер»; советы есть у каждой зоны (по 3)", () => {
    const all3 = scoreTest(jealousy, jealousy.questions.map(() => 3));
    expect(all3.scales?.scales.map((s) => [s.score, s.level])).toEqual([[9, "high"], [9, "high"], [9, "high"], [9, "high"]]);
    const tips = jealousy.scalesPanel?.tips?.byScale ?? {};
    expect(Object.keys(tips).sort()).toEqual(["exes", "friends", "social", "time"]);
    for (const list of Object.values(tips)) expect(list).toHaveLength(3);
    expect(jealousy.scalesPanel?.levels?.low).toMatchObject({ emoji: "🟢", label: "спокойно" });
    expect(jealousy.scalesPanel?.levels?.high).toMatchObject({ emoji: "🔴", label: "триггер" });
  });

  it("кнопка «Здоровые ли у вас отношения? 🚦» только у 🔥 и 🕵️", () => {
    expect(jealousy.results.map((r) => !!r.button)).toEqual([false, false, false, true, true]);
    expect(jealousy.results[3]?.button?.label).toBe("Пройти «Здоровые ли у вас отношения? 🚦» →");
  });

  it("случайные ответы: 🧊 0.3% · 😌 18.2% · 👀 62.9% · 🔥 18.4% · 🕵️ 0.3% (как в спеке)", () => {
    const s = randomShares(jealousy, 3, (a) => scoreTest(jealousy, a).resultId);
    near(s.ice, 0.3, 0.3, "ice");
    near(s.trust, 18.2, 1, "trust");
    near(s.watch, 62.9, 1.2, "watch");
    near(s.fire, 18.4, 1, "fire");
    near(s.detective, 0.3, 0.3, "detective");
  });
});

describe("«Сколько в тебе романтики? 🌹»: уровень + язык", () => {
  it("латинский квадрат: у каждого языка каждый балл 0–3 встречается ровно 3 раза", () => {
    const grid: Record<string, number[]> = {};
    for (const q of romance.questions) {
      expect(q.options.map((o) => o.score).sort()).toEqual([0, 1, 2, 3]);
      expect(new Set(q.options.map((o) => o.type)).size).toBe(4);
      for (const o of q.options) (grid[o.type as string] ??= []).push(o.score as number);
    }
    for (const [lang, scores] of Object.entries(grid)) {
      for (const n of [0, 1, 2, 3]) expect(scores.filter((x) => x === n).length, `${lang}: балл ${n}`).toBe(3);
    }
  });

  it("уровни от 0 / 12 / 17 / 22 / 27 и таблица «уровень × язык» 5×4", () => {
    expect(romance.results.map((r) => [r.id, r.range])).toEqual([
      ["ice", [0, 11]],
      ["holiday", [12, 16]],
      ["warm", [17, 21]],
      ["full", [22, 26]],
      ["drama", [27, 36]],
    ]);
    const dates = romance.languages?.dates ?? {};
    expect(Object.keys(dates)).toHaveLength(5);
    for (const row of Object.values(dates)) expect(Object.keys(row).sort()).toEqual(["adventure", "cozy", "surprise", "words"]);
    expect(dates.ice?.surprise).toBe("Заранее выбранная кафешка, без неожиданностей, зато вкусно");
    expect(dates.drama?.cozy).toBe("Каждый вечер как кино: свечи, песня, медленный танец");
    expect(romance.languages?.items.map((l) => l.title)).toEqual(["Сюрпризы", "Слова", "Приключения", "Уют"]);
  });

  it("язык = чаще всего выбранный; ничья — по хэшу ответов; scores.lang едет рядом с суммой", () => {
    const pickLang = (lang: string) => romance.questions.map((q) => q.options.findIndex((o) => o.type === lang));
    for (const [i, lang] of ["surprise", "words", "adventure", "cozy"].entries()) {
      const s = scoreTest(romance, pickLang(lang));
      expect(s.scores[LANG_KEY], lang).toBe(i);
      expect(languageOf(romance, s.scores[LANG_KEY] as number)?.id).toBe(lang);
      expect(s.scores.romance).toBeGreaterThanOrEqual(0);
    }
    // 12 ответов поровну на два языка: ничья, победитель — тот, на кого указывает хэш
    const answers = romance.questions.map((q, i) => q.options.findIndex((o) => o.type === (i < 6 ? "words" : "cozy")));
    const tied = scoreTest(romance, answers).scores[LANG_KEY];
    expect(["words", "cozy"]).toContain(romance.languages?.items[tied as number]?.id);
    expect(tied).toBe([1, 3][answersHash(answers) % 2]);
    expect(scoreTest(romance, [...answers]).scores[LANG_KEY]).toBe(tied);
  });

  it("случайные ответы: уровни 🧊 4.7 · 🌤️ 30.6 · 🌸 46.1 · 🔥 17.3 · 🌹 1.3%; языки по ~25% каждый", () => {
    const s = randomShares(romance, 5, (a) => scoreTest(romance, a).resultId);
    near(s.ice, 4.7, 0.8, "ice");
    near(s.holiday, 30.6, 1.2, "holiday");
    near(s.warm, 46.1, 1.3, "warm");
    near(s.full, 17.3, 1, "full");
    near(s.drama, 1.3, 0.5, "drama");
    const langs = randomShares(romance, 6, (a) => String(scoreTest(romance, a).scores[LANG_KEY]));
    for (const k of ["0", "1", "2", "3"]) near(langs[k], 25, 1.2, `язык ${k}`);
  });

  it("сообщение для шеринга: «Мой уровень романтики: 🔥 …, язык: 🎁 Сюрпризы 🌹 А твой?»", () => {
    const result = romance.results.find((r) => r.id === "full")!;
    const text = shareMessage(romance, result, { link: "https://gaz.test/t", language: { emoji: "🎁", title: "Сюрпризы" } });
    expect(text).toBe("Мой уровень романтики: 🔥 Романтика на полную, язык: 🎁 Сюрпризы 🌹 А твой? https://gaz.test/t");
  });
});

describe("«Красный флаг, зелёный флаг 🚩💚»: типы + Флаг-метр", () => {
  it("12 вопросов: каждый тип ровно 8 раз; веса «красного» 0, 1, 2, 3 по одному разу в вопросе", () => {
    const counts: Record<string, number> = {};
    for (const q of flags.questions) {
      expect(q.options.map((o) => o.flag).sort(), q.id).toEqual([0, 1, 2, 3]);
      expect(new Set(q.options.map((o) => Object.keys(o.scores ?? {})[0])).size).toBe(4);
      for (const o of q.options) {
        const key = Object.keys(o.scores ?? {})[0] as string;
        expect(o.scores?.[key]).toBe(2);
        counts[key] = (counts[key] ?? 0) + 1;
      }
    }
    expect(Object.values(counts)).toEqual([8, 8, 8, 8, 8, 8]);
  });

  it("сумма «красного» едет в scores.flag; процент и подписи по диапазонам 0–30 / 31–50 / 51–70 / 71–100", () => {
    const green = flags.questions.map((q) => q.options.findIndex((o) => o.flag === 0));
    const red = flags.questions.map((q) => q.options.findIndex((o) => o.flag === 3));
    expect(scoreTest(flags, green).scores[FLAG_KEY]).toBe(0);
    expect(scoreTest(flags, red).scores[FLAG_KEY]).toBe(36);
    expect(flagMeterOf(flags, 0)).toMatchObject({ red: 0, green: 100, band: { title: "Сплошной зелёный", emoji: "💚" } });
    expect(flagMeterOf(flags, 10)?.band.title).toBe("Сплошной зелёный"); // 27.8% → 28
    expect(flagMeterOf(flags, 11)?.band.title).toBe("Зелёный с перчинкой"); // 30.6% → 31
    expect(flagMeterOf(flags, 12)?.band.title).toBe("Зелёный с перчинкой"); // 33%
    expect(flagMeterOf(flags, 18)).toMatchObject({ red: 50, band: { title: "Зелёный с перчинкой" } });
    expect(flagMeterOf(flags, 19)?.band.title).toBe("Светофор"); // 52.8%
    expect(flagMeterOf(flags, 25)?.band.title).toBe("Светофор"); // 69.4%
    expect(flagMeterOf(flags, 26)?.band.title).toBe("Красный, но обаятельный"); // 72.2%
    expect(flagMeterOf(flags, 36)).toMatchObject({ red: 100, green: 0 });
    expect(flagMeterOf(flags, 37)).toBeNull();
  });

  it("случайные ответы: Зелёный с перчинкой ~52%, Светофор ~42%, края по ~2.6%", () => {
    const s = randomShares(flags, 8, (a) => flagMeterOf(flags, scoreTest(flags, a).scores[FLAG_KEY] as number)?.band.title ?? "?");
    near(s["Сплошной зелёный"], 2.6, 0.8, "Сплошной зелёный");
    near(s["Зелёный с перчинкой"], 52.4, 1.5, "Зелёный с перчинкой");
    near(s["Светофор"], 42.4, 1.5, "Светофор");
    near(s["Красный, но обаятельный"], 2.6, 0.8, "Красный");
  });

  it("у каждого итога две карточки — зелёный и красный флаг; текст для сторис собран из них", () => {
    for (const r of flags.results) {
      const [green, red] = r.extras ?? [];
      expect(green?.title).toBe("Твой зелёный флаг");
      expect(red?.title).toBe("Твой красный флаг");
      const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
      expect(r.shareText, r.id).toBe(`Мой зелёный флаг: ${lower(green?.text ?? "")} 💚 Мой красный флаг: ${lower(red?.text ?? "")} 🚩 А твои?`);
    }
  });
});

describe("типы: любовь, расставания и флаги — баланс и ничья по хэшу", () => {
  /** Наборы ответов, где каждый тип выбран ровно 2 раза: шестерная ничья, все по 4 балла. */
  function sixWayTies(t: Test, count: number, seed: number): number[][] {
    const random = seededRandom(seed);
    const found: number[][] = [];
    const types = t.questions.map((q) => q.options.map((o) => Object.keys(o.scores ?? {})[0] as string));
    const used: Record<string, number> = {};
    const answers: number[] = [];
    function go(q: number): boolean {
      if (found.length >= count) return true;
      if (q === t.questions.length) {
        found.push([...answers]);
        return found.length >= count;
      }
      for (const o of [0, 1, 2, 3].sort(() => random() - 0.5)) {
        const type = types[q]?.[o] as string;
        if ((used[type] ?? 0) >= 2) continue;
        used[type] = (used[type] ?? 0) + 1;
        answers[q] = o;
        if (go(q + 1)) return true;
        used[type] = (used[type] ?? 0) - 1;
      }
      return false;
    }
    for (let attempt = 0; attempt < 400 && found.length < count; attempt++) {
      Object.keys(used).forEach((k) => delete used[k]);
      go(0);
    }
    return found;
  }

  it("в каждом тесте 6 итогов, каждый тип встречается ровно 8 раз, каждый вариант +2", () => {
    for (const t of typeTests) {
      expect(t.results, t.id).toHaveLength(6);
      const counts: Record<string, number> = Object.fromEntries(t.results.map((r) => [r.id, 0]));
      for (const q of t.questions) {
        expect(new Set(q.options.map((o) => Object.keys(o.scores ?? {})[0])).size, `${t.id}: ${q.id}`).toBe(4);
        for (const o of q.options) {
          const [key, value] = Object.entries(o.scores ?? {})[0] as [string, number];
          expect(value).toBe(2);
          counts[key] = (counts[key] ?? 0) + 1;
        }
      }
      expect(Object.values(counts), t.id).toEqual([8, 8, 8, 8, 8, 8]);
    }
  });

  it("случайные ответы: каждый тип выпадает по ~16.7%", () => {
    for (const t of typeTests) {
      const s = randomShares(t, t.id.length * 100 + 3, (a) => scoreTest(t, a).resultId);
      for (const r of t.results) near(s[r.id], 16.7, 1, `${t.id}/${r.id}`);
    }
  });

  it("шестерная ничья: победитель — по хэшу ответов; одинаковые ответы дают одинаковый итог; у каждого типа есть шанс", () => {
    for (const t of typeTests) {
      const ties = sixWayTies(t, 120, 9);
      expect(ties.length, t.id).toBeGreaterThan(50);
      const order = t.scoring === "types" ? [] : t.scoring.type === "types" ? (t.scoring.types ?? []) : [];
      const winners = new Set<string>();
      for (const answers of ties) {
        const s = scoreTest(t, answers);
        expect(s.resultId, t.id).toBe(order[answersHash(answers) % 6]);
        expect(scoreTest(t, [...answers]).resultId).toBe(s.resultId);
        winners.add(s.resultId);
      }
      expect(winners.size, t.id).toBe(6);
    }
  });

  it("второй тип отстаёт не больше чем на 2 балла — «ещё в тебе…» с текстом из спеки", () => {
    const t = breakup;
    const random = seededRandom(21);
    let blends = 0;
    for (let n = 0; n < 500; n++) {
      const s = scoreTest(t, t.questions.map(() => Math.floor(random() * 4)));
      if (!s.blend) continue;
      blends++;
      expect(s.scores[s.resultId]! - s.scores[s.blend.resultId]!).toBeLessThanOrEqual(2);
      expect(s.blend.note.text).toMatch(/^А ещё в тебе есть /);
    }
    expect(blends).toBeGreaterThan(50);
  });
});

describe("фишки итогов из спек", () => {
  it("«Что тебе нужно в любви?»: три блока — 💌 кто подходит, ⚡ с кем тяжело, ☕ первое свидание (3 признака)", () => {
    for (const r of loveNeeds.results) {
      expect((r.extras ?? []).map((e) => e.title)).toEqual(["Кто тебе подходит", "С кем будет тяжело", "Как понять на первом свидании"]);
      expect(r.extras?.[2]?.items, r.id).toHaveLength(3);
    }
    const spark = loveNeeds.results.find((r) => r.id === "spark")!;
    expect(spark.extras?.[2]?.items?.[0]).toBe("Время пролетает незаметно");
  });

  it("«Как ты переживаешь расставания?»: план из трёх шагов, «Что точно не делать», мягкая строка и кнопка к чекапу", () => {
    for (const r of breakup.results) {
      expect((r.extras ?? []).map((e) => e.title)).toEqual(["Твой план восстановления", "Что точно не делать"]);
      const steps = r.extras?.[0]?.items ?? [];
      expect(steps, r.id).toHaveLength(3);
      expect(steps[0]).toMatch(/^День 1: /);
      expect(steps[1]).toMatch(/^Неделя 1: /);
      expect(steps[2]).toMatch(/^Месяц: /);
      expect(r.care).toBe("Пройди бесплатный чекап «Как ты сейчас? 🌡». Это пара минут, и станет понятнее, чем себе помочь.");
      expect(r.button?.soon).toBe(true);
    }
  });
});
