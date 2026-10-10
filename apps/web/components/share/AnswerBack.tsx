"use client";

// После своего итога, если тест прислал друг: «Ты: Холерик 🔥 · Друг: Сангвиник ☀️» и «Кинуть ответку 🔁».
// Итог друга лежит на устройстве (его запомнила плашка «Тебе скинули» на странице теста).
import { useSyncExternalStore } from "react";
import type { Test, TestResult } from "@gazgame/content";
import { findResult, type FriendResult } from "@gazgame/engine";
import { Button } from "@gazgame/ui";
import { trackAnswerBack } from "@/lib/analytics";
import { getProgress } from "@/lib/progress";
import { useOpenShare } from "./ShareSheet";

const noopSubscribe = () => () => {};

export function AnswerBack({ test, mine }: { test: Test; mine: TestResult }) {
  // На сервере итога друга нет; в браузере — из ProgressStore. Снимок — строка, чтобы не перерисовывать зря.
  const snapshot = useSyncExternalStore(
    noopSubscribe,
    () => JSON.stringify(getProgress().getFriendResult(test.id)),
    () => "null",
  );
  const openShare = useOpenShare();
  const record = JSON.parse(snapshot) as FriendResult | null;
  const friend = record ? findResult(test, record.resultId) : undefined;
  if (!friend) return null;

  return (
    <section aria-label="Ты и друг" className="flex flex-col gap-3 rounded-card bg-surface p-4">
      <p className="text-center text-lg font-bold">
        Ты: {mine.title} {mine.emoji} <span className="text-muted">·</span> Друг: {friend.title} {friend.emoji}
      </p>
      <Button
        variant="accent"
        onClick={() => {
          trackAnswerBack({ id: test.id });
          openShare({ answerTo: friend });
        }}
      >
        Кинуть ответку 🔁
      </Button>
    </section>
  );
}
