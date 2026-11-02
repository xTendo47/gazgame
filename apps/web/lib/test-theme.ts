// Оформление экранов теста по кармашку «Дневника»: «Ты в розыске» — дикий запад, «Психо» — клиника, остальное — общий стиль Дневника.
// Кармашек берётся из sections.json (вкладки раздела solo), сами тесты и их подсчёт не трогаем.
import { getCatalog } from "@/lib/catalog";

export type TestTheme = "wanted" | "clinic" | "diary" | "cosmos" | "album";

const BY_TAB: Record<string, TestTheme> = { who: "wanted", psy: "clinic" };

export function testTheme(slug: string): TestTheme {
  const sections = getCatalog().sectionLayouts?.sections ?? [];
  for (const section of sections) {
    if (section.id !== "solo") continue;
    for (const tab of section.tabs) {
      const theme = BY_TAB[tab.id];
      if (theme && tab.items.some((item) => item.ref?.test === slug)) return theme;
    }
  }
  return "diary";
}
