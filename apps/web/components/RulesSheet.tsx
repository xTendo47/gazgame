"use client";

// «Как играть за 10 секунд»: шторка с названием, тремя пунктами с оранжевыми цифрами, «Играть →» и «Не сейчас».
// Открывается тапом по игре или тесту в разделе и кнопкой «?» внутри игры (тот же текст).
import { useState } from "react";
import { cn } from "@gazgame/ui";
import { trackRulesOpen } from "@/lib/analytics";
import { Sheet } from "./Sheet";

export interface RulesTexts {
  title: string;
  play: string;
  later: string;
}

export function RulesSheet({
  emoji,
  name,
  lines,
  texts,
  onPlay,
  onClose,
}: {
  emoji: string;
  name: string;
  lines: readonly string[];
  texts: RulesTexts;
  onPlay: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet label={`${name}: ${texts.title}`} onClose={onClose}>
      <h3 className="font-display text-xl font-extrabold">
        <span aria-hidden="true">{emoji}</span> {name}
      </h3>
      <p className="-mt-2 text-[13px] text-muted">{texts.title}</p>
      <ol className="flex list-decimal flex-col gap-2 pl-[22px] marker:font-extrabold marker:text-orange">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
      <button type="button" onClick={onPlay} className="gaz-press min-h-14 w-full rounded-2xl bg-orange px-3 py-3.5 font-display text-[15px] font-extrabold text-bg">
        {texts.play}
      </button>
      <button type="button" onClick={onClose} className="min-h-11 w-full rounded-2xl px-3 py-2.5 text-[13px] font-bold text-muted">
        {texts.later}
      </button>
    </Sheet>
  );
}

/** Кнопка «?» в игре и в тесте: открывает те же три строки. «Играть →» просто закрывает шторку (мы уже в игре). */
export function RulesHelp({
  id,
  emoji,
  name,
  lines,
  texts,
  className,
}: {
  id: string;
  emoji: string;
  name: string;
  lines: readonly string[];
  texts: RulesTexts;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="Как играть"
        onClick={() => {
          trackRulesOpen({ id, source: "help" });
          setOpen(true);
        }}
        className={cn("grid size-11 place-items-center rounded-full border border-line bg-surface font-display text-base font-extrabold text-muted transition hover:text-cream", className)}
      >
        ?
      </button>
      {open && <RulesSheet emoji={emoji} name={name} lines={lines} texts={texts} onPlay={() => setOpen(false)} onClose={() => setOpen(false)} />}
    </>
  );
}
