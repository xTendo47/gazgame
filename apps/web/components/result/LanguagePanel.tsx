"use client";

// «Твой язык романтики» и «Идеальное свидание для тебя»: язык приходит в адресе результата (?lang=2),
// свидание берётся из таблицы «уровень × язык» (test.languages.dates).
import { useSearchParams } from "next/navigation";
import type { Test } from "@gazgame/content";
import { LANG_KEY, languageOf } from "@gazgame/engine";
import { sideScoreFromQuery } from "@/lib/result-query";

export function LanguagePanel({ test, resultId }: { test: Test; resultId: string }) {
  const index = sideScoreFromQuery(useSearchParams(), LANG_KEY);
  const language = index === null ? null : languageOf(test, index);
  if (!test.languages || !language) return null;
  const date = test.languages.dates?.[resultId]?.[language.id];

  return (
    <>
      <section aria-label={test.languages.title} className="flex flex-col gap-2 rounded-card border border-line bg-surface p-5">
        <h2 className="flex items-center gap-2 font-display text-lg leading-tight font-bold">
          <span aria-hidden="true">{language.emoji}</span>
          {test.languages.title}: {language.title}
        </h2>
        <p className="leading-relaxed text-cream/85">{language.text}</p>
      </section>
      {date && (
        <section aria-label={test.languages.datesTitle ?? "Идеальное свидание"} className="flex flex-col gap-2 rounded-card border-l-4 border-orange bg-surface p-5">
          <h2 className="flex items-center gap-2 font-display text-lg leading-tight font-bold">
            <span aria-hidden="true">💘</span>
            {test.languages.datesTitle ?? "Идеальное свидание"}
          </h2>
          <p className="leading-relaxed text-cream/85">{date}</p>
        </section>
      )}
    </>
  );
}
