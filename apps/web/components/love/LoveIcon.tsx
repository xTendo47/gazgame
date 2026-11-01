// Цветные значки на карточках колод «Романтики»: 2–3 цвета из палитры экранов 06 и 07 (розовый, золото, тёмная слива).
// Рисуются SVG, эмодзи нет. Нет значка для эмодзи — запасной однотонный значок из GIcon.
import type { ReactNode } from "react";
import { Glyph } from "@/components/casino/GIcon";

const PINK = "#ff5fa0";
const PINK_L = "#ffb3d0";
const PINK_D = "#c2336c";
const GOLD = "#e6c06a";
const GOLD_L = "#fff1c4";
const GOLD_D = "#9c7426";
const PLUM = "#2a0a1d";
const CREAM = "#ffe9f1";

const HEART = "M24 41C10 32 6 24 6 17.500 6 12 10 8.500 14.500 8.500c3.500 0 7 2 9.500 6 2.500-4 6-6 9.500-6C38 8.500 42 12 42 17.500 42 24 38 32 24 41z";

const ART: Record<string, ReactNode> = {
  // Правда или действие: мишень со стрелой
  "🎯": (
    <>
      <circle cx="21" cy="27" r="17" fill={PINK} stroke={GOLD_D} strokeWidth="1.500" />
      <circle cx="21" cy="27" r="12" fill={CREAM} />
      <circle cx="21" cy="27" r="7.500" fill={PINK} />
      <circle cx="21" cy="27" r="3" fill={GOLD} />
      <path d="M21 27L40 8" stroke={GOLD} strokeWidth="3" strokeLinecap="round" />
      <path d="M35 5l8-1-1 8zM38 11l5-5" fill={GOLD_L} stroke={GOLD_D} strokeWidth="1" strokeLinejoin="round" />
    </>
  ),
  // Я никогда не…: ладонь с сердцем
  "✋": (
    <>
      <path d="M13 24V11a3 3 0 0 1 6 0v9M19 20V7a3 3 0 0 1 6 0v13M25 20V9a3 3 0 0 1 6 0v13M31 22v-7a3 3 0 0 1 6 0v14c0 8-5 14-13 14-6 0-9-3-13-9l-5-8c-1.500-2.500 2-5 4-3l4 4" fill={CREAM} stroke={GOLD} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M25 37c-4-2.500-6-4.500-6-7a3 3 0 0 1 6-1 3 3 0 0 1 6 1c0 2.500-2 4.500-6 7z" fill={PINK} />
    </>
  ),
  // Насколько ты меня знаешь: двое обнимаются
  "🫂": (
    <>
      <circle cx="16" cy="12" r="6" fill={PINK_L} stroke={PINK_D} strokeWidth="1.400" />
      <circle cx="32" cy="12" r="6" fill={GOLD} stroke={GOLD_D} strokeWidth="1.400" />
      <path d="M5 42V30c0-6 4-10 11-10h1l7 6 7-6h1c7 0 11 4 11 10v12z" fill={PINK} stroke={PINK_D} strokeWidth="1.400" strokeLinejoin="round" />
      <path d="M24 26l-5 5 5 5 5-5z" fill={GOLD_L} stroke={GOLD_D} strokeWidth="1" strokeLinejoin="round" />
    </>
  ),
  // Совпадём?: два сердца
  "💞": (
    <>
      <path d={HEART} fill={PINK} stroke={PINK_D} strokeWidth="1.600" strokeLinejoin="round" transform="translate(-3 -2) scale(.88)" />
      <path d="M24 41C10 32 6 24 6 17.500 6 12 10 8.500 14.500 8.500c3.500 0 7 2 9.500 6 2.500-4 6-6 9.500-6C38 8.500 42 12 42 17.500 42 24 38 32 24 41z" fill={GOLD} stroke={GOLD_D} strokeWidth="1.600" strokeLinejoin="round" transform="translate(18 14) scale(.5)" />
      <path d="M10 14c2-3 5-3 7-1" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  // Капсула времени: банка с сердцем
  "🫙": (
    <>
      <rect x="12" y="6" width="24" height="7" rx="2" fill={GOLD} stroke={GOLD_D} strokeWidth="1.400" />
      <path d="M14 13h20l3 6v20a4 4 0 0 1-4 4H15a4 4 0 0 1-4-4V19z" fill={CREAM} fillOpacity=".25" stroke={CREAM} strokeWidth="2" strokeLinejoin="round" />
      <path d="M24 38c-6-3.500-9-6.500-9-10a4.500 4.500 0 0 1 9-1 4.500 4.500 0 0 1 9 1c0 3.500-3 6.500-9 10z" fill={PINK} />
    </>
  ),
  // Норм или стрём: вопрос в пузыре
  "🤔": (
    <>
      <path d="M6 8h36v26H22l-9 8v-8H6z" fill={PINK} stroke={PINK_D} strokeWidth="1.600" strokeLinejoin="round" />
      <path d="M19 18a5 5 0 1 1 7 4.500c-2 1-2 2-2 4" fill="none" stroke={GOLD_L} strokeWidth="3.400" strokeLinecap="round" />
      <circle cx="24" cy="31" r="2" fill={GOLD_L} />
    </>
  ),
  // Наш список дел: воздушный змей
  "🪁": (
    <>
      <path d="M26 3l14 15-14 20L12 18z" fill={PINK} stroke={PINK_D} strokeWidth="1.600" strokeLinejoin="round" />
      <path d="M26 3l14 15H12zM26 18v20" fill={GOLD} fillOpacity=".9" stroke={GOLD_D} strokeWidth="1.200" strokeLinejoin="round" />
      <path d="M26 38c-4 3 2 4-1 8M22 41h6M22 44h6" fill="none" stroke={GOLD} strokeWidth="1.800" strokeLinecap="round" />
    </>
  ),
  // Тип привязанности: магнит
  "🧲": (
    <>
      <path d="M9 8h10v20a5 5 0 0 0 10 0V8h10v20a15 15 0 0 1-30 0z" fill={PINK} stroke={PINK_D} strokeWidth="1.600" strokeLinejoin="round" />
      <path d="M9 8h10v8H9zM29 8h10v8H29z" fill={GOLD_L} stroke={GOLD_D} strokeWidth="1.400" />
      <path d="M14 22v6a10 10 0 0 0 4 8" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  // Языки любви: ладони складывают сердце
  "🫶": (
    <>
      <path d={HEART} fill={PINK} stroke={PINK_D} strokeWidth="1.600" strokeLinejoin="round" transform="translate(5 1) scale(.78)" />
      <path d="M3 30c4 1 9 4 14 10l-6 4C7 40 3 36 1 33z" fill={GOLD} stroke={GOLD_D} strokeWidth="1.200" strokeLinejoin="round" />
      <path d="M45 30c-4 1-9 4-14 10l6 4c4-4 8-8 10-11z" fill={GOLD} stroke={GOLD_D} strokeWidth="1.200" strokeLinejoin="round" />
    </>
  ),
  // Ревность: сердце с огоньком-бликом
  "💚": (
    <>
      <path d={HEART} fill={PINK} stroke={GOLD} strokeWidth="2.200" strokeLinejoin="round" />
      <path d="M12 16c1.500-3 5-4 8-2" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="2.600" strokeLinecap="round" />
      <circle cx="35" cy="14" r="2.500" fill={GOLD_L} />
    </>
  ),
  // Сколько романтики: роза
  "🌹": (
    <>
      <path d="M24 28v16M24 36c-4 0-7-2-8-5M24 38c3 0 6-1.500 8-4" fill="none" stroke={GOLD} strokeWidth="2.600" strokeLinecap="round" />
      <path d="M24 30c-9 0-14-6-14-14l6 3 3-9 5 4 5-4 3 9 6-3c0 8-5 14-14 14z" fill={PINK} stroke={PINK_D} strokeWidth="1.600" strokeLinejoin="round" />
      <path d="M18 17c2 3 4 4 6 4s4-1 6-4" fill="none" stroke={PINK_L} strokeWidth="1.800" strokeLinecap="round" />
    </>
  ),
  // Красный и зелёный флаг
  "🚩": (
    <>
      <path d="M12 44V5" stroke={GOLD} strokeWidth="3.400" strokeLinecap="round" />
      <path d="M12 6h26l-6 9 6 9H12z" fill={PINK} stroke={PINK_D} strokeWidth="1.600" strokeLinejoin="round" />
      <circle cx="12" cy="5" r="3" fill={GOLD_L} stroke={GOLD_D} strokeWidth="1" />
    </>
  ),
  // Что нужно в любви: письмо
  "💌": (
    <>
      <rect x="5" y="11" width="38" height="27" rx="3" fill={CREAM} stroke={GOLD} strokeWidth="1.800" />
      <path d="M5 13l19 15 19-15" fill="none" stroke={GOLD_D} strokeWidth="1.800" strokeLinejoin="round" />
      <path d="M24 33c-4-2-6-4-6-6a3 3 0 0 1 6-.800 3 3 0 0 1 6 .800c0 2-2 4-6 6z" fill={PINK} transform="translate(0 -3)" />
    </>
  ),
  // Расставания: сердце с трещиной
  "💔": (
    <>
      <path d="M24 41C10 32 6 24 6 17.500 6 12 10 8.500 14.500 8.500c3.500 0 7 2 9.500 6l-4 6 6 5-5 9z" fill={PINK} stroke={PINK_D} strokeWidth="1.600" strokeLinejoin="round" />
      <path d="M24 14.500c2.500-4 6-6 9.500-6C38 8.500 42 12 42 17.500 42 24 38 32 24 41l5-9-6-5 4-6z" fill={PINK_D} stroke={PINK_D} strokeWidth="1.600" strokeLinejoin="round" transform="translate(2.500 1)" />
      <path d="M24 14.500l-4 6 6 5-5 9" fill="none" stroke={GOLD_L} strokeWidth="1.800" strokeLinejoin="round" />
    </>
  ),
  // 36 вопросов: золотой ключ с сердцем
  "🗝": (
    <>
      <path d="M22 26L42 8M36 14l5 5M31 19l4 4" fill="none" stroke={GOLD} strokeWidth="4" strokeLinecap="round" />
      <path d="M13 24c-4-2.500-6-5-6-8a4.500 4.500 0 0 1 9-1 4.500 4.500 0 0 1 9 1c0 3-2 5.500-6 8z" fill={PINK} stroke={PINK_D} strokeWidth="1.400" transform="translate(-1 14) scale(1.4)" />
    </>
  ),
  // Здоровые отношения: светофор
  "🚦": (
    <>
      <rect x="14" y="3" width="20" height="42" rx="6" fill={PLUM} stroke={GOLD} strokeWidth="2" />
      <circle cx="24" cy="13" r="5" fill={PINK} />
      <circle cx="24" cy="24" r="5" fill={GOLD} />
      <circle cx="24" cy="35" r="5" fill={CREAM} />
    </>
  ),
  // Темперамент пары: вулкан
  "🌋": (
    <>
      <path d="M4 43L17 17h14l13 26z" fill={PLUM} stroke={GOLD} strokeWidth="1.800" strokeLinejoin="round" />
      <path d="M17 17c3 3 5 2 7 0 3 3 5 3 7 0l-2 6-5 3-5-3z" fill={PINK} />
      <path d="M18 14c-2-3 0-6-2-8M24 13V5M30 14c2-3 0-6 2-8" fill="none" stroke={GOLD_L} strokeWidth="2.200" strokeLinecap="round" />
    </>
  ),
  // Паспорт пары: карточка с фото
  "🪪": (
    <>
      <rect x="4" y="9" width="40" height="30" rx="4" fill={CREAM} stroke={GOLD} strokeWidth="2" />
      <circle cx="16" cy="21" r="5" fill={PINK} />
      <path d="M8 34c1-5 4-7 8-7s7 2 8 7z" fill={PINK_D} />
      <path d="M29 18h10M29 24h8M29 30h6" stroke={GOLD_D} strokeWidth="2.200" strokeLinecap="round" />
    </>
  ),
};

export function LoveIcon({ emoji, label }: { emoji: string; label?: string }) {
  const art = ART[emoji.replace(/[️‍]/g, "")];
  if (!art) return <Glyph emoji={emoji} label={label} />;
  return (
    <svg viewBox="0 0 48 48" width="1em" height="1em" aria-hidden="true" focusable="false" style={{ display: "block" }}>
      {art}
    </svg>
  );
}
