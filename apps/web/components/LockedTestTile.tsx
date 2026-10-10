"use client";

// Карточка платного теста под замком (data/locked-tests.json) в разделе.
// Нажатие считается как «Глубже 💎» и открывает экран с описанием /locked/<slug>.
import Link from "next/link";
import { Lock } from "lucide-react";
import type { LockedTest } from "@gazgame/content";
import { Badge, Tile } from "@gazgame/ui";
import { trackDeeperClick } from "@/lib/analytics";

export function LockedTestTile({ test }: { test: LockedTest }) {
  return (
    <Link
      href={`/locked/${test.slug}`}
      onClick={() => trackDeeperClick({ id: test.id, kind: "test", source: "locked-test" })}
      aria-label={`${test.title} — ${test.locked.text}`}
      className="diamond-glow group block rounded-card"
    >
      <Tile
        emoji={test.emoji}
        title={test.title}
        subtitle={`${test.description}\nТест · ${test.durationMin} мин`}
        accent="none"
        className="whitespace-pre-line"
        badge={
          <Badge tone="premium" className="max-w-28 text-right">
            <Lock aria-hidden="true" size={12} className="shrink-0" /> {test.locked.text}
          </Badge>
        }
      />
    </Link>
  );
}
