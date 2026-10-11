import { describe, expect, it } from "vitest";
import { cardGamesFileSchema } from "@gazgame/content";
import cardGamesJson from "@gazgame/content/data/card-games.json";
import { cardPlayersLabel, filterCardGames, findCardGame } from "../src/index";

const file = cardGamesFileSchema.parse(cardGamesJson);
const titles = (n: number | null) => filterCardGames(file, n).map((g) => g.title);

describe("«Карточные игры» — фильтр «Нас: N» на настоящем card-games.json", () => {
  it("без фильтра — все 8 игр", () => {
    expect(titles(null)).toHaveLength(8);
  });

  it("«1» — только Косынка", () => {
    expect(titles(1)).toEqual(["Косынка"]);
  });

  it("«3» — 7 игр, без Косынки", () => {
    expect(titles(3)).toHaveLength(7);
    expect(titles(3)).not.toContain("Косынка");
  });

  it("«6+» — игры, где max ≥ 6", () => {
    const expected = file.games.filter((g) => g.players.max >= 6).map((g) => g.title);
    expect(titles(6)).toEqual(expected);
    expect(titles(6)).toContain("Покер"); // 3–8
    expect(titles(6)).not.toContain("Война"); // 2–4
  });

  it("подпись игроков и поиск по id", () => {
    expect(cardPlayersLabel(findCardGame(file, "durak")!, "👥")).toBe("👥 2–6");
    expect(cardPlayersLabel(findCardGame(file, "klondike")!, "👥")).toBe("👥 1");
    expect(findCardGame(file, "nope")).toBeUndefined();
  });
});
