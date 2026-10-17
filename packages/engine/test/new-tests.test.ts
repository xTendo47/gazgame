import { describe, expect, it } from "vitest";
import { testSchema, type Test } from "@gazgame/content";
import characterJson from "@gazgame/content/data/tests/character.json";
import jobJson from "@gazgame/content/data/tests/job.json";
import ageJson from "@gazgame/content/data/tests/age.json";
import animalJson from "@gazgame/content/data/tests/animal.json";
import signJson from "@gazgame/content/data/tests/sign.json";
import zombieJson from "@gazgame/content/data/tests/zombie.json";
import { answersHash, isTopTie, scoreTest, seededRandom, shareButtonLabel, shareMessage, typeRanking } from "../src/index";

const tests: Test[] = [characterJson, jobJson, ageJson, animalJson, signJson, zombieJson].map((t) => testSchema.parse(t));
const byId = (id: string) => tests.find((t) => t.id === id) as Test;

describe("6 новых тестов «Кто ты»: структура и баланс", () => {
  it("12 вопросов по 4 варианта, каждый вариант +2 одному типу, каждый тип встречается ровно 8 раз", () => {
    for (const t of tests) {
      expect(t.questions, t.id).toHaveLength(12);
      expect(t.results, t.id).toHaveLength(6);
      const counts: Record<string, number> = Object.fromEntries(t.results.map((r) => [r.id, 0]));
      for (const q of t.questions) {
        expect(q.options, `${t.id}: ${q.id}`).toHaveLength(4);
        const kinds = q.options.map((o) => Object.keys(o.scores ?? {}));
        expect(new Set(kinds.map((k) => k[0])).size, `${t.id}: ${q.id} — типы в вопросе разные`).toBe(4);
        for (const o of q.options) {
          const entries = Object.entries(o.scores ?? {});
          expect(entries, `${t.id}: ${q.id}`).toHaveLength(1);
          expect(entries[0]?.[1]).toBe(2);
          counts[entries[0]?.[0] as string] = (counts[entries[0]?.[0] as string] ?? 0) + 1;
        }
      }
      expect(Object.values(counts), t.id).toEqual([8, 8, 8, 8, 8, 8]);
    }
  });

  it("случайные ответы: каждый тип выпадает одинаково часто (около 16,7%)", () => {
    for (const t of tests) {
      const random = seededRandom(t.id.length * 1000 + 7);
      const wins: Record<string, number> = Object.fromEntries(t.results.map((r) => [r.id, 0]));
      const N = 30_000;
      for (let n = 0; n < N; n++) {
        const answers = t.questions.map(() => Math.floor(random() * 4));
        const id = scoreTest(t, answers).resultId;
        wins[id] = (wins[id] ?? 0) + 1;
      }
      for (const [id, w] of Object.entries(wins)) {
        const pct = (w / N) * 100;
        expect(pct, `${t.id}/${id}: ${pct.toFixed(2)}%`).toBeGreaterThan(15.6);
        expect(pct, `${t.id}/${id}: ${pct.toFixed(2)}%`).toBeLessThan(17.7);
      }
    }
  }, 60_000);
});

describe("ничья решается по хэшу ответов", () => {
  const t = byId("character");
  /** Наборы ответов, где каждый тип выбран ровно 2 раза: шестерная ничья, все по 4 балла (поиск с возвратом, случайный порядок). */
  function sixWayTies(count: number, seed: number): number[][] {
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
      const options = [0, 1, 2, 3].sort(() => random() - 0.5);
      for (const o of options) {
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

  it("хэш = сумма (номер_варианта+1)×(номер_вопроса+7)", () => {
    expect(answersHash([0, 0, 0])).toBe(1 * 7 + 1 * 8 + 1 * 9);
    expect(answersHash([3, 1])).toBe(4 * 7 + 2 * 8);
  });

  it("одинаковые ответы — всегда одинаковый итог; итог не зависит от порядка показа (считается по номерам из файла)", () => {
    for (let seed = 0; seed < 50; seed++) {
      const random = seededRandom(seed);
      const answers = t.questions.map(() => Math.floor(random() * 4));
      expect(scoreTest(t, answers).resultId).toBe(scoreTest(t, [...answers]).resultId);
      expect(scoreTest(t, answers).blend?.resultId).toBe(scoreTest(t, [...answers]).blend?.resultId);
    }
  });

  it("при равных баллах побеждает один из равных: тот, на кого указывает хэш; все равные получают шанс", () => {
    // два вопроса дают +2 типам a и b, остальные ответы расходятся по другим типам так, что победа между a и b — равна по баллам
    const winners = new Set<string>();
    let ties = 0;
    const random = seededRandom(11);
    for (let n = 0; n < 4000; n++) {
      const answers = t.questions.map(() => Math.floor(random() * 4));
      const s = scoreTest(t, answers);
      const ranking = typeRanking(t, s.scores, { resultId: s.resultId, blendId: s.blend?.resultId });
      if (!isTopTie(ranking)) continue;
      ties++;
      const top = Math.max(...Object.values(s.scores));
      const equal = Object.keys(s.scores).filter((k) => s.scores[k] === top);
      // победитель — из равных, и ровно тот, на кого указывает хэш по порядку types
      const order = t.scoring === "types" ? [] : t.scoring.type === "types" ? (t.scoring.types ?? []) : [];
      const sorted = [...equal].sort((a, b) => order.indexOf(a) - order.indexOf(b));
      expect(s.resultId).toBe(sorted[answersHash(answers) % sorted.length]);
      winners.add(s.resultId);
    }
    expect(ties).toBeGreaterThan(300);
    expect(winners.size).toBe(6); // ни один тип не обделён при ничьей
  });

  it("шестерная ничья (все по 4 балла): победитель — по хэшу, разным ответам достаются разные типы, у каждого типа есть шанс", () => {
    const ties = sixWayTies(120, 5);
    expect(ties.length).toBeGreaterThan(50);
    const order = t.scoring === "types" ? [] : t.scoring.type === "types" ? (t.scoring.types ?? []) : [];
    const winners = new Set<string>();
    for (const answers of ties) {
      const sc = scoreTest(t, answers);
      expect(new Set(Object.values(sc.scores)).size, "все по 4 балла").toBe(1);
      expect(sc.resultId).toBe(order[answersHash(answers) % 6]);
      expect(scoreTest(t, answers).resultId).toBe(sc.resultId); // одинаковые ответы — одинаковый итог
      winners.add(sc.resultId);
    }
    expect(winners.size).toBe(6);
  });
});

describe("шеринг и фишки новых тестов", () => {
  it("кнопки шеринга: «Позвать в каст», «Собери отряд» и т.д.; текст сообщения — «Текст для сторис» результата + ссылка", () => {
    expect(shareButtonLabel(byId("character"))).toBe("Позвать в каст");
    expect(shareButtonLabel(byId("job"))).toBe("Кем работать твоим друзьям? 👀");
    expect(shareButtonLabel(byId("animal"))).toBe("Соберите свой зоопарк");
    expect(shareButtonLabel(byId("zombie"))).toBe("Собери отряд");
    const hero = byId("character").results.find((r) => r.id === "hero")!;
    expect(shareMessage(byId("character"), hero, { link: "https://gaz.test/t" })).toBe("Я главный герой 🦸 А ты кто в нашем фильме? https://gaz.test/t");
    // age и sign без своего блока share: кнопка по умолчанию, тот же текст
    expect(shareButtonLabel(byId("age"))).toBe("Пофлексить 🧊");
  });

  it("у каждого результата есть фишки из спеки", () => {
    const titles = (id: string) => byId(id).results.map((r) => (r.extras ?? []).map((e) => e.title).join("|"));
    for (const x of titles("character")) expect(x).toBe("Твоя сцена|Твоя фраза|Лучшая химия");
    for (const x of titles("job")) expect(x).toBe("Профессии под тебя|Где тебе будет тяжело|Пробник профессии");
    for (const x of titles("age")) expect(x).toBe("Это точно про тебя");
    for (const x of titles("animal")) expect(x).toBe("Твоя стая");
    for (const x of titles("sign")) expect(x).toBe("Прогноз на неделю|Талисман|Твой знак-пара");
    for (const x of titles("zombie")) expect(x).toBe("Шанс дожить до финала|Что у тебя в рюкзаке|Без кого не выжить");
    // «Шанс дожить» крупно, процент отдельно от шутки
    const leader = byId("zombie").results.find((r) => r.id === "leader")!;
    expect(leader.extras?.[0]).toMatchObject({ title: "Шанс дожить до финала", big: "91%" });
    const medic = byId("zombie").results.find((r) => r.id === "lucky")!;
    expect(medic.extras?.[0]).toMatchObject({ big: "99%", text: "никто не знает почему" });
    // «Твоя стая 🐾»: три строки
    expect(byId("animal").results[0]?.extras?.[0]?.items).toHaveLength(3);
    // знаки-пары взаимные: Искра ↔ Магнит, Волна ↔ Гора, Комета ↔ Луна
    const pairOf = (id: string) => byId("sign").results.find((r) => r.id === id)?.extras?.find((e) => e.title === "Твой знак-пара")?.text ?? "";
    expect(pairOf("spark")).toContain("Магнит");
    expect(pairOf("magnet")).toContain("Искра");
    expect(pairOf("wave")).toContain("Гора");
    expect(pairOf("mountain")).toContain("Волна");
    expect(pairOf("comet")).toContain("Луна");
    expect(pairOf("moon")).toContain("Комета");
  });

  it("«Лучшая химия» персонажей: пара взаимна или хотя бы указывает на существующую роль (share.duo)", () => {
    const t = byId("character");
    for (const r of t.results) expect(t.results.some((x) => x.id === r.share?.duo), r.id).toBe(true);
  });

  it("у каждого итога есть blend-текст второго типа", () => {
    for (const t of tests) for (const r of t.results) expect(t.blendNotes?.[r.id]?.text.length, `${t.id}/${r.id}`).toBeGreaterThan(10);
  });
});
