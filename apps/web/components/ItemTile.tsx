import Link from "next/link";
import type { ContentItem } from "@gazgame/content";
import { itemPath } from "@gazgame/engine";
import { Badge, Tile, type TileAccent } from "@gazgame/ui";

/** Плитка теста или игры со ссылкой на неё. У тестов ни числа вопросов, ни минут — только «Тест». */
export function ItemTile({ item, accent = "orange", size = "lg" }: { item: ContentItem; accent?: TileAccent; size?: "lg" | "md" }) {
  const meta = [
    item.kind === "test" ? "Тест" : "Игра",
    item.kind === "test" ? null : `${item.durationMin} мин`,
    item.players.max === 1 ? null : item.players.min === item.players.max ? `${item.players.min} игрока` : `${item.players.min}–${item.players.max} игроков`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link href={itemPath(item)} className="group block rounded-card">
      <Tile
        emoji={item.emoji}
        title={item.title}
        subtitle={size === "lg" ? `${item.description}\n${meta}` : meta}
        accent={accent}
        size={size}
        className="whitespace-pre-line"
        badge={item.status === "draft" ? <Badge tone="draft">черновик</Badge> : undefined}
      />
    </Link>
  );
}
