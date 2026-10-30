// Главная GAZ Game: «стол» с коробкой (дизайн v6.4). Полка, билет «Продолжим», календарь «Батл дня», «Мне скучно», VIP.
// Тап по коробке ведёт на «Чем займёмся?» (/open) с тремя разделами. Что и в каком порядке — в lib/menu.ts.
import { isVisible, itemPath, type DiceItem } from "@gazgame/engine";
import { type ContinueTestSummary } from "@/components/home/ContinueCard";
import { FirstHints } from "@/components/home/FirstHints";
import { IntroSplash } from "@/components/intro/IntroSplash";
import { StartTable } from "@/components/table/StartTable";
import { getCatalog, visibility } from "@/lib/catalog";

export default function Home() {
  const catalog = getCatalog();
  const layouts = catalog.sectionLayouts;
  // Готовые игры и тесты: те, на которые ведёт карточка раздела без «скоро» (их выбирает умный 🎲 и показывает «Продолжить»)
  const ready = new Set(
    (layouts?.sections ?? []).flatMap((s) =>
      s.tabs.flatMap((t) => t.items.flatMap((i) => (i.soon || !i.ref ? [] : [i.ref.game, i.ref.test].filter((x): x is string => !!x)))),
    ),
  );
  const readyGames = catalog.games.filter((g) => ready.has(g.slug) && isVisible(g, visibility));
  const readyTests = catalog.tests.filter((t) => ready.has(t.slug) && isVisible(t, visibility));
  const diceItems: DiceItem[] = [
    ...readyGames.map((g): DiceItem => ({ slug: g.slug, kind: "game", emoji: g.emoji, title: g.title, text: g.description, href: itemPath(g) })),
    ...readyTests.map((t): DiceItem => ({ slug: t.slug, kind: "test", emoji: t.emoji, title: t.title, text: t.description, href: itemPath(t) })),
  ];
  const games = readyGames.map((g) => ({ id: g.id, slug: g.slug, title: g.title, emoji: g.emoji }));
  // Для «Продолжить» нужны только название, эмодзи и число вариантов у вопросов
  const tests: ContinueTestSummary[] = catalog.tests
    .filter((t) => isVisible(t, visibility))
    .map((t) => ({ id: t.id, slug: t.slug, title: t.title, emoji: t.emoji, options: t.questions.map((q) => q.options.length) }));

  return (
    <>
      <StartTable tests={tests} games={games} diceItems={diceItems} diceConfig={layouts?.dice} boredIds={catalog.gaz?.bored.map((t) => t.id) ?? []} />
      <FirstHints />
      <IntroSplash />
    </>
  );
}
