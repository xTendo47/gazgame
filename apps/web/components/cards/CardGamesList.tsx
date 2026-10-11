"use client";

// Список «Карточных игр» с фильтром «Нас: 1 · 2 · … · 6+». Повторный тап снимает фильтр.
// Выбор помним до конца сессии (sessionStorage): это настройка экрана, а не прогресс.
import { useSyncExternalStore } from "react";
import Link from "next/link";
import type { CardGamesFile } from "@gazgame/content";
import { filterCardGames } from "@gazgame/engine";
import { cn } from "@gazgame/ui";
import { CardGameMeta } from "./CardGameMeta";

const KEY = "gazgame:cards-filter";
const listeners = new Set<() => void>();

function readFilter(): string {
  try {
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

function writeFilter(value: number | null) {
  try {
    if (value === null) sessionStorage.removeItem(KEY);
    else sessionStorage.setItem(KEY, String(value));
  } catch {
    // хранилище недоступно (приватный режим) — фильтр просто не запомнится
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function CardGamesList({ file }: { file: CardGamesFile }) {
  const raw = useSyncExternalStore(subscribe, readFilter, () => "");
  const valid = file.filter.options.some((o) => String(o.value) === raw);
  const selected = valid ? Number(raw) : null;
  const games = filterCardGames(file, selected);

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label={`Фильтр: ${file.filter.label}`} className="flex flex-wrap items-center gap-1.5">
        <span className="font-bold text-muted">{file.filter.label}</span>
        {file.filter.options.map((o) => {
          const on = selected === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => writeFilter(on ? null : o.value)}
              className={cn(
                "min-h-11 min-w-10 rounded-full px-2.5 font-display text-base font-bold transition active:scale-95",
                on ? "bg-lime text-bg" : "bg-surface text-cream hover:bg-surface-2",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      <ul aria-live="polite" className="flex flex-col gap-3">
        {games.map((g, i) => (
          <li key={g.id}>
            <Link
              href={`/${file.slug}/${g.id}`}
              className={cn(
                "group flex items-center gap-4 rounded-card border-l-[6px] bg-surface p-4 transition hover:bg-surface-2 active:scale-[0.98]",
                i % 2 ? "border-l-lime" : "border-l-orange",
              )}
            >
              <span aria-hidden="true" className="text-3xl leading-none">
                {g.emoji}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="flex flex-col">
                  <span className="font-display text-base font-bold leading-tight">{g.title}</span>
                  {g.aka && <span className="text-sm text-muted">{g.aka}</span>}
                </span>
                <CardGameMeta game={g} labels={file.labels} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {games.length === 0 && <p className="rounded-card bg-surface p-5 text-center font-semibold">{file.labels.empty}</p>}
    </div>
  );
}
