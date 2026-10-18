import { describe, expect, it } from "vitest";
import { gameSchema, type VerdictGame } from "@gazgame/content";
import normJson from "@gazgame/content/data/games/norm-or-cringe.json";
import {
  allVoted,
  cycleVerdict,
  deckAccess,
  nextVerdict,
  planVerdict,
  revealVerdicts,
  seededRandom,
  setVerdict,
  startVerdict,
  summarizeVerdicts,
  tallyVerdicts,
  type Verdict,
  type VerdictState,
} from "../src/index";

const parsed = gameSchema.parse({ ...normJson, related: [] });
if (parsed.mechanic !== "verdict") throw new Error("не verdict");
const game: VerdictGame = parsed;

const start = (players: string[], cards = 3): VerdictState => startVerdict({ players, deckId: "home" }, Array.from({ length: cards }, (_, i) => i));
/** Все игроки отвечают по списку и ответы открываются. */
const play = (s: VerdictState, answers: Verdict[]): VerdictState => {
  let t = s;
  answers.forEach((a, i) => (t = setVerdict(t, i, a)));
  return nextVerdict(revealVerdicts(t));
};

describe("«Норм или стрём 🤔»: контент", () => {
  it("игра в Тусовке и Романтике: 2–8 игроков, 10 минут, 10 ситуаций за игру", () => {
    expect(game.id).toBe("norm-or-cringe");
    expect(game.sections).toEqual(["company", "pairs"]);
    expect(game.players).toEqual({ min: 2, max: 8 });
    expect(game.durationMin).toBe(10);
    expect(game.ageRating).toBe("all");
    expect(game.emoji).toBe("🤔");
    expect(game.title).toBe("Норм или стрём");
    expect(game.description).toBe("Ситуация на экране, каждый решает: норм или стрём. Потом спорите");
    expect(game.questionsPerGame).toBe(10);
    expect(game.buttons).toEqual({ norm: "Норм 👍", cringe: "Стрём 👎" });
    expect(game.rules).toHaveLength(6);
  });

  it("колоды: Бытовое 30, Отношения 30, Дружба 30 — бесплатно, Без фильтра 20 — Premium под замком", () => {
    expect(game.decks.map((d) => [d.id, d.cards.length, d.tier])).toEqual([
      ["home", 30, "free"],
      ["love", 30, "free"],
      ["friends", 30, "free"],
      ["no-filter", 20, "premium"],
    ]);
    expect(game.decks.map((d) => `${d.emoji} ${d.title}`)).toEqual(["🙂 Бытовое", "💞 Отношения", "👯 Дружба", "💎 Без фильтра"]);
    const hard = game.decks[3]!;
    expect(hard.locked?.text).toBe("По подписке 💎");
    expect(deckAccess(hard, { userTier: "free" }).open).toBe(false);
    expect(deckAccess(hard, { userTier: "premium" }).open).toBe(true);
    expect(game.decks[0]?.upsellText).toBe("Слишком мирно? Без фильтра 💎");
  });

  it("ситуации — короткие, в инфинитиве, без повторов; первая и последняя совпадают со спекой", () => {
    for (const d of game.decks) {
      const texts = d.cards.map((c) => c.text);
      expect(new Set(texts).size, d.id).toBe(texts.length);
      for (const x of texts) expect(x.length, x).toBeLessThan(80);
    }
    expect(game.decks[0]?.cards[0]?.text).toBe("Отвечать на голосовое текстом");
    expect(game.decks[1]?.cards[29]?.text).toBe("Оставаться друзьями после расставания");
    expect(game.decks[3]?.cards[19]?.text).toBe("Рассказывать друзьям подробности ссор с партнёром");
  });
});

describe("«Норм или стрём 🤔»: ход игры", () => {
  it("10 ситуаций за раунд без повторов; «Сыграть ещё» не повторяет, пока колода не кончится", () => {
    const first = planVerdict(30, 10, [], seededRandom(1));
    expect(new Set(first.cards).size).toBe(10);
    const second = planVerdict(30, 10, first.used, seededRandom(2));
    expect(second.cards.filter((c) => first.cards.includes(c))).toEqual([]);
  });

  it("вскрыть можно, только когда ответили все; после вскрытия ответ не меняется", () => {
    let s = start(["Аня", "Боря", "Вика"]);
    s = setVerdict(s, 0, "norm");
    s = setVerdict(s, 1, "cringe");
    expect(allVoted(s)).toBe(false);
    expect(revealVerdicts(s).phase).toBe("vote");
    s = setVerdict(s, 2, "norm");
    s = revealVerdicts(s);
    expect(s.phase).toBe("reveal");
    expect(setVerdict(s, 0, "cringe").votes[0]).toBe("norm");
  });

  it("тап по чипу: норм → стрём → снять", () => {
    expect(cycleVerdict(null)).toBe("norm");
    expect(cycleVerdict("norm")).toBe("cringe");
    expect(cycleVerdict("cringe")).toBeNull();
  });

  it("«Дальше →» ведёт к следующей ситуации, после последней — итог", () => {
    let s = start(["А", "Б"], 2);
    s = play(s, ["norm", "norm"]);
    expect([s.phase, s.index, s.votes]).toEqual(["vote", 1, [null, null]]);
    s = play(s, ["norm", "cringe"]);
    expect(s.phase).toBe("final");
    expect(s.history).toEqual([["norm", "norm"], ["norm", "cringe"]]);
  });

  it("плашки: единогласно, спорная (меньшинство не меньше трети), посередине — без плашки", () => {
    expect(tallyVerdicts(["norm", "norm", "norm"])).toMatchObject({ norm: 3, cringe: 0, unanimous: true, contested: false });
    expect(tallyVerdicts(["norm", "cringe", "norm"])).toMatchObject({ unanimous: false, contested: true }); // 1 из 3
    expect(tallyVerdicts(["norm", "norm", "norm", "cringe"])).toMatchObject({ unanimous: false, contested: false }); // 1 из 4 — меньше трети
    expect(tallyVerdicts(["norm", "cringe"])).toMatchObject({ contested: true });
  });
});

describe("«Норм или стрём 🤔»: итог", () => {
  it("процент совпадений, строже всех, добрее всех, где разошлись", () => {
    const history: Verdict[][] = [
      ["norm", "norm", "norm"],
      ["cringe", "cringe", "cringe"],
      ["cringe", "norm", "cringe"],
      ["cringe", "norm", "norm"],
    ];
    const sum = summarizeVerdicts(history, 3);
    expect(sum.percent).toBe(50);
    expect(sum.diverged).toEqual([2, 3]);
    expect([sum.strictest, sum.strictCount]).toEqual([0, 3]);
    expect([sum.kindest, sum.kindCount]).toEqual([1, 3]);
  });

  it("ничья в званиях — первый по порядку; «добрее всех» не совпадает со «строже всех», если есть другой", () => {
    const sum = summarizeVerdicts(
      [
        ["norm", "cringe"],
        ["cringe", "norm"],
      ],
      2,
    );
    expect([sum.strictest, sum.kindest]).toEqual([0, 1]);
    const all = summarizeVerdicts([["norm", "norm"]], 2);
    expect([all.percent, all.strictCount, all.kindCount]).toEqual([100, 0, 1]);
  });
});
