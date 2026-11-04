"use client";

// Экран колоды «Тусовки» (макет v6.4, эталон 05_tusovka_dlya_svoih.png): золотое название, плашка «от 2 игроков»,
// «Наугад» и сетка казино-карт по две в ряд. У каждой карты свой узор, ранг и масть в углах, овальное окошко с рисунком игры,
// крупное название и ленточка с числом игроков; «скоро» — красный штамп, Premium — висячий замок.
// «Банда в сборе»: золотые брызги и красная печать «ОФИЦИАЛЬНО». «Без тормозов»: чёрные карты с золотыми кругами.
// Логика (что открывает карточка) — в SectionScreen: сюда приходит только готовый список и обработчики.
import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { BackTag } from "@gazgame/ui";
import { sfx } from "@/lib/sfx";
import { useCardAnim } from "@/lib/card-anim";
import { Suit } from "./CasinoArt";
import { GameIcon } from "./CasinoIcons";
import { ArcTitle, PadlockIcon, PLATE } from "./CasinoScene";
import { TABLE_ART } from "./casino-table-art";
import "./casino.css";
import "./casino-main.css";
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
  /** Готовая игра с пометкой «новинка»: на карте штамп «НОВИНКА». */
  fresh?: boolean;
}

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

/** Точки на гранях кубика: номера клеток сетки 3×3 (у единицы — одна, красно-оранжевая). */
const DIE_PIPS = [[4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]];

/** Объёмный кубик макета (cube3): шесть граней с точками и сердцевина, чтобы в щелях не было просвета. */
function Die({ turn }: { turn: string }) {
  return (
    <span className="cd-cube" style={{ transform: turn }}>
      <span className="cd-core" />
      <span className="cd-core cd-core1" />
      <span className="cd-core cd-core2" />
      {DIE_PIPS.map((pips, f) => (
        <span key={f} className={`cd-fc cd-f${f + 1}`}>
          {Array.from({ length: 9 }, (_, i) => (
            <i key={i} className={pips.includes(i) ? "p" : undefined} />
          ))}
        </span>
      ))}
    </span>
  );
}

/** Два объёмных кубика с тенью на сукне и подпись «наугад» (в эталоне 05 — справа вверху; стопки карт рядом нет). */
export function RandomButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="cd-rand" onClick={onClick} aria-label="Наугад: случайная игра этой колоды">
      <span className="cd-pair" data-dice aria-hidden="true">
        <span className="cd-pd" style={{ left: 36, top: 2 }}>
          <Die turn="rotateX(-32deg) rotateY(28deg) rotateZ(10deg)" />
        </span>
        <span className="cd-pd" style={{ left: 6, top: 22 }}>
          <Die turn="rotateX(-26deg) rotateY(-40deg) rotateZ(-14deg)" />
        </span>
      </span>
      <span className="cd-rand-lbl">наугад</span>
    </button>
  );
}

/** Оформление карты по названию игры (макет v6.4: массив P): два цвета, узор и подпись над овалом. theme 0–3 — узоры из CSS (ромбы, горошек, волны, шашки), у остальных узор берётся из pat. */
interface CardLook {
  c1: string;
  c2: string;
  label: string;
  theme?: number;
  pat?: string;
}
const CARD_LOOK: Record<string, CardLook> = {
  "Правда или действие": { c1: "#8e1418", c2: "#2a0406", label: "ПРАВДА · ДЕЙСТВИЕ", theme: 0 },
  "Я никогда не…": { c1: "#0e5a3a", c2: "#03241a", label: "ЧЕСТНО", theme: 1 },
  "Насколько ты знаешь друга": { c1: "#1d3a8a", c2: "#0a1640", label: "ДРУЗЬЯ", theme: 2 },
  "Совпадём? Друзья": { c1: "#5a1f8a", c2: "#200838", label: "СОВПАДЁМ", theme: 3 },
  "5 секунд": { c1: "#c25a12", c2: "#4a1a04", label: "ТАЙМЕР", pat: "repeating-conic-gradient(from 0deg at 50% 38%, rgb(255 240 200 / 0.16) 0 4deg, transparent 4deg 15deg)" },
  "Норм или стрём": { c1: "#0f6e78", c2: "#062a30", label: "НОРМ · СТРЁМ", pat: "linear-gradient(90deg, rgb(255 111 174 / 0.28) 0 50%, transparent 50%)" },
  "Дилеммы": { c1: "#1a1a1c", c2: "#050506", label: "ЭТО ИЛИ ТО", pat: "linear-gradient(90deg, rgb(255 255 255 / 0.12) 0 50%, transparent 50%)" },
  "Данетки": { c1: "#2a2a3a", c2: "#08080e", label: "НОКТЮРН", pat: "radial-gradient(60% 40% at 50% 38%, rgb(200 200 255 / 0.2), transparent 70%)" },
  "Кто из нас?": { c1: "#a8201e", c2: "#3a0608", label: "ПАЛЕЦ ВВЕРХ", pat: "repeating-linear-gradient(-45deg, rgb(0 0 0 / 0.25) 0 6px, transparent 6px 12px)" },
  "Шпион": { c1: "#141418", c2: "#000", label: "ТОП-СЕКРЕТ", pat: "radial-gradient(40% 30% at 50% 36%, rgb(255 250 220 / 0.28), transparent 70%)" },
  "Мафия": { c1: "#2a0606", c2: "#000", label: "ГОРОД СПИТ", pat: "radial-gradient(circle at 30% 70%, rgb(158 27 27 / 0.5) 0 8px, transparent 9px), radial-gradient(circle at 74% 24%, rgb(158 27 27 / 0.4) 0 5px, transparent 6px)" },
  "Объясни": { c1: "#8a6420", c2: "#3a2808", label: "СЛОВАМИ", pat: "repeating-linear-gradient(90deg, rgb(255 240 200 / 0.12) 0 2px, transparent 2px 8px)" },
  "Угадай по эмодзи": { c1: "#5a1440", c2: "#1e0414", label: "ЭМОДЗИ", pat: "radial-gradient(circle, rgb(255 111 174 / 0.3) 1.4px, transparent 2px) 0 0 / 12px 12px" },
  "Карточные игры": { c1: "#7a1210", c2: "#14050a", label: "КЛАССИКА", pat: "linear-gradient(135deg, rgb(0 0 0 / 0.4) 25%, transparent 25% 50%, rgb(0 0 0 / 0.4) 50% 75%, transparent 75%) 0 0 / 16px 16px" },
  "Две правды и ложь": { c1: "#4a4e58", c2: "#16181c", label: "ДВЕ ПРАВДЫ", pat: "repeating-linear-gradient(45deg, rgb(255 255 255 / 0.08) 0 1px, transparent 1px 6px)" },
  "Кто я?": { c1: "#7a3a10", c2: "#2a1204", label: "УГАДАЙ СЕБЯ", pat: "repeating-linear-gradient(0deg, rgb(255 240 200 / 0.12) 0 2px, transparent 2px 9px)" },
};
const FALLBACK_LOOK: CardLook = { c1: "#4a4e58", c2: "#16181c", label: "ИГРА" };

/** Находим оформление: по названию; у платных вариантов («Кто из нас? Без тормозов», «Шпион: Кино…») — по названию основной игры. */
function lookFor(title: string): CardLook {
  const exact = CARD_LOOK[title];
  if (exact) return exact;
  const base = title.split(/:| Без тормозов| с ботом/)[0]?.trim() ?? title;
  return CARD_LOOK[base] ?? FALLBACK_LOOK;
}

/** Наклон каждой карты на столе, градусы: чуть в разные стороны (эталон 05). */
const TILT = [-2.1, 1.4, -1.2, 1.7, -1.6, 1.1, -1.9, 1.5, -0.9, 1.2];
const DESIGN_W = 358;
const MAX_ZOOM = 1.25;

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
  onRandom: ((chosen?: number) => void) | null;
}) {
  const root = useRef<HTMLDivElement>(null);
  // Экран рисуется в «макетной» ширине 358 px и целиком увеличивается под телефон (zoom): пропорции карт не меняются
  useLayoutEffect(() => {
    const fit = () => {
      const el = root.current;
      if (el) el.style.setProperty("--z", String(Math.min(el.clientWidth / DESIGN_W, MAX_ZOOM)));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  // раздача, «наугад» и подъём карты: общая реализация для всех разделов (после масштаба, чтобы он уже был задан)
  const [, anim] = useCardAnim("party", root);
  return (
    <div className="tm-page cd-page" data-deck={deckId} ref={root}>
      <div className="tm-table" aria-hidden="true" dangerouslySetInnerHTML={{ __html: TABLE_ART }} />
      <div className="cs-scroll">
        <div className="cd-inner">
          <div className="cd-back">
            <BackTag
              onClick={() => {
                sfx.page();
                onBack();
              }}
            >
              ← К колодам
            </BackTag>
          </div>
          {onRandom && <RandomButton onClick={() => anim.roll((i) => onRandom(i))} />}

          {deckId === "band" && <GoldSplash />}
          {deckId === "band" && <OfficialStamp />}
          <ArcTitle text={title} size={title.length > 12 ? 38 : title.length > 9 ? 42 : 48} />
          <p className="cd-plate">
            <Suit kind="spade" size={10} color="#f2dc9a" />
            <span>{PLATE[deckId] ?? "от 2 игроков"}</span>
            <Suit kind="diamond" size={10} color="#f2dc9a" />
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
              const black = deckId === "prem";
              const look = lookFor(c.title);
              const red = SUITS[i % 4] === "heart" || SUITS[i % 4] === "diamond";
              const corner = (
                <>
                  <b>{RANKS[i % RANKS.length]}</b>
                  <Suit kind={SUITS[i % 4] ?? "spade"} size={11} color={red ? "#ff9bb0" : "currentColor"} />
                </>
              );
              const theme = black ? 6 : (look.theme ?? 9);
              return (
                <li key={`${c.title}-${c.index}`}>
                  <button
                    type="button"
                    className="cd-card"
                    data-card=""
                    data-card-index={c.index}
                    data-theme={theme}
                    data-soon={c.soon || undefined}
                    data-locked={c.locked || undefined}
                    style={
                      {
                        "--k": i,
                        "--tilt": `${TILT[i % TILT.length]}deg`,
                        ...(black ? {} : { "--c1": look.c1, "--c2": look.c2 }),
                        ...(look.pat && !black ? { "--pat": look.pat } : {}),
                      } as CSSProperties
                    }
                    aria-label={`${c.title}${c.players ? `, ${c.players.toLowerCase()}` : ""}${c.soon ? ", скоро" : c.fresh ? ", новинка" : ""}${c.locked ? ", закрыто: нужен Premium" : ""}`}
                    onClick={(e) => anim.open(e.currentTarget, () => onPick(c.index))}
                  >
                    <span className="cd-pat" aria-hidden="true" />
                    <span className="cd-gloss" aria-hidden="true" />
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
                    <span className="cd-kind">{look.label}</span>
                    <span className="cd-cameo" aria-hidden="true">
                      <GameIcon emoji={c.emoji} />
                    </span>
                    <b className="cd-name" data-long={c.title.length > 20 || undefined}>
                      {c.title}
                    </b>
                    {c.players && <span className="cd-ribbon">{c.players}</span>}
                    {(c.soon || c.fresh) && (
                      <span className="cd-seal" aria-hidden="true">
                        {c.soon ? "СКОРО" : "НОВИНКА"}
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
    </div>
  );
}
