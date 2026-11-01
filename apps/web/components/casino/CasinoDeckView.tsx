"use client";

// Экран колоды «Тусовки» (макет v6.4, эталон 05_tusovka_dlya_svoih.png): золотое название, плашка «от 2 игроков»,
// «Наугад» и сетка казино-карт по две в ряд. У каждой карты свой узор, ранг и масть в углах, овальное окошко с рисунком игры,
// крупное название и ленточка с числом игроков; «скоро» — красный штамп, Premium — висячий замок.
// «Банда в сборе»: золотые брызги и красная печать «ОФИЦИАЛЬНО». «Без тормозов»: чёрные карты с золотыми кругами.
// Логика (что открывает карточка) — в SectionScreen: сюда приходит только готовый список и обработчики.
import { useSyncExternalStore, type CSSProperties } from "react";
import { BackTag } from "@gazgame/ui";
import { prefersReducedMotion } from "@/lib/gaz";
import { sfx } from "@/lib/sfx";
import { BilliardBall, CasinoTable, Suit } from "./CasinoArt";
import { GameIcon } from "./CasinoIcons";
import { GoldTitle, PadlockIcon, PLATE, WHEEL_SVG } from "./CasinoScene";
import "./casino.css";
import "./casino-deck.css";

export interface DeckCard {
  /** Номер карточки в списке вкладки (по нему SectionScreen знает, что открыть). */
  index: number;
  title: string;
  emoji: string;
  /** Короткая подпись сверху карты («НА РАЗОГРЕВ»). */
  kind?: string;
  /** «2–3 ИГРОКА» и т.п.; null — подписи нет. */
  players: string | null;
  soon: boolean;
  /** Закрыто без Premium: на карте замок. */
  locked: boolean;
}

const noSubscribe = () => () => {};
const RANKS = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5"];
const SUITS = ["spade", "heart", "club", "diamond"] as const;

/** Красная печать «ОФИЦИАЛЬНО» у «Банды в сборе». */
function OfficialStamp() {
  return (
    <svg className="cd-stamp" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <path id="cd-stamp-ring" d="M50 50m-34 0a34 34 0 1 1 68 0a34 34 0 1 1-68 0" />
      </defs>
      <circle cx="50" cy="50" r="46" fill="#b3201a" stroke="#f1e6c8" strokeWidth="3" />
      <circle cx="50" cy="50" r="39" fill="none" stroke="#f1e6c8" strokeOpacity=".7" strokeWidth="1" />
      <text fontFamily="Manrope Variable, sans-serif" fontWeight="800" fontSize="8" letterSpacing="1.4" fill="#f1e6c8">
        <textPath href="#cd-stamp-ring">GAZ GAME CASINO · OFFICIAL ·</textPath>
      </text>
      <text x="50" y="48" textAnchor="middle" fontFamily="Playfair Display, serif" fontStyle="italic" fontWeight="900" fontSize="20" fill="#f1e6c8">
        GAZ
      </text>
      <g transform="rotate(-8 50 62)">
        <rect x="14" y="54" width="72" height="16" fill="#8f1812" stroke="#f1e6c8" strokeWidth="1.2" />
        <text x="50" y="66" textAnchor="middle" fontFamily="Manrope Variable, sans-serif" fontWeight="800" fontSize="9.5" letterSpacing="1" fill="#f1e6c8">
          ОФИЦИАЛЬНО
        </text>
      </g>
    </svg>
  );
}

/** Золотое «крылышко» в углу карты (в эталоне — по четыре на каждой карте). */
function Wing() {
  return (
    <svg viewBox="0 0 22 18" aria-hidden="true">
      <path d="M1.500 16C2 8 8 2.500 20 2c-3.500 2-5 4.500-5.500 7 2.500-1.500 4.500-2 6-1.500-3.500 2-5.500 5-6 7.500 2-.8 3.500-1 4.500-.8-4 3.500-9.500 5-17.500 1.800z" fill="url(#cd-wing-gold)" />
      <path d="M4 14.500c2-5 6-8 12-9.500" fill="none" stroke="#6b4a10" strokeOpacity=".5" strokeWidth=".7" />
    </svg>
  );
}

/** Золотые брызги за названием «Банды в сборе». */
function GoldSplash() {
  return (
    <svg className="cd-splash" viewBox="0 0 390 150" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <radialGradient id="cd-gold-drop" cx=".35" cy=".3" r=".85">
          <stop offset="0" stopColor="#fff6c8" />
          <stop offset=".5" stopColor="#e6b830" />
          <stop offset="1" stopColor="#7a5410" />
        </radialGradient>
      </defs>
      {[
        [34, 38, 9],
        [58, 62, 5],
        [22, 78, 4],
        [84, 28, 3.5],
        [352, 34, 8],
        [330, 66, 5],
        [366, 84, 3.5],
        [300, 22, 3],
        [196, 14, 3],
        [120, 112, 3],
        [270, 120, 4],
      ].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="url(#cd-gold-drop)" />
      ))}
      <path d="M8 56c18-8 24-30 40-30 10 0 6 12-4 16-12 4-8 20-36 14z" fill="url(#cd-gold-drop)" opacity=".9" />
      <path d="M382 52c-18-8-24-30-40-30-10 0-6 12 4 16 12 4 8 20 36 14z" fill="url(#cd-gold-drop)" opacity=".9" />
    </svg>
  );
}

/** Кубики и колода: кнопка «Наугад» (в эталоне — в правом верхнем углу). */
function RandomButton({ onClick }: { onClick: () => void }) {
  const pips = (cx: number, cy: number, s: number) =>
    [
      [-s, -s],
      [s, -s],
      [-s, s],
      [s, s],
    ].map(([dx, dy], i) => <circle key={i} cx={cx + (dx ?? 0)} cy={cy + (dy ?? 0)} r={s * 0.34} fill="#222" />);
  return (
    <button type="button" className="cd-rand" onClick={onClick} aria-label="Наугад: случайная игра этой колоды">
      <svg viewBox="0 0 84 66" aria-hidden="true">
        <g transform="rotate(-10 24 30)">
          <rect x="4" y="12" width="32" height="32" rx="6" fill="#faf6ea" stroke="#bdb292" strokeWidth="1.5" />
          {pips(20, 28, 7.5)}
          <circle cx="20" cy="28" r="2.6" fill="#e0561a" />
        </g>
        <g transform="rotate(12 44 20)">
          <rect x="30" y="2" width="30" height="30" rx="6" fill="#faf6ea" stroke="#bdb292" strokeWidth="1.5" />
          {pips(45, 17, 7)}
          <circle cx="45" cy="17" r="2.4" fill="#e0561a" />
        </g>
        <g transform="translate(58 12)">
          <rect x="0" y="6" width="22" height="30" rx="3" fill="#e9dfc6" />
          <rect x="1" y="3" width="22" height="30" rx="3" fill="#f3ead2" />
          <rect x="2" y="0" width="22" height="30" rx="3" fill="#fbf6e8" stroke="#b3201a" strokeWidth="1.4" />
          <rect x="6" y="4" width="14" height="22" rx="1.5" fill="none" stroke="#b3201a" strokeWidth=".8" />
        </g>
      </svg>
      <span>наугад</span>
    </button>
  );
}

export function CasinoDeckView({
  deckId,
  title,
  cards,
  onBack,
  onPick,
  onRandom,
}: {
  deckId: string;
  /** Название колоды (из sections.json). */
  title: string;
  cards: DeckCard[];
  onBack: () => void;
  onPick: (index: number) => void;
  /** Есть что открыть «Наугад» (хотя бы одна доступная игра). */
  onRandom: (() => void) | null;
}) {
  const still = useSyncExternalStore(
    noSubscribe,
    () => prefersReducedMotion(),
    () => false,
  );
  return (
    <div className="cs-page cd-page" data-deck={deckId}>
      <span className="cs-rim cs-rim-l" aria-hidden="true" />
      <span className="cs-rim cs-rim-r" aria-hidden="true" />
      <div className="cs-scroll">
        <div className="cs-inner">
          <div className="cd-top">
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

          {deckId === "band" && <GoldSplash />}
          {deckId === "band" && <OfficialStamp />}
          <GoldTitle text={title} still={still} size={title.length > 10 ? 46 : 62} light />
          <BilliardBall n="1" color="#e6b830" className="cd-ball" />
          <p className="cs-plate">
            <Suit kind="spade" size={11} color="#f2dc9a" />
            <span>{PLATE[deckId] ?? "от 2 игроков"}</span>
            <Suit kind="diamond" size={11} color="#f2dc9a" />
          </p>

          <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
            <defs>
              <linearGradient id="cd-wing-gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fff1c4" />
                <stop offset=".5" stopColor="#d9ae4a" />
                <stop offset="1" stopColor="#8a6420" />
              </linearGradient>
            </defs>
          </svg>
          <ul className="cd-grid">
            {cards.map((c, i) => {
              const theme = deckId === "prem" ? 6 : i % 7;
              const red = SUITS[i % 4] === "heart" || SUITS[i % 4] === "diamond";
              const corner = (
                <>
                  <b>{RANKS[i % RANKS.length]}</b>
                  <Suit kind={SUITS[i % 4] ?? "spade"} size={11} color={red ? "#ff9bb0" : "currentColor"} />
                </>
              );
              return (
                <li key={`${c.title}-${c.index}`}>
                  <button
                    type="button"
                    className="cd-card"
                    data-theme={theme}
                    data-soon={c.soon || undefined}
                    data-locked={c.locked || undefined}
                    style={{ "--k": i } as CSSProperties}
                    aria-label={`${c.title}${c.players ? `, ${c.players.toLowerCase()}` : ""}${c.soon ? ", скоро" : ""}${c.locked ? ", закрыто: нужен Premium" : ""}`}
                    onClick={() => {
                      sfx.flip();
                      onPick(c.index);
                    }}
                  >
                    <span className="cd-pat" aria-hidden="true" />
                    {[1, 2, 3, 4].map((n) => (
                      <span key={n} className={`cd-wing cd-w${n}`} aria-hidden="true">
                        <Wing />
                      </span>
                    ))}
                    <span className="cd-corner cd-tl" aria-hidden="true">
                      {corner}
                    </span>
                    <span className="cd-corner cd-br" aria-hidden="true">
                      {corner}
                    </span>
                    {c.kind && <span className="cd-kind">{c.kind}</span>}
                    <span className="cd-cameo" aria-hidden="true">
                      <GameIcon emoji={c.emoji} />
                    </span>
                    <b className="cd-name">{c.title}</b>
                    {c.players && !c.soon && <span className="cd-ribbon">{c.players}</span>}
                    {c.soon && (
                      <span className="cd-soon" aria-hidden="true">
                        СКОРО
                      </span>
                    )}
                    {c.locked && (
                      <span className="cd-padlock" aria-hidden="true">
                        <PadlockIcon />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="cs-bottom" aria-hidden="true">
        <CasinoTable />
        <div className="cs-wheel" dangerouslySetInnerHTML={{ __html: WHEEL_SVG }} />
      </div>
    </div>
  );
}
