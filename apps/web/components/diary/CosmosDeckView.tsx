"use client";

// Кармашек «Глубже» (эталон 11_glubzhe.png): космос с планетами, светящееся название, карточки на крючке с золотым замком и
// ярлычком («скоро» или «Premium»), в центре рисунок теста в кольце с «орбитой», внизу тетрадь в клетку с записями и созвездием.
// Логика (что открывает карточка) — в SectionScreen. Всё SVG и CSS, без картинок и эмодзи.
import type { CSSProperties } from "react";
import { BackTag } from "@gazgame/ui";
import { Glyph } from "@/components/casino/GIcon";
import { RandomButton } from "@/components/casino/CasinoDeckView";
import { sfx } from "@/lib/sfx";
import { useCardAnim } from "@/lib/card-anim";
import type { DiaryEntry } from "./DiaryDeckView";
import "@/components/casino/casino-deck.css";
import "./diary.css";
import "./diary-deck.css";
import "./cosmos.css";

function CosmosIcon({ emoji, label }: { emoji: string; label: string }) {
  return <Glyph emoji={emoji} label={label} size="3.6em" />;
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
  onRandom: ((chosen?: number) => void) | null;
}) {
  const [animRef, anim] = useCardAnim("solo");
  return (
    <div className="dr-page cm-page" ref={animRef}>
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
            {onRandom && <RandomButton onClick={() => anim.roll((i) => onRandom(i))} />}
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
                    data-card=""
                    data-card-index={e.index}
                    data-soon={e.soon || undefined}
                    aria-label={`${e.title}${e.soon ? ", скоро" : ""}${e.locked ? ", закрыто: нужен Premium" : ""}`}
                    onClick={(ev) => anim.open(ev.currentTarget, () => onPick(e.index))}
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
