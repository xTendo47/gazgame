"use client";

// Заставка первого запуска: чёрный экран → «СТАРТ» → трек с начала → искры летят к центру, G, A, Z влетают,
// «game» печатается, полоса, световые штрихи, вспышка и переход в меню ровно на 5-й секунде трека.
// Тайминги анимации — в intro.css (шкала времени от старта трека, как в макете); здесь только запуск и дроп.
// Показывается один раз (флаг в ProgressStore). Время дропа берём из audio.currentTime;
// если звук не завёлся (запрет браузера) — идём по таймеру.
import { useRef, useState, useSyncExternalStore } from "react";
import { GIcon } from "@/components/casino/GIcon";
import { getProgress } from "@/lib/progress";
import { startMusic } from "@/lib/music";
import "./intro.css";

const HINT_ID = "intro";
/** Секунда трека, на которой наступает дроп: вспышка и уход заставки. */
const DROP = 5.0;
const LETTERS = ["G", "A", "Z"];
/** Искры: 28 штук, положение и задержка считаются по номеру — так же, как в макете. */
const DUST = Array.from({ length: 28 }, (_, i) => ({ x: (i * 37) % 100, y: (i * 53) % 100, d: (i % 7) * 0.35, s: 1 + (i % 3) }));
const noSubscribe = () => () => {};

/** Запускает музыку и шкалу анимации (класс go), в секунду DROP зовёт onDrop. */
async function playIntro(el: HTMLElement, onDrop: () => void) {
  const audio = await startMusic();
  // Анимации стартуют вместе с треком — тогда дроп на 5.0 с попадает в бит
  el.classList.add("go");
  const t0 = performance.now();
  const tick = () => {
    const t = audio && !audio.paused ? audio.currentTime : (performance.now() - t0) / 1000;
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
      <span className="gz-intro-dust" aria-hidden="true">
        {DUST.map((p, i) => (
          <i key={i} style={{ "--x": p.x, "--y": p.y, "--d": `${p.d}s`, "--s": `${p.s}px` } as React.CSSProperties} />
        ))}
      </span>
      <span className="gz-intro-streaks" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="gz-intro-logo" aria-hidden="true">
        <span className="gz-intro-gz">
          {LETTERS.map((c, i) => (
            <b
              key={c}
              style={{ "--i": i, "--fx": `${[-140, 10, 150][i]}px`, "--fy": `${[-160, 190, -120][i]}px`, "--fr": `${[-80, 40, 110][i]}deg` } as React.CSSProperties}
            >
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
        <small>
          лучше со звуком <GIcon name="headphones" size="1.1em" />
        </small>
      </button>
    </div>
  );
}
