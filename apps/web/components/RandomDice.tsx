"use client";

// Кости в углу главного экрана: контурная иллюстрация (inline SVG).
// Покачиваются раз в несколько секунд, по нажатию — бросок (~0.6 с) и переход в случайный тест или игру.
// Кому мешает движение (prefers-reduced-motion) — без анимаций, переход сразу.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@gazgame/ui";

const ROLL_MS = 600;

export function RandomDice({ paths, className }: { paths: string[]; className?: string }) {
  const router = useRouter();
  const [rolling, setRolling] = useState(false);

  function roll() {
    if (rolling || paths.length === 0) return;
    const path = paths[Math.floor(Math.random() * paths.length)] as string;
    router.prefetch(path);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(path);
      return;
    }
    setRolling(true);
    window.setTimeout(() => router.push(path), ROLL_MS);
  }

  return (
    <button
      type="button"
      aria-label="Случайная игра"
      onClick={roll}
      disabled={paths.length === 0}
      className={cn("dice-button shrink-0 rounded-card p-1 disabled:opacity-40", rolling && "is-rolling", className)}
    >
      <svg viewBox="0 0 100 92" width="88" height="81" aria-hidden="true" fill="none" strokeWidth="2" strokeLinejoin="round">
        {/* Оранжевая кость: повёрнута влево, на грани — 3 */}
        <g transform="rotate(-14 32 40)" stroke="#FF5A1F">
          <rect x="8" y="16" width="48" height="48" rx="10" fill="rgb(255 90 31 / 0.08)" />
          <circle cx="20" cy="28" r="3.6" />
          <circle cx="32" cy="40" r="3.6" />
          <circle cx="44" cy="52" r="3.6" />
        </g>
        {/* Салатовая кость: повёрнута вправо, лежит поверх, на грани — 5 */}
        <g transform="rotate(16 66 58)" stroke="#D4FF3A">
          {/* непрозрачная подложка цвета фона, чтобы линии первой кости не просвечивали */}
          <rect x="44" y="36" width="44" height="44" rx="9" fill="#141217" />
          <rect x="44" y="36" width="44" height="44" rx="9" fill="rgb(212 255 58 / 0.08)" />
          <circle cx="55" cy="47" r="3.3" />
          <circle cx="77" cy="47" r="3.3" />
          <circle cx="66" cy="58" r="3.3" />
          <circle cx="55" cy="69" r="3.3" />
          <circle cx="77" cy="69" r="3.3" />
        </g>
      </svg>
    </button>
  );
}
