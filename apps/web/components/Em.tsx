// Текст с эмодзи: оставляем как есть. Пары эмодзи → значок (emojiIconName) нужны только картинкам для ссылок и сторис (share/og-emoji.tsx).
import { glyphName, type GIconName } from "@/components/casino/GIcon";


/** Запасные пары для надписей результата. */
const EXTRA: Record<string, GIconName> = {
  "🔥": "fire",
  "🔄": "refresh",
  "🔁": "refresh",
  "💎": "diamond",
  "💌": "heart",
  "💘": "heart",
  "💞": "heart",
  "🤍": "heart",
  "❤": "heart",
  "♥": "heart",
  "💡": "bulb",
  "🗺": "pin",
  "📍": "pin",
  "🎨": "palette",
  "⚡": "bolt",
  "🚩": "flag",
  "💪": "star",
  "✅": "check",
  "🃏": "cards",
  "✨": "sparkle",
  "👇": "next",
  "📌": "pin",
  "⚠": "bolt",
  "❄": "snowflake",
  "⚔": "swords",
  "💭": "bubble",
  "🙋": "hand",
  "👆": "hand",
  "⏱": "clock",
  "🚀": "rocket",
  "⚙": "gear",
  "🙂": "smile",
  "👤": "user",
  "📖": "notepad",
  "📭": "notepad",
  "🧩": "puzzle",
};

/** Имя значка для одного эмодзи (запасные пары, потом общий словарь GIcon). */
export function emojiIconName(part: string): GIconName | undefined {
  return EXTRA[part.replace(/[️‍]/gu, "")] ?? glyphName(part);
}

/** Текст с эмодзи: эмодзи остаются настоящими (значки GIcon нужны только кнопкам и элементам интерфейса). */
export function Em({ text }: { text: string; size?: number | string }) {
  return <>{text}</>;
}
