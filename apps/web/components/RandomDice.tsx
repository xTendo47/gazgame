"use client";

// Умный кубик 🎲 в шапке главной: тап открывает шторку «Во что играем?» с двумя вопросами («Сколько вас?» и «Какой настрой?»),
// «Крутить 🎲» выбирает одну случайную готовую игру или тест из подходящих (списки — data/sections.json, dice; подбор — engine/dice.ts).
// Выбор запоминается на устройстве. Кубик покачивается; перед карточкой он крутится ~0,6 с (при «Уменьшить движение» — без анимаций).
import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { SectionsFile } from "@gazgame/content";
import { pickDice, validDicePick, type DiceItem, type DicePick } from "@gazgame/engine";
import { cn } from "@gazgame/ui";
import { trackDiceOpen, trackDicePlay, trackDiceRoll, trackHomeClick } from "@/lib/analytics";
import { prefersReducedMotion } from "@/lib/gaz";
import { haptic } from "@/lib/haptics";
import { getProgress } from "@/lib/progress";
import { Sheet } from "./Sheet";
import { Em } from "@/components/Em";

const ROLL_MS = 600;

/** bare + children — свой значок вместо эмодзи 🎲 (кубики на полке стола); подбор и шторка те же. */
export function RandomDice({
  items,
  config,
  className,
  bare,
  children,
}: {
  items: DiceItem[];
  config: SectionsFile["dice"];
  className?: string;
  bare?: boolean;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="Случайная игра: подобрать, во что играть"
        aria-haspopup="dialog"
        onClick={() => {
          trackHomeClick({ target: "dice" });
          trackDiceOpen();
          haptic("tick");
          setOpen(true);
        }}
        className={cn(
          !bare &&
            "dice-button grid size-[46px] shrink-0 place-items-center rounded-[14px] border border-line bg-surface text-2xl transition hover:bg-surface-2 max-[380px]:size-[42px] max-[380px]:text-[21px]",
          className,
        )}
      >
        {children ?? (
          <span aria-hidden="true" className="dice-emoji leading-none">
            <Em text="🎲" />
          </span>
        )}
      </button>
      {open && <DiceSheet items={items} config={config} onClose={() => setOpen(false)} />}
    </>
  );
}

function Pills<T extends string>({
  label,
  value,
  options,
  onPick,
}: {
  label: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onPick: (id: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2">
      <p className="text-[13px] font-bold">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={value === o.id}
            onClick={() => onPick(o.id)}
            className={cn(
              "min-h-11 rounded-full border px-[13px] py-2 text-[13px] font-bold transition-colors motion-reduce:transition-none",
              value === o.id ? "border-orange bg-orange text-bg" : "border-line",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function DiceSheet({ items, config, onClose }: { items: DiceItem[]; config: SectionsFile["dice"]; onClose: () => void }) {
  const router = useRouter();
  // Шторка открывается по тапу, поэтому прошлый выбор читаем сразу при открытии
  const [pick, setPick] = useState<DicePick>(() => validDicePick(config, getProgress().getDicePick(), config.default));
  const [result, setResult] = useState<DiceItem | null | undefined>(undefined);
  const [rolling, setRolling] = useState(false);
  const last = useRef<string | undefined>(undefined);
  const timer = useRef(0);

  function roll(next: DicePick, animate: boolean) {
    getProgress().saveDicePick(next);
    trackDiceRoll(next);
    window.clearTimeout(timer.current);
    const done = () => {
      const found = pickDice(config, items, next, Math.random, last.current);
      last.current = found?.slug;
      setResult(found);
      setRolling(false);
      haptic("take");
    };
    if (animate && !prefersReducedMotion()) {
      setRolling(true);
      haptic("click");
      timer.current = window.setTimeout(done, ROLL_MS);
    } else done();
  }

  function change(patch: Partial<DicePick>) {
    const next = { ...pick, ...patch };
    setPick(next);
    // карточка уже на экране — после смены ответа сразу подбираем новую
    if (result !== undefined && !rolling) roll(next, false);
    else getProgress().saveDicePick(next);
  }

  return (
    <Sheet label={config.title} onClose={onClose}>
      <h3 className="font-display text-xl font-extrabold">{config.title}</h3>
      <p className="-mt-2 text-[13px] text-muted">{config.sub}</p>
      <Pills label={config.askSize} value={pick.size} options={config.sizes} onPick={(size) => change({ size })} />
      <Pills label={config.askMood} value={pick.mood} options={config.moods} onPick={(mood) => change({ mood })} />

      <div aria-live="polite">
        {rolling && (
          <div className="grid h-[76px] place-items-center rounded-[18px] border border-line bg-[#2A2531]">
            <span aria-hidden="true" className="dice-spin text-4xl leading-none">
              <Em text="🎲" />
            </span>
          </div>
        )}
        {!rolling && result === null && <p className="rounded-[18px] border border-line bg-[#2A2531] px-3.5 py-3 text-[13px] text-muted">{config.empty}</p>}
        {!rolling && result && (
          <div className="flex items-center gap-3 rounded-[18px] border border-orange bg-[#2A2531] px-3.5 py-3">
            <span aria-hidden="true" className="text-[34px] leading-none">
              {result.emoji}
            </span>
            <span className="min-w-0">
              <b className="block font-display text-[15px] leading-tight font-bold">{result.title}</b>
              <small className="line-clamp-2 text-[12.5px] text-muted">{result.text}</small>
            </span>
          </div>
        )}
      </div>

      {result ? (
        <>
          <button
            type="button"
            onClick={() => {
              trackDicePlay({ id: result.slug });
              router.push(result.href);
            }}
            className="gaz-press min-h-14 w-full rounded-2xl bg-orange px-3 py-3.5 font-display text-[15px] font-extrabold text-bg"
          >
            {config.play}
          </button>
          <button type="button" onClick={() => roll(pick, true)} disabled={rolling} className="min-h-11 w-full rounded-2xl px-3 py-2.5 text-[13px] font-bold text-muted">
            {config.again}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => roll(pick, true)}
          disabled={rolling}
          className="gaz-press min-h-14 w-full rounded-2xl bg-orange px-3 py-3.5 font-display text-[15px] font-extrabold text-bg disabled:opacity-70"
        >
          {config.roll}
        </button>
      )}
    </Sheet>
  );
}
