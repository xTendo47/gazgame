// Цветные значки тестов в списках кармашков «Дневника»: 2–3 цвета из палитры кармашка, рисуются SVG, эмодзи нет.
// «Ты в розыске»: пергамент, бирюза, тёмное и красная печать. «Психо» (эталон 10): бирюза клиники, мята, белое и один цвет-акцент.
// Нет рисунка для эмодзи — запасной однотонный значок из GIcon.
import type { ReactNode } from "react";
import { Glyph } from "@/components/casino/GIcon";

const W = {
  paper: "#f3e2b4",
  paperD: "#c9a25a",
  ink: "#2a1a0c",
  red: "#a1302a",
  teal: "#2f8c8a",
  tealL: "#9fd8cf",
};

const C = {
  teal: "#14707a",
  mint: "#8fdccf",
  white: "#f4fbfb",
  navy: "#123238",
  coral: "#ff7a4a",
  pink: "#f08aa0",
  green: "#6cc04a",
  bronze: "#c9925a",
  red: "#e5566c",
};

const WANTED: Record<string, ReactNode> = {
  // Какой ты персонаж: хлопушка
  "🎬": (
    <>
      <rect x="6" y="18" width="36" height="24" rx="2" fill={W.ink} />
      <rect x="9" y="26" width="30" height="13" fill={W.teal} />
      <path d="M6 10l34-5 2 9L8 19z" fill={W.paper} stroke={W.ink} strokeWidth="2" strokeLinejoin="round" />
      <path d="M13 9l6 8M23 8l6 8M33 6l6 8" stroke={W.red} strokeWidth="4" />
    </>
  ),
  // Кто ты в компании: диско-шар
  "🪩": (
    <>
      <path d="M24 2v8" stroke={W.ink} strokeWidth="2" />
      <circle cx="24" cy="27" r="16" fill={W.teal} stroke={W.ink} strokeWidth="2" />
      <path d="M8 27h32M24 11v32M12 17c8 4 16 4 24 0M12 37c8-4 16-4 24 0" fill="none" stroke={W.tealL} strokeWidth="1.600" />
      <path d="M17 19l4-3 3 4-4 3zM28 30l4-2 2 4-4 2z" fill={W.paper} />
      <path d="M41 8l1.500 3.500L46 13l-3.500 1.500L41 18l-1.500-3.500L36 13l3.500-1.500z" fill={W.red} />
    </>
  ),
  // Интроверт или экстраверт: батарейка
  "🔋": (
    <>
      <rect x="6" y="14" width="32" height="22" rx="4" fill={W.paper} stroke={W.ink} strokeWidth="2.400" />
      <rect x="38" y="20" width="5" height="10" rx="1.500" fill={W.ink} />
      <rect x="10" y="18" width="14" height="14" rx="2" fill={W.teal} />
      <path d="M24 18l-4 8h4l-2 6 7-9h-4l2-5z" fill={W.red} stroke={W.ink} strokeWidth="1" strokeLinejoin="round" />
    </>
  ),
  // Какой ты цвет: палитра
  "🎨": (
    <>
      <path d="M24 5C12 5 4 13 4 24s9 19 19 19c4 0 5-3 3-5s-1-5 3-5h6c6 0 9-3 9-8C44 13 36 5 24 5z" fill={W.paper} stroke={W.ink} strokeWidth="2.200" strokeLinejoin="round" />
      <circle cx="15" cy="21" r="3.600" fill={W.red} />
      <circle cx="24" cy="14" r="3.600" fill={W.teal} />
      <circle cx="34" cy="19" r="3.600" fill={W.ink} />
      <circle cx="13" cy="31" r="3.600" fill={W.tealL} stroke={W.ink} strokeWidth="1" />
    </>
  ),
  // Сколько тебе лет: торт
  "🎂": (
    <>
      <path d="M24 5c2 3 3 4 0 7-3-3-2-4 0-7z" fill={W.red} />
      <path d="M24 12v6" stroke={W.ink} strokeWidth="2.200" />
      <rect x="9" y="18" width="30" height="10" rx="3" fill={W.paper} stroke={W.ink} strokeWidth="2" />
      <path d="M9 22c4 4 8-1 12 2s8-2 12 1 4 0 6-2" fill="none" stroke={W.red} strokeWidth="2.400" strokeLinecap="round" />
      <rect x="5" y="28" width="38" height="14" rx="3" fill={W.teal} stroke={W.ink} strokeWidth="2" />
      <path d="M5 35h38" stroke={W.tealL} strokeWidth="2" strokeDasharray="3 3" />
    </>
  ),
  // Какое ты животное: лапка
  "🐾": (
    <>
      <path d="M24 24c-7 0-12 6-12 11 0 4 3 6 7 5 3-1 4-2 5-2s2 1 5 2c4 1 7-1 7-5 0-5-5-11-12-11z" fill={W.ink} />
      <ellipse cx="11" cy="20" rx="4" ry="5.500" transform="rotate(-20 11 20)" fill={W.red} />
      <ellipse cx="19" cy="11" rx="4" ry="5.500" fill={W.teal} />
      <ellipse cx="29" cy="11" rx="4" ry="5.500" fill={W.teal} />
      <ellipse cx="37" cy="20" rx="4" ry="5.500" transform="rotate(20 37 20)" fill={W.red} />
    </>
  ),
  // Твой знак GAZ: хрустальный шар
  "🔮": (
    <>
      <path d="M10 44c0-6 5-8 14-8s14 2 14 8z" fill={W.ink} />
      <circle cx="24" cy="21" r="16" fill={W.teal} stroke={W.ink} strokeWidth="2.200" />
      <path d="M13 20c1-6 6-10 11-10" fill="none" stroke={W.tealL} strokeWidth="3" strokeLinecap="round" />
      <path d="M26 17l1.500 4 4 1.500-4 1.500L26 28l-1.500-4-4-1.500 4-1.500z" fill={W.paper} />
    </>
  ),
  // Зомби-апокалипсис: зомби
  "🧟": (
    <>
      <path d="M8 44c0-9 7-12 16-12s16 3 16 12z" fill={W.ink} />
      <circle cx="24" cy="19" r="14" fill={W.tealL} stroke={W.ink} strokeWidth="2.200" />
      <circle cx="18" cy="17" r="3.400" fill={W.paper} stroke={W.ink} strokeWidth="1.400" />
      <circle cx="31" cy="17" r="3.400" fill={W.paper} stroke={W.ink} strokeWidth="1.400" />
      <circle cx="18.500" cy="17.500" r="1.200" fill={W.ink} />
      <circle cx="30.500" cy="17.500" r="1.200" fill={W.ink} />
      <path d="M16 26c4 3 12 3 16 0" fill="none" stroke={W.red} strokeWidth="2.600" strokeLinecap="round" />
      <path d="M20 26v3M24 27v3M28 26v3" stroke={W.paper} strokeWidth="2" />
    </>
  ),
  // Суперсила: герой в плаще
  "🦸": (
    <>
      <path d="M12 16L2 42h44L36 16z" fill={W.red} stroke={W.ink} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="24" cy="12" r="7" fill={W.paper} stroke={W.ink} strokeWidth="2" />
      <path d="M17 10h14v4c-3 1-11 1-14 0z" fill={W.teal} />
      <path d="M17 22h14l3 18H14z" fill={W.teal} stroke={W.ink} strokeWidth="2" strokeLinejoin="round" />
      <path d="M24 26l1.800 3.600 4 .6-2.900 2.800.7 4-3.600-1.900-3.600 1.900.7-4-2.900-2.800 4-.6z" fill={W.paper} />
    </>
  ),
  // Кем тебе работать: портфель
  "💼": (
    <>
      <path d="M17 14v-4a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4" fill="none" stroke={W.ink} strokeWidth="3" />
      <rect x="4" y="14" width="40" height="28" rx="4" fill={W.red} stroke={W.ink} strokeWidth="2.200" />
      <path d="M4 26h40" stroke={W.ink} strokeWidth="2.200" />
      <rect x="20" y="23" width="8" height="8" rx="1.500" fill={W.paper} stroke={W.ink} strokeWidth="1.600" />
      <path d="M9 18h30" stroke={W.paper} strokeOpacity=".5" strokeWidth="2" />
    </>
  ),
  // Твой вайб: искры
  "✨": (
    <>
      <path d="M20 4l4 12 12 4-12 4-4 12-4-12-12-4 12-4z" fill={W.red} stroke={W.ink} strokeWidth="1.800" strokeLinejoin="round" />
      <path d="M37 24l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill={W.teal} stroke={W.ink} strokeWidth="1.600" strokeLinejoin="round" />
      <path d="M38 5l1.200 3.300 3.300 1.200-3.300 1.200L38 14l-1.200-3.300-3.300-1.200 3.300-1.200z" fill={W.paperD} stroke={W.ink} strokeWidth="1.200" strokeLinejoin="round" />
    </>
  ),
  // Твой юмор: смех в ладонь
  "🤭": (
    <>
      <circle cx="24" cy="23" r="18" fill={W.paper} stroke={W.ink} strokeWidth="2.200" />
      <path d="M13 17c2-3 6-3 8 0M27 17c2-3 6-3 8 0" fill="none" stroke={W.ink} strokeWidth="2.400" strokeLinecap="round" />
      <path d="M12 30c0-4 4-6 8-5l12 2c4 1 5 5 2 8l-6 6c-4 3-12 1-14-4z" fill={W.teal} stroke={W.ink} strokeWidth="2" strokeLinejoin="round" />
      <path d="M22 31h10M21 36h9" stroke={W.tealL} strokeWidth="1.600" strokeLinecap="round" />
    </>
  ),
  // Твой город: небоскрёбы
  "🏙": (
    <>
      <circle cx="35" cy="12" r="6" fill={W.red} />
      <path d="M4 44V24h10v20zM16 44V12h12v32zM30 44V28h14v16z" fill={W.ink} />
      <path d="M19 17h2M23 17h2M19 24h2M23 24h2M19 31h2M23 31h2M33 33h2M38 33h2M33 39h2M38 39h2M7 29h2M7 35h2" stroke={W.tealL} strokeWidth="2.600" strokeLinecap="round" />
      <path d="M2 44h44" stroke={W.teal} strokeWidth="3" />
    </>
  ),
};

const CLINIC: Record<string, ReactNode> = {
  // Темперамент: вулкан
  "🌋": (
    <>
      <path d="M17 20c-1-4 2-6 0-10M24 18c-1-5 2-8 0-12M31 20c-1-4 2-6 0-10" fill="none" stroke={C.mint} strokeWidth="2.600" strokeLinecap="round" />
      <path d="M3 44L16 22h16l13 22z" fill={C.navy} />
      <path d="M16 22c3 4 6 3 8 0 3 4 6 4 8 0l-3 8-5 2-5-2z" fill={C.coral} />
      <path d="M24 32l-2 12M28 33l3 11" stroke={C.coral} strokeWidth="2.400" strokeLinecap="round" />
    </>
  ),
  // Тип мышления: мозг
  "🧠": (
    <>
      <path d="M24 8c-3-4-10-3-12 2-5 0-8 5-6 9-3 3-2 9 3 10 1 5 8 7 12 3 4 4 11 2 12-3 5-1 6-7 3-10 2-4-1-9-6-9-2-5-9-6-6-2z" fill={C.pink} stroke={C.navy} strokeWidth="1.800" strokeLinejoin="round" />
      <path d="M24 10v26M16 17c3 0 5 2 5 5M32 17c-3 0-5 2-5 5M15 28c3 0 5-1 6-3M33 28c-3 0-5-1-6-3" fill="none" stroke={C.red} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  // Анализ самооценки: зеркало
  "🪞": (
    <>
      <path d="M22 41h4v5h-4z" fill={C.bronze} />
      <ellipse cx="24" cy="22" rx="14" ry="19" fill={C.bronze} />
      <ellipse cx="24" cy="22" rx="10.500" ry="15.500" fill={C.mint} />
      <path d="M17 14c2-4 6-5 9-4M16 22c0-2 0-3 1-5" fill="none" stroke={C.white} strokeWidth="3" strokeLinecap="round" />
      <path d="M24 3c-2-1-3-3-1-3s3 2 1 3z" fill={C.bronze} />
    </>
  ),
  // Языки любви: ладони с сердцем
  "🫶": (
    <>
      <path d="M24 30C14 24 12 18 12 14a6 6 0 0 1 12-1 6 6 0 0 1 12 1c0 4-2 10-12 16z" fill={C.red} stroke={C.navy} strokeWidth="1.600" strokeLinejoin="round" />
      <path d="M3 30c4-4 9-3 13 1l8 5-3 7c-5 1-11-2-16-6z" fill={C.mint} stroke={C.teal} strokeWidth="1.800" strokeLinejoin="round" />
      <path d="M45 30c-4-4-9-3-13 1l-8 5 3 7c5 1 11-2 16-6z" fill={C.mint} stroke={C.teal} strokeWidth="1.800" strokeLinejoin="round" />
    </>
  ),
  // Как ты сейчас: градусник
  "🌡": (
    <>
      <rect x="19" y="3" width="10" height="30" rx="5" fill={C.white} stroke={C.teal} strokeWidth="2.200" />
      <circle cx="24" cy="37" r="8" fill={C.white} stroke={C.teal} strokeWidth="2.200" />
      <circle cx="24" cy="37" r="4.800" fill={C.red} />
      <rect x="22" y="14" width="4" height="22" rx="2" fill={C.red} />
      <path d="M31 9h6M31 15h4M31 21h6M31 27h4" stroke={C.mint} strokeWidth="2.400" strokeLinecap="round" />
    </>
  ),
  // Тревожность: дрожащее лицо
  "🫨": (
    <>
      <circle cx="24" cy="24" r="14" fill={C.mint} stroke={C.teal} strokeWidth="2.200" />
      <circle cx="19" cy="21" r="2.400" fill={C.navy} />
      <circle cx="29" cy="21" r="2.400" fill={C.navy} />
      <path d="M17 31c2-2 3 2 5 0s3 2 5 0 3 2 4 0" fill="none" stroke={C.navy} strokeWidth="2" strokeLinecap="round" />
      <path d="M4 16v16M8 12v24M44 16v16M40 12v24" stroke={C.coral} strokeWidth="2.600" strokeLinecap="round" />
    </>
  ),
};

export function DiaryIcon({ emoji, label, kind }: { emoji: string; label?: string; kind: "wanted" | "clinic" }) {
  const art = (kind === "wanted" ? WANTED : CLINIC)[emoji.replace(/[\u{FE0F}\u{200D}]/gu, "")];
  if (!art) return <Glyph emoji={emoji} label={label} size="1.5em" />;
  return (
    <svg viewBox="0 0 48 48" width="1.5em" height="1.5em" aria-hidden="true" focusable="false" style={{ display: "block" }}>
      {art}
    </svg>
  );
}
