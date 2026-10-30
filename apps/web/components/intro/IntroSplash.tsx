"use client";

// Заставка первого запуска: чёрный экран → «СТАРТ» → трек с начала → G, A, Z влетают в такт, «game» печатается,
// полоса, вспышка и переход в меню ровно на 5-й секунде трека. Показывается один раз (флаг в ProgressStore).
// Время берём из audio.currentTime; если звук не завёлся (запрет браузера) — идём по таймеру.
import { useRef, useState, useSyncExternalStore } from "react";
import { getProgress } from "@/lib/progress";
import { startMusic } from "@/lib/music";
import "./intro.css";

const HINT_ID = "intro";
/** Секунда трека, на которой наступает бит-дроп и заставка уходит. */
const DROP = 5.0;
/** Удары трека (замерены в макете): класс добавляется на корень, когда currentTime дошёл до секунды. */
const BEATS: [number, string][] = [
  [1.95, "l0"],
  [2.62, "l1"],
  [3.29, "l2"],
  [3.4, "bar"],
  [3.8, "streaks"],
  [3.96, "gm"],
];
const LETTERS = ["G", "A", "Z"];
const noSubscribe = () => () => {};

/** Ход заставки: ловит удары трека по audio.currentTime и в конце зовёт onDrop. */
async function playIntro(el: HTMLElement, onDrop: () => void) {
  el.classList.add("go");
  const audio = await startMusic();
  const t0 = performance.now();
  const fired = new Set<string>();
  const tick = () => {
    const t = audio && !audio.paused ? audio.currentTime : (performance.now() - t0) / 1000;
    for (const [at, cls] of BEATS) {
      if (t >= at && !fired.has(cls)) {
        fired.add(cls);
        el.classList.add(cls);
      }
    }
    if (t >= DROP - 0.02) {
      el.classList.add("drop");
      onDrop();
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function IntroSplash() {
  // На сервере и до гидратации считаем «уже видели»: меню не мигает под заставкой у тех, кто её уже смотрел
  const seen = useSyncExternalStore(noSubscribe, () => getProgress().isHintSeen(HINT_ID), () => true);
  const [gone, setGone] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  if (seen || gone) return null;

  function run() {
    const el = root.current;
    if (!el || started.current) return;
    started.current = true;
    void playIntro(el, () => {
      getProgress().markHintSeen(HINT_ID);
      // Вспышка и уход занимают ~1 секунду, потом убираем заставку из разметки
      setTimeout(() => setGone(true), 1100);
    });
  }

  return (
    <div ref={root} className="gz-intro" role="dialog" aria-label="Заставка GAZ game">
      <noscript>
        <style>{".gz-intro{display:none}"}</style>
      </noscript>
      <span className="gz-intro-streaks" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="gz-intro-logo" aria-hidden="true">
        <span className="gz-intro-gz">
          {LETTERS.map((c, i) => (
            <b key={c} style={{ "--fx": `${[-140, 10, 150][i]}px`, "--fy": `${[-160, 190, -120][i]}px`, "--fr": `${[-80, 40, 110][i]}deg` } as React.CSSProperties}>
              {c}
            </b>
          ))}
        </span>
        <span className="gz-intro-gm">game</span>
        <span className="gz-intro-bar" />
      </span>
      <span className="gz-intro-ring" aria-hidden="true" />
      <span className="gz-intro-flash" aria-hidden="true" />
      <button type="button" className="gz-intro-start" onClick={run}>
        <span className="gz-intro-lbl">СТАРТ</span>
        <small>лучше со звуком 🎧</small>
      </button>
    </div>
  );
}
