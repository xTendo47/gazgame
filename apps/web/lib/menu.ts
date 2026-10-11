// Главное меню. Два уровня:
// 1) MAIN_CARDS — три большие тёмные карточки разделов (названия — packages/content/src/sections.ts);
// 2) SMALL_BUTTONS — маленькие кнопки по две в ряд.
import type { Section } from "@gazgame/content";
import { TELEGRAM_CHANNEL_URL } from "./links";

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
  /** Живая «огненная» плитка Ultimate: оранжевое дышащее свечение и искры. */
  fire?: boolean;
  /** Внешняя ссылка: открывается в новой вкладке (t.me — сразу в приложении Telegram). */
  external?: boolean;
}

export const SMALL_BUTTONS: SmallButton[] = [
  // Название и подпись берутся из ultimate.json (tile) — здесь запасные
  { href: "/ultimate", emoji: "🔱", title: "Ultimate", subtitle: "скоро 🔥", fire: true },
  // Название и подпись берутся из premium.json (tile) — здесь запасные
  { href: "/premium", emoji: "💎", title: "Premium", subtitle: "без ограничений", diamond: true },
  // «Предложи своё» — сразу в Telegram-канал GAZ (ссылка — в lib/links.ts)
  { href: TELEGRAM_CHANNEL_URL, emoji: "💡", title: "Предложи своё", external: true },
  { href: "/profile", emoji: "👤", title: "Профиль" },
];
