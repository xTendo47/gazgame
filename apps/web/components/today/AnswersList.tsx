"use client";

// Дневник «Мои ответы 📖»: по датам, новые сверху (дата, вопрос, ответ).
import Link from "next/link";
import { buttonVariants } from "@gazgame/ui";
import { useTodayData } from "@/lib/today";

const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function AnswersList() {
  const { answers } = useTodayData();
  if (answers.length === 0) {
    return (
      <section className="flex flex-col items-center gap-4 rounded-card bg-surface p-6 text-center">
        <div aria-hidden="true" className="text-5xl">
          📖
        </div>
        <p className="text-lg font-semibold">Пока пусто. Ответь на вопрос дня, и он появится здесь.</p>
        <Link href="/today" className={buttonVariants({ variant: "primary" })}>
          Газ! 🔥
        </Link>
      </section>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {[...answers].reverse().map((a) => (
        <li key={a.day} className="flex flex-col gap-1.5 rounded-[22px] border border-line bg-surface p-4">
          <time dateTime={a.day} className="text-xs font-bold tracking-[0.1em] text-muted uppercase">
            {dateFormat.format(new Date(a.day))}
          </time>
          <p className="font-display text-base leading-snug font-semibold">{a.question}</p>
          <p className="text-[15px] leading-snug break-words whitespace-pre-wrap">{a.text}</p>
        </li>
      ))}
    </ul>
  );
}
