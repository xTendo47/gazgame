"use client";

// Подсказки при первом заходе: кубик 🎲 и полоса «Сегодня» один раз объясняют себя всплывашкой, дальше молчат.
// «Понятно» запоминается на устройстве. Тексты — наши, в спеке их нет.
import { useState, useSyncExternalStore } from "react";
import { trackHintsSeen } from "@/lib/analytics";
import { getProgress } from "@/lib/progress";

const HINT_ID = "home";
const noSubscribe = () => () => {};

export function FirstHints() {
  // На сервере и до гидратации «уже видели»: всплывашка не мигает
  const seen = useSyncExternalStore(noSubscribe, () => getProgress().isHintSeen(HINT_ID), () => true);
  const [closed, setClosed] = useState(false);
  if (seen || closed) return null;

  function close() {
    getProgress().markHintSeen(HINT_ID);
    trackHintsSeen();
    setClosed(true);
  }

  return (
    <aside
      role="status"
      aria-label="Подсказки"
      className="sheet-up fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 mx-auto flex w-[calc(100%-2rem)] max-w-[448px] flex-col gap-2.5 rounded-[20px] border border-line bg-[#2A2531] px-4 py-3.5 shadow-[0_10px_30px_rgb(0_0_0/0.55)]"
    >
      <p className="text-[14px] leading-snug">
        <span aria-hidden="true">🎲</span> Не знаешь, во что играть? Тапни кубик, и мы подберём игру под вас.
      </p>
      <p className="text-[14px] leading-snug">
        <span aria-hidden="true">🔥</span> «Сегодня»: каждый день новые батл, вопрос и задание. Сделал любое из трёх, и серия растёт.
      </p>
      <button type="button" onClick={close} className="gaz-press min-h-11 self-end rounded-xl bg-orange px-4 py-2 font-display text-[13px] font-extrabold text-bg">
        Понятно
      </button>
    </aside>
  );
}
