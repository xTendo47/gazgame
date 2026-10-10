"use client";

// «Мои результаты»: пройденные тесты из ProgressStore (сейчас — память этого устройства).
// Названия тестов и результатов приходят с сервера, а что пройдено — читаем уже в браузере.
import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import type { ProgressData } from "@gazgame/engine";
import { buttonVariants } from "@gazgame/ui";
import { getProgress } from "@/lib/progress";

export interface TestSummary {
  id: string;
  slug: string;
  title: string;
  emoji: string;
  results: { id: string; title: string; emoji: string }[];
}

/** Если тест пройден в другой вкладке — список обновится сам. */
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });

export function MyResults({ tests, emptyHref }: { tests: TestSummary[]; emptyHref: string }) {
  // На сервере прогресса нет (null) — в браузере читаем его из ProgressStore.
  // Снимок — строка: так React видит, что данные не поменялись, и не перерисовывает зря.
  const snapshot = useSyncExternalStore(subscribe, () => JSON.stringify(getProgress().load()), () => null);
  const progress = useMemo(() => (snapshot ? (JSON.parse(snapshot) as ProgressData) : null), [snapshot]);

  if (!progress) return <p className="text-muted">Загружаем…</p>;

  const rows = Object.entries(progress.tests)
    .flatMap(([testId, record]) => {
      const test = tests.find((t) => t.id === testId);
      const result = test?.results.find((r) => r.id === record.resultId);
      return test && result ? [{ test, result, date: new Date(record.completedAt) }] : [];
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  if (rows.length === 0) {
    return (
      <section className="flex flex-col items-center gap-4 rounded-card bg-surface p-6 text-center">
        <div aria-hidden="true" className="text-5xl">
          🫥
        </div>
        <p className="text-lg font-semibold">Пока пусто. Пройди первый тест — результат появится здесь.</p>
        <Link href={emptyHref} className={buttonVariants({ variant: "primary" })}>
          Газ! 🔥
        </Link>
      </section>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {rows.map(({ test, result, date }) => (
        <li key={test.id}>
          <Link
            href={`/test/${test.slug}/result/${result.id}`}
            className="flex items-center gap-4 rounded-card bg-surface p-4 transition hover:bg-surface-2 active:scale-[0.98]"
          >
            <span aria-hidden="true" className="w-12 shrink-0 text-center text-4xl leading-none">
              {result.emoji}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm font-bold text-muted">
                {test.emoji} {test.title}
              </span>
              <span className="font-display text-lg font-bold leading-tight">{result.title}</span>
              <time dateTime={date.toISOString()} className="text-sm text-muted">
                {Number.isNaN(date.getTime()) ? "" : dateFormat.format(date)}
              </time>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
