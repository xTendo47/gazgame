import { describe, expect, it } from "vitest";
import { gazFileSchema, todayFileSchema } from "@gazgame/content";
import gazJson from "@gazgame/content/data/gaz.json";
import todayJson from "@gazgame/content/data/today.json";
import {
  countToday,
  createMemoryKeyValueStore,
  createProgressStore,
  dayIndex,
  emptyToday,
  isDayCounted,
  ladderProgress,
  nextStep,
  pluralDays,
  saveAnswer,
  settleToday,
  todayPicks,
  voteToday,
  weekChoices,
  type TodayData,
} from "../src/index";

const today = todayFileSchema.parse(todayJson);
const gaz = gazFileSchema.parse(gazJson);
/** День недели: 13.10.2026 — вторник; hour — час по МСК. */
const msk = (day: number, hour = 12) => new Date(Date.UTC(2026, 9, day, hour - 3));

/** Засчитать день `day` октября и записать результат. */
const count = (data: TodayData, day: number) => countToday(data, msk(day), today.ladder).data;

describe("что показываем сегодня", () => {
  it("индекс дня — число дней от 13.10.2026 по МСК, граница 00:00 МСК", () => {
    expect(dayIndex(msk(13, 0))).toBe(0);
    expect(dayIndex(new Date("2026-10-12T20:59:59Z"))).toBe(-1); // 23:59:59 МСК 12.10
    expect(dayIndex(new Date("2026-10-12T21:00:00Z"))).toBe(0);
    expect(dayIndex(new Date("2026-10-13T20:59:59Z"))).toBe(0);
    expect(dayIndex(new Date("2026-10-13T21:00:00Z"))).toBe(1);
  });

  it("батл, вопрос и задание меняются в 00:00 МСК: батл = [i%30], вопрос = [i%30], задание = b[(i×7)%30]", () => {
    const before = todayPicks(today, gaz.bored, new Date("2026-10-13T20:59:59Z"));
    const after = todayPicks(today, gaz.bored, new Date("2026-10-13T21:00:00Z"));
    expect([before.index, after.index]).toEqual([0, 1]);
    expect(before.battle.id).toBe("bt01");
    expect(after.battle.id).toBe("bt02");
    expect(after.question.id).toBe("q02");
    expect(before.task.id).toBe("b01");
    expect(after.task.id).toBe("b08"); // (1×7)%30 = 7
    expect(todayPicks(today, gaz.bored, msk(13 + 30)).battle.id).toBe("bt01"); // по кругу
    expect(todayPicks(today, gaz.bored, msk(13 + 5)).task.id).toBe("b06"); // (5×7)%30 = 5
  });
});

describe("серия и заморозка", () => {
  it("растёт на 1 в день; второе действие в тот же день серию не меняет", () => {
    let d = count(emptyToday(), 13);
    expect(d.streak).toBe(1);
    expect(countToday(d, msk(13, 20), today.ladder).counted).toBe(false);
    d = count(d, 14);
    d = count(d, 15);
    expect(d.streak).toBe(3);
    expect(d.best).toBe(3);
    expect(isDayCounted(d, msk(15))).toBe(true);
    expect(isDayCounted(d, msk(16))).toBe(false);
  });

  it("заморозка спасает ровно один пропуск; два пропуска подряд сжигают серию, рекорд остаётся", () => {
    let d = count(count(emptyToday(), 13), 14); // серия 2, последний день 14 (в среду 14 — в одну неделю с 13)
    // пропущен 15, вернулись 16: заморозка (недельная) тратится сама
    const back = settleToday(d, msk(16));
    expect(back.streak).toBe(2);
    expect(back.freezes).toBe(0);
    expect(back.notice).toEqual({ kind: "freeze", day: "2026-10-16" });
    d = count(d, 16);
    expect(d.streak).toBe(3);
    // пропущены 17 и 18 — серия сгорает
    const burnt = settleToday(d, msk(19));
    expect(burnt.streak).toBe(0);
    expect(burnt.best).toBe(3);
    expect(burnt.notice?.kind).toBe("restart");
    expect(count(burnt, 19).streak).toBe(1);
  });

  it("заморозка 1 в неделю, копится максимум до 2; повторный settle ничего не меняет", () => {
    let d = settleToday(emptyToday(), msk(13));
    expect(d.freezes).toBe(1);
    expect(settleToday(d, msk(14))).toEqual(d);
    d = settleToday(d, msk(19)); // новая неделя (понедельник 19.10)
    expect(d.freezes).toBe(2);
    d = settleToday(d, msk(26)); // ещё неделя: больше 2 не бывает
    expect(d.freezes).toBe(2);
  });

  it("без заморозки пропуск сжигает серию", () => {
    let d = count(emptyToday(), 13);
    d = { ...settleToday(d, msk(13)), freezes: 0 };
    expect(settleToday(d, msk(15)).streak).toBe(0);
  });
});

describe("награды за серию", () => {
  const streakTo = (n: number) => {
    let d = emptyToday();
    for (let i = 0; i < n; i++) d = count(d, 13 + i);
    return d;
  };

  it("на 3-й день карта «Разогрев», на 7-й карта «Неделя огня» и заморозка; Premium-ступени ничего не выдают", () => {
    expect(streakTo(2).cards).toEqual([]);
    const three = streakTo(3);
    expect(three.cards).toEqual([{ id: "streak-3", date: "2026-10-15", gold: false }]);
    const seven = streakTo(7);
    expect(seven.cards.map((c) => c.id)).toEqual(["streak-3", "streak-7"]);
    expect(seven.freezes).toBe(2); // недельная + за 7 дней
    // 30 и 100: только ступеньки на лесенке, карт и Premium нет
    let d: TodayData = { ...emptyToday(), streak: 29, lastDay: "2026-10-12", freezeWeek: -1 };
    d = countToday(d, msk(13), today.ladder).data;
    expect(d.streak).toBe(30);
    expect(d.cards).toEqual([]);
  });

  it("карта выдаётся один раз, даже если серию набрали заново", () => {
    let d = streakTo(3);
    d = { ...d, streak: 2 }; // как будто сгорела и дошла до 3 снова
    d = count(d, 16);
    expect(d.cards.filter((c) => c.id === "streak-3")).toHaveLength(1);
  });

  it("лесенка: ближайшая ступенька и полоса", () => {
    expect(nextStep(5, today.ladder)?.days).toBe(7);
    expect(nextStep(100, today.ladder)).toBeUndefined();
    expect(ladderProgress(0, today.ladder)).toBe(0);
    expect(ladderProgress(3, today.ladder)).toBeCloseTo(0.125);
    expect(ladderProgress(7, today.ladder)).toBeCloseTo(0.375);
    expect(ladderProgress(100, today.ladder)).toBeCloseTo(0.875);
    expect(ladderProgress(150, today.ladder)).toBe(1);
  });
});

describe("батл, дневник, хранение", () => {
  it("переголосовать нельзя", () => {
    const first = voteToday(emptyToday(), "a", msk(13));
    expect(voteToday(first, "b", msk(13, 23)).votes).toEqual({ "2026-10-13": "a" });
    expect(voteToday(first, "b", msk(14)).votes["2026-10-14"]).toBe("b"); // на следующий день — снова можно
  });

  it("ответ сохраняется в дневник; пустой и второй за день — нет", () => {
    expect(saveAnswer(emptyToday(), "Вопрос?", "   ", msk(13)).answers).toEqual([]);
    const d = saveAnswer(emptyToday(), "Вопрос?", "  как есть ", msk(13));
    expect(d.answers).toEqual([{ day: "2026-10-13", question: "Вопрос?", text: "как есть" }]);
    expect(saveAnswer(d, "Вопрос?", "другое", msk(13)).answers).toHaveLength(1);
  });

  it("всё переживает «перезагрузку» (хранилище)", () => {
    const kv = createMemoryKeyValueStore();
    createProgressStore(kv).updateToday((d) => saveAnswer(voteToday(count(d, 13), "b", msk(13)), "В?", "ответ", msk(13)));
    const d = createProgressStore(kv).getToday();
    expect(d.streak).toBe(1);
    expect(d.votes["2026-10-13"]).toBe("b");
    expect(d.answers[0]?.text).toBe("ответ");
  });

  it("неделя в батлах: выборы дней строкой, не голосовали — пусто", () => {
    // воскресенье 18.10; голоса в понедельник 12.10 (индекс -1 → батл №30) и в среду 14.10 (индекс 1 → батл №2)
    let d = voteToday(emptyToday(), "a", msk(12));
    d = voteToday(d, "b", msk(14));
    const row = weekChoices(d, today, msk(18), 7);
    expect(row).toHaveLength(7);
    expect(row[0]).toEqual({ emoji: "🌀", label: "Телепорт" });
    expect(row[1]).toBeUndefined();
    expect(row[2]).toEqual({ emoji: "💬", label: "Написать" });
  });

  it("склонение дней", () => {
    expect([1, 2, 5, 11, 12, 21, 22, 25, 111].map(pluralDays)).toEqual(["день", "дня", "дней", "дней", "дней", "день", "дня", "дней", "дней"]);
  });
});
