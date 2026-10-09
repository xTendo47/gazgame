import type { Section } from "@gazgame/content";
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
    title: "Для пар",
    emoji: "💞",
    subtitle: "Узнайте друг друга по-настоящему",
    greeting: "Вдвоём — интереснее. Выбирайте 👇",
    accent: "orange",
  },
  {
    id: "company",
    title: "Для компаний",
    emoji: "🎉",
    subtitle: "Один телефон — вся тусовка",
    greeting: "Йо! Кто сегодня собрался? 🔥",
    accent: "lime",
  },
  {
    id: "solo",
    title: "Соло",
    emoji: "👤",
    subtitle: "Тесты о тебе",
    greeting: "Узнай себя глубже 🧠",
    accent: "cream",
  },
];

export function getSection(id: string): SectionInfo | undefined {
  return SECTIONS.find((s) => s.id === id);
}
