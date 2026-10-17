import { describe, expect, it } from "vitest";
import { gameSchema, testSchema, type LadderGame } from "@gazgame/content";
import questionsJson from "@gazgame/content/data/games/36-questions.json";
import valuesJson from "@gazgame/content/data/tests/couple-values.json";
import {
  clock,
  comparePair,
  createTimer,
  decodeOrder,
  encodeOrder,
  ladderNumber,
  ladderStarter,
  nextLadderDeck,
  ORDER_KEY,
  scoreTest,
  seededRandom,
  timerReducer,
} from "../src/index";

const parsed = gameSchema.parse({ ...questionsJson, related: [] });
if (parsed.mechanic !== "ladder") throw new Error("не лесенка");
const game: LadderGame = parsed;
const values = testSchema.parse({ ...valuesJson, related: [] });

describe("«36 вопросов 🗝️»", () => {
  it("игра в Романтике, 2 игрока, бесплатно, 60 минут; три уровня по 12 в фиксированном порядке", () => {
    expect(game.id).toBe("36-questions");
    expect(game.sections).toEqual(["pairs"]);
    expect(game.players).toEqual({ min: 2, max: 2 });
    expect(game.durationMin).toBe(60);
    expect(game.tier).toBe("free");
    expect(game.decks.map((d) => [d.id, d.cards.length, d.tier])).toEqual([
      ["meet", 12, "free"],
      ["deeper", 12, "free"],
      ["close", 12, "free"],
    ]);
    expect(game.decks.map((d) => `${d.emoji} ${d.title}`)).toEqual(["☕ Знакомство", "🌊 Глубже", "🕯️ Совсем близко"]);
    // уровни открыты все: «по порядку, но можно выбрать любой»
    for (const d of game.decks) expect(d.unlockAfter).toBeUndefined();
  });

  it("вопросы идут как в спеке и без пометок для разработчика", () => {
    const all = game.decks.flatMap((d) => d.cards.map((c) => c.text));
    expect(all).toHaveLength(36);
    expect(all[0]).toBe("Кого из любых людей в мире хочется позвать на ужин? Почему именно этого человека?");
    expect(all[10]).toBe("Расскажи историю своей жизни за 4 минуты. Как можно подробнее.");
    expect(all[35]).toBe("Расскажи о том, что тебя сейчас волнует, и спроси совета у человека напротив. А потом спроси, как, по его мнению, ты к этому относишься.");
    for (const t of all) expect(t, t).not.toMatch(/\*|отвечаете вместе\)|таймер 4/i);
    expect(new Set(all).size).toBe(36);
  });

  it("«Отвечаете вместе» у 8, 22, 25; таймер на 4 минуты только у 11", () => {
    const flat = game.decks.flatMap((d) => d.cards);
    expect(flat.flatMap((c, i) => (c.together ? [i + 1] : []))).toEqual([8, 22, 25]);
    expect(flat.flatMap((c, i) => (c.timerSec ? [i + 1] : []))).toEqual([11]);
    expect(flat[10]?.timerSec).toBe(240);
  });

  it("«Начинает» чередуется по номеру вопроса в игре, и на втором уровне счёт продолжается", () => {
    expect(ladderNumber(game, 0, 0)).toBe(0);
    expect(ladderNumber(game, 1, 0)).toBe(12);
    expect(ladderNumber(game, 2, 11)).toBe(35);
    const who = (d: number, i: number) => game.texts.players[ladderStarter(game, d, i)];
    expect([who(0, 0), who(0, 1), who(0, 2)]).toEqual(["Игрок 1", "Игрок 2", "Игрок 1"]);
    expect(who(1, 0)).toBe("Игрок 1"); // 13-й вопрос
    expect(who(2, 11)).toBe("Игрок 2"); // 36-й
  });

  it("следующий уровень: у первых двух есть, у последнего нет — после него финал", () => {
    expect(nextLadderDeck(game, 0)?.id).toBe("deeper");
    expect(nextLadderDeck(game, 1)?.id).toBe("close");
    expect(nextLadderDeck(game, 2)).toBeUndefined();
  });

  it("тексты экранов из спеки", () => {
    expect(game.fact).toBe(
      "В 1997 году психолог Артур Арон придумал 36 вопросов, чтобы двое незнакомых людей сблизились примерно за 45 минут. Говорят, после них даже влюбляются. Мы переписали их по-нашему.",
    );
    expect(game.texts).toMatchObject({ starts: "Начинает: {player}", together: "Отвечаете вместе", pass: "Пас", next: "Дальше →" });
    expect(game.levelDone).toMatchObject({ title: "Уровень пройден", emoji: "🗝️", text: "Перерыв или дальше?", next: "Дальше: {level} →", later: "Продолжим в другой раз" });
    expect(game.finale).toMatchObject({ title: "4 минуты глаза в глаза", emoji: "👀", note: "Молча. Можно улыбаться", seconds: 240 });
    expect(game.finale.after).toMatchObject({ title: "Как вы?", text: "Скажите друг другу одно слово" });
    expect(game.finale.flexText).toBe("Мы прошли 36 вопросов 🗝️ Попробуйте тоже");
    expect(game.rules).toHaveLength(6);
  });
});

describe("таймер", () => {
  it("старт, тики, пауза, конец", () => {
    let s = createTimer(3);
    expect(s).toEqual({ remaining: 3, running: false });
    s = timerReducer(s, { type: "tick" });
    expect(s.remaining).toBe(3); // стоит — не тикает
    s = timerReducer(s, { type: "toggle" });
    s = timerReducer(s, { type: "tick" });
    expect(s).toEqual({ remaining: 2, running: true });
    s = timerReducer(s, { type: "toggle" }); // пауза
    s = timerReducer(s, { type: "tick" });
    expect(s).toEqual({ remaining: 2, running: false });
    s = timerReducer(timerReducer(s, { type: "toggle" }), { type: "tick" });
    s = timerReducer(s, { type: "tick" });
    expect(s).toEqual({ remaining: 0, running: false });
    expect(timerReducer(s, { type: "toggle" })).toEqual(s); // на нуле не запускается
    expect(timerReducer(s, { type: "reset", seconds: 240 })).toEqual({ remaining: 240, running: false });
  });

  it("часы: 240 → 4:00, 59 → 0:59", () => {
    expect(clock(240)).toBe("4:00");
    expect(clock(59)).toBe("0:59");
    expect(clock(65)).toBe("1:05");
    expect(clock(-3)).toBe("0:00");
  });
});

// ---------------- Ценности пары ----------------

const random = (seed: number) => {
  const r = seededRandom(seed);
  return () => values.questions.map(() => Math.floor(r() * 4));
};

describe("«Ценности пары 💞»: своя карта", () => {
  it("12 вопросов по 4, 6 ценностей, каждая ровно 8 раз по +2; по 2 вопроса на каждую из 6 зон", () => {
    expect(values.questions).toHaveLength(12);
    expect(values.results.map((r) => r.id)).toEqual(["stab", "free", "close", "grow", "roots", "adv"]);
    const counts: Record<string, number> = {};
    for (const q of values.questions) {
      expect(new Set(q.options.map((o) => Object.keys(o.scores ?? {})[0])).size, q.id).toBe(4);
      for (const o of q.options) {
        const [k, v] = Object.entries(o.scores ?? {})[0] as [string, number];
        expect(v).toBe(2);
        counts[k] = (counts[k] ?? 0) + 1;
      }
    }
    expect(Object.values(counts)).toEqual([8, 8, 8, 8, 8, 8]);
    for (const zone of values.pair?.zones ?? []) expect(values.questions.filter((q) => q.zone === zone.id), zone.id).toHaveLength(2);
    expect(values.pair?.zones.map((z) => z.title)).toEqual([
      "Деньги и быт",
      "Где и как жить",
      "Дети и родные",
      "Работа и время вместе",
      "Свобода и доверие",
      "Ссоры и планы",
    ]);
  });

  it("случайные ответы: первое место у каждой ценности ~16,7%", () => {
    const next = random(4);
    const wins: Record<string, number> = {};
    const N = 40_000;
    for (let n = 0; n < N; n++) {
      const id = scoreTest(values, next()).resultId;
      wins[id] = (wins[id] ?? 0) + 1;
    }
    for (const r of values.results) {
      const pct = ((wins[r.id] ?? 0) / N) * 100;
      expect(pct, `${r.id}: ${pct.toFixed(2)}%`).toBeGreaterThan(15.7);
      expect(pct, `${r.id}: ${pct.toFixed(2)}%`).toBeLessThan(17.7);
    }
  });

  it("порядок карты: ничья по хэшу, первый в порядке — итог; число в адресе кодируется и читается обратно", () => {
    const next = random(8);
    let ties = 0;
    for (let n = 0; n < 500; n++) {
      const answers = next();
      const s = scoreTest(values, answers);
      expect(s.order?.[0]).toBe(s.resultId);
      const scores = (id: string) => s.scores[id] ?? 0;
      const order = s.order as string[];
      for (let i = 1; i < order.length; i++) expect(scores(order[i - 1] as string)).toBeGreaterThanOrEqual(scores(order[i] as string));
      if (scores(order[0] as string) === scores(order[1] as string)) ties++;
      const code = s.scores[ORDER_KEY] as number;
      expect(decodeOrder(values, code)).toEqual(order);
      expect(scoreTest(values, [...answers]).order).toEqual(order);
    }
    expect(ties).toBeGreaterThan(30);
    expect(decodeOrder(values, encodeOrder(values, ["adv", "stab", "free", "close", "grow", "roots"]))).toEqual(["adv", "stab", "free", "close", "grow", "roots"]);
    expect(decodeOrder(values, 12345)).toBeNull();
    expect(decodeOrder(values, 1000000)).toBeNull();
  });

  it("у итога «Партнёру важно знать» и три сильные стороны; карта — все 6 с топ-3 из 24", () => {
    expect(values.valueMap).toMatchObject({ top: 3, outOf: 24 });
    expect(values.resultBlocks?.howToLoveMe).toBe("Партнёру важно знать");
    for (const r of values.results) {
      expect(r.howToLoveMe, r.id).toHaveLength(1);
      expect(r.strengths, r.id).toHaveLength(3);
    }
    expect(values.results[0]?.howToLoveMe?.[0]).toBe("Тебе спокойнее, когда есть план и запас.");
  });

  it("описание и оговорка из спеки", () => {
    expect(values.description).toBe("Деньги, дети, где жить и сколько свободы. Насколько вы хотите от жизни одного и того же");
    expect(values.disclaimer).toBe("Это не приговор и не диагноз, а подсказка, где вам легко и где стоит договориться");
  });
});

describe("«Ценности пары 💞»: сравнение пары (движок для экрана пары)", () => {
  it("одинаковые ответы: 100%, «Одна волна», все зоны зелёные, общая ценность — первая", () => {
    const a = random(1)();
    const c = comparePair(values, a, a)!;
    expect(c.percent).toBe(100);
    expect(c.name.title).toBe("Одна волна");
    expect(c.zones.every((z) => z.state === "green")).toBe(true);
    expect(c.talk).toBeUndefined();
    expect(c.shared?.id).toBe(scoreTest(values, a).resultId);
    expect(c.freeLine).toBe(`Вы хотите от жизни почти одного и того же. Редкая удача. Вас объединяет ${c.shared?.emoji} ${c.shared?.title}.`);
  });

  it("полностью разные: низкий процент, красные зоны, «Общих ценностей в топ-3 нет», вопрос для разговора", () => {
    // человек A всегда выбирает 1-й вариант, B — 2-й: ни один ответ не совпадает
    const a = values.questions.map(() => 0);
    const b = values.questions.map(() => 1);
    const c = comparePair(values, a, b)!;
    expect(c.zones.every((z) => z.state === "red")).toBe(true);
    expect(c.percent).toBeLessThan(50);
    expect(c.talk).toBe(values.pair?.zones[0]?.differ); // первая из красных
    expect(["Искрим", "Два мира", "Разные, но рядом"]).toContain(c.name.title);
  });

  it("зона: оба совпали 🟢, один 🟡, ни одного 🔴", () => {
    const base = random(3)();
    const other = [...base];
    // вопросы зоны «Деньги и быт» — 3-й и 8-й: меняем только 3-й ответ
    const moneyIdx = values.questions.flatMap((q, i) => (q.zone === "money" ? [i] : []));
    expect(moneyIdx).toEqual([2, 7]);
    other[moneyIdx[0] as number] = (base[moneyIdx[0] as number]! + 1) % 4;
    let c = comparePair(values, base, other)!;
    expect(c.zones.find((z) => z.id === "money")).toMatchObject({ state: "yellow", matches: 1 });
    expect(c.talk).toBe(values.pair?.zones.find((z) => z.id === "money")?.differ);
    other[moneyIdx[1] as number] = (base[moneyIdx[1] as number]! + 1) % 4;
    c = comparePair(values, base, other)!;
    expect(c.zones.find((z) => z.id === "money")).toMatchObject({ state: "red", matches: 0 });
    expect(c.zones.find((z) => z.id === "money")?.text).toBe(values.pair?.zones.find((z) => z.id === "money")?.differ);
  });

  it("названия по проценту: от 80 / 65 / 50 / 35 / 0", () => {
    const names = values.pair?.names.map((n) => [n.minPercent, n.title]);
    expect(names).toEqual([
      [80, "Одна волна"],
      [65, "Хорошая команда"],
      [50, "Разные, но рядом"],
      [35, "Искрим"],
      [0, "Два мира"],
    ]);
  });

  it("случайные пары: в среднем около 46% (как в спеке)", () => {
    const next = random(12);
    let sum = 0;
    const N = 4000;
    for (let n = 0; n < N; n++) sum += comparePair(values, next(), next())!.percent;
    expect(sum / N).toBeGreaterThan(43);
    expect(sum / N).toBeLessThan(49);
  });

  it("тексты зон из спеки", () => {
    const money = values.pair?.zones[0];
    expect(money?.same).toBe("Про деньги и быт вы думаете одинаково, а это одна из главных причин ссор у пар. Повезло.");
    expect(values.pair?.noShared).toBe("Общих ценностей в топ-3 нет, тем интереснее.");
    expect(values.pair?.zonesTitle).toBe("🚦 Шесть зон вашей пары");
    expect(values.pair?.talkTitle).toBe("💬 Разговор на эту неделю");
  });
});
