// Кнопки главного меню — сверху вниз в этом порядке.
// Названия разделов берутся из packages/content/src/sections.ts.
import { SECTION_LABELS } from "@gazgame/content";

export interface MenuItem {
  href: string;
  emoji: string;
  title: string;
  /** Голубое «алмазное» свечение позади кнопки. */
  glow?: boolean;
}

export const MENU: MenuItem[] = [
  { href: "/pairs", ...SECTION_LABELS.pairs },
  { href: "/company", ...SECTION_LABELS.company },
  { href: "/solo", ...SECTION_LABELS.solo },
  { href: "/ultimate", emoji: "🔱", title: "Ultimate" },
  { href: "/soon/subscription", emoji: "💎", title: "Подписка", glow: true },
  { href: "/soon/suggest", emoji: "💡", title: "Предложи своё" },
  { href: "/soon/feedback", emoji: "📝", title: "Обратная связь" },
  { href: "/profile", emoji: "👤", title: "Профиль" },
];
