// Раздел: список тестов и игр из packages/content, после них — «Карточные игры 🃏»
// (если файл card-games.json указал этот раздел) и платные тесты под замком (тап — шторка с превью).
// Общий для /pairs, /company, /solo и для /locked/<slug> (тот же список, шторка уже открыта).
import Link from "next/link";
import type { Section } from "@gazgame/content";
import { itemsForSection, lockedTestsForSection } from "@gazgame/engine";
import { PageHeader, Screen, Tile } from "@gazgame/ui";
import { BackLink } from "@/components/BackLink";
import { ItemTile } from "@/components/ItemTile";
import { LockedTestsList } from "@/components/LockedTestsList";
import { getCatalog, visibility } from "@/lib/catalog";
import { getSection } from "@/lib/sections";

export function SectionView({ sectionId, openLocked }: { sectionId: Section; openLocked?: string }) {
  const section = getSection(sectionId);
  if (!section) return null;
  const catalog = getCatalog();
  const items = itemsForSection(catalog, section.id, visibility);
  const locked = lockedTestsForSection(catalog, section.id);
  const cards = catalog.cardGames;
  const showCards = cards?.sections.includes(section.id) ?? false;

  return (
    <Screen>
      <PageHeader back={<BackLink href="/">Меню</BackLink>} title={section.title} emoji={section.emoji} subtitle={section.greeting} />
      <div className="flex flex-col gap-3.5">
        {items.map((item, i) => (
          <ItemTile key={item.id} item={item} accent={i % 2 ? "lime" : "orange"} />
        ))}
        {cards && showCards && (
          <Link href={`/${cards.slug}`} className="group block rounded-card">
            <Tile emoji={cards.emoji} title={cards.title} subtitle={cards.subtitle} accent={items.length % 2 ? "lime" : "orange"} />
          </Link>
        )}
        {locked.length > 0 && catalog.premium && (
          <LockedTestsList tests={locked} texts={catalog.premium.preview} sectionPath={`/${section.id}`} initialOpen={openLocked} />
        )}
        {items.length === 0 && locked.length === 0 && !showCards && <p className="text-muted">Здесь скоро что-то появится 👀</p>}
      </div>
    </Screen>
  );
}
