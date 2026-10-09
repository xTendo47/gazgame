// Экран игры: /game/<slug>
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findGame } from "@gazgame/engine";
import { Badge, PageHeader, Screen } from "@gazgame/ui";
import { BackLink } from "@/components/BackLink";
import { GameScreen } from "@/components/games/GameScreen";
import { RelatedBlock } from "@/components/RelatedBlock";
import { getCatalog, visibility } from "@/lib/catalog";
import { getSection } from "@/lib/sections";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCatalog().games.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/game/[slug]">): Promise<Metadata> {
  const game = findGame(getCatalog(), (await params).slug, visibility);
  return { title: game?.title, description: game?.description };
}

export default async function GamePage({ params }: PageProps<"/game/[slug]">) {
  const game = findGame(getCatalog(), (await params).slug, visibility);
  if (!game) notFound();
  const section = getSection(game.sections[0] ?? "company");

  return (
    <Screen>
      <PageHeader
        back={<BackLink href={`/${section?.id ?? ""}`}>{section?.title ?? "Меню"}</BackLink>}
        title={game.title}
        emoji={game.emoji}
        subtitle={game.description}
        badge={
          <span className="flex flex-wrap gap-2">
            <Badge>
              {game.players.min === game.players.max
                ? `${game.players.min} игрока`
                : `${game.players.min}–${game.players.max} игроков`}{" "}
              · {game.durationMin} мин
            </Badge>
            {game.status === "draft" && <Badge tone="draft">черновик</Badge>}
          </span>
        }
      />

      {game.rules.length > 0 && (
        <ol className="flex list-inside list-decimal flex-col gap-1 rounded-card bg-surface p-4 text-[15px] text-muted marker:font-bold marker:text-lime">
          {game.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
      )}

      <GameScreen game={game} related={<RelatedBlock item={game} />} />
    </Screen>
  );
}
