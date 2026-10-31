"use client";

// Шторка «Правила GAZ GAME»: открывается с полки на столе и со вкладыша на крышке коробки. Текст — черновик.
import { Jeton } from "@gazgame/ui";
import { Sheet } from "@/components/Sheet";

export function BoxRulesSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet label="Правила GAZ GAME" onClose={onClose}>
      <h2 className="font-display text-[19px] leading-tight font-extrabold">Правила GAZ GAME</h2>
      <ol className="flex list-decimal flex-col gap-2 pl-5 text-[15px] leading-snug">
        <li>Жми «Играть» и открывай коробку: внутри разделы для компании, для пары и для себя.</li>
        <li>Выбери то, что ближе, и тапни игру или тест. Правила каждой игры — в одно касание.</li>
        <li>Не знаешь, во что играть? Кинь кубики или жми «Мне скучно».</li>
      </ol>
      <p className="text-[12px] text-muted">[черновик: настоящие правила напишет основатель]</p>
      <Jeton onClick={onClose}>Понятно</Jeton>
    </Sheet>
  );
}
