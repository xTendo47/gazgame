"use client";

// Плашка на странице теста, если пришли по ссылке друга (?from=share&r=…): «🔥 Тебе скинули: Холерик. Твоя очередь».
// Итог друга запоминаем на устройстве — после своего итога покажем «Ты: … · Друг: …» и «Кинуть ответку 🔁».
import { useEffect } from "react";
import { getProgress } from "@/lib/progress";
import { trackShareOpen } from "@/lib/analytics";

export function FriendBanner({
  testId,
  friend,
}: {
  testId: string;
  /** Итог друга из ссылки; null — ссылка битая, плашку не показываем, но заход по шерингу считаем. */
  friend: { resultId: string; blendId?: string; emoji: string; title: string } | null;
}) {
  const resultId = friend?.resultId;
  const blendId = friend?.blendId;
  // один раз на заход: считаем заход по шерингу и запоминаем итог друга
  useEffect(() => {
    trackShareOpen({ id: testId });
    if (resultId) getProgress().saveFriendResult(testId, { resultId, blendId });
  }, [testId, resultId, blendId]);

  if (!friend) return null;
  return (
    <p className="diamond-glow flex items-center gap-3 rounded-card bg-surface px-4 py-3 font-semibold">
      <span aria-hidden="true" className="text-2xl leading-none">
        {friend.emoji}
      </span>
      <span>
        Тебе скинули: <strong className="font-extrabold">{friend.title}</strong>. Твоя очередь
      </span>
    </p>
  );
}
