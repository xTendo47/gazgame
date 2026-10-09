import type { ContentItem } from "@gazgame/content";
import { relatedItems } from "@gazgame/engine";
import { getCatalog, visibility } from "@/lib/catalog";
import { ItemTile } from "./ItemTile";

/** «Связанное»: тесты и игры из поля related. Серверный компонент. */
export function RelatedBlock({ item }: { item: ContentItem }) {
  const related = relatedItems(getCatalog(), item, visibility);
  if (related.length === 0) return null;

  return (
    <section aria-labelledby="related-title" className="flex flex-col gap-3">
      <h2 id="related-title" className="font-display text-xl font-bold">
        Связанное 🔗
      </h2>
      <p className="-mt-1 text-[15px] text-muted">Пройди вместе с партнёром или узнай себя глубже</p>
      {related.map((rel, i) => (
        <ItemTile key={rel.id} item={rel} size="md" accent={i % 2 ? "lime" : "orange"} />
      ))}
    </section>
  );
}
