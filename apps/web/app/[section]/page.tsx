// Раздел: /pairs, /company, /solo — список тестов и игр из packages/content.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { itemsForSection } from "@gazgame/engine";
import { PageHeader, Screen } from "@gazgame/ui";
import { BackLink } from "@/components/BackLink";
import { ItemTile } from "@/components/ItemTile";
import { getCatalog, visibility } from "@/lib/catalog";
import { getSection, SECTIONS } from "@/lib/sections";

export const dynamicParams = false;

export function generateStaticParams() {
  return SECTIONS.map((s) => ({ section: s.id }));
}

export async function generateMetadata({ params }: PageProps<"/[section]">): Promise<Metadata> {
  const section = getSection((await params).section);
  return { title: section?.title };
}

export default async function SectionPage({ params }: PageProps<"/[section]">) {
  const section = getSection((await params).section);
  if (!section) notFound();

  const items = itemsForSection(getCatalog(), section.id, visibility);

  return (
    <Screen>
      <PageHeader back={<BackLink href="/">Меню</BackLink>} title={section.title} emoji={section.emoji} subtitle={section.greeting} />
      <div className="flex flex-col gap-3.5">
        {items.map((item, i) => (
          <ItemTile key={item.id} item={item} accent={i % 2 ? "lime" : "orange"} />
        ))}
        {items.length === 0 && <p className="text-muted">Здесь скоро что-то появится 👀</p>}
      </div>
    </Screen>
  );
}
