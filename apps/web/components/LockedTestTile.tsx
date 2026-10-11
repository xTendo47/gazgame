"use client";

// Карточка платного теста под замком (data/locked-tests.json) в разделе.
// Нажатие открывает шторку с превью (LockedTestsList). С Premium замка в значке нет.
import { Lock } from "lucide-react";
import type { LockedTest } from "@gazgame/content";
import { Badge, Tile } from "@gazgame/ui";
import { usePremium } from "@/lib/premium";

export function LockedTestTile({ test, onOpen }: { test: LockedTest; onOpen: () => void }) {
  const premium = usePremium();
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={premium ? `${test.title} — превью` : `${test.title} — ${test.locked.text}`}
      className="diamond-glow group block w-full rounded-card text-left"
    >
      <Tile
        emoji={test.emoji}
        title={test.title}
        subtitle={`${test.description}\nТест`}
        accent="none"
        className="whitespace-pre-line"
        badge={
          <Badge tone="premium" className="max-w-28 text-right">
            {premium ? (
              "💎 скоро"
            ) : (
              <>
                <Lock aria-hidden="true" size={12} className="shrink-0" /> {test.locked.text}
              </>
            )}
          </Badge>
        }
      />
    </button>
  );
}
