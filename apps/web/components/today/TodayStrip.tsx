"use client";

// Полоска «Сегодня» на главной: между слоганом и тремя карточками. Слева «🔥 Сегодня», справа серия («5 дней» / «Начни серию»).
// Пока день не засчитан: огонёк серый и тихо «дышит». Засчитан: огонёк цветной, рамка оранжевая со свечением. Тап — экран «Сегодня».
import Link from "next/link";
import { currentStreak, isDayCounted, pluralDays } from "@gazgame/engine";
import { cn } from "@gazgame/ui";
import { useNow } from "@/lib/gaz";
import { useTodayData } from "@/lib/today";

export function TodayStrip() {
  const data = useTodayData();
  // Главная статическая: серверного времени нет, до гидратации данных всё равно нет (серия 0)
  const now = useNow(0);
  const streak = currentStreak(data, now);
  const lit = isDayCounted(data, now);

  return (
    <Link
      href="/today"
      aria-label={streak > 0 ? `Сегодня: серия ${streak} ${pluralDays(streak)}` : "Сегодня: начни серию"}
      className={cn(
        "flex min-h-11 items-center justify-between gap-2.5 rounded-full border bg-surface px-4 py-2 text-sm font-bold transition",
        "hover:bg-surface-2 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
        lit ? "border-orange/60 shadow-[0_0_18px_rgb(255_90_31/0.22)]" : "border-line",
      )}
    >
      <span>
        <span aria-hidden="true" className={cn("inline-block", !lit && "today-breathe opacity-60 grayscale")}>
          🔥
        </span>{" "}
        Сегодня
      </span>
      <b className="font-display text-sm font-extrabold tabular-nums">{streak > 0 ? `${streak} ${pluralDays(streak)}` : "Начни серию"}</b>
    </Link>
  );
}
