// Раздел /pairs, /company, /solo в одном формате: данные — packages/content/data/sections.json,
// куда ведёт каждая карточка — считаем здесь по контенту (нет игры или теста — «скоро»).
import { notFound } from "next/navigation";
import type { Section } from "@gazgame/content";
import { sectionTarget } from "@gazgame/engine";
import { Screen } from "@gazgame/ui";
import { getCatalog, visibility } from "@/lib/catalog";
import { SectionScreen } from "./SectionScreen";

export function SectionPage({ sectionId, openLocked }: { sectionId: Section; openLocked?: string }) {
  const catalog = getCatalog();
  const layouts = catalog.sectionLayouts;
  const section = layouts?.sections.find((s) => s.id === sectionId);
  if (!layouts || !section) notFound();
  const targets = Object.fromEntries(section.tabs.map((t) => [t.id, t.items.map((item) => sectionTarget(catalog, item, visibility))]));

  return (
    <Screen>
      <SectionScreen
        section={section}
        texts={layouts.texts}
        targets={targets}
        lockedTests={catalog.lockedTests ?? []}
        previewTexts={catalog.premium?.preview}
        openLocked={openLocked}
      />
    </Screen>
  );
}
