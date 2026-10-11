// Главное меню. Два уровня:
// 1) MAIN_CARDS — три большие тёмные карточки разделов (названия — packages/content/src/sections.ts);
// 2) SMALL_BUTTONS — маленькие кнопки по две в ряд.
import type { Section } from "@gazgame/content";

/** Разделы сверху вниз. Цвет полоски слева — accent в lib/sections.ts. */
export const MAIN_CARDS: Section[] = ["pairs", "company", "solo"];

export interface SmallButton {
  href: string;
  emoji: string;
  title: string;
  /** Голубое «алмазное» свечение на самой кнопке. */
  diamond?: boolean;
  /** Мелкая подпись под названием. */
  subtitle?: string;
}

export const SMALL_BUTTONS: SmallButton[] = [
  { href: "/ultimate", emoji: "🔱", title: "Ultimate" },
  // Название и подпись берутся из premium.json (tile) — здесь запасные
  { href: "/premium", emoji: "💎", title: "Премиум", subtitle: "без замков", diamond: true },
  { href: "/soon/suggest", emoji: "💡", title: "Предложи своё" },
  { href: "/profile", emoji: "👤", title: "Профиль" },
];
