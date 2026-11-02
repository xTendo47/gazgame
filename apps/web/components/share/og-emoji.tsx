// Значки вместо эмодзи в картинках для next/og (Satori): те же SVG из GIcon.tsx, что и на экранах. Нет пары — рисуем искорку.
// Satori понимает currentColor по свойству color у обёртки; у блоков с несколькими детьми нужен display: flex.
import { GIcon } from "@/components/casino/GIcon";
import { emojiIconName } from "@/components/Em";

const EMOJI = /(\p{Extended_Pictographic}[\u{FE0F}\u{200D}\u{1F3FB}-\u{1F3FF}\p{Extended_Pictographic}]*)/gu;

/** Один значок для эмодзи из данных (большой, в углу фона, на аватаре). */
export function OgGlyph({ emoji, size, color = "#F3EEE6", label }: { emoji: string; size: number; color?: string; label?: string }) {
  const name = emojiIconName(emoji);
  return (
    <div style={{ display: "flex", width: size, height: size, color }}>
      {name ? (
        <GIcon name={name} size={size} plain />
      ) : label ? (
        // нет значка для эмодзи: кольцо с первой буквой названия (как «фишка» на экранах)
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: size, height: size, borderRadius: size, border: `${Math.max(2, Math.round(size * 0.07))}px solid ${color}`, fontSize: Math.round(size * 0.5), fontWeight: 900, lineHeight: 1 }}>
          {label.trim().charAt(0).toUpperCase()}
        </div>
      ) : (
        <svg viewBox="0 0 24 24" width={size} height={size}>
          <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="1.800" />
          <path d="M12 6.500l1.700 3.800 3.800 1.700-3.800 1.700L12 17.500l-1.700-3.800L6.500 12l3.800-1.700z" fill={color} />
        </svg>
      )}
    </div>
  );
}

/** Строка с эмодзи внутри: эмодзи — значки, остальное — текст. Эмодзи без пары пропускаются. */
export function OgText({ text, size, color, gap = 10 }: { text: string; size: number; color?: string; gap?: number }) {
  const parts = text.split(EMOJI);
  return (
    <div style={{ display: "flex", alignItems: "center", gap, ...(color ? { color } : {}) }}>
      {parts.map((part, i) => {
        if (i % 2 === 0) return part.trim() ? <span key={i}>{part.trim()}</span> : null;
        const name = emojiIconName(part);
        return name ? (
          <div key={i} style={{ display: "flex", width: Math.round(size * 1.05), height: Math.round(size * 1.05), ...(color ? { color } : {}) }}>
            <GIcon name={name} size={Math.round(size * 1.05)} plain />
          </div>
        ) : null;
      })}
    </div>
  );
}
