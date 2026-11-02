"use client";

// Кармашек «Глубже» (эталон 11_glubzhe.png): космос с планетами, светящееся название, карточки на крючке с золотым замком и
// ярлычком («скоро» или «Premium»), в центре рисунок теста в кольце с «орбитой», внизу тетрадь в клетку с записями и созвездием.
// Логика (что открывает карточка) — в SectionScreen. Всё SVG и CSS, без картинок и эмодзи.
import type { CSSProperties, ReactNode } from "react";
import { BackTag } from "@gazgame/ui";
import { Glyph } from "@/components/casino/GIcon";
import { RandomButton } from "@/components/casino/CasinoDeckView";
import { sfx } from "@/lib/sfx";
import type { DiaryEntry } from "./DiaryDeckView";
import "@/components/casino/casino-deck.css";
import "./diary.css";
import "./diary-deck.css";
import "./cosmos.css";

const V = "#a98bff";
const VL = "#d8c8ff";
const CY = "#62d2ff";
const GD = "#f0c75a";
const PK = "#ff6fae";
const GR = "#8be0a0";
const NV = "#1a1240";

/** Значки тестов «Глубже»: 2–3 цвета космической палитры. */
const ART: Record<string, ReactNode> = {
  // Сравнись с другом: двое
  "👯": (
    <>
      <circle cx="16" cy="11" r="6" fill={GD} />
      <circle cx="32" cy="11" r="6" fill={PK} />
      <path d="M6 42l3-18c1-5 5-7 7-7s6 2 7 7l2 18zM25 42l2-18c1-5 5-7 7-7s6 2 7 7l3 18z" fill={VL} stroke={NV} strokeWidth="1.400" strokeLinejoin="round" />
      <path d="M12 27h8M30 27h8" stroke={V} strokeWidth="2.400" strokeLinecap="round" />
    </>
  ),
  // Пазл личности
  "🧩": (
    <>
      <path d="M6 14h12a5 5 0 1 1 10 0h14v12a5 5 0 1 0 0 10v10H28a5 5 0 1 1-10 0H6V36a5 5 0 1 0 0-10z" fill={GR} stroke={NV} strokeWidth="1.600" strokeLinejoin="round" />
      <path d="M12 20c3-3 7-3 10 0" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="2.400" strokeLinecap="round" />
    </>
  ),
  // Ты месяц назад: бумеранг
  "🪃": (
    <>
      <path d="M6 10c20-4 36 6 36 28-4-12-14-18-26-16 4 6 4 12 0 20-6-10-10-22-10-32z" fill={GD} stroke={NV} strokeWidth="1.600" strokeLinejoin="round" />
      <path d="M12 15c10-1 18 3 24 10" fill="none" stroke={CY} strokeWidth="2.600" strokeLinecap="round" />
    </>
  ),
  // Полные разборы: ДНК
  "🧬": (
    <>
      <path d="M14 4c0 14 20 16 20 40M34 4c0 14-20 16-20 40" fill="none" stroke={V} strokeWidth="4" strokeLinecap="round" />
      <path d="M17 12h14M15 20h18M15 28h18M17 36h14" stroke={CY} strokeWidth="3" strokeLinecap="round" />
      <circle cx="14" cy="5" r="2.600" fill={PK} />
      <circle cx="34" cy="43" r="2.600" fill={PK} />
    </>
  ),
  // Тёмная триада: чёртик
  "😈": (
    <>
      <path d="M9 6c0 8 3 11 8 12M39 6c0 8-3 11-8 12" fill={PK} stroke={NV} strokeWidth="1.400" />
      <circle cx="24" cy="27" r="16" fill={V} stroke={NV} strokeWidth="1.600" />
      <path d="M14 23l8 3M34 23l-8 3" stroke={NV} strokeWidth="3" strokeLinecap="round" />
      <path d="M15 32c5 7 13 7 18 0z" fill={NV} />
      <path d="M19 32v3M24 32v4M29 32v3" stroke="#fff" strokeWidth="1.800" />
    </>
  ),
  // Архетип по Юнгу: хрустальный шар со звездой
  "🔮": (
    <>
      <path d="M10 44c0-6 5-8 14-8s14 2 14 8z" fill={GD} />
      <circle cx="24" cy="21" r="16" fill={V} stroke={NV} strokeWidth="1.600" />
      <path d="M13 19c1-6 6-10 11-10" fill="none" stroke={VL} strokeWidth="3" strokeLinecap="round" />
      <path d="M26 15l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill={GD} />
    </>
  ),
  // Уровень тревоги: спираль
  "🌀": (
    <>
      <circle cx="24" cy="24" r="20" fill={NV} stroke={V} strokeWidth="1.600" />
      <path d="M24 24c0-3 4-3 4 0s-6 4-8 0 4-10 12-8 8 12 2 18-18 4-20-8" fill="none" stroke={CY} strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="24" r="2" fill={GD} />
    </>
  ),
};

function CosmosIcon({ emoji, label }: { emoji: string; label: string }) {
  const art = ART[emoji.replace(/[\u{FE0F}\u{200D}]/gu, "")];
  if (!art) return <Glyph emoji={emoji} label={label} size="3.6em" />;
  return (
    <svg viewBox="0 0 48 48" width="3.6em" height="3.6em" aria-hidden="true" focusable="false" style={{ display: "block" }}>
      {art}
    </svg>
  );
}

/** Подписи и «число игроков» карточек по месту в списке (как в макете: «2 · РАЗБОР», «ПОРТРЕТ»). */
const CAPTIONS = ["2 · РАЗБОР", "ПОРТРЕТ", "СРАВНЕНИЕ", "РАЗБОРЫ", "ТЕСТ", "ТЕСТ", "ТЕСТ"];

function Padlock() {
  return (
    <svg className="cm-lock" viewBox="0 0 40 52" aria-hidden="true">
      <path d="M12 22v-6a8 8 0 0 1 16 0v6" fill="none" stroke="#8a8f9c" strokeWidth="4" strokeLinecap="round" />
      <rect x="4" y="21" width="32" height="26" rx="5" fill="url(#cm-gold)" stroke="#7a5410" strokeWidth="1.600" />
      <circle cx="20" cy="31" r="3.600" fill="#3a2208" />
      <path d="M18.500 33h3l1 8h-5z" fill="#3a2208" />
      <path d="M8 25h12" stroke="#fff6c8" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Hook() {
  return (
    <svg className="cm-hook" viewBox="0 0 40 40" aria-hidden="true">
      <path d="M8 36V14a12 12 0 0 1 24 0v4" fill="none" stroke="#9aa1ad" strokeWidth="4" strokeLinecap="round" />
      <path d="M8 36V14a12 12 0 0 1 12-12" fill="none" stroke="#e6eaf0" strokeOpacity=".7" strokeWidth="1.400" strokeLinecap="round" />
    </svg>
  );
}

function Constellation() {
  return (
    <svg className="cm-const" viewBox="0 0 300 160" aria-hidden="true">
      <path d="M20 120L60 60 110 80 150 20 200 40" fill="none" stroke="#e8e0ff" strokeWidth="1.200" />
      <path d="M170 140l40-24 50 10" fill="none" stroke="#b9a8ff" strokeWidth="1.200" opacity=".8" />
      {[
        [20, 120],
        [60, 60],
        [110, 80],
        [150, 20],
        [200, 40],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="4.500" fill="#fff" />
      ))}
    </svg>
  );
}

export function CosmosDeckView({
  title,
  entries,
  onBack,
  onPick,
  onRandom,
}: {
  title: string;
  entries: DiaryEntry[];
  onBack: () => void;
  onPick: (index: number) => void;
  onRandom: (() => void) | null;
}) {
  return (
    <div className="dr-page cm-page">
      <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="cm-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff1c4" />
            <stop offset=".5" stopColor="#d9ae4a" />
            <stop offset="1" stopColor="#8a6420" />
          </linearGradient>
        </defs>
      </svg>
      <span className="cm-planet cm-p1" aria-hidden="true" />
      <span className="cm-planet cm-p2" aria-hidden="true" />
      <span className="cm-stars" aria-hidden="true" />
      <div className="dr-scroll">
        <div className="dr-inner cm-inner">
          <div className="dd-top">
            <BackTag
              onClick={() => {
                sfx.page();
                onBack();
              }}
            >
              ← К колодам
            </BackTag>
            {onRandom && <RandomButton onClick={onRandom} />}
          </div>
          <h1 className="cm-title">{title}</h1>
          <ul className="cm-grid">
            {entries.map((e, n) => {
              const style = { "--cm-tilt": `${n % 2 ? 0.6 : -1}deg`, "--cm-i": n } as CSSProperties;
              const players = n === 0 ? 2 : 1;
              const tag = e.soon ? "скоро" : "Premium";
              return (
                <li key={`${e.title}-${e.index}`} style={style}>
                  <button
                    type="button"
                    className="cm-card"
                    data-soon={e.soon || undefined}
                    aria-label={`${e.title}${e.soon ? ", скоро" : ""}${e.locked ? ", закрыто: нужен Premium" : ""}`}
                    onClick={() => {
                      sfx.flip();
                      onPick(e.index);
                    }}
                  >
                    <Hook />
                    <Padlock />
                    <i className="cm-tag">{tag}</i>
                    <span className="cm-corner cm-tl">{players}</span>
                    <span className="cm-corner cm-br">{players}</span>
                    <span className="cm-ring">
                      <CosmosIcon emoji={e.emoji} label={e.title} />
                    </span>
                    <b className="cm-name">{e.title}</b>
                    <span className="cm-cap">{CAPTIONS[n % CAPTIONS.length]}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="cm-note" aria-hidden="true">
            <p>я + мечты = ∞</p>
            <p>кто я, если никто не смотрит?</p>
            <Constellation />
            <p className="cm-mine">моё созвездие</p>
          </div>
        </div>
      </div>
    </div>
  );
}
