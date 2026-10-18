import { describe, expect, it } from "vitest";
import { gameSchema, type TimerDeckGame } from "@gazgame/content";
import fiveJson from "@gazgame/content/data/games/five-seconds.json";
import {
  answerCard,
  beginCard,
  deckAccess,
  joinNames,
  planTimerDeck,
  playerNames,
  roundCardCount,
  seededRandom,
  standings,
  startTimerDeck,
  type TimerDeckSettings,
  type TimerDeckState,
} from "../src/index";

const parsed = gameSchema.parse({ ...fiveJson, related: [] });
if (parsed.mechanic !== "timer-deck") throw new Error("не timer-deck");
const game: TimerDeckGame = parsed;

const settings = (over: Partial<TimerDeckSettings> = {}): TimerDeckSettings => ({ players: ["Аня", "Боря", "Витя"], perPlayer: 2, deckId: "warmup", chain: false, ...over });
const fresh = (over: Partial<TimerDeckSettings> = {}) => {
  const s = settings(over);
  return startTimerDeck(s, planTimerDeck(80, s, [], seededRandom(1)).cards);
};
/** Ход целиком: «Старт» и ответ. */
const play = (s: TimerDeckState, ok: boolean) => answerCard(beginCard(s), ok);

describe("«5 секунд ⏱️»: контент", () => {
  it("игра в Тусовке: 2–10 игроков, 15 минут, таймер 5 секунд, карт на игрока 3 / 5 / 7 (по умолчанию 5), «Цепочка» выкл", () => {
    expect(game.id).toBe("five-seconds");
    expect(game.sections).toEqual(["company"]);
    expect(game.players).toEqual({ min: 2, max: 10 });
    expect(game.durationMin).toBe(15);
    expect(game.timerSec).toBe(5);
    expect(game.cardsPerPlayer).toEqual([3, 5, 7]);
    expect(game.cardsPerPlayerDefault).toBe(5);
    expect(game.chainRuleDefault).toBe(false);
    expect(game.emoji).toBe("⏱️");
    expect(game.title).toBe("5 секунд");
  });

  it("колоды: Разминка 80 и Мозговой штурм 80 бесплатно, Без тормозов 💎 50 — Premium под замком", () => {
    expect(game.decks.map((d) => [d.id, d.cards.length, d.tier])).toEqual([
      ["warmup", 80, "free"],
      ["brainstorm", 80, "free"],
      ["no-brakes", 50, "premium"],
    ]);
    expect(game.decks.map((d) => d.emoji)).toEqual(["🙌", "🧠", "💎"]);
    const locked = game.decks[2]!;
    expect(locked.locked?.reason).toBe("subscription");
    expect(deckAccess(locked, { userTier: "free" }).open).toBe(false);
    expect(deckAccess(locked, { userTier: "premium" }).open).toBe(true);
    expect(deckAccess(game.decks[0]!, { userTier: "free" }).open).toBe(true);
    expect(game.decks[0]?.upsellText).toBe("Слишком легко? Дальше Мозговой штурм 🧠");
    expect(game.decks[1]?.upsellText).toBe("Мозги разогреты? Без тормозов 💎 уже ждёт");
  });

  it("карточки дословно из спеки, без повторов", () => {
    const text = (i: number, n: number) => game.decks[i]?.cards[n]?.text;
    expect(text(0, 0)).toBe("Три вида сыра");
    expect(text(0, 79)).toBe("Три песни, которые все знают наизусть");
    expect(text(1, 0)).toBe("Три столицы Африки");
    expect(text(1, 79)).toBe("Три вида облаков или осадков");
    expect(text(2, 0)).toBe("Три вещи, которые гуглят тайком");
    expect(text(2, 49)).toBe("Три человека здесь, кто первым выживет в зомби-апокалипсисе");
    for (const d of game.decks) {
      const all = d.cards.map((c) => c.text);
      expect(new Set(all).size, d.id).toBe(all.length);
      for (const t of all) expect(t, t).toMatch(/^Три /);
    }
  });

  it("кнопки «Засчитано ✅ / Не засчитано ❌» (без рода), итоги и правила — из спеки", () => {
    expect(game.buttons).toEqual({ yes: "Засчитано ✅", no: "Не засчитано ❌" });
    expect(game.cardPrompt).toBe("Назови за 5 секунд");
    expect(game.handoffText).toBe("Передай телефон: ход {name} 👉");
    expect(game.finale.winner).toEqual({ title: "Мозг на газу", emoji: "⚡", text: "Быстрее всех думает. Корона твоя 👑" });
    expect(game.finale.tie.title).toBe("Делите корону");
    expect(game.finale.last).toEqual({ title: "Тормозок дня", emoji: "🐢", text: "В следующем раунде отвечаешь первым. Реванш!" });
    expect(game.texts.chain).toBe("Цепочка 🔗: тот же вопрос, сказанное не повторять");
    expect(game.texts.flexText).toBe("Мы сыграли в 5 секунд ⏱️, и {name} мозг на газу");
    expect(game.rules).toHaveLength(6);
    expect(game.rules[1]).toBe("Жмёшь «Старт», видишь задание и за 5 секунд называешь вслух три ответа.");
  });
});

describe("«5 секунд ⏱️»: ход и очки", () => {
  it("раунд = игроков × карт на игрока, без повторов карт; всё не больше колоды", () => {
    const s = settings({ players: ["А", "Б", "В", "Г"], perPlayer: 5 });
    expect(roundCardCount(s)).toBe(20);
    const plan = planTimerDeck(80, s, [], seededRandom(3));
    expect(plan.cards).toHaveLength(20);
    expect(new Set(plan.cards).size).toBe(20);
    // 10 игроков × 7 карт = 70 > 50 карт в колоде: берём столько, сколько есть
    expect(planTimerDeck(50, settings({ players: Array.from({ length: 10 }, (_, i) => `И${i}`), perPlayer: 7 }), []).cards).toHaveLength(50);
  });

  it("«Ещё раунд»: карты не повторяются, пока колода не кончится", () => {
    const s = settings({ players: ["А", "Б"], perPlayer: 5 });
    const first = planTimerDeck(80, s, [], seededRandom(5));
    const second = planTimerDeck(80, s, first.used, seededRandom(6));
    expect(second.cards.filter((c) => first.cards.includes(c))).toEqual([]);
  });

  it("ходы идут по кругу: карта k достаётся игроку k mod N; сначала «рубашкой вверх», потом «Старт»", () => {
    let s = fresh();
    expect(s.phase).toBe("turn");
    const owners: number[] = [];
    for (let i = 0; i < 6; i++) {
      expect(s.phase, `карта ${i}`).toBe("turn");
      owners.push(s.player);
      const started = beginCard(s);
      expect(started.phase).toBe("card");
      s = answerCard(started, false);
    }
    expect(owners).toEqual([0, 1, 2, 0, 1, 2]);
    expect(s.phase).toBe("final");
  });

  it("«Засчитано» даёт +1 очко тому, кто отвечал; «Не засчитано» очков не даёт; без «Старта» ответ не принимается", () => {
    const s = fresh();
    expect(answerCard(s, true)).toBe(s); // карта ещё лежит рубашкой вверх
    const a = play(s, true);
    expect(a.scores).toEqual([1, 0, 0]);
    const b = play(a, false);
    expect(b.scores).toEqual([1, 0, 0]);
    const c = play(b, true);
    expect(c.scores).toEqual([1, 0, 1]);
  });

  it("финал после всех карт; очки по игрокам складываются", () => {
    let s = fresh({ perPlayer: 2 });
    for (let i = 0; i < 6; i++) s = play(s, i % 2 === 0); // карты 0, 2, 4 засчитаны: у игроков 0, 2, 1
    expect(s.phase).toBe("final");
    expect(s.scores).toEqual([1, 1, 1]);
    expect(play(s, true)).toBe(s); // после финала ничего не меняется
  });

  it("«Цепочка»: не засчитанная карта уходит следующему игроку и обходит всех, потом сгорает", () => {
    let s = fresh({ chain: true });
    const card = s.cards[s.index];
    s = play(s, false);
    expect([s.phase, s.player, s.hops, s.cards[s.index], s.index]).toEqual(["turn", 1, 1, card, 0]);
    s = play(s, false);
    expect([s.player, s.hops, s.cards[s.index]]).toEqual([2, 2, card]);
    s = play(s, false); // обошла всех — карта сгорает, следующая карта достаётся игроку 1
    expect([s.index, s.player, s.hops]).toEqual([1, 1, 0]);
    expect(s.cards[s.index]).not.toBe(card);
  });

  it("«Цепочка»: если следующий игрок ответил верно — очко ему, а следующая карта идёт дальше по кругу", () => {
    let s = fresh({ chain: true });
    s = play(s, false);
    s = play(s, true);
    expect(s.scores).toEqual([0, 1, 0]);
    expect([s.index, s.player, s.hops]).toEqual([1, 1, 0]);
  });

  it("без «Цепочки» не засчитанная карта просто сгорает", () => {
    const s = play(fresh({ chain: false }), false);
    expect([s.index, s.player, s.hops]).toEqual([1, 1, 0]);
  });

  it("первое место, ничья на вершине и последнее место", () => {
    expect(standings([3, 1, 2])).toEqual({ winners: [0], tie: false, last: [1] });
    expect(standings([2, 2, 1])).toEqual({ winners: [0, 1], tie: true, last: [2] });
    expect(standings([2, 2, 2])).toEqual({ winners: [0, 1, 2], tie: true, last: [] }); // у всех поровну — последнего нет
    expect(standings([0, 0])).toEqual({ winners: [0, 1], tie: true, last: [] });
    expect(standings([4, 1, 1])).toEqual({ winners: [0], tie: false, last: [1, 2] });
  });

  it("имена: пустые становятся «Игрок N»; список через «и»", () => {
    expect(playerNames(["Аня", "", "  ", "Витя"])).toEqual(["Аня", "Игрок 2", "Игрок 3", "Витя"]);
    expect(joinNames(["Аня"])).toBe("Аня");
    expect(joinNames(["Аня", "Боря"])).toBe("Аня и Боря");
    expect(joinNames(["Аня", "Боря", "Витя"])).toBe("Аня, Боря и Витя");
  });
});
