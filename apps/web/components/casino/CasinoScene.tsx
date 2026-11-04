"use client";

// Экран «Тусовка» (макет v6.4, эталон 04_tusovka.png): зелёное сукно казино, золотое название с переливом, вывеска «GAZ game CASINO»
// с плашкой «от 2 игроков», три колоды, внизу стол с рулеткой, фишками, коктейлями, кубиками, деньгами и бильярдным шаром.
// «Без тормозов» — чёрная колода с ледяными трещинами и замком (замок снимается с Premium).
// Открытие (если пришли с «Чем займёмся?»): сукно раскрывается, сверху влетает рулетка, фишки разлетаются,
// одна колода раскладывается в три. Звуки — lib/sfx.ts. При «Уменьшить движение» всё стоит.
import {
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import Link from "next/link";
import { backTagClass } from "@gazgame/ui";
import { prefersReducedMotion } from "@/lib/gaz";
import { clearOpeningSection, peekOpeningSection } from "@/lib/section-open";
import { sfx } from "@/lib/sfx";
import { Suit } from "./CasinoArt";
import { TABLE_ART } from "./casino-table-art";
import "./casino.css";
import "./casino-main.css";

export interface CasinoDeck {
  id: string;
  /** Название колоды (из sections.json). */
  name: string;
  /** Платная колода: чёрная, с ледяными трещинами и замком. */
  premium: boolean;
}

/** Плашка «от N игроков» по колоде (в данных подпись другая, а на колоде в макете именно такая). */
export const PLATE: Record<string, string> = {
  own: "от 2 игроков",
  band: "от 4 игроков",
};

/** Значки колод — рисунки макета (ico64): две карты с червами, шляпа, корона. */
function DeckIcon({ id }: { id: string }): ReactNode {
  if (id === "band") {
    return (
      <svg viewBox="0 0 60 60" aria-hidden="true">
        <path d="M8 38c6 4 38 4 44 0" stroke="#9e1b1b" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 38c0-10 2-20 8-22 3-1 5 2 8 2s5-3 8-2c6 2 8 12 8 22" fill="#1a1210" stroke="#1a1210" strokeWidth="2" />
        <path d="M15 32h30" stroke="#9e1b1b" strokeWidth="4" />
        <path d="M8 38c6 6 38 6 44 0" stroke="#1a1210" strokeWidth="3" fill="none" />
      </svg>
    );
  }
  if (id === "prem") {
    return (
      <svg viewBox="0 0 60 60" aria-hidden="true">
        <path d="M10 44l4-24 10 10 6-16 6 16 10-10 4 24z" fill="#c9a14e" stroke="#5e4210" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="14" cy="18" r="3" fill="#f2dc9a" />
        <circle cx="30" cy="12" r="3" fill="#f2dc9a" />
        <circle cx="46" cy="18" r="3" fill="#f2dc9a" />
        <rect x="10" y="44" width="40" height="6" fill="#8a6420" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 60 60" aria-hidden="true">
      <g transform="rotate(-14 30 34)">
        <rect x="12" y="10" width="24" height="34" rx="3" fill="#fbf5e6" stroke="#9e1b1b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M24 22c-4-3-5-5-5-7a2.6 2.6 0 015-1 2.6 2.6 0 015 1c0 2-1 4-5 7z" fill="#9e1b1b" />
      </g>
      <g transform="rotate(12 30 34)">
        <rect x="24" y="12" width="24" height="34" rx="3" fill="#fbf5e6" stroke="#9e1b1b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M36 24c-4-3-5-5-5-7a2.6 2.6 0 015-1 2.6 2.6 0 015 1c0 2-1 4-5 7z" fill="#9e1b1b" />
      </g>
    </svg>
  );
}

/** Ледяные трещины на чёрной колоде (макет: crk71): тонкие линии прорисовываются, по ним бежит яркая искра. */
function IceCracks() {
  return (
    <svg className="tm-cracks" viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true">
      <g className="cr">
        <path d="M0 26L14 32 11 41 25 48 22 58 38 64 35 77 50 84" />
        <path d="M25 48L34 43 43 46" />
        <path d="M38 64L30 73" />
        <path d="M100 100L85 95 88 85 72 79 75 68 58 62 61 51 48 45" />
        <path d="M72 79L79 90" />
        <path d="M58 62L64 56 72 58" />
        <path d="M50 84L56 96 49 108 60 120 55 140" />
        <path d="M56 96L67 100" />
      </g>
      <g className="cur">
        <path d="M0 26L14 32 11 41 25 48 22 58 38 64 35 77 50 84 56 96 49 108 60 120 55 140" />
        <path d="M100 100L85 95 88 85 72 79 75 68 58 62 61 51 48 45" />
      </g>
    </svg>
  );
}

/** Висячий замок. */
export function PadlockIcon() {
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

/** Золотая заливка названия и вывески: один и тот же градиент (макет: czG). */
const GOLD_STOPS = (
  <>
    <stop offset="0" stopColor="#8a6420" />
    <stop offset=".35" stopColor="#f6e3a1" />
    <stop offset=".55" stopColor="#b8913f" />
    <stop offset=".75" stopColor="#fff1c4" />
    <stop offset="1" stopColor="#9c7426" />
  </>
);

/** «Тусовка» дугой, рукописным курсивом Playfair Display (Italic 900) в золоте, как «GAZ game CASINO» (макет: arc64). */
export function ArcTitle({ text, size = 75 }: { text: string; size?: number }) {
  return (
    <svg className="tm-title" viewBox="0 0 390 96" role="img" aria-label={text}>
      <defs>
        <linearGradient id="tm-title-gold" x1="0" x2="1">
          {GOLD_STOPS}
        </linearGradient>
        <path id="tm-title-arc" d="M24 90Q195 6 366 90" fill="none" />
      </defs>
      <text fontFamily="Playfair Display, Georgia, serif" fontWeight={900} fontStyle="italic" fontSize={size} letterSpacing="1" fill="rgb(0 0 0 / .45)" transform="translate(0 2)" aria-hidden="true">
        <textPath href="#tm-title-arc" startOffset="50%" textAnchor="middle">
          {text}
        </textPath>
      </text>
      <text fontFamily="Playfair Display, Georgia, serif" fontWeight={900} fontStyle="italic" fontSize={size} letterSpacing="1" fill="url(#tm-title-gold)" stroke="#5e4210" strokeWidth=".8" paintOrder="stroke">
        <textPath href="#tm-title-arc" startOffset="50%" textAnchor="middle">
          {text}
        </textPath>
      </text>
    </svg>
  );
}

/** Вывеска «GAZ game CASINO» на овале и строка «игра началась» с мастями (макет: czsign). */
function Sign() {
  return (
    <div className="tm-sign">
      <svg viewBox="0 0 390 112" aria-hidden="true">
        <defs>
          <linearGradient id="tm-sign-gold" x1="0" x2="1">
            {GOLD_STOPS}
          </linearGradient>
          <path id="tm-sign-arc" d="M40 98Q195 6 350 98" fill="none" />
        </defs>
        <ellipse cx="195" cy="80" rx="176" ry="54" fill="none" stroke="#e8d6a8" strokeOpacity=".35" strokeWidth="1.2" />
        <ellipse cx="195" cy="80" rx="168" ry="48" fill="none" stroke="#e8d6a8" strokeOpacity=".18" strokeDasharray="3 5" />
        <text fontFamily="Playfair Display, Georgia, serif" fontWeight="900" fontStyle="italic" fill="rgb(0 0 0 / .55)" transform="translate(0 2)">
          <textPath href="#tm-sign-arc" startOffset="50%" textAnchor="middle">
            <tspan fontSize="40">GAZ</tspan>
            <tspan fontSize="25" dx="6" letterSpacing="2">
              game
            </tspan>
            <tspan fontSize="40" dx="8" letterSpacing="3">
              CASINO
            </tspan>
          </textPath>
        </text>
        <text fontFamily="Playfair Display, Georgia, serif" fontWeight="900" fontStyle="italic" fill="url(#tm-sign-gold)" stroke="#3a2808" strokeWidth=".7">
          <textPath href="#tm-sign-arc" startOffset="50%" textAnchor="middle">
            <tspan fontSize="40">GAZ</tspan>
            <tspan fontSize="25" dx="6" letterSpacing="2">
              game
            </tspan>
            <tspan fontSize="40" dx="8" letterSpacing="3">
              CASINO
            </tspan>
          </textPath>
        </text>
      </svg>
      <p className="tm-sign-sub">
        <Suit kind="spade" size={9} color="#e8d6a8" />
        <Suit kind="heart" size={9} color="#e8d6a8" />
        <span>ИГРА НАЧАЛАСЬ</span>
        <Suit kind="club" size={9} color="#e8d6a8" />
        <Suit kind="diamond" size={9} color="#e8d6a8" />
      </p>
    </div>
  );
}

/** Шары, которые катятся по сукну (макет: roll65): цвет, номер, полосатый ли, время круга, задержка, высота начала и конца. */
const ROLL = [
  { b: "#f2c218", n: "1", st: false, t: 14, dl: 2, y0: 100, y1: 217, rot: 720 },
  { b: "#a51f1a", n: "3", st: false, t: 17, dl: 6.5, y0: 251, y1: 150, rot: 810 },
  { b: "#1a1210", n: "8", st: false, t: 20, dl: 11, y0: 184, y1: 276, rot: 900 },
  { b: "#1f4f8a", n: "10", st: true, t: 23, dl: 15.5, y0: 318, y1: 209, rot: 990 },
  { b: "#0e7a4a", n: "14", st: true, t: 26, dl: 20, y0: 142, y1: 75, rot: 1080 },
];

/** Макетный экран: 358×695. Масштаб — по ширине окна (не больше ×1,25); на высоком экране верх сдвигается вниз на половину лишнего, на низком пустое сукно сжимается. */
const STAGE_W = 358;
const STAGE_H = 695;
/** Самая низкая сцена, которую ещё можно сжать (пустое сукно между плашкой и колодами уменьшается): ниже масштаб падает и по бокам видны края стола. */
const MIN_STAGE_H = 610;
const MAX_SCALE = 1.25;

function fitStage(pageEl: HTMLElement, stageEl: HTMLElement): void {
  const vw = pageEl.clientWidth;
  const vh = window.innerHeight;
  const s = Math.min(vw / STAGE_W, vh / MIN_STAGE_H, MAX_SCALE);
  const sh = vh / s;
  stageEl.style.setProperty("--s", String(s));
  stageEl.style.setProperty("--sh", String(sh));
  stageEl.style.setProperty("--dy", String(Math.max(0, (sh - STAGE_H) / 2)));
  stageEl.dataset.ready = "true";
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
  const stage = useRef<HTMLDivElement>(null);
  const table = useRef<HTMLDivElement>(null);
  const burst = useRef<HTMLDivElement>(null);
  const deckRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useLayoutEffect(() => {
    const fit = () => {
      if (root.current && stage.current) fitStage(root.current, stage.current);
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useLayoutEffect(() => {
    if (peekOpeningSection() !== "party" || prefersReducedMotion()) {
      if (peekOpeningSection() === "party") clearOpeningSection();
      return;
    }
    const rootEl = root.current;
    const tableEl = table.current;
    const burstEl = burst.current;
    if (!rootEl || !tableEl || typeof rootEl.animate !== "function") return;
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

    // 2) сверху влетает стол с рулеткой и садится на место
    anims.push(
      tableEl.animate(
        [
          { transform: "translateY(-120%) scale(1.15) rotate(-6deg)", opacity: 1 },
          { transform: "translateY(-3%) scale(1.02)", opacity: 1, offset: 0.78 },
          { transform: "none", opacity: 1 },
        ],
        { duration: 1400, delay: 150, easing: "cubic-bezier(.3,.7,.3,1)", fill: "both" },
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
        const d = 100 + (i % 3) * 32;
        anims.push(
          chip.animate(
            [
              { transform: "translate(0, 0) scale(.4) rotate(0deg)", opacity: 0 },
              { opacity: 1, offset: 0.2 },
              { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d * 0.7}px) scale(1) rotate(${160 + i * 40}deg)`, opacity: 0 },
            ],
            { duration: 1000, delay: 420 + (i % 4) * 40, easing: "cubic-bezier(.2,.7,.3,1)", fill: "both" },
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
              { transform: `translateX(${toMid}px) rotate(${(i - 1) * 3}deg) scale(.94)`, opacity: i === 1 ? 1 : 0.0 },
              { transform: `translateX(${toMid}px) rotate(${(i - 1) * 3}deg) scale(.94)`, opacity: 1, offset: 0.25 },
              { transform: "none", opacity: 1 },
            ],
            { duration: 800, delay: 900 + i * 130, easing: "cubic-bezier(.25,1.3,.4,1)", fill: "both" },
          ),
        );
      });
      timers.push(window.setTimeout(() => sfx.riffle(0, 9), 880));
      [0, 1, 2].forEach((i) => timers.push(window.setTimeout(() => sfx.flip(), 1000 + i * 130)));
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
    <div className="tm-page" ref={root}>
      <div className="tm-stage" ref={stage}>
        <div className="tm-roll" aria-hidden="true">
          {ROLL.map((r) => (
            <i
              key={r.n}
              className={r.st ? "st" : undefined}
              data-n={r.n}
              style={{ "--b": r.b, "--t": `${r.t}s`, "--dl": `${r.dl}s`, "--w": "360px", "--y0": `${r.y0}px`, "--y1": `${r.y1}px`, "--rot": `${r.rot}deg` } as CSSProperties}
            />
          ))}
        </div>
        <div className="tm-table" ref={table} aria-hidden="true" dangerouslySetInnerHTML={{ __html: TABLE_ART }} />

        <Link href={backHref} className={`${backTagClass()} tm-back`} onClick={() => sfx.page()}>
          ← В коробку
        </Link>
        <div className="tm-head">
          <ArcTitle text={title} />
          <Sign />
          <p className="tm-plate">
            <Suit kind="spade" size={10} color="#f2dc9a" />
            <span>от 2 игроков</span>
            <Suit kind="diamond" size={10} color="#f2dc9a" />
          </p>
        </div>

        <span className="tm-tray" aria-hidden="true" />
        <div className="tm-decks" role="group" aria-label="Колоды">
          {decks.map((d, i) => {
            const locked = d.premium && !premium;
            const black = d.premium;
            return (
              <button
                key={d.id}
                type="button"
                ref={(el) => {
                  deckRefs.current[i] = el;
                }}
                className="tm-deck"
                data-kind={black ? "black" : "cream"}
                data-id={d.id}
                style={{ "--r": ["-2.4deg", "1.2deg", "2.6deg"][i % 3] } as CSSProperties}
                aria-label={`${d.name}${PLATE[d.id] ? `, ${PLATE[d.id]}` : ""}${locked ? ", закрыто: нужен Premium" : ""}`}
                onClick={() => {
                  sfx.flip();
                  onPick(d.id);
                }}
              >
                <span className="tm-stk" />
                {black && <span className="tm-back1" />}
                {black && <span className="tm-back2" />}
                <span className="tm-top">
                  <span className="tm-in" />
                  {black && <IceCracks />}
                  <span className="tm-ico">
                    <DeckIcon id={d.id} />
                  </span>
                  <b className="tm-name">{d.name}</b>
                  {PLATE[d.id] && <span className="tm-ribbon">{PLATE[d.id]}</span>}
                </span>
                {black && <span className="tm-glow" aria-hidden="true" />}
                {black && <span className="tm-zap" aria-hidden="true" />}
                {locked && (
                  <span className="tm-lock" aria-hidden="true">
                    <PadlockIcon />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="tm-burst" ref={burst} aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} style={{ background: ["#a51f1a", "#17120f", "#c9a14e", "#1f4f8a"][i % 4] }} />
          ))}
        </div>
      </div>
    </div>
  );
}
