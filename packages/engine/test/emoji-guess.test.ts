import { describe, expect, it } from "vitest";
import { gameSchema, type RebusGame } from "@gazgame/content";
import emojiJson from "@gazgame/content/data/games/emoji-guess.json";
import explainJson from "@gazgame/content/data/games/explain.json";
import {
  askRebusHint,
  deckAccess,
  firstLetter,
  hintParts,
  planRebus,
  rebusPoints,
  resolveRebus,
  revealRebusAnswer,
  seededRandom,
  startRebus,
  type RebusSettings,
  type RebusState,
} from "../src/index";

const parsed = gameSchema.parse({ ...emojiJson, related: [] });
if (parsed.mechanic !== "rebus") throw new Error("не rebus");
const game: RebusGame = parsed;

const settings = (over: Partial<RebusSettings> = {}): RebusSettings => ({ deckId: "films", teams: false, teamNames: ["Газ", "Тормоза"], goal: 10, timer: false, ...over });
const fresh = (over: Partial<RebusSettings> = {}, size = 12) => {
  const s = settings(over);
  return startRebus(s, planRebus(60, size, s.teams, [], seededRandom(2)).cards);
};

describe("«Угадай по эмодзи 🧩»: контент", () => {
  it("игра в Тусовке: 2–20 игроков, 15 минут, ребусы с эмодзи, раунд 12, таймер 30 секунд", () => {
    expect(game.id).toBe("emoji-guess");
    expect(game.sections).toEqual(["company"]);
    expect(game.players).toEqual({ min: 2, max: 20 });
    expect(game.durationMin).toBe(15);
    expect(game.title).toBe("Угадай по эмодзи");
    expect(game.description).toBe("Фильмы, сказки и мемы, зашифрованные смайликами");
    expect(game.emoji).toBe("🧩");
    expect(game.roundSize).toBe(12);
    expect(game.timerSec).toBe(30);
    expect(game.goals).toEqual([10, 20, 30]);
    expect(game.goalDefault).toBe(20);
  });

  it("255 ребусов: Фильмы 60, Сказки и книги 65, Пословицы 50, Мемы 40 (бесплатно), Хардкор 💎 40 (Premium под замком)", () => {
    expect(game.decks.map((d) => [d.id, d.cards.length, d.tier])).toEqual([
      ["films", 60, "free"],
      ["tales", 65, "free"],
      ["phrases", 50, "free"],
      ["memes", 40, "free"],
      ["hardcore", 40, "premium"],
    ]);
    expect(game.decks.reduce((n, d) => n + d.cards.length, 0)).toBe(255);
    expect(game.decks.map((d) => `${d.emoji} ${d.title}`)).toEqual(["🎬 Фильмы и мультики", "📚 Сказки и книги", "🗣️ Пословицы и фразы", "📱 Мемы и интернет", "💎 Хардкор"]);
    const hard = game.decks[4]!;
    expect(hard.locked?.reason).toBe("subscription");
    expect(deckAccess(hard, { userTier: "free" }).open).toBe(false);
    expect(deckAccess(hard, { userTier: "premium" }).open).toBe(true);
    expect(deckAccess(game.decks[0]!, { userTier: "free" }).open).toBe(true);
    expect(game.decks[0]?.upsellText).toBe("Слишком легко? В Хардкоре ребусы, над которыми думают всей компанией 💎");
  });

  it("у каждого ребуса есть эмодзи, ответ и намёк; ребусы и ответы не повторяются", () => {
    for (const d of game.decks) {
      for (const c of d.cards) {
        expect(c.text, `${d.id}: ${c.answer}`).toMatch(/\p{Extended_Pictographic}|\p{Emoji}/u);
        expect(c.answer, c.text).toBeTruthy();
        expect(c.hint, c.text).toBeTruthy();
      }
      const rebuses = d.cards.map((c) => c.text);
      const answers = d.cards.map((c) => c.answer);
      expect(new Set(rebuses).size, d.id).toBe(rebuses.length);
      expect(new Set(answers).size, d.id).toBe(answers.length);
    }
    expect(game.decks[0]?.cards[0]).toMatchObject({ text: "🦁👑", answer: "Король Лев", hint: "Мультфильм Disney, «Акуна матата»" });
    expect(game.decks[4]?.cards[39]).toMatchObject({ answer: "Хорошая мина при плохой игре", hint: "Делать вид, что всё хорошо" });
  });

  it("кнопки, правила и финалы — из спеки; имена команд те же, что в «Объясни»", () => {
    expect(game.buttons).toEqual({ hint: "Подсказка 💡", answer: "Ответ 👀", pass: "Пас", guessed: "Угадали ✅" });
    expect(game.rules).toHaveLength(6);
    expect(game.rules[2]).toBe("Застряли? «Подсказка 💡» покажет тему, первую букву и намёк.");
    expect(game.finale.title).toBe("Сколько угадали?");
    expect(game.finale.again).toBe("Ещё 12");
    expect(game.finale.otherDeck).toBe("Другая колода");
    expect(game.finale.flexText).toBe("Мы угадали {guessed} из {total} в «Угадай по эмодзи» 🧩 Сможете лучше?");
    expect(game.win.title).toBe("Победа: {team} 👑");
    expect(game.win.rematch).toBe("Реванш 🔥");
    expect(game.texts.timer).toBe("Таймер 30 секунд");
    expect(game.teamNames).toEqual(explainJson.teamNames);
    expect(game.teamNames.slice(0, 2)).toEqual(["Газ", "Тормоза"]);
  });
});

describe("«Угадай по эмодзи 🧩»: подсказка", () => {
  it("первая буква ответа: с буквы, с цифры и после знаков", () => {
    expect(firstLetter("Король Лев")).toBe("К");
    expect(firstLetter("ВАЛЛ-И")).toBe("В");
    expect(firstLetter("101 далматинец")).toBe("1");
    expect(firstLetter("«Ну, погоди!»")).toBe("Н");
    expect(firstLetter("ёжик")).toBe("Ё");
  });

  it("подсказка = название колоды + первая буква + намёк", () => {
    const deck = game.decks[0]!;
    expect(hintParts(deck, deck.cards[0]!)).toEqual({ theme: "Фильмы и мультики", letter: "К", hint: "Мультфильм Disney, «Акуна матата»" });
    expect(game.texts.hintTheme.replace("{deck}", "Фильмы и мультики")).toBe("Тема: Фильмы и мультики");
  });
});

describe("«Угадай по эмодзи 🧩»: ход игры", () => {
  it("раунд без повторов, колода перемешана; «Ещё 12» не повторяет карточки", () => {
    const first = planRebus(60, 12, false, [], seededRandom(1));
    expect(first.cards).toHaveLength(12);
    expect(new Set(first.cards).size).toBe(12);
    expect(first.cards).not.toEqual([...first.cards].sort((a, b) => a - b)); // перемешано
    const second = planRebus(60, 12, false, first.used, seededRandom(2));
    expect(second.cards.filter((c) => first.cards.includes(c))).toEqual([]);
    // с командами играют по всей колоде
    expect(planRebus(60, 12, true, [], seededRandom(1)).cards).toHaveLength(60);
  });

  it("без команд: 12 карточек, считаем «угадали» и «пас», в конце финал «N из 12»", () => {
    let s = fresh();
    for (let i = 0; i < 12; i++) {
      expect(s.phase, `карточка ${i + 1}`).toBe("card");
      s = resolveRebus(s, i % 3 !== 0); // пас у 0, 3, 6, 9
    }
    expect(s.phase).toBe("final");
    expect([s.guessed, s.passed]).toEqual([8, 4]);
    expect(resolveRebus(s, true)).toBe(s); // после финала ничего не меняется
  });

  it("«Подсказка» и «Ответ» живут на одной карточке и сбрасываются на следующей", () => {
    let s = fresh();
    s = askRebusHint(s);
    s = revealRebusAnswer(s);
    expect([s.hint, s.revealed]).toEqual([true, true]);
    s = resolveRebus(s, false);
    expect([s.hint, s.revealed, s.index]).toEqual([false, false, 1]);
  });

  it("команды: без подсказки +2, с подсказкой +1, пас 0; ход переходит после каждой карточки", () => {
    expect(rebusPoints(false)).toBe(2);
    expect(rebusPoints(true)).toBe(1);
    let s = fresh({ teams: true, goal: 20 }, 60);
    expect(s.team).toBe(0);
    s = resolveRebus(s, true); // Газ: +2
    expect([s.scores, s.team]).toEqual([[2, 0], 1]);
    s = resolveRebus(askRebusHint(s), true); // Тормоза с подсказкой: +1
    expect([s.scores, s.team]).toEqual([[2, 1], 0]);
    s = resolveRebus(s, false); // Газ пас: 0
    expect([s.scores, s.team]).toEqual([[2, 1], 1]);
  });

  it("победа — только после полного круга, когда у кого-то цель и счёт не равный", () => {
    let s = fresh({ teams: true, goal: 4 }, 60);
    s = resolveRebus(s, true); // Газ 2
    s = resolveRebus(s, false); // Тормоза 0 — круг: 2:0, цели нет
    s = resolveRebus(s, true); // Газ 4 — цель, но круг не закончен
    expect(s.phase).toBe("card");
    s = resolveRebus(s, false); // Тормоза 0 — круг закончен: 4:0
    expect([s.phase, s.winner]).toEqual(["win", 0]);
  });

  it("ничья на цели — играем ещё круг", () => {
    let s = fresh({ teams: true, goal: 2 }, 60);
    s = resolveRebus(s, true); // Газ 2
    s = resolveRebus(s, true); // Тормоза 2 — круг, цель есть, но поровну
    expect(s.phase).toBe("card");
    s = resolveRebus(s, true); // Газ 4
    s = resolveRebus(s, false); // Тормоза 2 — круг: победил Газ
    expect([s.phase, s.winner, s.scores]).toEqual(["win", 0, [4, 2]]);
  });

  it("карточки кончились раньше цели: побеждает лидер, при равенстве — ничья", () => {
    let s: RebusState = startRebus(settings({ teams: true, goal: 30 }), [0, 1, 2, 3]);
    s = resolveRebus(s, true);
    s = resolveRebus(s, false);
    s = resolveRebus(s, false);
    s = resolveRebus(s, true);
    expect([s.phase, s.winner, s.scores]).toEqual(["win", null, [2, 2]]);
    let t: RebusState = startRebus(settings({ teams: true, goal: 30 }), [0, 1, 2, 3]);
    t = resolveRebus(t, true);
    t = resolveRebus(t, false);
    t = resolveRebus(t, true);
    t = resolveRebus(t, false);
    expect([t.phase, t.winner]).toEqual(["win", 0]);
  });
});
