"use client";

// Экран «Тусовка» (макет v6.4, эталон 04_tusovka.png): зелёное сукно казино, золотое название с переливом, вывеска «GAZ game CASINO»
// с плашкой «от 2 игроков», три колоды, внизу стол с рулеткой, фишками, коктейлями, кубиками, деньгами и бильярдным шаром.
// «Без тормозов» — чёрная колода с ледяными трещинами и замком (замок снимается с Premium).
// Открытие (если пришли с «Чем займёмся?»): сукно раскрывается, сверху влетает рулетка, фишки разлетаются,
// одна колода раскладывается в три. Звуки — lib/sfx.ts. При «Уменьшить движение» всё стоит.
import {
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import Link from "next/link";
import { backTagClass } from "@gazgame/ui";
import { PARTY_SCENE } from "@/components/table/tile-art";
import { prefersReducedMotion } from "@/lib/gaz";
import { clearOpeningSection, peekOpeningSection } from "@/lib/section-open";
import { sfx } from "@/lib/sfx";
import { BilliardBall, CasinoTable, Suit } from "./CasinoArt";
import "./casino.css";

export interface CasinoDeck {
  id: string;
  /** Название колоды (из sections.json). */
  name: string;
  /** Платная колода: чёрная, с ледяными трещинами и замком. */
  premium: boolean;
}

const noSubscribe = () => () => {};

/** Плашка «от N игроков» по колоде (в данных подпись другая, а на колоде в макете именно такая). */
const PLATE: Record<string, string> = {
  own: "от 2 игроков",
  band: "от 4 игроков",
};

/** Рулетка из рисунка макета: берём только круг колеса (остальное из сцены обрезаем). */
const WHEEL_SVG = PARTY_SCENE.replace(
  'viewBox="0 0 160 160"',
  'viewBox="27 21 106 106"',
).replace(/♥/g, "");

/** Значок колоды: две карты с червами, шляпа, корона. */
function DeckIcon({ id }: { id: string }): ReactNode {
  if (id === "band") {
    return (
      <svg viewBox="0 0 64 44" aria-hidden="true">
        <ellipse cx="32" cy="38" rx="28" ry="5" fill="#17120f" />
        <path
          d="M14 36c0-6 2-14 6-20 2-3 5-5 12-5s10 2 12 5c4 6 6 14 6 20z"
          fill="#17120f"
        />
        <path d="M14 33h36v4H14z" fill="#b01c1c" />
        <path
          d="M22 14c3-2 6-2.500 10-2.500"
          stroke="#fff"
          strokeOpacity=".25"
          strokeWidth="1.500"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (id === "prem") {
    return (
      <svg viewBox="0 0 64 44" aria-hidden="true">
        <defs>
          <linearGradient id="cs-crown" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#fff1c4" />
            <stop offset=".5" stopColor="#d9b45a" />
            <stop offset="1" stopColor="#8a6420" />
          </linearGradient>
        </defs>
        <path
          d="M8 36 5 12l14 12L32 6l13 18 14-12-3 24z"
          fill="url(#cs-crown)"
          stroke="#5e4210"
          strokeWidth="1.200"
          strokeLinejoin="round"
        />
        <rect
          x="8"
          y="35"
          width="48"
          height="6"
          rx="1.500"
          fill="url(#cs-crown)"
          stroke="#5e4210"
          strokeWidth="1.200"
        />
        <circle cx="32" cy="38" r="1.800" fill="#c8321c" />
        <circle cx="19" cy="38" r="1.200" fill="#1f4f8a" />
        <circle cx="45" cy="38" r="1.200" fill="#1f4f8a" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 44" aria-hidden="true">
      <g transform="rotate(-14 22 26)">
        <rect
          x="6"
          y="4"
          width="26"
          height="36"
          rx="3"
          fill="#fbf5e6"
          stroke="#9e1b1b"
          strokeWidth="2"
        />
        <path
          d="M19 24c-5-3.500-6-5-6-7a3.200 3.200 0 0 1 6-1.500A3.200 3.200 0 0 1 25 17c0 2-1 3.500-6 7z"
          fill="#9e1b1b"
        />
      </g>
      <g transform="rotate(10 42 26)">
        <rect
          x="30"
          y="6"
          width="26"
          height="36"
          rx="3"
          fill="#fbf5e6"
          stroke="#9e1b1b"
          strokeWidth="2"
        />
        <path
          d="M43 26c-5-3.500-6-5-6-7a3.200 3.200 0 0 1 6-1.500A3.200 3.200 0 0 1 49 19c0 2-1 3.500-6 7z"
          fill="#9e1b1b"
        />
      </g>
    </svg>
  );
}

/** Ледяные трещины на чёрной колоде: тонкие светящиеся молнии, по ним медленно бежит ток. */
function IceCracks() {
  return (
    <svg
      className="cs-cracks"
      viewBox="0 0 100 150"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M14 0 22 22 12 40 28 62 18 88 34 112 26 150" pathLength="100" />
      <path d="M96 20 80 42 90 64 72 92 84 120 70 150" pathLength="100" />
      <path d="M22 22 44 30 52 50" pathLength="100" />
      <path d="M80 42 62 52 58 72" pathLength="100" />
      <path d="M28 62 46 70" pathLength="100" />
      <path d="M72 92 54 102" pathLength="100" />
    </svg>
  );
}

/** Висячий замок. */
function PadlockIcon() {
  return (
    <svg viewBox="0 0 26 32" width="26" height="32" aria-hidden="true">
      <defs>
        <linearGradient id="cs-lock" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fff1c4" />
          <stop offset=".5" stopColor="#d9b45a" />
          <stop offset="1" stopColor="#8a6420" />
        </linearGradient>
      </defs>
      <path
        d="M6.500 14V9.500a6.500 6.500 0 0 1 13 0V14"
        fill="none"
        stroke="#c9c9cf"
        strokeWidth="3.200"
        strokeLinecap="round"
      />
      <rect
        x="2"
        y="13"
        width="22"
        height="17"
        rx="3"
        fill="url(#cs-lock)"
        stroke="#5e4210"
        strokeWidth="1.200"
      />
      <circle cx="13" cy="20.500" r="2.600" fill="#2a1a06" />
      <path
        d="M13 22v4"
        stroke="#2a1a06"
        strokeWidth="2.200"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Название «Тусовка» дугой, золотой градиент с переливом (SMIL; без анимации, если включено «Уменьшить движение»). */
function GoldTitle({ text, still }: { text: string; still: boolean }) {
  return (
    <svg
      className="cs-title"
      viewBox="0 0 390 150"
      role="img"
      aria-label={text}
    >
      <defs>
        <linearGradient
          id="cs-gold-title"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="390"
          y2="0"
        >
          <stop offset="0" stopColor="#8a6420" />
          <stop offset=".22" stopColor="#f6e3a1" />
          <stop offset=".45" stopColor="#b8913f" />
          <stop offset=".62" stopColor="#fff1c4" />
          <stop offset=".82" stopColor="#9c7426" />
          <stop offset="1" stopColor="#f6e3a1" />
          {!still && (
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              from="-390 0"
              to="390 0"
              dur="5s"
              repeatCount="indefinite"
            />
          )}
        </linearGradient>
        <path id="cs-title-arc" d="M14 126Q195 -22 376 100" fill="none" />
      </defs>
      <text
        fontFamily="Playfair Display, serif"
        fontStyle="italic"
        fontWeight="900"
        fontSize="84"
        textAnchor="middle"
        stroke="#2a1c06"
        strokeWidth="2.400"
        fill="#000"
        opacity=".5"
        transform="translate(0 4)"
      >
        <textPath href="#cs-title-arc" startOffset="50%">
          {text}
        </textPath>
      </text>
      <text
        fontFamily="Playfair Display, serif"
        fontStyle="italic"
        fontWeight="900"
        fontSize="84"
        textAnchor="middle"
        fill="url(#cs-gold-title)"
        stroke="#5e4210"
        strokeWidth=".8"
      >
        <textPath href="#cs-title-arc" startOffset="50%">
          {text}
        </textPath>
      </text>
    </svg>
  );
}

/** Вывеска «GAZ game CASINO» на овале и строка «игра началась» с мастями. */
function Sign() {
  return (
    <div className="cs-sign">
      <svg viewBox="0 0 390 116" aria-hidden="true">
        <defs>
          <linearGradient id="cs-gold-sign" x1="0" x2="1">
            <stop offset="0" stopColor="#8a6420" />
            <stop offset=".3" stopColor="#f6e3a1" />
            <stop offset=".6" stopColor="#b8913f" />
            <stop offset="1" stopColor="#fff1c4" />
          </linearGradient>
          <path id="cs-sign-arc" d="M40 78Q195 -24 350 78" fill="none" />
        </defs>
        <ellipse
          cx="195"
          cy="62"
          rx="178"
          ry="46"
          fill="none"
          stroke="#f6e3a1"
          strokeOpacity=".28"
          strokeWidth="1.200"
        />
        <ellipse
          cx="195"
          cy="62"
          rx="170"
          ry="40"
          fill="none"
          stroke="#f6e3a1"
          strokeOpacity=".12"
          strokeWidth="1"
        />
        <text
          fontFamily="Playfair Display, serif"
          fontStyle="italic"
          fontWeight="900"
          fontSize="44"
          textAnchor="middle"
          fill="url(#cs-gold-sign)"
          stroke="#3a2808"
          strokeWidth=".8"
        >
          <textPath href="#cs-sign-arc" startOffset="50%">
            GAZ{" "}
            <tspan
              fontFamily="Marck Script, cursive"
              fontSize="26"
              fontWeight="400"
            >
              game
            </tspan>{" "}
            CASINO
          </textPath>
        </text>
      </svg>
      <p className="cs-sign-sub">
        <Suit kind="spade" size={11} />
        <Suit kind="heart" size={11} />
        <span>ИГРА НАЧАЛАСЬ</span>
        <Suit kind="club" size={11} />
        <Suit kind="diamond" size={11} />
      </p>
    </div>
  );
}

export function CasinoScene({
  title,
  decks,
  premium,
  onPick,
  backHref = "/open",
}: {
  /** «Тусовка» (без эмодзи). */
  title: string;
  decks: CasinoDeck[];
  /** Premium включён: замок с колоды «Без тормозов» снят. */
  premium: boolean;
  onPick: (id: string) => void;
  backHref?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const wheel = useRef<HTMLDivElement>(null);
  const burst = useRef<HTMLDivElement>(null);
  const deckRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // «Уменьшить движение» узнаём после показа (на сервере экрана нет), чтобы разметка совпала
  const still = useSyncExternalStore(
    noSubscribe,
    () => prefersReducedMotion(),
    () => false,
  );

  useLayoutEffect(() => {
    if (!peekOpeningSection() || prefersReducedMotion()) {
      clearOpeningSection();
      return;
    }
    const rootEl = root.current;
    const wheelEl = wheel.current;
    const burstEl = burst.current;
    if (!rootEl || !wheelEl || typeof rootEl.animate !== "function") return;
    sfx.arm();
    const anims: Animation[] = [];
    const timers: number[] = [];

    // 1) сукно раскрывается кругом из центра
    anims.push(
      rootEl.animate(
        [
          { clipPath: "circle(0% at 50% 42%)" },
          { clipPath: "circle(150% at 50% 42%)" },
        ],
        { duration: 650, easing: "cubic-bezier(.3,.7,.2,1)", fill: "both" },
      ),
    );

    // 2) сверху влетает рулетка и садится на своё место
    const wr = wheelEl.getBoundingClientRect();
    const dx = window.innerWidth / 2 - (wr.left + wr.width / 2);
    const dy = -(wr.top + wr.height) - 40;
    anims.push(
      wheelEl.animate(
        [
          {
            transform: `translate(${dx}px, ${dy}px) scale(1.2) rotate(-220deg)`,
            opacity: 1,
          },
          {
            transform: "translate(0, -14px) scale(1.02) rotate(10deg)",
            opacity: 1,
            offset: 0.78,
          },
          { transform: "none", opacity: 1 },
        ],
        {
          duration: 1400,
          delay: 150,
          easing: "cubic-bezier(.3,.7,.3,1)",
          fill: "both",
        },
      ),
    );
    // звуки как в макете: колесо раскручивается, шарик падает на него, фишки стучат
    sfx.whirr(0.15, 1.2);
    sfx.ballDrop(1.15);
    sfx.chips(0.5);

    // 3) фишки разлетаются от центра
    if (burstEl) {
      burstEl.querySelectorAll<HTMLElement>("i").forEach((chip, i) => {
        const a = (i / 12) * Math.PI * 2;
        const d = 120 + (i % 3) * 38;
        anims.push(
          chip.animate(
            [
              {
                transform: "translate(0, 0) scale(.4) rotate(0deg)",
                opacity: 0,
              },
              { opacity: 1, offset: 0.2 },
              {
                transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d * 0.7}px) scale(1) rotate(${160 + i * 40}deg)`,
                opacity: 0,
              },
            ],
            {
              duration: 1000,
              delay: 420 + (i % 4) * 40,
              easing: "cubic-bezier(.2,.7,.3,1)",
              fill: "both",
            },
          ),
        );
      });
    }

    // 4) одна колода раскладывается в три
    const refs = deckRefs.current.filter((d): d is HTMLButtonElement => !!d);
    const mid = refs[Math.floor(refs.length / 2)];
    if (mid) {
      const mr = mid.getBoundingClientRect();
      refs.forEach((d, i) => {
        const r = d.getBoundingClientRect();
        const toMid = mr.left - r.left;
        anims.push(
          d.animate(
            [
              {
                transform: `translateX(${toMid}px) rotate(${(i - 1) * 3}deg) scale(.94)`,
                opacity: i === 1 ? 1 : 0.0,
              },
              {
                transform: `translateX(${toMid}px) rotate(${(i - 1) * 3}deg) scale(.94)`,
                opacity: 1,
                offset: 0.25,
              },
              { transform: "none", opacity: 1 },
            ],
            {
              duration: 800,
              delay: 900 + i * 130,
              easing: "cubic-bezier(.25,1.3,.4,1)",
              fill: "both",
            },
          ),
        );
      });
      timers.push(window.setTimeout(() => sfx.riffle(0, 9), 880));
      [0, 1, 2].forEach((i) =>
        timers.push(window.setTimeout(() => sfx.flip(), 1000 + i * 130)),
      );
    }
    anims[0]?.finished.then(() => undefined).catch(() => undefined);
    const done = window.setTimeout(clearOpeningSection, 2300);
    return () => {
      anims.forEach((a) => a.cancel());
      timers.forEach((t) => window.clearTimeout(t));
      window.clearTimeout(done);
    };
  }, []);

  return (
    <div className="cs-page" ref={root}>
      <span className="cs-rim cs-rim-l" aria-hidden="true" />
      <span className="cs-rim cs-rim-r" aria-hidden="true" />
      <div className="cs-scroll">
        <div className="cs-inner">
          <Link
            href={backHref}
            className={backTagClass()}
            onClick={() => sfx.page()}
          >
            ← В коробку
          </Link>

          <GoldTitle text={title} still={still} />
          <BilliardBall n="1" color="#e6b830" className="cs-ball" />
          <Sign />
          <p className="cs-plate">
            <Suit kind="spade" size={11} color="#f2dc9a" />
            <span>от 2 игроков</span>
            <Suit kind="diamond" size={11} color="#f2dc9a" />
          </p>

          <div className="cs-decks" role="group" aria-label="Колоды">
            <span className="cs-tray" aria-hidden="true" />
            {decks.map((d, i) => {
              const locked = d.premium && !premium;
              return (
                <button
                  key={d.id}
                  type="button"
                  ref={(el) => {
                    deckRefs.current[i] = el;
                  }}
                  className="cs-deck"
                  data-kind={d.premium ? "black" : "cream"}
                  data-id={d.id}
                  style={{ "--i": i } as CSSProperties}
                  aria-label={`${d.name}${PLATE[d.id] ? `, ${PLATE[d.id]}` : ""}${locked ? ", закрыто: нужен Premium" : ""}`}
                  onClick={() => {
                    sfx.flip();
                    onPick(d.id);
                  }}
                >
                  <span className="cs-deck-face">
                    {d.premium && <IceCracks />}
                    <span className="cs-deck-ico">
                      <DeckIcon id={d.id} />
                    </span>
                    <b className="cs-deck-name">{d.name}</b>
                    {PLATE[d.id] && (
                      <span className="cs-deck-plate">{PLATE[d.id]}</span>
                    )}
                  </span>
                  {locked && (
                    <span className="cs-lock" aria-hidden="true">
                      <PadlockIcon />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="cs-bottom" aria-hidden="true">
        <CasinoTable />
        <div
          className="cs-wheel"
          ref={wheel}
          dangerouslySetInnerHTML={{ __html: WHEEL_SVG }}
        />
        <div className="cs-burst" ref={burst}>
          {Array.from({ length: 12 }, (_, i) => (
            <i
              key={i}
              style={{
                background: ["#a51f1a", "#17120f", "#c9a14e", "#1f4f8a"][i % 4],
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
