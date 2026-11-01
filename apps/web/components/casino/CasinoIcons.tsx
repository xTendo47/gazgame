// Рисунки игр на карточках «Тусовки» (SVG, без эмодзи). Ключ — эмодзи, которым игра помечена в sections.json:
// так карточка не зависит от названий и новые игры с теми же значками подхватываются сами.
import type { ReactNode } from "react";

const INK = "#2a1a10";
const RED = "#c8321c";
const GOLD = "#d9b45a";
const SKIN = "#f2c9a0";

const ICONS: Record<string, ReactNode> = {
  // Правда или действие: мишень со стрелой
  "🎯": (
    <>
      <circle cx="22" cy="26" r="17" fill="#fff" stroke={INK} strokeWidth="2" />
      <circle cx="22" cy="26" r="12" fill={RED} />
      <circle cx="22" cy="26" r="7.5" fill="#fff" />
      <circle cx="22" cy="26" r="3.6" fill={RED} />
      <path d="M22 26 40 8" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M36 6l6-1-1 6zM38 12l4-4" fill="#2a63b8" stroke="#2a63b8" strokeWidth="1.2" />
    </>
  ),
  // Я никогда не…: лицо, закрытое ладонями
  "🫣": (
    <>
      <circle cx="24" cy="24" r="16" fill="#f6d36a" stroke={INK} strokeWidth="2" />
      <path d="M9 22c4-6 9-7 15-7s11 1 15 7l-3 9H12z" fill={SKIN} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 22v8M19 20v10M24 19v11M29 20v10M34 22v8" stroke={INK} strokeOpacity=".4" strokeWidth="1.2" />
      <circle cx="19" cy="25" r="1.800" fill={INK} />
      <circle cx="30" cy="25" r="1.800" fill={INK} />
    </>
  ),
  // Дилеммы: развилка со стрелками
  "🫨": (
    <>
      <path d="M24 42V26M24 26 12 14M24 26 36 14" fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M6 20 12 8l9 8zM42 20 36 8l-9 8z" fill={RED} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="24" cy="42" r="3.4" fill={GOLD} stroke={INK} strokeWidth="1.6" />
    </>
  ),
  // Насколько ты знаешь друга: два силуэта рядом
  "🤜": (
    <>
      <circle cx="16" cy="16" r="7" fill="#3f7fd6" stroke={INK} strokeWidth="1.8" />
      <path d="M3 40c0-10 6-15 13-15s13 5 13 15z" fill="#3f7fd6" stroke={INK} strokeWidth="1.8" />
      <circle cx="32" cy="18" r="6.500" fill="#6fa5ee" stroke={INK} strokeWidth="1.8" />
      <path d="M20 42c0-9 5-14 12-14s12 5 12 14z" fill="#6fa5ee" stroke={INK} strokeWidth="1.8" />
    </>
  ),
  // Совпадём? Друзья: две руки, сходящиеся в сердце
  "👯": (
    <>
      <path d="M24 40C10 31 5 24 5 17c0-6 4-10 9-10 4 0 8 2 10 6 2-4 6-6 10-6 5 0 9 4 9 10 0 7-5 14-19 23z" fill={RED} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 14c2-3 5-3 7-1" stroke="#fff" strokeOpacity=".6" strokeWidth="2" strokeLinecap="round" fill="none" />
    </>
  ),
  // Данетки: лупа над вопросом
  "🫥": (
    <>
      <circle cx="20" cy="20" r="13" fill="#e9f0f6" stroke={INK} strokeWidth="3" />
      <path d="M30 30 42 42" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <path d="M16 16c0-4 8-4 8 0 0 3-4 3-4 7" fill="none" stroke={INK} strokeWidth="2.600" strokeLinecap="round" />
      <circle cx="20" cy="27.500" r="1.700" fill={INK} />
    </>
  ),
  // Кто я?: карточка-пропуск с силуэтом
  "🪪": (
    <>
      <rect x="5" y="11" width="38" height="27" rx="3.500" fill="#e8d8b0" stroke={INK} strokeWidth="2" />
      <circle cx="17" cy="22" r="5" fill="#8a6f4a" />
      <path d="M8 35c0-6 4-8 9-8s9 2 9 8z" fill="#8a6f4a" />
      <path d="M29 20h10M29 26h10M29 32h7" stroke={INK} strokeWidth="2.200" strokeLinecap="round" />
    </>
  ),
  // 5 секунд: секундомер
  "⏱": (
    <>
      <rect x="20" y="3" width="8" height="5" rx="1.500" fill={INK} />
      <circle cx="24" cy="26" r="17" fill="#f4eee0" stroke={INK} strokeWidth="2.600" />
      <path d="M24 26V14M24 26l8 5" stroke={RED} strokeWidth="2.800" strokeLinecap="round" />
      <path d="M37 11l3-3" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="26" r="2" fill={INK} />
    </>
  ),
  // Угадай по эмодзи: пазл
  "🧩": (
    <>
      <path d="M18 7a4.500 4.500 0 0 1 9 0v3h10v10h3a4.500 4.500 0 0 1 0 9h-3v10H28v-3a4.500 4.500 0 0 0-9 0v3H9V30H6a4.500 4.500 0 0 1 0-9h3V10h9z" fill="#4cb534" stroke="#2f7f1f" strokeWidth="2" strokeLinejoin="round" />
      <path d="M13 13h6" stroke="#9be07e" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  // Норм или стрём: задумавшееся лицо
  "🤔": (
    <>
      <circle cx="24" cy="24" r="17" fill="#f6d36a" stroke={INK} strokeWidth="2" />
      <path d="M13 17l8-2M27 15l8 2" stroke={INK} strokeWidth="2.400" strokeLinecap="round" />
      <circle cx="18" cy="23" r="2.200" fill={INK} />
      <circle cx="31" cy="23" r="2.200" fill={INK} />
      <path d="M17 33c3-2 8-2 11 0" stroke={INK} strokeWidth="2.400" strokeLinecap="round" fill="none" />
      <path d="M32 31c3 1 5 4 3 7" stroke={INK} strokeWidth="2.200" strokeLinecap="round" fill="none" />
    </>
  ),
  // Кто из нас?: указательный палец
  "🫵": (
    <>
      <path d="M21 4a3.500 3.500 0 0 1 7 0v20l5 1c4 1 6 3 6 8 0 6-3 10-10 10H22c-4 0-6-2-8-5l-7-9c-1-2 1-4 3-3l5 3z" fill={SKIN} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M24.500 6v14" stroke={INK} strokeOpacity=".3" strokeWidth="1.400" />
    </>
  ),
  // Шпион: шляпа и очки
  "🕵": (
    <>
      <ellipse cx="24" cy="21" rx="19" ry="5" fill={INK} />
      <path d="M12 21c0-9 5-14 12-14s12 5 12 14z" fill="#3a3a44" stroke={INK} strokeWidth="1.600" />
      <path d="M12 19h24" stroke={RED} strokeWidth="3" />
      <path d="M10 27h28v6c0 6-5 9-14 9s-14-3-14-9z" fill={SKIN} stroke={INK} strokeWidth="1.800" />
      <circle cx="18" cy="31" r="4.500" fill="#222" stroke={INK} strokeWidth="1.400" />
      <circle cx="30" cy="31" r="4.500" fill="#222" stroke={INK} strokeWidth="1.400" />
      <path d="M22.500 31h3" stroke={INK} strokeWidth="1.600" />
    </>
  ),
  // Мафия: нож
  "🔪": (
    <>
      <path d="M9 41 31 8c3-4 8-3 8-3s0 6-4 9L16 41z" fill="#e1e5ea" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M13 38 8 43l-3-3 5-5z" fill="#5a2a14" stroke={INK} strokeWidth="1.800" strokeLinejoin="round" />
      <path d="M33 11c2-3 4-3 5-3" stroke="#fff" strokeWidth="1.600" strokeLinecap="round" fill="none" />
      <path d="M22 28 26 33" stroke={RED} strokeWidth="2.200" strokeLinecap="round" />
    </>
  ),
  // Объясни: табличка на палке
  "🪧": (
    <>
      <path d="M24 28v16" stroke="#6a4a24" strokeWidth="4" strokeLinecap="round" />
      <rect x="6" y="6" width="36" height="24" rx="3" fill="#f1e2bd" stroke={INK} strokeWidth="2" />
      <path d="M13 14h22M13 20h22M13 26h14" stroke={INK} strokeWidth="2.200" strokeLinecap="round" />
      <circle cx="10" cy="10" r="1.200" fill={INK} />
      <circle cx="38" cy="10" r="1.200" fill={INK} />
    </>
  ),
  // Карточные игры: джокер
  "🃏": (
    <>
      <rect x="10" y="4" width="28" height="40" rx="3.500" fill="#fbf5e6" stroke={INK} strokeWidth="2" />
      <path d="M17 23c0-6 3-9 7-9s7 3 7 9z" fill="#3a6fd6" stroke={INK} strokeWidth="1.400" />
      <circle cx="24" cy="12" r="2.200" fill={GOLD} />
      <circle cx="17" cy="23.500" r="2" fill={RED} />
      <circle cx="31" cy="23.500" r="2" fill={RED} />
      <circle cx="24" cy="21" r="2" fill={GOLD} />
      <path d="M18 30c2 6 10 6 12 0" stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none" />
    </>
  ),
  // Шпион: кино, сериалы
  "🎬": (
    <>
      <rect x="5" y="19" width="38" height="24" rx="2.500" fill="#2a2a2e" stroke={INK} strokeWidth="1.800" />
      <path d="M5 19 8 8l35 6-2.500 5z" fill="#ececef" stroke={INK} strokeWidth="1.800" strokeLinejoin="round" />
      <path d="M13 9l5 9M22 11l5 9M31 12l5 8" stroke={INK} strokeWidth="3" />
      <path d="M12 28h24M12 35h14" stroke="#8a8a92" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  // Мафия с ботом-ведущим: микрофон
  "🎙": (
    <>
      <rect x="17" y="4" width="14" height="24" rx="7" fill="#c9cdd3" stroke={INK} strokeWidth="2" />
      <path d="M17 14h14M17 19h14" stroke={INK} strokeOpacity=".45" strokeWidth="1.400" />
      <path d="M10 22c0 8 6 13 14 13s14-5 14-13M24 35v8M16 43h16" fill="none" stroke={INK} strokeWidth="2.800" strokeLinecap="round" />
    </>
  ),
};

/** Пики — запасной значок, если игры с таким эмодзи нет в наборе. */
const FALLBACK = (
  <path d="M24 5C16 15 5 20 5 29c0 6 5 9 10 9 3 0 5-1 7-3-.5 4-1.500 7-4 9h12c-2.500-2-3.500-5-4-9 2 2 4 3 7 3 5 0 10-3 10-9 0-9-11-14-19-24z" fill={INK} />
);

export function GameIcon({ emoji }: { emoji: string }) {
  const key = emoji.replace(/️/g, "");
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      {ICONS[key] ?? FALLBACK}
    </svg>
  );
}
