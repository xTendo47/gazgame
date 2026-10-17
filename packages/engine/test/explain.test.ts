import { describe, expect, it } from "vitest";
import { gameSchema } from "@gazgame/content";
import explainJson from "@gazgame/content/data/games/explain.json";
import {
  answerWord,
  beginTurn,
  chooseLastWinner,
  defaultExplainSettings,
  drawWord,
  endExplain,
  explainDeck,
  finishRound,
  modeAllowed,
  randomTeamName,
  rematchExplain,
  roundEndsGame,
  roundPoints,
  scoresAfterRound,
  seededRandom,
  startExplain,
  timeUp,
  toggleWord,
  type ExplainSettings,
  type ExplainState,
} from "../src/index";

const parsed = gameSchema.parse({ ...explainJson, related: [] });
if (parsed.mechanic !== "explain") throw new Error("в explain.json не «Объясни»");
const game = parsed;
const easy = game.levels[0]?.words ?? [];
const settings = (patch: Partial<ExplainSettings> = {}): ExplainSettings => ({ ...defaultExplainSettings("easy", game.teamNames), ...patch });

/** Раунд: ходит текущая команда, answers — серия свайпов (true — вправо), потом время вышло и последнее слово. */
function play(state: ExplainState, answers: boolean[], last: number | null, random = seededRandom(1)): ExplainState {
  let s = beginTurn(state, easy, random);
  for (const ok of answers) s = answerWord(s, ok, easy, random);
  s = timeUp(s);
  return chooseLastWinner(s, last);
}

describe("слова без повторов", () => {
  it("120 слов Лёгкого выпадают по одному разу, потом колода идёт по кругу", () => {
    const random = seededRandom(5);
    let used: string[] = [];
    const seen: string[] = [];
    for (let i = 0; i < easy.length; i++) {
      const d = drawWord(easy, used, random);
      seen.push(d.word);
      used = d.used;
    }
    expect(new Set(seen).size).toBe(easy.length);
    const next = drawWord(easy, used, random);
    expect(next.used).toEqual([next.word]);
    expect(next.word).not.toBe(seen.at(-1));
  });

  it("использованные слова приходят снаружи (с устройства) и пропускаются", () => {
    const used = easy.slice(0, 118);
    const d = drawWord(easy, used, seededRandom(2));
    expect(easy.slice(118)).toContain(d.word);
  });

  it("в игре слова не повторяются и копятся в used (его сохраняет устройство)", () => {
    const random = seededRandom(9);
    let s = beginTurn(startExplain(settings()), easy, random);
    const shown = [s.word];
    for (let i = 0; i < 40; i++) {
      s = answerWord(s, i % 2 === 0, easy, random);
      shown.push(s.word);
    }
    expect(new Set(shown).size).toBe(shown.length);
    expect(s.used).toEqual(shown);
  });
});

describe("режим «Жестами»: своя колода, на Тяжёлом недоступен", () => {
  const [easyLevel, midLevel, hardLevel] = game.levels;

  it("«Словами» — все слова уровня, «Жестами» — колода gestures", () => {
    expect(explainDeck(easyLevel!, "words")).toHaveLength(391);
    expect(explainDeck(easyLevel!, "gestures")).toHaveLength(391);
    expect(explainDeck(midLevel!, "words")).toHaveLength(377);
    expect(explainDeck(midLevel!, "gestures")).toHaveLength(135);
  });

  it("Тяжёлый 💎 жестами не играется: колоды нет, режим недоступен; словами можно", () => {
    expect(hardLevel?.tier).toBe("premium");
    expect(explainDeck(hardLevel!, "gestures")).toEqual([]);
    expect(modeAllowed(hardLevel!, "gestures")).toBe(false);
    expect(modeAllowed(hardLevel!, "words")).toBe(true);
    expect(modeAllowed(easyLevel!, "gestures")).toBe(true);
    expect(modeAllowed(midLevel!, "gestures")).toBe(true);
  });

  it("игра жестами берёт слова только из колоды «Жестами» и без повторов", () => {
    const deck = explainDeck(midLevel!, "gestures");
    const random = seededRandom(4);
    let s = beginTurn(startExplain(settings({ mode: "gestures", levelId: "mid" })), deck, random);
    const shown = [s.word];
    for (let i = 0; i < 60; i++) {
      s = answerWord(s, true, deck, random);
      shown.push(s.word);
    }
    expect(new Set(shown).size).toBe(shown.length);
    for (const w of shown) expect(deck).toContain(w);
  });
});

describe("команды и очки", () => {
  it("🎲 даёт имя из списка, которого ещё нет у команд", () => {
    for (let i = 0; i < 30; i++) {
      const name = randomTeamName(game.teamNames, ["Газ", "Тормоза"], seededRandom(i));
      expect(game.teamNames).toContain(name);
      expect(["Газ", "Тормоза"]).not.toContain(name);
    }
  });

  it("свайпы: +1 за угаданное, −1 за пропуск при штрафе", () => {
    const s = play(startExplain(settings()), [true, true, false, true, false, false, true], null);
    expect(s.round.filter((w) => w.ok)).toHaveLength(4);
    expect(roundPoints(s)).toBe(4 - 3);
  });

  it("штраф выключен: пропуск не отнимает очко", () => {
    const s = play(startExplain(settings({ penalty: false })), [true, true, false, false, false], null);
    expect(roundPoints(s)).toBe(2);
    expect(scoresAfterRound(s)).toEqual([2, 0]);
  });

  it("счёт команды не уходит ниже 0", () => {
    const s = play(startExplain(settings()), [false, false, false], null);
    expect(roundPoints(s)).toBe(-3);
    expect(scoresAfterRound(s)).toEqual([0, 0]);
    // у команды 2 очка, в раунде −3: тоже 0, а не −1
    const hurt = play({ ...startExplain(settings()), scores: [2, 5] }, [false, false, false], null);
    expect(scoresAfterRound(hurt)).toEqual([0, 5]);
  });
});

describe("последнее слово", () => {
  it("очко уходит выбранной команде, любой, а не только ходившей", () => {
    const base = startExplain(settings());
    expect(scoresAfterRound(play(base, [true], 1))).toEqual([1, 1]); // угадала соперница
    expect(scoresAfterRound(play(base, [true], 0))).toEqual([2, 0]); // угадала своя
    expect(scoresAfterRound(play(base, [true], null))).toEqual([1, 0]); // никто
  });

  it("последнее слово не входит в список раунда, и очко ему приходит при любой отметке", () => {
    const s = play(startExplain(settings()), [true, false], 1);
    expect(s.round).toHaveLength(2);
    expect(finishRound(s).scores).toEqual([0, 1]); // +1 −1 = 0 у ходившей, +1 у выбранной
  });

  it("фаза «last» принимает выбор только после звонка", () => {
    const playing = beginTurn(startExplain(settings()), easy);
    expect(chooseLastWinner(playing, 0)).toBe(playing);
    expect(timeUp(playing).phase).toBe("last");
  });
});

describe("итог раунда: исправление тапом", () => {
  it("тап по слову меняет отметку, счёт пересчитывается сразу", () => {
    let s = play(startExplain(settings()), [true, true, false], null);
    expect(scoresAfterRound(s)).toEqual([1, 0]); // 2 − 1
    s = toggleWord(s, 2); // пропуск оказался «угадали»
    expect(roundPoints(s)).toBe(3);
    expect(scoresAfterRound(s)).toEqual([3, 0]);
    s = toggleWord(s, 0); // угадали → пропуск
    expect(scoresAfterRound(s)).toEqual([1, 0]); // 2 угадано, 1 пропуск
    expect(toggleWord(s, 99)).toBe(s);
  });
});

describe("победа и круги", () => {
  it("победа проверяется только после полного круга: первой сходила команда, набравшая цель, — игра идёт дальше", () => {
    const s0 = startExplain(settings({ goal: 30 }));
    const first = { ...play(s0, [true], null), scores: [29, 0] }; // 29 + 1 = 30
    const afterFirst = finishRound(first);
    expect(afterFirst.phase).toBe("turn");
    expect(afterFirst.cur).toBe(1);
    expect(afterFirst.scores).toEqual([30, 0]);
    // ходит вторая и не добирает → круг полный, у первой 30 и она впереди
    const second = finishRound(play(afterFirst, [true], null));
    expect(second.phase).toBe("win");
    expect(second.winner).toBe(0);
  });

  it("ничья на вершине → «Ничья! Ещё круг», ходит первая команда", () => {
    const s0 = startExplain(settings({ goal: 30 }));
    const afterFirst = finishRound({ ...play(s0, [true], null), scores: [29, 0] }); // 30:0
    const second = { ...play(afterFirst, [true], null), scores: [30, 29] }; // 29 + 1 = 30
    expect(roundEndsGame(second)).toBe(false);
    const tied = finishRound(second);
    expect(tied.scores).toEqual([30, 30]);
    expect(tied.phase).toBe("turn");
    expect(tied.tie).toBe(true);
    expect(tied.cur).toBe(0);
    // ещё круг: первая команда пропускает, вторая нет — вторая впереди и побеждает
    const nextFirst = finishRound({ ...play(tied, [false], null), scores: [30, 30] });
    expect(nextFirst.tie).toBe(false);
    const nextSecond = finishRound(play(nextFirst, [true, true], null));
    expect(nextSecond.phase).toBe("win");
    expect(nextSecond.winner).toBe(1);
  });

  it("полная игра: 2 команды до 30 — идёт по кругам и кончается победой того, кто впереди", () => {
    let s = startExplain(settings({ goal: 30 }));
    const random = seededRandom(42);
    let guard = 0;
    while (s.phase !== "win" && guard++ < 100) {
      // команда 0 угадывает по 10, команда 1 по 7 за раунд (с двумя пропусками)
      const answers = s.cur === 0 ? Array(10).fill(true) : [...Array(7).fill(true), false, false];
      s = finishRound(play(s, answers, null, random));
    }
    expect(s.phase).toBe("win");
    expect(s.winner).toBe(0);
    // команда 0: 10 · 3 раунда = 30; команда 1: (7 − 2) · 3 = 15 — победа сразу после третьего круга
    expect(s.scores).toEqual([30, 15]);
    expect(s.rounds).toBe(6);
    // реванш: те же настройки, счёт 0, слова продолжают колоду
    const again = rematchExplain(s);
    expect(again.scores).toEqual([0, 0]);
    expect(again.settings).toEqual(s.settings);
    expect(again.used).toEqual(s.used);
    expect(again.phase).toBe("turn");
  });

  it("без лимита: победы нет, пока не нажали «Закончить» после полного круга; ничья — ещё круг", () => {
    let s = startExplain(settings({ goal: 0 }));
    s = finishRound({ ...play(s, [true, true], null) });
    expect(s.phase).toBe("turn");
    expect(endExplain(s)).toBe(s); // круг ещё не полный (ходит вторая)
    s = finishRound(play(s, [true, true], null));
    expect(s.cur).toBe(0);
    const tie = endExplain(s);
    expect(tie.tie).toBe(true); // 2:2
    expect(tie.phase).toBe("turn");
    s = finishRound(play(tie, [true], null));
    s = finishRound(play(s, [true, false], null));
    const done = endExplain(s);
    expect(done.phase).toBe("win");
    expect(done.winner).toBe(0);
  });

  it("2–4 команды: круг заканчивает последняя", () => {
    let s = startExplain(settings({ teams: ["А", "Б", "В", "Г"], goal: 30 }));
    const order: number[] = [];
    for (let i = 0; i < 4; i++) {
      order.push(s.cur);
      s = finishRound(play(s, [true], null));
    }
    expect(order).toEqual([0, 1, 2, 3]);
    expect(s.cur).toBe(0);
    expect(s.rounds).toBe(4);
  });
});
