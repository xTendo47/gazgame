// Главная: три большие карточки «С кем ты сейчас?» и мини-ряд. Тексты и цвета — по спеке главной (16.10).
// Разделы пока ведут на текущие экраны (/company, /pairs, /solo): их переделываем отдельными шагами.
import { TELEGRAM_CHANNEL_URL } from "./links";

export interface HomeSection {
  /** Для аналитики: party / love / solo. */
  id: "party" | "love" | "solo";
  href: string;
  emoji: string;
  title: string;
  /** Чип справа сверху: с кем. */
  who: string;
  subtitle: string;
  /** Цвет рамки, свечения, чипа и стрелки. */
  color: string;
}

export const HOME_SECTIONS: HomeSection[] = [
  { id: "party", href: "/company", emoji: "🎉", title: "Тусовка", who: "2+ ЧЕЛОВЕКА", subtitle: "Кто из нас, Шпион, Мафия, Объясни и другие", color: "#FF5A1F" },
  { id: "love", href: "/pairs", emoji: "💞", title: "Романтика", who: "ВДВОЁМ", subtitle: "Игры, тесты и разбор вашей пары", color: "#FF6FAE" },
  { id: "solo", href: "/solo", emoji: "🧠", title: "Дневник", who: "ТОЛЬКО ТЫ", subtitle: "Кто ты, психотесты и сравнения", color: "#B58CFF" },
];

export interface MiniButton {
  id: "collection" | "ultimate" | "suggest";
  href: string;
  emoji: string;
  title: string;
  /** Салатовая метка на углу. */
  badge?: string;
  /** Оранжевая точка, пока есть новая карта (Коллекция). */
  dot?: boolean;
  /** Внешняя ссылка: открывается в новой вкладке (t.me — сразу в приложении Telegram). */
  external?: boolean;
}

export const MINI_BUTTONS: MiniButton[] = [
  { id: "collection", href: "/collection", emoji: "🃏", title: "Коллекция", dot: true },
  { id: "ultimate", href: "/ultimate", emoji: "🔱", title: "Ultimate", badge: "скоро" },
  // «Предложить» — сразу в Telegram-канал GAZ (ссылка — в lib/links.ts)
  { id: "suggest", href: TELEGRAM_CHANNEL_URL, emoji: "💡", title: "Предложить", external: true },
];
