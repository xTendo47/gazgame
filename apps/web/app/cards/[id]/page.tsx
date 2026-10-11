// Правила одной карточной игры: /cards/<id>. Только тексты: цель, раздача, как ходить, доп. блоки, частые споры.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { findCardGame } from "@gazgame/engine";
import { buttonVariants, PageHeader, Screen } from "@gazgame/ui";
import { BackLink } from "@/components/BackLink";
import { CardGameMeta } from "@/components/cards/CardGameMeta";
import { getCatalog } from "@/lib/catalog";

export const dynamicParams = false;

export function generateStaticParams() {
  return (getCatalog().cardGames?.games ?? []).map((g) => ({ id: g.id }));
}

export async function generateMetadata({ params }: PageProps<"/cards/[id]">): Promise<Metadata> {
  const game = findCardGame(getCatalog().cardGames, (await params).id);
  return { title: game?.title, description: game?.goal };
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 rounded-card bg-surface p-5">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

const listClass = "flex list-inside flex-col gap-2 leading-snug [overflow-wrap:anywhere]";

export default async function CardGamePage({ params }: PageProps<"/cards/[id]">) {
  const cards = getCatalog().cardGames;
  const game = findCardGame(cards, (await params).id);
  if (!cards || !game) notFound();
  const { labels } = cards;

  return (
    <Screen>
      <PageHeader
        back={<BackLink href={`/${cards.slug}`}>{cards.title}</BackLink>}
        title={game.title}
        emoji={game.emoji}
        badge={
          <div className="flex flex-col gap-2">
            {(game.aka || game.note) && (
              <p className="flex flex-col text-sm text-muted">
                {game.aka && <span>{game.aka}</span>}
                {game.note && <span>{game.note}</span>}
              </p>
            )}
            <CardGameMeta game={game} labels={labels} />
          </div>
        }
      />

      {game.intro && <p className="rounded-card border border-line bg-surface p-4 text-[15px] leading-relaxed">{game.intro}</p>}

      <Block title={labels.goal}>
        <p className="leading-relaxed">{game.goal}</p>
      </Block>

      <Block title={labels.deal}>
        <p className="leading-relaxed">{game.deal}</p>
        <p className="text-sm text-muted">🃏 {cards.decks[String(game.deck) as "36" | "52"]}</p>
      </Block>

      <Block title={labels.moves}>
        <ol className={`${listClass} list-decimal marker:font-bold marker:text-lime`}>
          {game.moves.map((move) => (
            <li key={move}>{move}</li>
          ))}
        </ol>
      </Block>

      {game.extra?.map((block) => (
        <Block key={block.title} title={block.title}>
          <ul className={`${listClass} list-disc marker:text-orange`}>
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Block>
      ))}

      {game.disputes && game.disputes.length > 0 && (
        // Свёрнуты по умолчанию, раскрываются тапом — без JavaScript
        <details className="group rounded-card bg-surface p-5">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-display text-lg font-bold [&::-webkit-details-marker]:hidden">
            {labels.disputes}
            <span aria-hidden="true" className="text-muted transition group-open:rotate-180">
              ▾
            </span>
          </summary>
          <ul className={`${listClass} mt-3 list-disc marker:text-lime`}>
            {game.disputes.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </details>
      )}

      <Link href={`/${cards.slug}`} className={buttonVariants({ variant: "ghost", size: "md" })}>
        {labels.back}
      </Link>
    </Screen>
  );
}
