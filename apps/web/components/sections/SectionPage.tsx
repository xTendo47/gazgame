// Раздел /pairs, /company, /solo в одном формате: данные — packages/content/data/sections.json,
// куда ведёт каждая карточка — считаем здесь по контенту (нет игры или теста — «скоро»).
import { notFound } from "next/navigation";
import type { Section } from "@gazgame/content";
import { sectionTarget } from "@gazgame/engine";
import { Screen } from "@gazgame/ui";
import { getCatalog, visibility } from "@/lib/catalog";
import { playersLabel } from "@/lib/players-label";
import { SectionScreen } from "./SectionScreen";

export function SectionPage({ sectionId, openLocked }: { sectionId: Section; openLocked?: string }) {
  const catalog = getCatalog();
  const layouts = catalog.sectionLayouts;
  const section = layouts?.sections.find((s) => s.id === sectionId);
  if (!layouts || !section) notFound();
  const targets = Object.fromEntries(section.tabs.map((t) => [t.id, t.items.map((item) => sectionTarget(catalog, item, visibility))]));
  // Подпись «сколько игроков» для карточек: берётся из файла игры; у «Карточных игр» нет числа — 2+
  const players = Object.fromEntries(
    section.tabs.map((t) => [
      t.id,
      t.items.map((item) => {
        const game = item.ref?.game ? catalog.games.find((g) => g.slug === item.ref?.game) : undefined;
        if (game) return playersLabel(game.players);
        return item.ref?.cards ? playersLabel({ min: 2, max: 20 }) : null;
      }),
    ]),
  );

  // Подпись на карточке колоды «Романтики»: «2 · 20 МИН» у игры, «ТЕСТ» у теста
  const meta = Object.fromEntries(
    section.tabs.map((t) => [
      t.id,
      t.items.map((item) => {
        const game = item.ref?.game ? catalog.games.find((g) => g.slug === item.ref?.game) : undefined;
        if (game) return `${game.players.min === game.players.max ? game.players.min : `${game.players.min}–${game.players.max}`} · ${game.durationMin} МИН`;
        // «Дневник»: у теста — «тест · 4 мин» (выписка Психо), в «Романтике» — «ТЕСТ»
        const test = section.id === "solo" && item.ref?.test ? catalog.tests.find((x) => x.slug === item.ref?.test) : undefined;
        if (test) return `тест · ${test.durationMin} мин`;
        return item.ref?.test || item.ref?.lockedTest ? "ТЕСТ" : null;
      }),
    ]),
  );

  return (
    <Screen>
      <SectionScreen
        section={section}
        texts={layouts.texts}
        targets={targets}
        players={players}
        meta={meta}
        lockedTests={catalog.lockedTests ?? []}
        previewTexts={catalog.premium?.preview}
        rules={layouts.rules}
        openLocked={openLocked}
      />
    </Screen>
  );
}
