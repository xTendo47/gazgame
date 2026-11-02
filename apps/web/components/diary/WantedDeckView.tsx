"use client";

// Кармашек «Ты в розыске» (эталон 09_rozysk.png): деревянный стол, лассо и револьвер по краям, крупное название
// и плакаты WANTED по два в ряд. На плакате: булавка, ★ WANTED ★, фото ковбоя с повязкой, значок теста, название,
// красная плашка с «наградой», подпись, пулевые отверстия, чёрточки-счёт и штамп. Логика — в SectionScreen:
// сюда приходит готовый список и обработчики. Всё рисунками SVG и CSS, без картинок и эмодзи.
import type { CSSProperties } from "react";
import { BackTag } from "@gazgame/ui";
import { Glyph } from "@/components/casino/GIcon";
import { RandomButton } from "@/components/casino/CasinoDeckView";
import { sfx } from "@/lib/sfx";
import type { DiaryEntry } from "./DiaryDeckView";
import "@/components/casino/casino-deck.css";
import "./diary.css";
import "./diary-deck.css";
import "./wanted.css";

type StampKind = "sheriff" | "star" | "skull";

/** Шесть плакатов макета: бумага, фон фото, «награда», подпись, штамп, наклон; дальше по кругу. */
const VARIANTS: {
  paper: string;
  photo: string;
  rw: string;
  nt: string;
  stamp: StampKind;
  tilt: number;
  holes: number[][];
  tally: number[];
  stampAt: number[];
}[] = [
  { paper: "#ecd6a2", photo: "#cf9d78", rw: "$1000 ЛАЙКОВ", nt: "ОПАСЕН НА ВЕЧЕРИНКАХ", stamp: "sheriff", tilt: -1.6, holes: [[12, 22], [88, 54]], tally: [84, 20, 5], stampAt: [14, 66] },
  { paper: "#e4c98e", photo: "#e0a98e", rw: "$500 И ПИЦЦА", nt: "ВСЕГДА В ЦЕНТРЕ", stamp: "star", tilt: 1.4, holes: [[86, 24], [14, 58]], tally: [16, 20, 4], stampAt: [88, 66] },
  { paper: "#f0dfb4", photo: "#c6c18a", rw: "$777 СУПЕРСИЛ", nt: "НЕ ПОДДАЁТСЯ", stamp: "skull", tilt: 1.8, holes: [[50, 20], [90, 62]], tally: [10, 56, 6], stampAt: [14, 30] },
  { paper: "#dcc08a", photo: "#d9a48f", rw: "$2000 ПРЕМИЯ", nt: "ИЩЕТ ДЕЛО ЖИЗНИ", stamp: "sheriff", tilt: -1.2, holes: [[10, 30], [84, 40], [16, 66]], tally: [84, 62, 3], stampAt: [88, 22] },
  { paper: "#ead2a0", photo: "#cdb58a", rw: "$300 ВАЙБА", nt: "ЗАМЕЧЕН В ТРЕНДАХ", stamp: "star", tilt: 1.1, holes: [[90, 28]], tally: [10, 22, 5], stampAt: [12, 62] },
  { paper: "#e6cd96", photo: "#d6a98a", rw: "$900 ОТТЕНКОВ", nt: "ЯРКО ВЫРАЖЕН", stamp: "skull", tilt: -1.8, holes: [[14, 24], [86, 26]], tally: [84, 56, 4], stampAt: [12, 60] },
];

function Hole({ x, y }: { x: number; y: number }) {
  return (
    <svg className="wd-mark" style={{ left: `${x}%`, top: `${y}%` }} viewBox="-9 -9 18 18" aria-hidden="true">
      <circle r="4.600" fill="#3a2208" opacity=".28" />
      <circle r="2.400" fill="#120802" />
      <circle cx="-.6" cy="-.6" r=".8" fill="#5a3412" />
      <path d="M0 0l-6-4M0 0l7-2M0 0l-2 7M0 0l5 6M0 0l-5 4" stroke="#1a0e04" strokeWidth=".4" opacity=".7" />
    </svg>
  );
}

function Tally({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <svg className="wd-mark wd-tally" style={{ left: `${x}%`, top: `${y}%` }} viewBox="0 0 22 12" aria-hidden="true">
      <g stroke="#2a1a0c" strokeWidth="1.300" strokeLinecap="round" opacity=".75">
        {Array.from({ length: Math.min(n, 4) }, (_, i) => (
          <path key={i} d={`M${2 + i * 4} 1v10`} />
        ))}
        {n >= 5 && <path d="M0 9l19-6" />}
        {n >= 6 && <path d="M21 1v10" />}
      </g>
    </svg>
  );
}

function Stamp({ kind, x, y }: { kind: StampKind; x: number; y: number }) {
  return (
    <svg className="wd-stamp" style={{ left: `${x}%`, top: `${y}%` }} viewBox="-12 -12 24 24" aria-hidden="true">
      {kind === "sheriff" && (
        <>
          <path d="M0-9l2.600 5.400 6-.6-3.600 4.800 3.600 4.800-6-.6L0 9l-2.600-5.400-6 .6L-5 0l-3.600-4.800 6 .6z" fill="none" stroke="#8a1f12" strokeWidth="1" />
          <circle r="2.400" fill="none" stroke="#8a1f12" strokeWidth=".8" />
        </>
      )}
      {kind === "star" && <path d="M0-8l2.300 5.300 5.700.5-4.300 3.800 1.300 5.600L0 4.200l-5 3 1.300-5.600L-8-2.200l5.700-.5z" fill="#8a1f12" opacity=".75" />}
      {kind === "skull" && (
        <>
          <circle cy="-2" r="5" fill="none" stroke="#8a1f12" strokeWidth="1" />
          <circle cx="-1.800" cy="-2.400" r="1.100" fill="#8a1f12" />
          <circle cx="1.800" cy="-2.400" r="1.100" fill="#8a1f12" />
          <path d="M-3 4h6M-6 7l12-6M-6 1l12 6" stroke="#8a1f12" strokeWidth=".8" />
        </>
      )}
    </svg>
  );
}

/** Ковбой в шляпе с красной повязкой на лице: тот же силуэт на всех плакатах. */
function Outlaw() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path d="M0 100c4-26 22-34 50-34s46 8 50 34z" fill="#2b1a14" />
      <path d="M34 62l16 14 16-14-6-10H40z" fill="#6c3a2c" />
      <path d="M32 48c0-6 8-10 18-10s18 4 18 10v10c0 8-8 18-18 18S32 66 32 58z" fill="#8c4a34" />
      <path d="M30 52h40v26c-6 6-12 10-20 10s-14-4-20-10z" fill="#a1302a" opacity=".92" />
      <path d="M38 40c0-12 5-24 12-24s12 12 12 24z" fill="#2a1a12" />
      <path d="M12 42c0-4 16-8 38-8s38 4 38 8c0 3-14 6-38 6S12 45 12 42z" fill="#2a1a12" />
      <path d="M38 36h24v4H38z" fill="#8a1f12" />
    </svg>
  );
}

function Pin() {
  return (
    <svg className="wd-pin" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="13" r="8" fill="#000" opacity=".25" />
      <circle cx="12" cy="11" r="8" fill="#c9ccd2" />
      <circle cx="9.500" cy="8.500" r="3" fill="#fff" opacity=".8" />
      <circle cx="12" cy="11" r="8" fill="none" stroke="#6a6e78" strokeWidth="1" />
    </svg>
  );
}

function Rope() {
  return (
    <svg className="wd-rope" viewBox="0 0 150 120" aria-hidden="true">
      <g fill="none" stroke="#e8cf9c" strokeWidth="5" strokeLinecap="round">
        <ellipse cx="62" cy="62" rx="56" ry="40" />
        <ellipse cx="62" cy="62" rx="48" ry="32" opacity=".8" />
        <ellipse cx="62" cy="62" rx="40" ry="24" opacity=".6" />
      </g>
      <g fill="none" stroke="#9c7a44" strokeWidth="1" strokeDasharray="3 5" opacity=".7">
        <ellipse cx="62" cy="62" rx="56" ry="40" />
        <ellipse cx="62" cy="62" rx="48" ry="32" />
      </g>
    </svg>
  );
}

function Revolver() {
  return (
    <svg className="wd-gun" viewBox="0 0 150 90" aria-hidden="true">
      <path d="M8 40L96 18l6 14L18 58z" fill="#3c4048" />
      <path d="M96 20l32-6 6 22-34 8z" fill="#2a2d33" />
      <circle cx="104" cy="34" r="14" fill="#555a63" />
      <circle cx="104" cy="34" r="6" fill="#1c1e22" />
      <path d="M118 44c6 8 12 22 12 36l-16 2c0-12-4-22-10-30z" fill="#6a3a1e" />
      <path d="M20 56l30-8 2 6-28 10z" fill="#24262b" />
    </svg>
  );
}

export function WantedDeckView({
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
    <div className="dr-page wd-page">
      <div className="dr-scroll">
        <div className="dr-inner wd-inner">
          <Rope />
          <Revolver />
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
          <h1 className="wd-title">{title}</h1>
          <ul className="wd-grid">
            {entries.map((e, n) => {
              const v = VARIANTS[n % VARIANTS.length] as (typeof VARIANTS)[number];
              const style = { "--wd-paper": v.paper, "--wd-photo": v.photo, "--wd-tilt": `${v.tilt}deg` } as CSSProperties;
              return (
                <li key={`${e.title}-${e.index}`} style={style}>
                  <button
                    type="button"
                    className="wd-poster"
                    data-soon={e.soon || undefined}
                    data-locked={e.locked || undefined}
                    aria-label={`${e.title}${e.soon ? ", скоро" : ""}${e.locked ? ", закрыто: нужен Premium" : ""}`}
                    onClick={() => {
                      sfx.flip();
                      onPick(e.index);
                    }}
                  >
                    <Pin />
                    {v.holes.map(([x, y], i) => (
                      <Hole key={i} x={x as number} y={y as number} />
                    ))}
                    <Tally x={v.tally[0] as number} y={v.tally[1] as number} n={v.tally[2] as number} />
                    <Stamp kind={v.stamp} x={v.stampAt[0] as number} y={v.stampAt[1] as number} />
                    <span className="wd-wanted">
                      <i>★</i> WANTED <i>★</i>
                    </span>
                    <span className="wd-photo">
                      <Outlaw />
                      <span className="wd-badge">
                        <Glyph emoji={e.emoji} label={e.title} size="1.5em" />
                      </span>
                    </span>
                    <b className="wd-name">{e.title}</b>
                    <span className="wd-reward">{e.soon ? "СКОРО" : e.locked ? "ТОЛЬКО ДЛЯ VIP" : v.rw}</span>
                    <span className="wd-note">{v.nt}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
