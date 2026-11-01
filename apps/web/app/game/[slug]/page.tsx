// Экран игры: /game/<slug>
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findGame } from "@gazgame/engine";
import { backTagClass, Badge, PageHeader, Screen } from "@gazgame/ui";
import { BackLink } from "@/components/BackLink";
import { CasinoBackdrop } from "@/components/casino/CasinoBackdrop";
import { GameScreen } from "@/components/games/GameScreen";
import { GameStartMarker } from "@/components/games/GameStartMarker";
import { RulesHelp } from "@/components/RulesSheet";
import { RelatedBlock } from "@/components/RelatedBlock";
import { getCatalog, visibility } from "@/lib/catalog";
import { getSection } from "@/lib/sections";
import { stripEmoji } from "@/lib/text";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCatalog().games.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/game/[slug]">): Promise<Metadata> {
  const game = findGame(getCatalog(), (await params).slug, visibility);
  return { title: game?.title, description: game?.description };
}

export default async function GamePage({ params }: PageProps<"/game/[slug]">) {
  const game = findGame(getCatalog(), (await params).slug, visibility);
  if (!game) notFound();
  const section = getSection(game.sections[0] ?? "company");
  const layouts = getCatalog().sectionLayouts;
  const rules = layouts?.rules[game.slug];
  // Игра раундами, «Мафия», «Шпион», «Объясни», «Совпадём?» и «5 секунд» показывают правила отдельным экраном — здесь их не дублируем.
  const rulesOnOwnScreen =
    (game.mechanic === "deck" && game.roundSize !== undefined) ||
    game.mechanic === "mafia" ||
    game.mechanic === "spy" ||
    game.mechanic === "explain" ||
    game.mechanic === "match" ||
    game.mechanic === "timer-deck" ||
    game.mechanic === "rebus" ||
    game.mechanic === "verdict";

  // Игры «Тусовки» оформлены в стиле казино (сукно, золото); остальные — как были
  const casino = game.sections.includes("company");

  return (
    <>
      {casino && <CasinoBackdrop />}
      <Screen className={casino ? "cg-skin" : undefined}>
        <PageHeader
          back={
            casino ? (
              <Link href={`/${section?.id ?? ""}`} className={backTagClass()}>
                ← {stripEmoji(section?.title ?? "Меню")}
              </Link>
            ) : (
              <BackLink href={`/${section?.id ?? ""}`}>
                {section?.title ?? "Меню"}
              </BackLink>
            )
          }
          title={game.title}
          emoji={casino ? undefined : game.emoji}
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
              {/* «?» открывает «Как играть за 10 секунд» (тот же текст, что в шторке раздела) */}
              {layouts && rules && (
                <RulesHelp
                  id={game.slug}
                  emoji={game.emoji}
                  name={game.title}
                  lines={rules}
                  texts={{
                    title: layouts.texts.rulesTitle,
                    play: layouts.texts.play,
                    later: layouts.texts.later,
                  }}
                />
              )}
            </span>
          }
        />

        {game.rules.length > 0 && !rulesOnOwnScreen && (
          <ol className="flex list-inside list-decimal flex-col gap-1 rounded-card bg-surface p-4 text-[15px] text-muted marker:font-bold marker:text-lime">
            {game.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>
        )}

        <GameStartMarker id={game.id} />
        <GameScreen game={game} related={<RelatedBlock item={game} />} />
      </Screen>
    </>
  );
}
