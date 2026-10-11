// «Карточные игры 🃏»: памятка правил для обычной колоды. Механики нет — только фильтр «Нас: N».
import type { CardGame, CardGamesFile } from "@gazgame/content";

/**
 * Игры для компании из N человек. null — фильтр не выбран, видны все.
 * Последний вариант фильтра — «и больше» («6+»): игры, где max ≥ N. Остальные: min ≤ N ≤ max.
 */
export function filterCardGames(file: CardGamesFile, players: number | null): CardGame[] {
  if (players === null) return file.games;
  const plus = file.filter.options[file.filter.options.length - 1]?.value;
  if (players === plus) return file.games.filter((g) => g.players.max >= players);
  return file.games.filter((g) => g.players.min <= players && players <= g.players.max);
}

/** «👥 2–6» или «👥 1». */
export function cardPlayersLabel(game: CardGame, icon: string): string {
  const { min, max } = game.players;
  return `${icon} ${min === max ? min : `${min}–${max}`}`;
}

export function findCardGame(file: CardGamesFile | undefined, id: string): CardGame | undefined {
  return file?.games.find((g) => g.id === id);
}
