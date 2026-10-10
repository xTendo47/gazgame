// Названия и эмодзи разделов — одно место для сайта и бота.
// Хочешь переименовать раздел — меняй здесь, остальное подтянется само.
// id разделов (pairs, company, solo) не меняй: на них ссылаются тесты и игры в data/.
import type { Section } from "./schema";

export const SECTION_LABELS: Record<Section, { title: string; emoji: string }> = {
  pairs: { title: "Для пар", emoji: "💞" },
  company: { title: "Для компании", emoji: "🎉" },
  solo: { title: "Познай себя", emoji: "🧠" },
};
