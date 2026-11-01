"use client";

// Игра «Объясни 🪧»: таймер полоской и цифрой, имя команды и счёт раунда, колода с верхней картой, свайпы и кнопки.
// «Вес»: вправо карта улетает с салатовым свечением и коротким вибро, влево — с оранжевым и двойным; новая карта выезжает
// снизу; последние 5 секунд таймер оранжевый и пульсирует (тиканье включается кнопкой, по умолчанию выкл); в 0 длинное вибро.
// При «Уменьшить движение» карта просто сменяется, таймер не пульсирует.
import { useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { roundPoints, type ExplainState } from "@gazgame/engine";
import { cn } from "@gazgame/ui";
import { haptic } from "@/lib/haptics";
import { prefersReducedMotion } from "@/lib/gaz";
import { TEAM_COLORS } from "./parts";

const YES_GLOW = "border-lime shadow-[0_0_34px_rgb(212_255_58/0.35)]";
const NO_GLOW = "border-orange shadow-[0_0_34px_rgb(255_90_31/0.35)]";
/** Насколько тянуть карту, чтобы свайп засчитался. */
const SWIPE_PX = 90;

/** Короткий щелчок тиканья (Web Audio). Звука нет — не страшно. */
function beep(ctx: AudioContext | null) {
  try {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.06;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch {
    // звука нет — игра идёт
  }
}

export function PlayScreen({
  state,
  levelTitle,
  left,
  sound,
  onToggleSound,
  onAnswer,
}: {
  state: ExplainState;
  levelTitle: string;
  /** Сколько секунд осталось. */
  left: number;
  sound: boolean;
  onToggleSound: () => void;
  onAnswer: (ok: boolean) => void;
}) {
  const { settings } = state;
  const front = useRef<HTMLDivElement>(null);
  const yesStamp = useRef<HTMLSpanElement>(null);
  const noStamp = useRef<HTMLSpanElement>(null);
  const drag = useRef({ x0: null as number | null, dx: 0, busy: false });
  const audio = useRef<AudioContext | null>(null);
  const hot = left <= 5;

  // Тиканье в последние 5 секунд (если включено)
  useEffect(() => {
    if (sound && left > 0 && left <= 5) beep(audio.current);
  }, [sound, left]);

  function toggleSound() {
    if (!sound && !audio.current && typeof AudioContext !== "undefined") {
      try {
        audio.current = new AudioContext();
      } catch {
        audio.current = null;
      }
    }
    onToggleSound();
  }

  function setGlow(el: HTMLElement, dir: "yes" | "no" | null) {
    el.classList.remove(...YES_GLOW.split(" "), ...NO_GLOW.split(" "));
    if (dir) el.classList.add(...(dir === "yes" ? YES_GLOW : NO_GLOW).split(" "));
  }

  /** Карта улетает со свечением и вибро, потом ответ засчитывается и на её месте выезжает следующая. */
  function fly(ok: boolean) {
    const el = front.current;
    if (!el || drag.current.busy || left <= 0) return;
    drag.current.busy = true;
    haptic(ok ? "yes" : "no");
    if (prefersReducedMotion()) {
      drag.current.busy = false;
      onAnswer(ok);
      return;
    }
    setGlow(el, ok ? "yes" : "no");
    el.style.transition = "transform .25s ease-in, opacity .25s";
    el.style.transform = `translateX(${ok ? 140 : -140}%) rotate(${ok ? 18 : -18}deg)`;
    el.style.opacity = "0.2";
    window.setTimeout(() => {
      drag.current.busy = false;
      onAnswer(ok);
    }, 230);
  }

  function reset(el: HTMLElement) {
    el.style.transform = "";
    setGlow(el, null);
    if (yesStamp.current) yesStamp.current.style.opacity = "0";
    if (noStamp.current) noStamp.current.style.opacity = "0";
  }

  const word = state.word;
  const score = roundPoints(state);

  return (
    <section className="today-pop flex flex-col gap-4" aria-label="Игра">
      <div className="flex items-center justify-between gap-2.5">
        <span className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-bold">
          <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: TEAM_COLORS[state.cur] }} />
          <span className="max-w-[9rem] truncate">{settings.teams[state.cur]}</span> · <b className="tabular-nums">{score}</b>
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={sound}
            aria-label={sound ? "Тиканье включено" : "Тиканье выключено"}
            className="grid size-11 place-items-center rounded-[14px] border border-line bg-surface text-muted"
          >
            {sound ? <Volume2 aria-hidden="true" size={18} /> : <VolumeX aria-hidden="true" size={18} />}
          </button>
          <span
            role="timer"
            aria-label={`Осталось ${left} секунд`}
            className={cn("font-display text-[34px] leading-none font-extrabold tabular-nums", hot && "explain-pulse text-orange")}
          >
            {left}
          </span>
        </div>
      </div>

      <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-surface">
        <i
          className={cn("today-smooth block h-full rounded-full transition-[width] duration-1000 ease-linear", hot ? "bg-orange" : "bg-lime")}
          style={{ width: `${Math.min(100, (left / settings.time) * 100)}%` }}
        />
      </div>

      <div className="relative h-[300px] touch-pan-y select-none">
        <div aria-hidden="true" className="absolute inset-0 translate-y-7 scale-[0.88] rounded-[28px] border-[1.5px] border-line bg-surface opacity-30" />
        <div aria-hidden="true" className="absolute inset-0 translate-y-3.5 scale-[0.94] rounded-[28px] border-[1.5px] border-line bg-surface opacity-60" />
        <div
          key={word}
          ref={front}
          role="group"
          aria-label={`Слово: ${word}`}
          className="cg-playcard explain-rise absolute inset-0 flex cursor-grab flex-col items-center justify-center gap-2.5 rounded-[28px] border-[1.5px] border-line bg-[linear-gradient(165deg,#2C2533,#211C26)] p-5 text-center shadow-[0_18px_40px_rgb(0_0_0/0.45)] active:cursor-grabbing"
          onPointerDown={(e) => {
            if (drag.current.busy) return;
            drag.current.x0 = e.clientX;
            drag.current.dx = 0;
            e.currentTarget.style.transition = "none";
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (d.x0 === null) return;
            d.dx = e.clientX - d.x0;
            const el = e.currentTarget;
            el.style.transform = `translateX(${d.dx}px) rotate(${d.dx / 14}deg)`;
            if (yesStamp.current) yesStamp.current.style.opacity = String(Math.max(0, Math.min(1, d.dx / 90)));
            if (noStamp.current) noStamp.current.style.opacity = String(Math.max(0, Math.min(1, -d.dx / 90)));
            setGlow(el, d.dx > 60 ? "yes" : d.dx < -60 ? "no" : null);
          }}
          onPointerUp={(e) => {
            const d = drag.current;
            if (d.x0 === null) return;
            d.x0 = null;
            if (Math.abs(d.dx) > SWIPE_PX) fly(d.dx > 0);
            else {
              e.currentTarget.style.transition = "transform .2s";
              reset(e.currentTarget);
            }
          }}
          onPointerCancel={(e) => {
            drag.current.x0 = null;
            reset(e.currentTarget);
          }}
        >
          <span ref={yesStamp} aria-hidden="true" className="absolute top-[18px] right-[18px] rotate-[8deg] rounded-[10px] border-2 border-lime px-2.5 py-[5px] font-display text-sm font-extrabold text-lime opacity-0">
            +1
          </span>
          <span ref={noStamp} aria-hidden="true" className="absolute top-[18px] left-[18px] -rotate-[8deg] rounded-[10px] border-2 border-orange px-2.5 py-[5px] font-display text-sm font-extrabold text-orange opacity-0">
            −1
          </span>
          <span className="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">
            {levelTitle}
            {settings.mode === "gestures" ? " · жестами" : ""}
          </span>
          <span className={cn("font-display leading-[1.1] font-extrabold [overflow-wrap:anywhere] text-balance", word.length > 16 ? "text-[28px]" : "text-[34px]")}>{word}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => fly(false)}
          className="gaz-press min-h-14 rounded-2xl border-[1.5px] border-orange/50 bg-orange/[0.12] px-2 py-3.5 font-display text-[15px] font-extrabold text-orange"
        >
          {settings.penalty ? "Пропуск −1" : "Пропуск"}
        </button>
        <button type="button" onClick={() => fly(true)} className="gaz-press min-h-14 rounded-2xl bg-lime px-2 py-3.5 font-display text-[15px] font-extrabold text-bg">
          Угадали +1
        </button>
      </div>
    </section>
  );
}
