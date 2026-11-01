"use client";

// Экран раздела «Дневник» (образец — _design/etalon/08_dnevnik.png): раскрытая книга на деревянном столе, в ней три кармашка
// («Ты в розыске», «Психо», «Глубже»), сбоку закладки, рядом свеча, компас, личное дело, полароиды и стикеры.
// Открытие из стола — по макету (v6.4ii): тёмная комната, книга поворачивается, обложка и листы раскрываются, свет, символы;
// потом кармашки въезжают в книгу. Всё через transform и opacity; при «уменьшить движение» сразу конечный вид.
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { backTagClass } from "@gazgame/ui";
import { GIcon } from "@/components/casino/GIcon";
import { COMPASS } from "@/components/table/tile-art";
import { prefersReducedMotion } from "@/lib/gaz";
import { clearOpeningSection, peekOpeningSection } from "@/lib/section-open";
import { sfx } from "@/lib/sfx";
import "./diary.css";

const noSubscribe = () => () => {};

const SEEN_KEY = "gaz:diary-opened";
type OpenMode = "full" | "short" | "none";
/** Режим выбран один раз на показ экрана: полная книга — только при первом открытии за сессию, потом короткая версия. */
let decided: OpenMode | null = null;

function readMode(): OpenMode {
  if (decided) return decided;
  if (peekOpeningSection() !== "solo" || prefersReducedMotion()) return "none";
  let seen = false;
  try {
    seen = sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    // хранилища нет (приватный режим) — считаем, что книга ещё не открывалась
  }
  decided = seen ? "short" : "full";
  return decided;
}

function markSeen(): void {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // не страшно: в худшем случае покажем полную версию ещё раз
  }
}

export interface DiaryPocket {
  id: string;
  /** Сколько тестов лежит в кармашке («12 тестов»). */
  count: number;
  /** Платный кармашек: на нём замок и метка VIP. */
  premium: boolean;
}

/** «12 тестов», «4 теста», «1 тест». */
export function testsLabel(n: number): string {
  const last = n % 10;
  const tens = n % 100;
  const word = last === 1 && tens !== 11 ? "тест" : last >= 2 && last <= 4 && (tens < 12 || tens > 14) ? "теста" : "тестов";
  return `${n} ${word}`;
}

/** Симметричная клякса для карточки Роршаха. */
function blotPath(seed: number): string {
  const pts: [number, number][] = [];
  const n = 22;
  for (let i = 0; i <= n; i++) {
    const th = (i / n) * Math.PI;
    const r = 20 * (0.55 + 0.25 * Math.sin(th * 3 + seed) + 0.15 * Math.sin(th * 7 + seed * 2.1));
    pts.push([Math.sin(th) * r * 0.9, -Math.cos(th) * r * 1.15]);
  }
  let d = `M0 ${pts[0]![1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i]!;
    const [px, py] = pts[i - 1]!;
    d += `Q${(px * 1.08).toFixed(1)} ${py.toFixed(1)} ${((px + x) / 2).toFixed(1)} ${((py + y) / 2).toFixed(1)}`;
  }
  return d + "Z";
}

function Blot({ size, seed = 2.3 }: { size: number; seed?: number }) {
  const d = blotPath(seed);
  return (
    <svg viewBox="-26 -28 52 56" width={size} height={size * 1.08} aria-hidden="true">
      <path d={d} fill="#14101a" />
      <path d={d} fill="#14101a" transform="scale(-1 1)" />
      <circle cx="0" cy="-4" r="2.600" fill="#f4ead6" opacity=".9" />
    </svg>
  );
}

/** Ковбой с повязкой для мини-плаката «Ты в розыске». */
function Cowboy() {
  return (
    <svg viewBox="0 0 40 46" aria-hidden="true">
      <rect width="40" height="46" fill="#c9a06a" />
      <path d="M8 20c2-8 7-11 12-11s10 3 12 11z" fill="#2a1a12" />
      <path d="M2 21h36l-3 3H5z" fill="#2a1a12" />
      <path d="M9 22h22v3H9z" fill="#8a1f12" />
      <path d="M12 25h16v9c0 3-3 5-8 5s-8-2-8-5z" fill="#8a4a30" />
      <path d="M12 30h16v7c-2 2-5 3-8 3s-6-1-8-3z" fill="#9c2a22" />
      <path d="M3 46c1-8 7-11 17-11s16 3 17 11z" fill="#2a1a12" />
    </svg>
  );
}

function Pocket({ pocket, index, name, onPick }: { pocket: DiaryPocket; index: number; name: string; onPick: () => void }) {
  const style = { "--i": index } as CSSProperties;
  const label = `${name}, ${testsLabel(pocket.count)}${pocket.premium ? ", нужен Premium" : ""}`;
  if (pocket.id === "who") {
    return (
      <button type="button" className="dr-pocket dr-wanted" style={style} aria-label={label} onClick={onPick}>
        <span className="dr-w-tag">ТЫ В РОЗЫСКЕ</span>
        <span className="dr-w-sheriff" aria-hidden="true">
          <svg viewBox="0 0 40 40">
            <path d="M20 2l4.500 10 11 .5-8.500 7 3 11-10-6-10 6 3-11-8.500-7 11-.5z" fill="#e6c06a" stroke="#8a6420" strokeWidth="1.400" strokeLinejoin="round" />
            <circle cx="20" cy="19" r="3.500" fill="#8a6420" />
          </svg>
        </span>
        <span className="dr-w-poster" aria-hidden="true">
          <b>WANTED</b>
          <Cowboy />
        </span>
        <span className="dr-w-name">
          ТЫ В<br />
          РОЗЫСКЕ
        </span>
        <span className="dr-w-count">{testsLabel(pocket.count)} →</span>
        <span className="dr-w-stamp" aria-hidden="true">
          <i>$500</i>
        </span>
        <span className="dr-w-tally" aria-hidden="true">
          <svg viewBox="0 0 24 14">
            <path d="M3 1v12M8 1v12M13 1v12M18 1v12M1 11L21 3" stroke="#3a2412" strokeWidth="1.400" strokeLinecap="round" fill="none" />
          </svg>
        </span>
      </button>
    );
  }
  if (pocket.id === "psy") {
    return (
      <button type="button" className="dr-pocket dr-clinic" style={style} aria-label={label} onClick={onPick}>
        <span className="dr-c-tag">ВЫПИСКА № 07</span>
        <span className="dr-c-cross" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" fill="#fff" />
          </svg>
        </span>
        <span className="dr-c-card" aria-hidden="true">
          <Blot size={30} />
        </span>
        <span className="dr-c-name">Психо</span>
        <span className="dr-c-count">
          <GIcon name="heart" size={13} /> {testsLabel(pocket.count)} →
        </span>
        <span className="dr-c-stamp" aria-hidden="true">
          ПРИНЯТО
        </span>
      </button>
    );
  }
  return (
    <button type="button" className="dr-pocket dr-cosmos" style={style} aria-label={label} onClick={onPick}>
      <span className="dr-s-stars" aria-hidden="true" />
      <span className="dr-s-card" aria-hidden="true">
        <GIcon name="diamond" size={30} />
      </span>
      <span className="dr-s-name">Глубже</span>
      <span className="dr-s-count">{testsLabel(pocket.count)} →</span>
      <span className="dr-s-vip" aria-hidden="true">
        VIP
      </span>
      <span className="dr-s-lock" aria-hidden="true">
        <svg viewBox="0 0 26 32" width="26" height="32">
          <defs>
            <linearGradient id="dr-lockg" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#fff1c4" />
              <stop offset=".5" stopColor="#d9b45a" />
              <stop offset="1" stopColor="#8a6420" />
            </linearGradient>
          </defs>
          <path d="M6.500 14V9.500a6.500 6.500 0 0 1 13 0V14" fill="none" stroke="#cfcfd6" strokeWidth="3.200" strokeLinecap="round" />
          <rect x="2" y="13" width="22" height="17" rx="3" fill="url(#dr-lockg)" stroke="#6a4a14" strokeWidth=".8" />
          <circle cx="13" cy="21" r="2.400" fill="#4a3208" />
        </svg>
      </span>
      <span className="dr-s-ring" aria-hidden="true" />
    </button>
  );
}

/** Закладки у среза книги: «Нарцисс», «Тень», «Эго». */
const TABS: [string, string, string][] = [
  ["Нарцисс", "#f0c75a", "#5a3a08"],
  ["Тень", "#1f7a6a", "#d9f3ea"],
  ["Эго", "#e8654f", "#fff0e8"],
];

export function DiaryScene({
  title,
  pockets,
  names,
  onPick,
  backHref = "/open",
}: {
  /** «Дневник» (без эмодзи). */
  title: string;
  pockets: DiaryPocket[];
  /** Названия для скринридера: names[id]. */
  names: Record<string, string>;
  onPick: (id: string) => void;
  backHref?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  // «Открытие из стола»: метку читаем в браузере (на сервере её нет), поэтому разметка сервера и браузера совпадает
  const mode = useSyncExternalStore(noSubscribe, readMode, (): OpenMode => "none");
  const armed = mode !== "none";
  // run → done (кармашки едут) → idle; пока метки нет, сразу idle
  const [phase, setPhase] = useState<"done" | "idle" | null>(null);
  /** Пелена с книгой: убираем по окончании её анимации, а не по таймеру (на медленном телефоне они разойдутся). */
  const [overlayGone, setOverlayGone] = useState(false);
  const opening = phase ?? (armed ? "run" : "idle");

  function finish() {
    setPhase("idle");
    setOverlayGone(true);
    decided = null;
    clearOpeningSection();
  }

  useEffect(() => {
    if (!armed) {
      if (peekOpeningSection() === "solo") clearOpeningSection(); // «уменьшить движение»: метку просто снимаем
      return;
    }
    sfx.arm();
    sfx.page();
    const full = mode === "full";
    if (full) markSeen();
    // полная версия, как в макете: книга 2,6 с, на 2,45 с кармашки въезжают (ещё 1,4 с); короткая: ~0,4 с
    const t1 = window.setTimeout(
      () => {
        setPhase("done");
        sfx.flip();
        if (full) {
          window.setTimeout(() => sfx.flip(), 140);
          window.setTimeout(() => sfx.flip(), 280);
        }
      },
      full ? 2450 : 30,
    );
    const t2 = window.setTimeout(
      () => {
        setPhase("idle");
        decided = null;
        clearOpeningSection();
      },
      full ? 2450 + 1400 : 30 + 450,
    );
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [armed, mode]);

  return (
    <div
      className="dr-page"
      ref={root}
      data-opening={opening}
      data-mode={mode}
      // тап во время анимации сразу показывает конечное состояние (и не нажимает то, что под пальцем)
      onPointerDownCapture={(e) => {
        if (opening === "idle") return;
        e.stopPropagation();
        e.preventDefault();
        finish();
      }}
    >
      <div className="dr-scroll">
        <div className="dr-inner">
          <Link href={backHref} className={backTagClass()} onClick={() => sfx.page()}>
            ← В коробку
          </Link>
          <p className="dr-only">только твоё</p>

          <span className="dr-candle" aria-hidden="true">
            <svg viewBox="0 0 62 112">
              <defs>
                <linearGradient id="dr-wax" x1="0" x2="1">
                  <stop offset="0" stopColor="#e8d9b4" />
                  <stop offset=".45" stopColor="#fdf6e2" />
                  <stop offset="1" stopColor="#d9c593" />
                </linearGradient>
                <radialGradient id="dr-fl" cx=".5" cy=".7" r=".6">
                  <stop offset="0" stopColor="#fff6c8" />
                  <stop offset=".5" stopColor="#ffb340" />
                  <stop offset="1" stopColor="#e2570f" />
                </radialGradient>
              </defs>
              <ellipse cx="31" cy="106" rx="27" ry="5" fill="#000" fillOpacity=".35" />
              <path d="M6 36v64q0 6 25 6t25-6V36z" fill="url(#dr-wax)" />
              <path d="M6 36v22q2 4 4 0V42zM17 36v16q1.600 3 3.200 0V38zM41 36v26q2 4 4 0V40zM51 36v12q1.500 3 3 0V37z" fill="#fff9e8" />
              <ellipse cx="31" cy="36" rx="25" ry="7" fill="#f6e8cb" />
              <ellipse cx="31" cy="36.500" rx="16" ry="4" fill="#d9a85a" fillOpacity=".7" />
              <path d="M31 36c0-4-1-6 0-10" stroke="#1a120c" strokeWidth="1.600" strokeLinecap="round" fill="none" />
              <g className="dr-flame">
                <path d="M31 6c4 6 6 9 6 13a6 6 0 0 1-12 0c0-4 2-7 6-13z" fill="url(#dr-fl)" />
                <path d="M31 14c2 3 3 4.500 3 6.500a3 3 0 0 1-6 0c0-2 1-3.500 3-6.500z" fill="#fff6c8" />
              </g>
            </svg>
            <i className="dr-halo" />
          </span>

          <div className="dr-book">
            <span className="dr-spine" aria-hidden="true" />
            <span className="dr-edge dr-edge-r" aria-hidden="true" />
            <span className="dr-edge dr-edge-b" aria-hidden="true" />
            <div className="dr-page-sheet">
              <svg className="dr-doodle dr-doodle-tl" viewBox="0 0 40 24" aria-hidden="true">
                <path d="M2 22l10-16 8 12 7-9 11 13" fill="none" stroke="#b9a37a" strokeWidth="1.400" strokeLinejoin="round" />
              </svg>
              <svg className="dr-doodle dr-doodle-tr" viewBox="0 0 32 32" aria-hidden="true">
                <circle cx="16" cy="16" r="9" fill="none" stroke="#b9a37a" strokeWidth="1.200" />
                <path d="M16 2v28M2 16h28" stroke="#b9a37a" strokeWidth="1.200" />
              </svg>
              <h1 className="dr-title">{title}</h1>
              <p className="dr-rule" aria-hidden="true">
                <i />
                <b />
                <i />
              </p>
              <div className="dr-pockets">
                {pockets.map((p, i) => (
                  <Pocket
                    key={p.id}
                    pocket={p}
                    index={i}
                    name={names[p.id] ?? p.id}
                    onPick={() => {
                      sfx.flip();
                      onPick(p.id);
                    }}
                  />
                ))}
              </div>
            </div>
            <span className="dr-tabs" aria-hidden="true">
              {TABS.map(([name, bg, fg], i) => (
                <i key={name} style={{ background: bg, color: fg, "--k": i } as CSSProperties}>
                  {name}
                </i>
              ))}
            </span>
            <span className="dr-eraser" aria-hidden="true" />
          </div>

          <div className="dr-desk" aria-hidden="true">
            <span className="dr-compass" dangerouslySetInnerHTML={{ __html: COMPASS }} />
            <span className="dr-file">
              <b>ЛИЧНОЕ ДЕЛО №07</b>
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="dr-rorschach">
              <Blot size={64} seed={4.1} />
            </span>
            <span className="dr-pol dr-pol1">
              <i />
              <em>где я счастлива?</em>
            </span>
            <span className="dr-pol dr-pol2">
              <i>
                <GIcon name="mask" size={30} />
              </i>
              <em>это я?</em>
            </span>
            <span className="dr-folder">
              <b>ТЕСТЫ</b>
              <span>
                тип привязанности: тревожный? холерик / сангвиник
              </span>
            </span>
            <span className="dr-sticky">
              <b>МОЙ ХАРАКТЕР</b>
              интроверт на 70% немного нарцисс
            </span>
            <span className="dr-pill dr-pill1">эмпат</span>
            <span className="dr-pill dr-pill2">меланхолик</span>
            <span className="dr-pill dr-pill3">флегматик</span>
            <span className="dr-label">язык любви: время ♡</span>
          </div>
        </div>
      </div>

      {mode === "full" && !overlayGone && <BookOpening onEnd={() => setOverlayGone(true)} />}
    </div>
  );
}

/** Книга раскрывается: тёмная комната, поворот, обложка и три листа, свет, символы (2,6 с, как в макете). */
function BookOpening({ onEnd }: { onEnd: () => void }): ReactNode {
  const glyphs = ["✦", "ψ", "☉", "✧", "Ω", "☽", "✦"];
  return (
    <div className="dr-ov" aria-hidden="true">
      <span className="dr-ov-dim" onAnimationEnd={onEnd} />
      <span className="dr-ov-sc">
        <span className="dr-bk">
          <span className="dr-bk-blk" />
          <span className="dr-bk-pg">
            <b>Дневник</b>
            <i />
            <i />
            <i />
            <em>только твоё</em>
          </span>
          <span className="dr-bk-lf l1" />
          <span className="dr-bk-lf l2" />
          <span className="dr-bk-lf l3" />
          <span className="dr-bk-cv">
            <span className="dr-bk-fr">
              <span className="dr-bk-gt">Дневник</span>
              <span className="dr-bk-cp" dangerouslySetInnerHTML={{ __html: COMPASS }} />
            </span>
            <span className="dr-bk-bf" />
          </span>
          <span className="dr-bk-beam" />
        </span>
      </span>
      {glyphs.map((g, i) => (
        <i key={i} className="dr-gl" style={{ "--i": i, left: `${33 + i * 6}%` } as CSSProperties}>
          {g}
        </i>
      ))}
    </div>
  );
}
