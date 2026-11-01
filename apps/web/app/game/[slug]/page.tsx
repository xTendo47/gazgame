// Экран игры: /game/<slug>
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findGame } from "@gazgame/engine";
import { backTagClass, Badge, PageHeader, Screen } from "@gazgame/ui";
import { BackLink } from "@/components/BackLink";
import { CasinoBackdrop } from "@/components/casino/CasinoBackdrop";
import { LoveBackdrop } from "@/components/love/LoveBackdrop";
import { GameScreen } from "@/components/games/GameScreen";
import { GameStartMarker } from "@/components/games/GameStartMarker";
import { RulesHelp } from "@/components/RulesSheet";
import { RelatedBlock } from "@/components/RelatedBlock";
import { getCatalog, visibility } from "@/lib/catalog";
import { getSection } from "@/lib/sections";
import { stripEmoji, stripGameEmoji } from "@/lib/text";

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

export default async function GamePage({ params, searchParams }: PageProps<"/game/[slug]">) {
  const found = findGame(getCatalog(), (await params).slug, visibility);
  if (!found) notFound();
  // Игры «Тусовки» оформлены в стиле казино (сукно, золото), игры «Романтики» — в стиле конверта (слива, розовый).
  // «Норм или стрём» есть в обоих разделах: из «Романтики» её открывают с ?mode=duo.
  const duo = (await searchParams).mode === "duo";
  const inPairs = found.sections.includes("pairs") && (!found.sections.includes("company") || duo);
  const love = inPairs;
  const casino = !love && found.sections.includes("company");
  const themed = casino || love;
  const game = themed ? stripGameEmoji(found) : found;
  const section = getSection(love ? "pairs" : (game.sections[0] ?? "company"));
  const sectionTitle = themed
    ? (getCatalog().sectionLayouts?.sections.find((x) => x.id === section?.id)?.title ?? section?.title)
    : section?.title;
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


  return (
    <>
      {casino && <CasinoBackdrop />}
      {love && <LoveBackdrop />}
      <Screen className={casino ? "cg-skin" : love ? "lv-skin" : undefined}>
        <PageHeader
          back={
            themed ? (
              <Link href={`/${section?.id ?? ""}`} className={backTagClass()}>
                ← {stripEmoji(sectionTitle ?? "Меню")}
              </Link>
            ) : (
              <BackLink href={`/${section?.id ?? ""}`}>
                {section?.title ?? "Меню"}
              </BackLink>
            )
          }
          title={stripEmoji(game.title)}
          emoji={themed ? undefined : game.emoji}
          subtitle={stripEmoji(game.description)}
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
              <li key={rule}>{stripEmoji(rule)}</li>
            ))}
          </ol>
        )}

        <GameStartMarker id={game.id} />
        <GameScreen game={game} related={<RelatedBlock item={game} />} />
      </Screen>
    </>
  );
}
