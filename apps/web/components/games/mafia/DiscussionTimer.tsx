"use client";

// Таймер обсуждения: длительность меняется шагом (−/+), «Старт» и «Ещё раз». По нулю — «Время!» и вибрация.
import { useEffect, useRef, useState } from "react";
import { Button } from "@gazgame/ui";

const format = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

export function DiscussionTimer({ defaultSec, stepSec }: { defaultSec: number; stepSec: number }) {
  const [duration, setDuration] = useState(defaultSec);
  const [left, setLeft] = useState(defaultSec);
  const [running, setRunning] = useState(false);
  /** Сколько осталось — для тика интервала (в функциях обновления состояния побочных эффектов быть не должно). */
  const leftRef = useRef(defaultSec);

  function show(sec: number) {
    leftRef.current = sec;
    setLeft(sec);
  }

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const next = Math.max(0, leftRef.current - 1);
      show(next);
      if (next === 0) {
        setRunning(false);
        try {
          navigator.vibrate?.([200, 100, 200]);
        } catch {
          // вибрации нет — не страшно
        }
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  function change(delta: number) {
    const next = Math.max(stepSec, duration + delta);
    setDuration(next);
    show(next);
  }

  return (
    <section aria-labelledby="timer-title" className="flex flex-col gap-3 rounded-card bg-surface p-5">
      <h2 id="timer-title" className="font-display text-lg font-bold">
        Обсуждение ⏱️
      </h2>
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="md" className="w-14 bg-surface-2" aria-label={`Меньше на ${stepSec} секунд`} disabled={running} onClick={() => change(-stepSec)}>
          −
        </Button>
        <div
          role="timer"
          aria-live={left === 0 ? "assertive" : "off"}
          className={`font-display text-5xl font-black tabular-nums ${left === 0 ? "text-orange" : ""}`}
        >
          {left === 0 ? "Время!" : format(left)}
        </div>
        <Button variant="ghost" size="md" className="w-14 bg-surface-2" aria-label={`Больше на ${stepSec} секунд`} disabled={running} onClick={() => change(stepSec)}>
          +
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="primary" size="md" disabled={running || left === 0} onClick={() => setRunning(true)}>
          Старт
        </Button>
        <Button
          variant="outline"
          size="md"
          onClick={() => {
            setRunning(false);
            show(duration);
          }}
        >
          Ещё раз
        </Button>
      </div>
    </section>
  );
}
