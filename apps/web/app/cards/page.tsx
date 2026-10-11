// «Карточные игры 🃏»: /cards — памятка правил для обычной колоды, список с фильтром «Нас: N».
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader, Screen } from "@gazgame/ui";
import { BackLink } from "@/components/BackLink";
import { CardGamesList } from "@/components/cards/CardGamesList";
import { getCatalog } from "@/lib/catalog";
import { getSection } from "@/lib/sections";

export function generateMetadata(): Metadata {
  const cards = getCatalog().cardGames;
  return { title: cards?.title, description: cards?.subtitle };
}

export default function CardGamesPage() {
  const cards = getCatalog().cardGames;
  if (!cards) notFound();
  const section = getSection(cards.sections[0] ?? "company");

  return (
    <Screen>
      <PageHeader
        back={<BackLink href={`/${section?.id ?? ""}`}>{section?.title ?? "Меню"}</BackLink>}
        title={cards.title}
        emoji={cards.emoji}
        subtitle={cards.subtitle}
      />
      <CardGamesList file={cards} />
    </Screen>
  );
}
