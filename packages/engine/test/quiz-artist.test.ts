import { describe, expect, it } from "vitest";
import type { QuizQuestion } from "@gazgame/content";
import { ARTIST_PER_LEVEL, buildArtistRound, dailyQuestion, nextSeen, pickRank, type QuizBank } from "../src";

const bank = (id: string, perLevel: number, draft = false): QuizBank => ({
  id,
  questions: [1, 2, 3].flatMap((level) =>
    Array.from({ length: perLevel }, (_, i): QuizQuestion => ({
      id: `${id}-${level}-${i}`,
      level,
      text: `вопрос ${id} ${level}.${i}`,
      options: ["a", "b", "c", "d"],
      correct: 0,
      ...(draft ? { draft: true } : {}),
    })),
  ),
});

describe("квиз $HOW: раунд про артиста", () => {
  it("15 вопросов: 5 лёгких, 5 средних, 5 сложных, без повторов", () => {
    const round = buildArtistRound(bank("eminem", 8));
    expect(round).toHaveLength(15);
    expect(round.map((q) => q.level)).toEqual([...Array(5).fill(1), ...Array(5).fill(2), ...Array(5).fill(3)]);
    expect(new Set(round.map((q) => q.id)).size).toBe(15);
    expect(ARTIST_PER_LEVEL).toBe(5);
  });

  it("пока вопросов мало (заглушки), берёт сколько есть, без повторов", () => {
    const round = buildArtistRound(bank("drake", 1));
    expect(round.map((q) => q.level)).toEqual([1, 2, 3]);
  });

  it("при повторном прохождении вопросы другие, пока не кончился банк; потом круг заново", () => {
    const b = bank("ye", 10);
    let seen = new Set<string>();
    const first = buildArtistRound(b, Math.random, seen);
    seen = nextSeen([b], first, seen);
    const second = buildArtistRound(b, Math.random, seen);
    // на уровне 10 вопросов: два прохода по 5 не пересекаются
    expect(second.filter((q) => first.some((x) => x.id === q.id))).toEqual([]);
    seen = nextSeen([b], second, seen);
    // банк исчерпан: третий проход разрешён (круг заново), вопросов снова 15
    const third = buildArtistRound(b, Math.random, seen);
    expect(third).toHaveLength(15);
    seen = nextSeen([b], third, seen);
    expect(seen.size).toBeLessThanOrEqual(b.questions.length);
  });

  it("варианты перемешиваются, верный находится по тексту", () => {
    const round = buildArtistRound(bank("lsp", 6), () => 0.3);
    for (const q of round) if (q.type !== "input") expect(q.options[q.correct]).toBe("a");
  });

  it("звание по проценту: наибольший порог, не выше процента игрока", () => {
    const ranks = [{ minPercent: 0, title: "0" }, { minPercent: 50, title: "50" }, { minPercent: 90, title: "90" }];
    expect(pickRank(ranks, 0)?.title).toBe("0");
    expect(pickRank(ranks, 49)?.title).toBe("0");
    expect(pickRank(ranks, 50)?.title).toBe("50");
    expect(pickRank(ranks, 89)?.title).toBe("50");
    expect(pickRank(ranks, 100)?.title).toBe("90");
  });

  it("«Вопрос дня» не берёт заглушки, пока есть настоящие вопросы", () => {
    const real = bank("kino", 3);
    const stub = bank("rap-ru", 3, true);
    for (let day = 0; day < 20; day++) {
      const q = dailyQuestion([real, stub], new Date(Date.UTC(2026, 9, 13 + day, 9)));
      expect(q?.draft).not.toBe(true);
    }
    expect(dailyQuestion([stub], new Date("2026-10-13T09:00:00Z"))?.draft).toBe(true);
  });
});
