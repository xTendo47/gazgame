// Главное меню. Два уровня:
// 1) MAIN_CARDS — три большие цветные карточки разделов (названия — packages/content/src/sections.ts);
// 2) SMALL_BUTTONS — маленькие кнопки по две в ряд.
import type { Section } from "@gazgame/content";

export interface MainCard {
  section: Section;
  /** Фон карточки. Текст на всех — тёмный (text-bg): так он читается на ярком фоне. */
  bg: string;
}

export const MAIN_CARDS: MainCard[] = [
  { section: "pairs", bg: "bg-rose" },
  { section: "company", bg: "bg-orange" },
  { section: "solo", bg: "bg-lime" },
];

export interface SmallButton {
  href: string;
  emoji: string;
  title: string;
  /** Неоновый акцент на самой кнопке. */
  neon?: boolean;
}

export const SMALL_BUTTONS: SmallButton[] = [
  { href: "/ultimate", emoji: "🔱", title: "Ultimate", neon: true },
  { href: "/soon/subscription", emoji: "💎", title: "Подписка" },
  { href: "/soon/suggest", emoji: "💡", title: "Предложи своё" },
  { href: "/profile", emoji: "👤", title: "Профиль" },
];
