"use client";

// Карта задания GAZ 🚀: тёмная, с оранжевой рамкой. Сверху слева метка источника, справа крупный эмодзи.
// Текст — шрифтом Unbounded. Теги: кто, время, где (у «Мне скучно»: «⏱ 5 минут»). Плашка «Усложнение 🌶️».
// Появляется с прыжком снизу (gaz-pop). Кнопки зависят от состояния: «Беру!» → «в процессе» → «Сделано».
import type { ReactNode } from "react";
import type { GazTask } from "@gazgame/content";
import type { GazSource } from "@gazgame/engine";
import { cn } from "@gazgame/ui";
import { Em } from "@/components/Em";
import { Glyph } from "@/components/casino/GIcon";

export const SOURCE_LABEL: Record<GazSource, string> = {
  bored: "Мне скучно",
  roulette: "Газ-рулетка",
  dare: "Вызов 🫵",
  daily: "Задание дня",
};

const WHO = { solo: "🙋 соло", duo: "💞 вдвоём", crew: "🪩 компания" } as const;
const TIME = { "15": "⏱ 15 минут", eve: "⏱ вечер", wk: "⏱ выходные" } as const;
const WHERE = { home: "🏠 дома", out: "🌆 на улице" } as const;

/** Есть ли у задания версия посложнее (только у рулетки). */
export function twistOf(task: GazTask): string | undefined {
  return "twist" in task ? task.twist : undefined;
}

export const BTN = "gaz-press rounded-[14px] px-2 py-3 text-center text-sm font-extrabold min-h-12";
export const BTN_GHOST = cn(BTN, "border border-line bg-[#2A2531]");

interface TaskCardProps {
  task: GazTask;
  source: GazSource;
  /** Кнопки под текстом: до «Беру!», после («Сделано»), свои (экран «Вызов») или без кнопок. */
  actions?: ReactNode;
  /** «В процессе. Без проверок, на честном слове» с мигающей точкой. */
  taking?: boolean;
  className?: string;
}

export function TaskCard({ task, source, actions, taking, className }: TaskCardProps) {
  const twist = twistOf(task);
  const tags = "who" in task ? [WHO[task.who], TIME[task.time], WHERE[task.where]] : ["⏱ 5 минут", "🙋 соло"];
  return (
    <article
      aria-label={`${SOURCE_LABEL[source]}: ${task.text}`}
      className={cn(
        "gaz-pop relative flex flex-col gap-3 rounded-3xl border border-orange/60 bg-[linear-gradient(160deg,#2B2430,#1C1920)] p-[18px] shadow-[0_14px_30px_rgb(0_0_0/0.45)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold tracking-[0.14em] text-orange uppercase">{SOURCE_LABEL[source]}</span>
        <span aria-hidden="true" className="text-[44px] leading-none">
          <Glyph emoji={task.emoji} label={task.text} size="1em" />
        </span>
      </div>
      <p className="font-display text-[17px] leading-[1.35] font-semibold text-pretty">{task.text}</p>
      <ul className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <li key={t} className="rounded-full bg-cream/[0.06] px-[9px] py-1 text-xs font-bold text-muted">
            <Em text={t} />
          </li>
        ))}
      </ul>
      {twist && (
        <p className="rounded-xl bg-orange/10 px-2.5 py-2 text-[13px]">
          <b className="text-orange"><Em text="Усложнение 🌶️" /></b> {twist}
        </p>
      )}
      {taking && (
        <p className="flex items-center gap-2 text-[13px] font-bold text-lime">
          <i aria-hidden="true" className="gaz-blink size-2 rounded-full bg-lime" />В процессе. Без проверок, на честном слове
        </p>
      )}
      {actions && <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-2">{actions}</div>}
    </article>
  );
}
