"use client";

// Полоса «Сегодня» на главной: «🔥 Сегодня батл, вопрос, задание · N дней →» (подсказка прячется на узких экранах ≤380px).
// Серия 0: «Начни серию →». Пока день не засчитан: огонёк серый и тихо «дышит»; засчитан: огонёк цветной, рамка оранжевая со свечением.
// Тап открывает экран «Сегодня».
import { currentStreak, isDayCounted, pluralDays } from "@gazgame/engine";
import { cn } from "@gazgame/ui";
import { useNow } from "@/lib/gaz";
import { useTodayData } from "@/lib/today";
import { TrackedLink } from "../home/TrackedLink";

export function TodayStrip() {
  const data = useTodayData();
  // Главная статическая: серверного времени нет, до гидратации данных всё равно нет (серия 0)
  const now = useNow(0);
  const streak = currentStreak(data, now);
  const lit = isDayCounted(data, now);

  return (
    <TrackedLink
      href="/today"
      track={{ kind: "home", target: "today" }}
      aria-label={streak > 0 ? `Сегодня: батл, вопрос, задание. Серия ${streak} ${pluralDays(streak)}` : "Сегодня: батл, вопрос, задание. Начни серию"}
      className={cn(
        "flex min-h-11 items-center justify-between gap-2.5 rounded-full border bg-surface px-4 py-2 text-sm font-bold transition",
        "hover:bg-surface-2 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
        lit ? "border-orange/60 shadow-[0_0_18px_rgb(255_90_31/0.22)]" : "border-line",
      )}
    >
      <span className="min-w-0 truncate whitespace-nowrap">
        <span aria-hidden="true" className={cn("inline-block", !lit && "today-breathe opacity-60 grayscale")}>
          🔥
        </span>{" "}
        Сегодня<i className="ml-1.5 text-[12.5px] font-bold text-muted not-italic max-[380px]:hidden">батл, вопрос, задание</i>
      </span>
      <b className="ml-2 font-display text-sm font-extrabold whitespace-nowrap tabular-nums">
        {streak > 0 ? `${streak} ${pluralDays(streak)}` : "Начни серию"} →
      </b>
    </TrackedLink>
  );
}
