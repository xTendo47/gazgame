import { describe, expect, it } from "vitest";
import { testSchema, type Test } from "@gazgame/content";
import introJson from "@gazgame/content/data/tests/intro-extro.json";
import colorJson from "@gazgame/content/data/tests/color.json";
import vibeJson from "@gazgame/content/data/tests/vibe.json";
import cityJson from "@gazgame/content/data/tests/city.json";
import { answersHash, borderlineNeighbour, decodeOrder, ORDER_KEY, scoreTest, seededRandom } from "../src/index";

const parse = (json: unknown) => testSchema.parse({ ...(json as object), related: [] });
const intro = parse(introJson);
const color = parse(colorJson);
const vibe = parse(vibeJson);
const city = parse(cityJson);
const typeTests: Test[] = [color, vibe, city];

const N = 60_000;
function randomShares(t: Test, seed: number, pick: (answers: number[]) => string): Record<string, number> {
  const random = seededRandom(seed);
  const wins: Record<string, number> = {};
  for (let n = 0; n < N; n++) {
    const id = pick(t.questions.map((q) => Math.floor(random() * q.options.length)));
    wins[id] = (wins[id] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(wins).map(([id, w]) => [id, (w / N) * 100]));
}
const near = (actual: number | undefined, expected: number, tol: number, label: string) => {
  expect(actual ?? 0, `${label}: ${(actual ?? 0).toFixed(2)}% (ждали ${expected}%)`).toBeGreaterThan(expected - tol);
  expect(actual ?? 0, `${label}: ${(actual ?? 0).toFixed(2)}% (ждали ${expected}%)`).toBeLessThan(expected + tol);
};

describe("4 теста Дневника → Кто ты: общее", () => {
  it("12 вопросов по 4 варианта, раздел Дневник, бесплатно, варианты перемешиваются", () => {
    for (const t of [intro, color, vibe, city]) {
      expect(t.questions, t.id).toHaveLength(12);
      for (const q of t.questions) expect(q.options, `${t.id}: ${q.id}`).toHaveLength(4);
      expect(t.sections).toEqual(["solo"]);
      expect(t.tier).toBe("free");
      expect(t.shuffleOptions, t.id).toBe(true);
    }
  });

  it("название, описание, подсказка и оговорка — из спек", () => {
    expect(intro.title).toBe("Интроверт или экстраверт?");
    expect(intro.description).toBe("Сколько тебя хватает на людей");
    expect(intro.disclaimer).toBe("Это не диагноз и не ярлык. Интроверсия и экстраверсия не хорошо и не плохо, а просто разный способ заряжаться.");
    expect(color.description).toBe("Не любимый цвет, а твой. 12 ситуаций, 6 цветов и палитра, которая есть только у тебя.");
    expect(vibe.intro).toBe("Выбирай то, что про тебя на самом деле, а не то, как красиво. Вайб не обманешь.");
    expect(city.disclaimer).toBe("Это игра про вайб городов, а не совет переезжать. Но выходные там провести стоит.");
  });

  it("в текстах нет мужского или женского рода от первого лица", () => {
    const bad = /(^|[^а-яё])(сама|готов|готова|рад|рада|уверен|уверена)(?=[^а-яё]|$)/i;
    for (const t of [intro, color, vibe, city]) {
      const strings: string[] = [];
      (function walk(o: unknown) {
        if (typeof o === "string") strings.push(o);
        else if (o && typeof o === "object") Object.values(o).forEach(walk);
      })({ ...t, $schema: undefined });
      for (const s of strings) expect(s, `${t.id}: ${s}`).not.toMatch(bad);
    }
  });
});

describe("«Интроверт или экстраверт? 🔋»: шкала из 5 итогов и соц-батарейка", () => {
  it("4 зоны по 3 вопроса, варианты 0/1/2/3; итоги 0–9 / 10–15 / 16–20 / 21–26 / 27–36", () => {
    expect(intro.results.map((r) => [r.id, r.range])).toEqual([
      ["shell", [0, 9]],
      ["quiet", [10, 15]],
      ["chameleon", [16, 20]],
      ["sun", [21, 26]],
      ["disco", [27, 36]],
    ]);
    for (const zone of ["company", "talk", "charge", "rhythm"]) {
      const qs = intro.questions.filter((q) => q.scale === zone);
      expect(qs, zone).toHaveLength(3);
      for (const q of qs) expect(q.options.map((o) => o.score)).toEqual([0, 1, 2, 3]);
    }
  });

  it("крайние ответы: все «тихие» → 🐚, все «громкие» → 🕺", () => {
    expect(scoreTest(intro, intro.questions.map(() => 0)).resultId).toBe("shell");
    expect(scoreTest(intro, intro.questions.map(() => 3)).resultId).toBe("disco");
    expect(scoreTest(intro, intro.questions.map(() => 1)).resultId).toBe("quiet"); // 12
    expect(scoreTest(intro, intro.questions.map(() => 2)).resultId).toBe("sun"); // 24
  });

  it("случайные ответы: 🐚 1.4% · 🌙 24.7% · 🦎 47.7% · ☀️ 24.9% · 🕺 1.3% (как в спеке)", () => {
    const s = randomShares(intro, 3, (a) => scoreTest(intro, a).resultId);
    near(s.shell, 1.4, 0.5, "shell");
    near(s.quiet, 24.7, 1.2, "quiet");
    near(s.chameleon, 47.7, 1.3, "chameleon");
    near(s.sun, 24.9, 1.2, "sun");
    near(s.disco, 1.3, 0.5, "disco");
  });

  it("пограничный итог: сумма 9↔10, 15↔16, 20↔21, 26↔27 даёт соседа, остальные суммы — нет", () => {
    const neighbour = (n: number) => borderlineNeighbour(intro, n)?.id ?? null;
    expect([9, 10, 15, 16, 20, 21, 26, 27].map(neighbour)).toEqual(["quiet", "shell", "chameleon", "quiet", "sun", "chameleon", "disco", "sun"]);
    for (const n of [0, 5, 8, 12, 13, 18, 23, 30, 36]) expect(neighbour(n), `сумма ${n}`).toBeNull();
    expect(intro.borderline).toBe("Ты на границе с «{title}»: часть его описания тоже про тебя");
  });

  it("у каждого итога: чип «по-научному», часы батарейки и два блока по 3 пункта", () => {
    expect(intro.results.map((r) => [r.tag, r.battery])).toEqual([
      ["по-научному: глубокий интроверт", "1–2 часа"],
      ["по-научному: интроверт", "3–4 часа"],
      ["по-научному: амбиверт", "5–6 часов"],
      ["по-научному: экстраверт", "8–10 часов"],
      ["по-научному: яркий экстраверт", "12+ часов"],
    ]);
    for (const r of intro.results) {
      expect(r.extras?.map((e) => e.title), r.id).toEqual(["Как ты заряжаешься", "Что тебя разряжает"]);
      for (const e of r.extras ?? []) expect(e.items, `${r.id}/${e.title}`).toHaveLength(3);
    }
    expect(intro.battery?.caption).toBe("Соц-батарейки хватает на ~{hours} среди людей");
    expect(intro.results[0]?.shareText).toBe("Я 🐚 Уютная ракушка. Соц-батарейки на 1–2 часа, дальше режим «не беспокоить»");
  });

  it("зоны: 0–3 «больше интро», 4–5 «посередине», 6–9 «больше экстра», ползунок интро ↔ экстра", () => {
    expect(intro.scoring).toMatchObject({ scaleLevels: { low: [0, 3], mid: [4, 5], high: [6, 9] } });
    expect(intro.scalesPanel?.levels?.low?.label).toBe("больше интро");
    expect(intro.scalesPanel?.levels?.mid?.label).toBe("посередине");
    expect(intro.scalesPanel?.levels?.high?.label).toBe("больше экстра");
    expect(intro.scalesPanel?.slider).toEqual({ low: "интро", high: "экстра" });
    const mixed = scoreTest(intro, intro.questions.map((q) => (q.scale === "company" ? 3 : 0)));
    expect(mixed.scales?.scales.map((s) => [s.scale.id, s.level])).toEqual([
      ["company", "high"],
      ["talk", "low"],
      ["charge", "low"],
      ["rhythm", "low"],
    ]);
  });
});

describe("типы: цвет, вайб, город — баланс и ничья по хэшу", () => {
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

  it("6 итогов, каждый тип встречается ровно 8 раз, каждый вариант +2", () => {
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
      const s = randomShares(t, t.id.length * 100 + 7, (a) => scoreTest(t, a).resultId);
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

  it("порядок всех типов едет в адресе (order): первый — итог, второй — «второй цвет / город-пара», ничьи по хэшу", () => {
    for (const t of [color, city]) {
      const random = seededRandom(5);
      for (let n = 0; n < 300; n++) {
        const answers = t.questions.map(() => Math.floor(random() * 4));
        const s = scoreTest(t, answers);
        const order = decodeOrder(t, s.scores[ORDER_KEY] as number);
        expect(order, t.id).toEqual(s.order);
        expect(order?.[0]).toBe(s.resultId);
        expect(order).toHaveLength(6);
      }
    }
    // у «вайба» палитры и город-пары нет — порядок в адрес не кладём
    expect(ORDER_KEY in scoreTest(vibe, vibe.questions.map(() => 0)).scores).toBe(false);
  });
});

describe("фишки итогов из спек", () => {
  it("«Какой ты цвет?»: цвета и рамка чёрного бархата, «Где тебя видно» чипами, «С каким цветом совпадаешь», палитра", () => {
    expect(color.results.map((r) => r.acc)).toEqual(["#FF5A1F", "#D4FF3A", "#62D2FF", "#8B5CFF", "#FF8FC7", "#0B0A0D"]);
    expect(color.results.map((r) => r.accBorder)).toEqual([undefined, undefined, undefined, undefined, undefined, "#C9C2CF"]);
    expect(color.palette).toEqual({ title: "Твоя палитра", barTitle: "Из чего ты состоишь" });
    expect(color.blendNotes).toBeUndefined(); // второй цвет живёт в палитре, а не в «Ещё в тебе»
    for (const r of color.results) {
      expect(r.asSecond, r.id).toBeTruthy();
      expect(r.extras?.map((e) => e.title)).toEqual(["Где тебя видно", "С каким цветом ты совпадаешь"]);
      expect(r.extras?.[0]?.chips).toBe(true);
      expect(r.extras?.[0]?.items).toHaveLength(3);
    }
    // цвета-пары взаимные: Огненный ↔ Ледяной, Салатовый ↔ Фиолетовый, Розовый ↔ Чёрный
    const pairOf = (id: string) => color.results.find((r) => r.id === id)?.extras?.[1]?.text ?? "";
    expect(pairOf("fire")).toContain("Ледяной голубой");
    expect(pairOf("ice")).toContain("Огненно-оранжевый");
    expect(pairOf("lime")).toContain("Глубокий фиолетовый");
    expect(pairOf("violet")).toContain("Электро-салатовый");
    expect(pairOf("pink")).toContain("Чёрный бархат");
    expect(pairOf("black")).toContain("Нежно-розовый");
  });

  it("«Твой вайб ✨»: вайб-борд (3 эмодзи, 2 цвета, 3 настроения, локация, звук), совместимость, цвет карточки, blend", () => {
    for (const r of vibe.results) {
      expect(r.board?.emojis, r.id).toHaveLength(3);
      expect(r.board?.moods, r.id).toHaveLength(3);
      expect(r.board?.colors, r.id).toHaveLength(2);
      expect(r.board?.place && r.board?.sound).toBeTruthy();
      expect(r.compat?.match && r.compat?.drain, r.id).toBeTruthy();
      expect(r.acc, r.id).toMatch(/^#[0-9A-F]{6}$/);
      expect(vibe.blendNotes?.[r.id]?.text, r.id).toMatch(/^А ещё в тебе есть /);
    }
    const old = vibe.results.find((r) => r.id === "oldmoney")!;
    expect(old.board).toEqual({
      emojis: ["🎾", "⛵", "📖"],
      colors: ["#EDE4D3", "#1F3A2E"],
      moods: ["джаз", "рояль", "тишина"],
      place: "Летняя веранда у моря",
      sound: "Звон ложки о фарфоровую чашку",
    });
    expect(old.compat).toEqual({
      match: "🧸 Cozy: тихий вечер вместе — лучший отдых",
      drain: "🌪️ Хаос-энергия: весело, но после встречи нужен день тишины",
    });
    expect(vibe.results.find((r) => r.id === "grunge")?.acc).toBe("#C24A4A");
  });

  it("«Твой город 🏙»: маршрут из трёх точек, район, «где будешь скучать», город-пара, цвет карточки", () => {
    expect(city.pairBlock?.title).toBe("А ещё тебе подойдёт");
    expect(city.blendNotes).toBeUndefined();
    for (const r of city.results) {
      expect(r.route?.map((s) => s.label), r.id).toEqual(["☀️ Утро", "🌤 День", "🌙 Вечер"]);
      expect(r.extras?.map((e) => e.title)).toEqual(["Твой район", "Где ты будешь скучать"]);
      expect(r.asSecond, r.id).toBeTruthy();
      expect(r.acc, r.id).toMatch(/^#[0-9A-F]{6}$/);
    }
    expect(city.results.map((r) => r.acc)).toEqual(["#FF4D8D", "#F3D9B1", "#FFC93C", "#FF5A1F", "#B58CFF", "#62D2FF"]);
    expect(city.results[0]?.route?.[2]?.text).toBe("Неоновые переулки, рамен у стойки и игровые автоматы");
  });
});
