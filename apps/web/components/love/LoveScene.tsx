"use client";

// Экран раздела «Романтика» (образец — _design/etalon/06_romantika.png): винный фон с лучами, кружево, фото-полароиды, роза,
// лента, пузырь-сердце, конверт с тремя колодами (Игры, Близость, Совместимость), а внизу шкатулка с кольцом,
// записка и билеты в кино (жемчуга и духов нет). Анимации — только transform и opacity, при «уменьшить движение» их нет.
import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { backTagClass } from "@gazgame/ui";
import { prefersReducedMotion } from "@/lib/gaz";
import { clearOpeningSection, peekOpeningSection } from "@/lib/section-open";
import { sfx } from "@/lib/sfx";
import { BOX, FLOUR, LACE, ROSE } from "./love-art";
import "./love.css";
import "./love-main.css";

export interface LoveDeck {
  id: string;
  /** Название колоды (из sections.json). */
  name: string;
  /** Платная колода: чёрная с золотом и замком. */
  premium: boolean;
}

/** Плашка сверху колоды: во всех трёх на эталоне «2 ЧЕЛОВЕКА». */
export const LOVE_PLATE = "2 человека";

/** Мелкие значки на обложках колод: кубики, сердца, кольца. */
function DeckArt({ id }: { id: string }): ReactNode {
  if (id === "close") {
    return (
      <svg viewBox="0 0 64 48" aria-hidden="true">
        <path d="M22 40C10 32 6 26 6 20c0-5 4-8 8-8 3 0 6 1.500 8 4.500C24 13.500 27 12 30 12c4 0 8 3 8 8 0 6-4 12-16 20z" fill="none" stroke="#ffd6e4" strokeWidth="2.400" strokeLinejoin="round" />
        <path d="M40 44C30 37 26 32 26 27c0-4 3-6.500 6.500-6.500 2.500 0 4.500 1.200 7.500 4 3-2.800 5-4 7.500-4 3.500 0 6.500 2.500 6.500 6.500 0 5-4 10-14 17z" fill="#ff5fa0" stroke="#ffd6e4" strokeWidth="1.600" strokeLinejoin="round" transform="translate(1 -3) scale(.92)" />
      </svg>
    );
  }
  if (id === "compat") {
    return (
      <svg viewBox="0 0 64 48" aria-hidden="true">
        <defs>
          <linearGradient id="lv-gold" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#fff1c4" />
            <stop offset=".5" stopColor="#d9b45a" />
            <stop offset="1" stopColor="#8a6420" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="30" r="12" fill="none" stroke="url(#lv-gold)" strokeWidth="3.400" />
        <circle cx="40" cy="30" r="12" fill="none" stroke="url(#lv-gold)" strokeWidth="3.400" />
        <path d="M32 7l4 4.500-4 4.500-4-4.500z" fill="#fff" stroke="url(#lv-gold)" strokeWidth="1.600" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 48" aria-hidden="true">
      <g transform="rotate(-14 20 28)">
        <rect x="6" y="14" width="26" height="26" rx="6" fill="none" stroke="#ffd6e4" strokeWidth="2.400" />
        <circle cx="14" cy="22" r="2.200" fill="#ffd6e4" />
        <circle cx="24" cy="32" r="2.200" fill="#ffd6e4" />
      </g>
      <g transform="rotate(12 46 26)">
        <rect x="34" y="12" width="24" height="24" rx="6" fill="none" stroke="#ffd6e4" strokeWidth="2.400" />
        <circle cx="42" cy="20" r="2.200" fill="#ffd6e4" />
        <circle cx="50" cy="28" r="2.200" fill="#ffd6e4" />
        <circle cx="46" cy="24" r="2.200" fill="#ffd6e4" />
      </g>
    </svg>
  );
}

/** Розовая глянцевая кнопка-сердечко под названием колоды. */
export function HeartBead({ className }: { className?: string }) {
  return (
    <span className={className ? `lv-bead ${className}` : "lv-bead"} aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M12 19.500S4.500 15 4.500 9.800A3.800 3.800 0 0 1 12 8a3.800 3.800 0 0 1 7.500 1.800C19.500 15 12 19.500 12 19.500z" fill="none" stroke="#fff" strokeWidth="1.800" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/** Золотой замочек на чёрной колоде. */
export function GoldLock() {
  return (
    <svg viewBox="0 0 26 32" width="26" height="32" aria-hidden="true">
      <defs>
        <linearGradient id="lv-lockg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fff1c4" />
          <stop offset=".5" stopColor="#d9b45a" />
          <stop offset="1" stopColor="#8a6420" />
        </linearGradient>
      </defs>
      <path d="M6.500 14V9.500a6.500 6.500 0 0 1 13 0V14" fill="none" stroke="#cfcfd6" strokeWidth="3.200" strokeLinecap="round" />
      <rect x="2" y="13" width="22" height="17" rx="3" fill="url(#lv-lockg)" stroke="#6a4a14" strokeWidth=".8" />
      <circle cx="13" cy="21" r="2.400" fill="#4a3208" />
      <path d="M13 22.500v4" stroke="#4a3208" strokeWidth="1.800" strokeLinecap="round" />
    </svg>
  );
}

/** Макетный экран: 358×695 (эталон 06). Масштаб — по ширине окна (не больше ×1,25); на высоком экране середина (конверт с колодами) сдвигается вниз на половину лишнего, низ остаётся у нижнего края. */
const STAGE_W = 358;
const STAGE_H = 695;
/** Самая низкая сцена, которую ещё можно сжать: ниже масштаб падает и по бокам остаются пустые поля. */
const MIN_STAGE_H = 695;
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

/** Лепестки, рассыпанные по сцене: слева, сверху, у конверта и внизу (как в эталоне). */
const PETALS: [number, number, number, number][] = [
  [14, 112, 30, 0],
  [10, 296, 70, 2],
];
/** Нижние лепестки (координаты от верха нижней группы, y = 500 макетного экрана). */
const PETALS_BOTTOM: [number, number, number, number][] = [
  [196, 30, -20, 1],
  [250, 98, 10, 0],
  [238, 160, -60, 1],
];

export function LoveScene({
  title,
  decks,
  premium,
  onPick,
  backHref = "/open",
}: {
  /** «Романтика» (без эмодзи). */
  title: string;
  decks: LoveDeck[];
  /** Premium включён: замок с колоды «Совместимость» снят. */
  premium: boolean;
  onPick: (id: string) => void;
  backHref?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
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
    if (peekOpeningSection() !== "love" || prefersReducedMotion()) {
      if (peekOpeningSection() === "love") clearOpeningSection();
      return;
    }
    const rootEl = root.current;
    if (!rootEl || typeof rootEl.animate !== "function") return;
    sfx.arm();
    const anims: Animation[] = [];
    const timers: number[] = [];
    // 1) сцена проявляется из темноты
    anims.push(rootEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, easing: "ease-out", fill: "both" }));
    // 2) колоды выезжают из конверта вверх одна за другой
    deckRefs.current.forEach((d, i) => {
      if (!d) return;
      anims.push(
        d.animate(
          [
            { transform: "translateY(120px) scale(.96)", opacity: 0 },
            { opacity: 1, offset: 0.2 },
            { transform: "translateY(-10px)", offset: 0.8 },
            { transform: "none", opacity: 1 },
          ],
          { duration: 900, delay: 350 + i * 170, easing: "cubic-bezier(.3,.8,.3,1)", fill: "both" },
        ),
      );
      timers.push(window.setTimeout(() => sfx.flip(), 450 + i * 170));
    });
    const done = window.setTimeout(clearOpeningSection, 2000);
    return () => {
      anims.forEach((a) => a.cancel());
      timers.forEach((t) => window.clearTimeout(t));
      window.clearTimeout(done);
    };
  }, []);

  const vars = { "--lv-lace": `url("${LACE}")`, "--lv-rose": `url("${ROSE}")`, "--lv-flour": `url("${FLOUR}")` } as CSSProperties;

  return (
    <div className="lv-page" ref={root} style={vars}>
      <div className="lv-beams" aria-hidden="true" />
      <div className="lm-stage" ref={stage}>
        <div className="lm-decor" aria-hidden="true">
          <i className="lv-lace" style={{ left: -14, top: 82, transform: "rotate(-9deg)" }} />
          <i className="lv-lace" style={{ left: -10, top: 112, transform: "rotate(-9deg)" }} />
          <div className="lv-pol p2" style={{ left: 243, top: 96, transform: "rotate(-7deg)" }}>
            <i />
            <b>тот вечер</b>
          </div>
          <div className="lv-pol p1" style={{ left: 290, top: 122, transform: "rotate(9deg)" }}>
            <i />
            <b>мы ♡</b>
          </div>
          <i className="lv-rose" style={{ left: -22, top: 205, transform: "rotate(-4deg)" }} />
          <svg className="lv-ribbon" viewBox="0 0 60 150" style={{ left: 8, top: 232 }}>
            <path d="M44 4C10 22 6 52 26 74c18 20 12 52-12 72" fill="none" stroke="#d6305f" strokeWidth="9" strokeLinecap="round" />
            <path d="M44 4C10 22 6 52 26 74c18 20 12 52-12 72" fill="none" stroke="#ff8fb0" strokeWidth="2.200" strokeLinecap="round" opacity=".7" transform="translate(-1.500 -1)" />
          </svg>
          <span className="lv-bubble" style={{ left: 293, top: 215 }}>
            <svg viewBox="0 0 24 24">
              <path d="M12 19.500S4.500 15 4.500 9.800A3.800 3.800 0 0 1 12 8a3.800 3.800 0 0 1 7.500 1.800C19.500 15 12 19.500 12 19.500z" fill="#fff" fillOpacity=".92" />
            </svg>
          </span>
          {PETALS.map(([x, y, r, k], i) => (
            <i key={i} className={`lv-petal k${k}`} style={{ left: x, top: y, transform: `rotate(${r}deg)` }} />
          ))}
        </div>

        <Link href={backHref} className={`${backTagClass()} lm-back`} onClick={() => sfx.page()}>
          ← В коробку
        </Link>
        <h1 className="lm-title">{title}</h1>
        <p className="lm-sub">вдвоём</p>

        <div className="lm-mid">
          <div className="lv-stage">
            <span className="lv-env-back" aria-hidden="true" />
            <div className="lv-decks" role="group" aria-label="Колоды">
              {decks.map((d, i) => {
                const locked = d.premium && !premium;
                return (
                  <button
                    key={d.id}
                    type="button"
                    ref={(el) => {
                      deckRefs.current[i] = el;
                    }}
                    className="lv-deck"
                    data-kind={d.premium ? "black" : "plum"}
                    data-id={d.id}
                    style={{ "--i": i } as CSSProperties}
                    aria-label={`${d.name}, ${LOVE_PLATE}${locked ? ", закрыто: нужен Premium" : ""}`}
                    onClick={() => {
                      sfx.flip();
                      onPick(d.id);
                    }}
                  >
                    <span className="lv-deck-plate">{LOVE_PLATE}</span>
                    <span className="lv-deck-art">
                      <DeckArt id={d.id} />
                    </span>
                    <b className="lv-deck-name">{d.name}</b>
                    <HeartBead className="lv-deck-bead" />
                    {locked && (
                      <span className="lv-deck-lock">
                        <GoldLock />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <span className="lv-env-front" aria-hidden="true" />
          </div>
        </div>

        <div className="lm-bottom" aria-hidden="true">
          <span className="lv-box" style={{ left: 20, top: 95 }} dangerouslySetInnerHTML={{ __html: BOX }} />
          <span className="lv-card" style={{ left: 118, top: 75 }}>
            <b>ОТ МЕНЯ · ТЕБЕ</b>
            с тобой даже тишина тёплая
          </span>
          <span className="lv-tix" style={{ left: 232, top: 100 }}>
            <b>КИНО · ЗАЛ 3</b>
            РЯД 7 · МЕСТА 8–9
            <br />
            2 БИЛЕТА ♡
          </span>
          {PETALS_BOTTOM.map(([x, y, r, k], i) => (
            <i key={i} className={`lv-petal k${k}`} style={{ left: x, top: y, transform: `rotate(${r}deg)` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
