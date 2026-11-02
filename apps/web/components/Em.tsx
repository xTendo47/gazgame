// Текст с эмодзи → текст со значками SVG. Эмодзи из служебных надписей и данных заменяются на значки из GIcon.tsx,
// у которых нет пары — пропускаются (на iPhone они стали бы цветными эмодзи).
import { GIcon, glyphName, type GIconName } from "@/components/casino/GIcon";

const EMOJI = /(\p{Extended_Pictographic}[\u{FE0F}\u{200D}\u{1F3FB}-\u{1F3FF}\p{Extended_Pictographic}]*)/gu;

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
  "🫵": "hand",
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

export function Em({ text, size = "1.05em" }: { text: string; size?: number | string }) {
  const parts = text.split(EMOJI);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return part;
        const key = part.replace(/[\u{FE0F}\u{200D}]/gu, "");
        const name = EXTRA[key] ?? glyphName(part);
        return name ? <GIcon key={i} name={name} size={size} /> : null;
      })}
    </>
  );
}
