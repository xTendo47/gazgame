// Значки казино для экранов игр «Тусовки»: один цвет (currentColor), SVG вместо эмодзи.
// <GIcon name="fire" /> — значок по имени; <Glyph emoji="🔪" /> — значок для эмодзи из данных (роли, ранги, колоды):
// так тексты в JSON остаются как есть, а на экране рисуется SVG. Незнакомое эмодзи → золотая фишка с буквой.
import type { ReactNode } from "react";

const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const ICONS = {
  fire: <path d="M12 3c1 3.500 5 5.500 5 10.500a5 5 0 0 1-10 0c0-2 1-3.500 2-4.500.2 1.500.8 2.300 1.700 2.800C10.500 9 10.800 5.500 12 3z" fill="currentColor" />,
  next: <path d="M5 6l6 6-6 6M12 6l6 6-6 6" {...S} />,
  back: <path d="M19 6l-6 6 6 6M12 6l-6 6 6 6" {...S} />,
  arrow: <path d="M4 12h15M13 6l6 6-6 6" {...S} />,
  arrowBack: <path d="M20 12H5M11 6l-6 6 6 6" {...S} />,
  flag: (
    <>
      <path d="M5 21V4" {...S} />
      <path d="M5 4h13l-2.500 4L18 12H5z" fill="currentColor" />
    </>
  ),
  refresh: <path d="M20 12a8 8 0 1 1-2.400-5.700M20 4v5h-5" {...S} />,
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4c0 3 1.500 5 3.500 5M17 6h3c0 3-1.500 5-3.500 5M12 14v4M8 20h8" {...S} />
    </>
  ),
  crown: <path d="M3 8l4.500 4L12 5l4.500 7L21 8l-2 11H5zM5 21h14" fill="currentColor" stroke="currentColor" strokeWidth="1.400" strokeLinejoin="round" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2.500" fill="currentColor" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" {...S} />
    </>
  ),
  diamond: <path d="M7 4h10l4 5-9 11L3 9zM3 9h18M9 4l-2 5 5 11 5-11-2-5" {...S} strokeWidth="1.600" />,
  timer: (
    <>
      <circle cx="12" cy="13.500" r="7.500" {...S} />
      <path d="M12 9.500v4l2.500 2M9.500 3h5M12 3v3" {...S} />
    </>
  ),
  dice: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3.500" {...S} />
      <circle cx="8.800" cy="8.800" r="1.400" fill="currentColor" />
      <circle cx="15.200" cy="8.800" r="1.400" fill="currentColor" />
      <circle cx="12" cy="12" r="1.400" fill="currentColor" />
      <circle cx="8.800" cy="15.200" r="1.400" fill="currentColor" />
      <circle cx="15.200" cy="15.200" r="1.400" fill="currentColor" />
    </>
  ),
  knife: <path d="M5 20l3-3M7 15l9.500-10c1.500-.5 3 0 3.500.5-.5 3.500-3 7-6 9l-3.500 1.500z" fill="currentColor" stroke="currentColor" strokeWidth="1.400" strokeLinejoin="round" />,
  moon: <path d="M19 14.500A8 8 0 0 1 9.500 5 8 8 0 1 0 19 14.500z" fill="currentColor" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4.200" fill="currentColor" />
      <path d="M12 2.500v2.500M12 19v2.500M2.500 12H5M19 12h2.500M5.300 5.300l1.800 1.800M16.900 16.900l1.800 1.800M5.300 18.700l1.800-1.800M16.900 7.100l1.800-1.800" {...S} />
    </>
  ),
  skull: (
    <>
      <path d="M12 3C7.500 3 5 6 5 9.500c0 2.500 1 4 2.500 5V18h9v-3.500c1.500-1 2.500-2.500 2.500-5C19 6 16.500 3 12 3z" fill="currentColor" />
      <circle cx="9.300" cy="10.200" r="1.700" fill="#0b2a1c" />
      <circle cx="14.700" cy="10.200" r="1.700" fill="#0b2a1c" />
      <path d="M10 21v-3M12 21v-3M14 21v-3" stroke="currentColor" strokeWidth="1.700" strokeLinecap="round" />
    </>
  ),
  hide: (
    <>
      <path d="M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12z" {...S} />
      <circle cx="12" cy="12" r="2.800" {...S} />
      <path d="M4 4l16 16" {...S} />
    </>
  ),
  eyes: (
    <>
      <circle cx="7.500" cy="12" r="4.300" {...S} />
      <circle cx="16.500" cy="12" r="4.300" {...S} />
      <circle cx="8.300" cy="12.400" r="1.600" fill="currentColor" />
      <circle cx="17.300" cy="12.400" r="1.600" fill="currentColor" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
      <path d="M5.500 11a6.500 6.500 0 0 0 13 0M12 17.500V21M8.500 21h7" {...S} />
    </>
  ),
  cards: (
    <>
      <rect x="3.500" y="6" width="10" height="14" rx="2" transform="rotate(-12 8.500 13)" {...S} />
      <rect x="10.500" y="4.500" width="10" height="14" rx="2" fill="currentColor" transform="rotate(10 15.500 11.500)" />
    </>
  ),
  spy: (
    <>
      <path d="M3 11h18M6 11l1.500-6h9L18 11" {...S} />
      <circle cx="8" cy="16" r="3" {...S} />
      <circle cx="16" cy="16" r="3" {...S} />
      <path d="M11 16h2" {...S} />
    </>
  ),
  thumbUp: <path d="M7 11v9H4v-9zM7 11l4-8c1.700 0 2.500 1 2.200 2.600L12.700 9H19a2 2 0 0 1 2 2.300l-1.200 6.500A2.500 2.500 0 0 1 17.300 20H7" {...S} />,
  thumbDown: <path d="M7 13V4H4v9zM7 13l4 8c1.700 0 2.500-1 2.200-2.600L12.700 15H19a2 2 0 0 0 2-2.300l-1.200-6.500A2.500 2.500 0 0 0 17.300 4H7" {...S} />,
  phone: (
    <>
      <rect x="6.500" y="2.500" width="11" height="19" rx="2.500" {...S} />
      <path d="M10.500 18.500h3" {...S} />
    </>
  ),
  link: <path d="M10 14a4 4 0 0 0 5.700 0l3-3A4 4 0 0 0 13 5.300l-1 1M14 10a4 4 0 0 0-5.700 0l-3 3A4 4 0 0 0 11 18.700l1-1" {...S} />,
  key: (
    <>
      <circle cx="8" cy="12" r="4.500" {...S} />
      <path d="M12.500 12H21M18 12v3.500M15 12v2.500" {...S} />
    </>
  ),
  check: <path d="M4.500 12.500l5 5L19.500 7" {...S} strokeWidth="2.600" />,
  cross: <path d="M6 6l12 12M18 6L6 18" {...S} strokeWidth="2.600" />,
  star: <path d="M12 3l2.700 5.600 6.100.9-4.400 4.300 1 6.100L12 17l-5.400 2.900 1-6.100L3.200 9.500l6.100-.9z" fill="currentColor" />,
  horse: <path d="M7 21h11M9 21c0-4 1.500-5 1.500-7.500C8.500 13 7 11 7 9c0-3 2.500-5.500 6-5.500l1.500 2.500c2 .5 3.500 2.500 3.500 5 0 3-1 5-1 10" fill="currentColor" stroke="currentColor" strokeWidth="1.400" strokeLinejoin="round" />,
  lips: <path d="M3 12c3-4 6-4.500 9-2.500 3-2 6-1.500 9 2.500-3 5-6 6-9 6s-6-1-9-6zM3 12h18" {...S} />,
  city: <path d="M3 21V10h6v11M9 21V4h6v17M15 21v-8h6v8M2 21h20M11.500 8h1M11.500 12h1M11.500 16h1" {...S} />,
  pin: (
    <>
      <path d="M12 21s-6.500-6-6.500-11a6.500 6.500 0 0 1 13 0c0 5-6.500 11-6.500 11z" {...S} />
      <circle cx="12" cy="10" r="2.300" fill="currentColor" />
    </>
  ),
  hand: <path d="M8 12V5.500a1.500 1.500 0 0 1 3 0V11M11 10V4a1.500 1.500 0 0 1 3 0v6M14 10V5.500a1.500 1.500 0 0 1 3 0V13M17 9.500a1.500 1.500 0 0 1 3 0V14c0 4-3 7-7 7-3 0-4.500-1.500-6.500-4.500L4 12.500c-.5-1 .5-2.200 1.700-1.700L8 12.500" {...S} strokeWidth="1.700" />,
  heart: <path d="M12 20S3.500 14.500 3.500 8.800A4.600 4.600 0 0 1 12 6.500a4.600 4.600 0 0 1 8.500 2.300C20.500 14.500 12 20 12 20z" fill="currentColor" />,
  bulb: (
    <>
      <path d="M9 17c0-2-3-3.500-3-7a6 6 0 0 1 12 0c0 3.500-3 5-3 7z" {...S} />
      <path d="M9.500 20.500h5M10.500 17.500v3" {...S} />
    </>
  ),
  puzzle: <path d="M4 9h3a2 2 0 1 1 4 0h3v3a2 2 0 1 1 0 4v4H4v-4a2 2 0 1 0 0-4zM14 12h6v8h-6" {...S} strokeWidth="1.700" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8.500" {...S} />
      <circle cx="12" cy="12" r="4.500" {...S} />
      <circle cx="12" cy="12" r="1.500" fill="currentColor" />
    </>
  ),
  chat: <path d="M4 5h16v11H11l-5 4v-4H4z" {...S} />,
  cup: <path d="M5 8h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 9.500h1.500a2.500 2.500 0 0 1 0 5H16M8 3.500v2M11 3.500v2M14 3.500v2" {...S} />,
  wave: <path d="M2 9c2.500-3 4.500-3 7 0s4.500 3 7 0 3-2.500 6 0M2 15c2.500-3 4.500-3 7 0s4.500 3 7 0 3-2.500 6 0" {...S} />,
  rocket: <path d="M12 2.500c3.500 2 5 6 4.500 10l-2 3h-5l-2-3c-.5-4 1-8 4.500-10zM9.500 15.500L7 20l3-1M14.500 15.500L17 20l-3-1M12 8.500v.1" {...S} />,
  brain: <path d="M12 5v15M12 5a3.500 3.500 0 0 0-6.500 1.500A3.500 3.500 0 0 0 4 12a3.500 3.500 0 0 0 2 5 3.500 3.500 0 0 0 6 1.500M12 5a3.500 3.500 0 0 1 6.500 1.500A3.500 3.500 0 0 1 20 12a3.500 3.500 0 0 1-2 5 3.500 3.500 0 0 1-6 1.500" {...S} strokeWidth="1.700" />,
  bolt: <path d="M13.500 2.500L5 13.500h6l-1 8 8.500-11h-6z" fill="currentColor" />,
  magnet: <path d="M5 4v9a7 7 0 0 0 14 0V4h-4v9a3 3 0 0 1-6 0V4zM5 8h4M15 8h4" {...S} />,
  turtle: <path d="M4 16c0-5 3.500-8 8-8s8 3 8 8zM3 16h18M6 19l1.500-3M17.500 16L19 19M20 12.500l2-1.500" {...S} />,
  sign: (
    <>
      <path d="M12 21V12" {...S} />
      <path d="M4 4h16v8H4z" fill="currentColor" stroke="currentColor" strokeWidth="1.400" strokeLinejoin="round" />
    </>
  ),
  question: <path d="M8.500 9a3.500 3.500 0 1 1 5 3.200c-1.200.7-1.500 1.300-1.500 2.800M12 19v.5" {...S} strokeWidth="2.400" />,
  home: <path d="M3.500 11.500L12 4l8.500 7.500M6 10v10h12V10M10 20v-5h4v5" {...S} />,
  mask: <path d="M4 5c5 2 11 2 16 0 1 7-1 14-8 15C5 19 3 12 4 5zM8 10c1-.8 2.500-.8 3 0M13 10c1-.8 2.500-.8 3 0M9 15c2 1.500 4 1.500 6 0" {...S} strokeWidth="1.700" />,
  megaphone: <path d="M4 10v4h3l8 4V6L7 10zM18 9.500c1.500 1 1.500 4 0 5M7 14l1 5h3l-1-4" {...S} strokeWidth="1.700" />,
  pepper: <path d="M13 6c1-2 3-3 5-2-1 1-1 2-2 3 3 3 2 8-3 11-4 2-8 1-9-1 3 0 6-2 7-5 1-2 1-4 2-6z" fill="currentColor" />,
  ghost: <path d="M5 21V11a7 7 0 0 1 14 0v10l-3-2-2 2-2-2-2 2-2-2z" fill="currentColor" />,
  spade: <path d="M12 3C9 8 4 10.500 4 14.500c0 2.500 2 4 4 4 1.500 0 2.500-.5 3.200-1.500-.2 2-.8 3.500-2.200 4.500h6c-1.400-1-2-2.500-2.200-4.500.7 1 1.700 1.500 3.200 1.500 2 0 4-1.500 4-4C20 10.500 15 8 12 3z" fill="currentColor" />,
  book: <path d="M4 5.500C7 4.500 10 5 12 7c2-2 5-2.500 8-1.500V19c-3-1-6-.5-8 1.500C10 18.500 7 18 4 19z M12 7v13" {...S} strokeWidth="1.700" />,
  music: <path d="M9 18V6l11-2v12M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zM20 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3z" {...S} strokeWidth="1.700" />,
  camera: (
    <>
      <path d="M4 8h3l1.500-2.500h7L17 8h3v11H4z" {...S} />
      <circle cx="12" cy="13.500" r="3.500" {...S} />
    </>
  ),
  sparkle: <path d="M12 3l1.800 6.200L20 11l-6.200 1.800L12 19l-1.800-6.200L4 11l6.200-1.800z" fill="currentColor" />,
} satisfies Record<string, ReactNode>;

export type GIconName = keyof typeof ICONS;

export function GIcon({ name, size = "1.15em", className }: { name: GIconName; size?: number | string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" className={className} style={{ display: "inline-block", verticalAlign: "-0.16em", flexShrink: 0 }}>
      {ICONS[name]}
    </svg>
  );
}

// Какое эмодзи из данных каким значком рисуется (остальное — фишка с буквой)
const BY_EMOJI: Record<string, GIconName> = {
  "🔥": "fire", "👉": "next", "🏁": "flag", "🔄": "refresh", "🏆": "trophy", "👑": "crown", "🔒": "lock", "💎": "diamond",
  "⏱": "timer", "🎲": "dice", "🔪": "knife", "🌙": "moon", "☀": "sun", "☠": "skull", "🙈": "hide", "🎙": "mic",
  "🃏": "cards", "🕵": "spy", "👍": "thumbUp", "👎": "thumbDown", "📱": "phone", "🔗": "link", "🗝": "key", "🔑": "key",
  "👀": "eyes", "✓": "check", "✅": "check", "✕": "cross", "✗": "cross", "⭐": "star", "🐴": "horse", "🤫": "lips",
  "🏙": "city", "🏠": "home", "📍": "pin", "✋": "hand", "🙌": "hand", "💞": "heart", "💡": "bulb", "🧩": "puzzle",
  "🎯": "target", "💬": "chat", "🗣": "chat", "☕": "cup", "🌊": "wave", "🚀": "rocket", "🧠": "brain", "⚡": "bolt",
  "🧲": "magnet", "🐢": "turtle", "🪧": "sign", "🫷": "hand", "🫢": "hide", "🤔": "question", "🤨": "question",
  "🎬": "mask", "🎭": "mask", "🎤": "mic", "👯": "heart", "🤝": "link", "🫵": "target", "🫣": "hide", "🫂": "heart",
  "🌶": "pepper", "👽": "ghost", "🔮": "sparkle", "🫧": "sparkle", "🤜": "hand", "🤿": "wave", "📚": "book",
  "📖": "book", "📸": "camera", "🎶": "music", "🎸": "music", "🎧": "music", "🪩": "sparkle", "🕯": "sparkle", "😏": "mask",
  "😇": "sparkle", "🎉": "sparkle", "🙂": "sparkle", "😜": "mask", "🟢": "check", "🟡": "bolt", "🪓": "knife",
  "📰": "book", "🐉": "ghost", "💉": "bolt", "🎺": "megaphone", "📣": "megaphone",
};

const CLEAN = /[️‍\u{1F3FB}-\u{1F3FF}]/gu;

/** Значок для эмодзи из данных. Если пары нет — золотая фишка с первой буквой подписи (или пиками). */
export function Glyph({ emoji, label, size = "1.15em", className }: { emoji: string; label?: string; size?: number | string; className?: string }) {
  const key = emoji.replace(CLEAN, "");
  const name = BY_EMOJI[key] ?? BY_EMOJI[[...key][0] ?? ""];
  if (name) return <GIcon name={name} size={size} className={className} />;
  const letter = label?.trim().charAt(0).toUpperCase();
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" className={className} style={{ display: "inline-block", verticalAlign: "-0.16em", flexShrink: 0 }}>
      <circle cx="12" cy="12" r="9.500" fill="none" stroke="currentColor" strokeWidth="1.800" />
      {letter ? (
        <text x="12" y="16.400" textAnchor="middle" fontSize="12" fontWeight="900" fill="currentColor" fontFamily="Georgia, serif">
          {letter}
        </text>
      ) : (
        <path d="M12 6.500c-1.500 2.500-4 3.500-4 5.500 0 1.200 1 2 2 2 .7 0 1.300-.3 1.600-.8-.1 1-.4 1.700-1.100 2.300h3c-.7-.6-1-1.300-1.100-2.300.3.500.9.800 1.600.8 1 0 2-.8 2-2 0-2-2.500-3-4-5.500z" fill="currentColor" />
      )}
    </svg>
  );
}
