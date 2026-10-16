import { describe, expect, it } from "vitest";
import { gazFileSchema } from "@gazgame/content";
import gazJson from "@gazgame/content/data/gaz.json";
import {
  activeCard,
  challengeOutcome,
  createMemoryKeyValueStore,
  createProgressStore,
  dailyBored,
  emptyGaz,
  finishCard,
  findGazTask,
  GAZ_SPINS,
  isTodayMarked,
  markedDays,
  markToday,
  mskDay,
  mskWeekday,
  mskWeekNumber,
  pickBored,
  pickRoulette,
  seededRandom,
  showRoulette,
  spinsLeft,
  takeCard,
  weeklyChallenge,
  type GazChips,
} from "../src/index";

const gaz = gazFileSchema.parse(gazJson);
// 12 октября 2026 — понедельник
const mon = (hour: number, minute = 0) => new Date(Date.UTC(2026, 9, 12, hour, minute));

describe("время по Москве", () => {
  it("день меняется ровно в 00:00 МСК (21:00 UTC)", () => {
    expect(mskDay(new Date("2026-10-12T20:59:59Z"))).toBe("2026-10-12");
    expect(mskDay(new Date("2026-10-12T21:00:00Z"))).toBe("2026-10-13");
  });

  it("неделя начинается с понедельника 00:00 МСК", () => {
    expect(mskWeekday(new Date("2026-10-11T20:59:00Z"))).toBe(7); // воскресенье 23:59 МСК
    expect(mskWeekday(new Date("2026-10-11T21:00:00Z"))).toBe(1); // понедельник 00:00 МСК
    expect(mskWeekNumber(new Date("2026-10-11T21:00:00Z"))).toBe(mskWeekNumber(new Date("2026-10-18T20:59:00Z")));
    expect(mskWeekNumber(new Date("2026-10-18T21:00:00Z"))).toBe(mskWeekNumber(new Date("2026-10-11T21:00:00Z")) + 1);
  });
});

describe("«Мне скучно»: без повторов до конца колоды", () => {
  it("за 30 тапов показаны все 30 заданий по одному разу, на 31-м круг начинается заново", () => {
    const random = seededRandom(7);
    let shown: string[] = [];
    const seen: string[] = [];
    for (let i = 0; i < 30; i++) {
      const r = pickBored(gaz.bored, shown, random);
      seen.push(r.task.id);
      shown = r.shown;
    }
    expect(new Set(seen).size).toBe(30);
    const next = pickBored(gaz.bored, shown, random);
    expect(next.shown).toEqual([next.task.id]);
    expect(next.task.id).not.toBe(seen.at(-1));
  });
});

describe("Газ-рулетка", () => {
  const combos: GazChips[] = (["solo", "duo", "crew"] as const).flatMap((who) =>
    (["15", "eve", "wk"] as const).flatMap((time) => (["home", "out"] as const).map((where) => ({ who, time, where }))),
  );

  it("в контенте 18 сочетаний по 3 задания", () => {
    expect(gaz.roulette).toHaveLength(54);
    for (const c of combos) {
      expect(gaz.roulette.filter((t) => t.who === c.who && t.time === c.time && t.where === c.where)).toHaveLength(3);
    }
  });

  it("подбирает точное сочетание кто + время + где, без повтора подряд, пока есть непоказанные", () => {
    const random = seededRandom(3);
    for (const chips of combos) {
      let shown: string[] = [];
      const seen: string[] = [];
      for (let i = 0; i < 7; i++) {
        const r = pickRoulette(gaz.roulette, chips, shown, random);
        expect(r).not.toBeNull();
        expect([r?.task.who, r?.task.time, r?.task.where]).toEqual([chips.who, chips.time, chips.where]);
        if (i > 0) expect(r?.task.id).not.toBe(seen.at(-1));
        if (i < 3) expect(seen).not.toContain(r?.task.id);
        seen.push(r?.task.id ?? "");
        shown = r?.shown ?? [];
      }
      expect(new Set(seen.slice(0, 3)).size).toBe(3);
    }
  });

  it("гаснет после 3 прокруток; после «Сделано» снова 3; на новый день снова 3", () => {
    const chips: GazChips = { who: "duo", time: "eve", where: "home" };
    let data = emptyGaz();
    expect(spinsLeft(data, mon(10))).toBe(GAZ_SPINS);
    for (let i = 1; i <= 3; i++) {
      const r = pickRoulette(gaz.roulette, chips, data.shownRoulette, seededRandom(i));
      if (!r) throw new Error("нет задания");
      data = showRoulette(data, r.task, r.shown, chips, mon(10));
      expect(spinsLeft(data, mon(10))).toBe(3 - i);
    }
    expect(spinsLeft(data, mon(10))).toBe(0);
    expect(spinsLeft(data, mon(20, 59))).toBe(0); // 23:59 МСК
    expect(spinsLeft(data, mon(21))).toBe(3); // 00:00 МСК
    const id = data.table?.id ?? "";
    expect(spinsLeft(finishCard(takeCard(data, { id, source: "roulette" }, mon(11)), id, false, mon(12)), mon(12))).toBe(3);
  });
});

describe("«в процессе» и сделанные", () => {
  it("взятое задание живёт до 00:00 МСК, переживает перезагрузку (хранилище) и тихо исчезает", () => {
    const kv = createMemoryKeyValueStore();
    createProgressStore(kv).updateGaz((d) => takeCard(d, { id: "b01", source: "bored" }, mon(10)));
    // «перезагрузка»: новый ProgressStore поверх того же хранилища
    const data = createProgressStore(kv).getGaz();
    expect(activeCard(data, mon(20, 59))?.id).toBe("b01");
    expect(activeCard(data, mon(21))).toBeUndefined();
  });

  it("«Сделано» сохраняет id, дату (МСК) и золотая или нет", () => {
    let data = takeCard(emptyGaz(), { id: "s-15-h-1", source: "roulette" }, mon(10));
    data = finishCard(data, "s-15-h-1", true, mon(20, 30));
    data = finishCard(data, "b01", false, mon(21, 30));
    expect(data.done).toEqual([
      { id: "s-15-h-1", date: "2026-10-12", gold: true },
      { id: "b01", date: "2026-10-13", gold: false },
    ]);
    expect(data.active).toBeUndefined();
  });
});

describe("челлендж недели", () => {
  it("один на всех по номеру недели, по кругу из 8", () => {
    expect(gaz.challenges).toHaveLength(8);
    const a = weeklyChallenge(gaz.challenges, mon(10));
    const next = weeklyChallenge(gaz.challenges, new Date(mon(10).getTime() + 7 * 86_400_000));
    expect(a?.id).not.toBe(next?.id);
    const later = weeklyChallenge(gaz.challenges, new Date(mon(10).getTime() + 8 * 7 * 86_400_000));
    expect(later?.id).toBe(a?.id);
  });

  it("отмечается только сегодняшний день, один раз", () => {
    let data = markToday(emptyGaz(), mon(10)); // понедельник
    expect(markedDays(data, mon(10))).toEqual([1]);
    expect(isTodayMarked(data, mon(10))).toBe(true);
    data = markToday(data, mon(11));
    expect(markedDays(data, mon(11))).toEqual([1]);
    const wed = new Date(mon(10).getTime() + 2 * 86_400_000);
    data = markToday(data, wed);
    expect(markedDays(data, wed)).toEqual([1, 3]); // вторник пропущен и уже не отмечается
    const nextMon = new Date(mon(10).getTime() + 7 * 86_400_000);
    expect(markedDays(data, nextMon)).toEqual([]);
  });

  it("5–6 отметок — карта, 7 — золотая", () => {
    expect([4, 5, 6, 7].map(challengeOutcome)).toEqual(["none", "card", "card", "gold"]);
  });
});

describe("задание дня и поиск по id", () => {
  it("индекс (i×7)%30 обходит всю колоду из 30", () => {
    expect(gaz.bored).toHaveLength(30);
    const ids = Array.from({ length: 30 }, (_, i) => dailyBored(gaz.bored, i)?.id);
    expect(new Set(ids).size).toBe(30);
    expect(dailyBored(gaz.bored, 1)?.id).toBe("b08");
  });

  it("находит задание из колоды и из рулетки (для «Вызова»)", () => {
    expect(findGazTask(gaz, "b05")?.text).toContain("Вспомнилось, как мы");
    expect(findGazTask(gaz, "d-e-h-3")?.emoji).toBe("🫂");
    expect(findGazTask(gaz, "нет-такого")).toBeUndefined();
  });
});
