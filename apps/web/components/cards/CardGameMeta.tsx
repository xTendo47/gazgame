import type { CardGame, CardGamesFile } from "@gazgame/content";
import { cardPlayersLabel } from "@gazgame/engine";
import { Badge } from "@gazgame/ui";

/** Пометки игры: «👥 2–6», «⏱ 15 мин», «колода 36». */
export function CardGameMeta({ game, labels }: { game: CardGame; labels: CardGamesFile["labels"] }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      <Badge>{cardPlayersLabel(game, labels.players)}</Badge>
      <Badge>
        {labels.minutes} {game.minutes}
      </Badge>
      <Badge>
        {labels.deck} {game.deck}
      </Badge>
    </span>
  );
}
