import { SECTION_LABELS, type Section } from "@gazgame/content";
import type { TileAccent } from "@gazgame/ui";

export interface SectionInfo {
  id: Section;
  title: string;
  emoji: string;
  subtitle: string;
  greeting: string;
  accent: TileAccent;
}

export const SECTIONS: SectionInfo[] = [
  {
    id: "pairs",
    ...SECTION_LABELS.pairs,
    subtitle: "Узнайте друг друга по-настоящему",
    greeting: "Вдвоём — интереснее. Выбирайте 👇",
    accent: "orange",
  },
  {
    id: "company",
    ...SECTION_LABELS.company,
    subtitle: "Один телефон — вся тусовка",
    greeting: "Йо! Кто сегодня собрался? 🔥",
    accent: "lime",
  },
  {
    id: "solo",
    ...SECTION_LABELS.solo,
    subtitle: "Тесты о тебе",
    greeting: "Узнай себя глубже 🧠",
    accent: "cream",
  },
];

export function getSection(id: string): SectionInfo | undefined {
  return SECTIONS.find((s) => s.id === id);
}
