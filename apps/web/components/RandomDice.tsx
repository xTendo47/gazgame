"use client";

// Кубик 🎲 в шапке главной: квадратная кнопка, как «Профиль». Покачивается раз в несколько секунд, по нажатию — бросок (~0.6 с)
// и переход в случайный тест или игру. Кому мешает движение (prefers-reduced-motion) — без анимаций, переход сразу.
// Умный подбор («Сколько вас?» и «Какой настрой?») добавим следующим шагом, пока подбор случайный.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@gazgame/ui";
import { trackHomeClick } from "@/lib/analytics";

const ROLL_MS = 600;

export function RandomDice({ paths, className }: { paths: string[]; className?: string }) {
  const router = useRouter();
  const [rolling, setRolling] = useState(false);

  function roll() {
    if (rolling || paths.length === 0) return;
    trackHomeClick({ target: "dice" });
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
      className={cn(
        "dice-button grid size-[46px] shrink-0 place-items-center rounded-[14px] border border-line bg-surface text-2xl transition hover:bg-surface-2 disabled:opacity-40 max-[380px]:size-[42px] max-[380px]:text-[21px]",
        rolling && "is-rolling",
        className,
      )}
    >
      <span aria-hidden="true" className="dice-emoji leading-none">
        🎲
      </span>
    </button>
  );
}
