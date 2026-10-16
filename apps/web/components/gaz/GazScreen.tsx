"use client";

// Экран раздела GAZ 🚀: /gaz. Сверху вниз: шапка со счётчиком, задание «в процессе», «Мне скучно 😩»,
// Газ-рулетка (3 прокрутки), карта задания, челлендж недели, наборы 💎, «Мои задания».
// Вид — по макету gaz-section (тёмная карта, оранжевая рамка, лаймовая рулетка). Всё хранится на устройстве (lib/gaz.ts).
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { GazFile, GazTask, TodayFile } from "@gazgame/content";
import {
  activeCard,
  DEFAULT_CHIPS,
  finishCard,
  gazTaskCard,
  mskDay,
  findGazTask,
  GAZ_SPINS,
  isTodayMarked,
  markedDays,
  markToday,
  mskWeekday,
  pickBored,
  pickRoulette,
  showBored,
  showRoulette,
  spinsLeft,
  tableCard,
  takeCard,
  weeklyChallenge,
  type GazChips,
  type GazSource,
} from "@gazgame/engine";
import { cn } from "@gazgame/ui";
import {
  trackDeeperClick,
  trackGazBored,
  trackGazChallengeMark,
  trackGazDare,
  trackGazDone,
  trackGazPackClick,
  trackGazSpin,
  trackGazTake,
} from "@/lib/analytics";
import { copyText } from "@/lib/clipboard";
import { isDesktop, prefersReducedMotion, updateGaz, useGazData, useNow } from "@/lib/gaz";
import { haptic } from "@/lib/haptics";
import { siteUrl } from "@/lib/share-card";
import { announceCard } from "@/lib/collection";
import { countDay } from "@/lib/today";
import { BackLink } from "../BackLink";
import { CollectionFlash } from "../collection/CollectionFlash";
import { DoneCard } from "./DoneCard";
import { BTN, BTN_GHOST, TaskCard, twistOf } from "./TaskCard";

const WHO_CHIPS = [
  { value: "solo", label: "Соло 🙋" },
  { value: "duo", label: "Вдвоём 💞" },
  { value: "crew", label: "Компания 🪩" },
] as const;
const TIME_CHIPS = [
  { value: "15", label: "15 минут" },
  { value: "eve", label: "Вечер" },
  { value: "wk", label: "Выходные" },
] as const;
const WHERE_CHIPS = [
  { value: "home", label: "Дома 🏠" },
  { value: "out", label: "На улице 🌆" },
] as const;

/** Сколько мини-карт показываем в «Мои задания»: полный список будет в Коллекции. */
const MINE_LIMIT = 20;
const REEL_TICKS = 11;

const BLOCK = "flex flex-col gap-3 rounded-[22px] border border-line bg-surface p-4";
const PRIMARY = cn(BTN, "col-span-full bg-orange py-3.5 font-display text-base text-bg");
const LIME_GHOST = cn(BTN, "border border-lime/50 bg-lime/10 text-lime");

function Head({ id, title, hint }: { id: string; title: string; hint: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <h2 id={id} className="font-display text-base leading-tight font-semibold text-balance">
        {title}
      </h2>
      <span className="text-right text-xs text-muted">{hint}</span>
    </div>
  );
}

function scrollTo(ref: RefObject<HTMLElement | null>, block: ScrollLogicalPosition) {
  requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block }));
}

export function GazScreen({ gaz, today, serverMs }: { gaz: GazFile; today: TodayFile; serverMs: number }) {
  const data = useGazData();
  const now = useNow(serverMs);
  const chips = data.lastChips ?? DEFAULT_CHIPS;
  const left = spinsLeft(data, now);

  /** Барабан крутится: эмодзи, которое сейчас мелькает. */
  const [reel, setReel] = useState<string | null>(null);
  const [won, setWon] = useState<{ task: GazTask; gold: boolean } | null>(null);
  const [message, setMessage] = useState("");
  const [packMessage, setPackMessage] = useState("");
  const timer = useRef(0);
  const resultRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const reelEmojis = useMemo(() => gaz.roulette.map((t) => t.emoji), [gaz.roulette]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const active = activeCard(data, now);
  const activeTask = active ? findGazTask(gaz, active.id) : undefined;
  const table = tableCard(data, now);
  const tableTask = table ? findGazTask(gaz, table.id) : undefined;
  const challenge = weeklyChallenge(gaz.challenges, now);
  const marks = markedDays(data, now);
  const weekday = mskWeekday(now);
  const todayMarked = isTodayMarked(data, now);

  function stopReel() {
    window.clearTimeout(timer.current);
    setReel(null);
  }

  function setChip<K extends keyof GazChips>(key: K, value: GazChips[K]) {
    haptic("click");
    updateGaz((d) => ({ ...d, lastChips: { ...(d.lastChips ?? DEFAULT_CHIPS), [key]: value } }));
  }

  function bored() {
    const picked = pickBored(gaz.bored, data.shownBored);
    stopReel();
    setWon(null);
    setMessage("");
    haptic("bored");
    trackGazBored({ id: picked.task.id });
    updateGaz((d) => showBored(d, picked.task, picked.shown, new Date()));
    scrollTo(resultRef, "nearest");
  }

  function spin() {
    if (reel !== null || left <= 0) return;
    const picked = pickRoulette(gaz.roulette, chips, data.shownRoulette);
    if (!picked) return;
    setWon(null);
    setMessage("");
    trackGazSpin(chips);
    updateGaz((d) => showRoulette(d, picked.task, picked.shown, chips, new Date()));
    scrollTo(resultRef, "nearest");
    if (prefersReducedMotion()) {
      haptic("take");
      return;
    }
    // Барабан около 1,2 с: эмодзи мелькают и замедляются, каждый щелчок — лёгкая вибрация, потом карта выпрыгивает
    let n = 0;
    const tick = () => {
      setReel(reelEmojis[Math.floor(Math.random() * reelEmojis.length)] ?? "🎯");
      haptic("click");
      n++;
      timer.current = window.setTimeout(n < REEL_TICKS ? tick : () => setReel(null), 50 + n * 12);
    };
    tick();
  }

  function take(task: GazTask, source: GazSource) {
    haptic("take");
    trackGazTake({ id: task.id, source });
    setMessage("");
    updateGaz((d) => takeCard(d, { id: task.id, source }, new Date()));
    scrollTo(activeRef, "center");
  }

  function done(task: GazTask, source: GazSource, gold: boolean) {
    haptic("fanfare");
    trackGazDone({ id: task.id, source, gold });
    const first = !data.done.some((x) => x.id === task.id);
    updateGaz((d) => finishCard(d, task.id, gold, new Date()));
    // первое такое задание — новая карта в Коллекции (повтор только «×2»)
    if (first) announceCard(gazTaskCard(task, { count: 1, gold, date: mskDay(new Date()) }));
    // любое сделанное задание GAZ засчитывает день в «Сегодня 🔥»
    countDay(today.ladder);
    setWon({ task, gold });
    scrollTo(resultRef, "center");
  }

  async function dare(task: GazTask) {
    trackGazDare({ id: task.id });
    const link = `${siteUrl(window.location.origin)}/gaz?dare=${task.id}`;
    const text = `Тебе бросили вызов в GAZ 🫵 «${task.text}». Слабо?`;
    if (!isDesktop() && navigator.share) {
      navigator.share({ text: `${text} ${link}` }).catch(() => {});
      return;
    }
    setMessage((await copyText(link)) ? "Ссылка скопирована" : `Не получилось скопировать. Вот ссылка: ${link}`);
  }

  function markDay() {
    if (!challenge || todayMarked) return;
    haptic("mark");
    trackGazChallengeMark({ id: challenge.id, day: weekday });
    updateGaz((d) => markToday(d, new Date()));
  }

  function packClick(id: string) {
    haptic("click");
    trackGazPackClick({ id });
    trackDeeperClick({ id, kind: "gaz", source: "gaz-pack" });
    setPackMessage("Скоро в Premium. Мы уже пишем задания 🔥");
  }

  const mine = data.done.slice(-MINE_LIMIT).reverse();
  const justDone = won !== null;

  return (
    <div className="flex flex-col gap-4">
      <BackLink href="/">Меню</BackLink>

      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h1 className="flex items-center gap-2.5 font-display text-[34px] leading-none font-extrabold">
            GAZ <span aria-hidden="true">🚀</span>
          </h1>
          <div className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-bold whitespace-nowrap tabular-nums">
            🔥 Сделано: <b className="text-orange">{data.done.length}</b>
          </div>
        </div>
        <p className="text-muted">Хватит листать. Вот что сделать прямо сейчас.</p>
      </header>

      {active && activeTask && (
        <div ref={activeRef}>
          <TaskCard
            key={`active-${active.id}`}
            task={activeTask}
            source={active.source}
            taking
            actions={
              <>
                <button type="button" className={PRIMARY} onClick={() => done(activeTask, active.source, false)}>
                  Сделано 🔥
                </button>
                {twistOf(activeTask) && (
                  <button
                    type="button"
                    className={cn(BTN, "col-span-full border border-[#FFC83A]/60 bg-[#FFC83A]/10 text-[#FFC83A]")}
                    onClick={() => done(activeTask, active.source, true)}
                  >
                    Сделано с усложнением 🌶️
                  </button>
                )}
              </>
            }
          />
        </div>
      )}

      <button
        type="button"
        onClick={bored}
        className="gaz-press flex min-h-16 w-full items-center gap-3.5 rounded-3xl bg-orange px-5 py-[18px] text-left text-bg"
      >
        <span aria-hidden="true" className="text-[40px] leading-none">
          😩
        </span>
        <span className="flex flex-col">
          <b className="font-display text-xl leading-[1.1] font-extrabold">Мне скучно</b>
          <small className="text-[13px] font-bold opacity-80">Одно задание на 5 минут, без вопросов</small>
        </span>
      </button>

      <section aria-labelledby="gaz-roulette" className={BLOCK}>
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="gaz-roulette" className="font-display text-base leading-tight font-semibold">
            Газ-рулетка
          </h2>
          <span className="text-xs text-muted">когда есть время</span>
        </div>
        <ChipRow label="Кто" value={chips.who} options={WHO_CHIPS} onPick={(v) => setChip("who", v)} />
        <ChipRow label="Сколько времени" value={chips.time} options={TIME_CHIPS} onPick={(v) => setChip("time", v)} />
        <ChipRow label="Где" value={chips.where} options={WHERE_CHIPS} onPick={(v) => setChip("where", v)} columns={2} />
        <button
          type="button"
          onClick={spin}
          disabled={left <= 0 || reel !== null}
          className="gaz-press min-h-14 rounded-2xl bg-lime p-3.5 font-display text-base font-extrabold text-bg disabled:bg-[#2A2531] disabled:text-muted"
        >
          {left <= 0 ? "Хватит выбирать, Газ! 🔥" : "Крути! 🎯"}
        </button>
        <p className="-mt-1 text-center text-xs text-muted">
          {left <= 0
            ? "Рулетка снова заработает завтра"
            : left === GAZ_SPINS
              ? `Можно крутить ${left} раза`
              : left === 1
                ? "Можно крутить ещё 1 раз"
                : `Можно крутить ещё ${left} раза`}
        </p>
      </section>

      <div ref={resultRef} aria-live="polite" className="flex scroll-mt-4 flex-col gap-2.5 empty:hidden">
        {reel !== null ? (
          <div
            aria-label="Крутим рулетку"
            className="grid h-[120px] place-items-center rounded-[22px] border border-dashed border-line bg-[#2A2531] text-[64px]"
          >
            <span aria-hidden="true">{reel}</span>
          </div>
        ) : won ? (
          <DoneCard key={`${won.task.id}-${data.done.length}`} task={won.task} gold={won.gold} />
        ) : table && tableTask ? (
          <TaskCard
            key={`${table.source}-${table.id}`}
            task={tableTask}
            source={table.source}
            actions={
              <>
                <button type="button" className={PRIMARY} onClick={() => take(tableTask, table.source)}>
                  Беру! 🔥
                </button>
                <button type="button" className={LIME_GHOST} onClick={() => void dare(tableTask)}>
                  Слабо другу? 🫵
                </button>
                <button
                  type="button"
                  className={cn(BTN_GHOST, "disabled:text-muted disabled:opacity-60")}
                  disabled={table.source === "roulette" && left <= 0}
                  onClick={table.source === "bored" ? bored : spin}
                >
                  Другое ↻
                </button>
              </>
            }
          />
        ) : null}
        {message && (
          <p role="status" className="rounded-[14px] border border-line bg-[#2A2531] px-3 py-2.5 text-[13px] break-words">
            {message}
          </p>
        )}
      </div>

      {challenge && (
        <section aria-labelledby="gaz-challenge" className={BLOCK}>
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="gaz-challenge" className="font-display text-base leading-tight font-semibold">
              Челлендж недели 🏁
            </h2>
            <span className="text-xs text-muted">один на всех</span>
          </div>
          <div>
            <p className="font-display text-lg leading-tight font-semibold">
              <span aria-hidden="true">{challenge.emoji} </span>
              {challenge.title}
            </p>
            <p className="mt-1 text-[13px] text-muted">{challenge.text}</p>
          </div>
          <ol aria-label={`Отмечено дней: ${marks.length} из 7`} className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => (
              <li
                key={day}
                className={cn(
                  "grid aspect-square place-items-center rounded-full border text-[11px] font-extrabold",
                  marks.includes(day) ? "border-orange bg-orange text-bg" : "border-line bg-[#2A2531] text-muted",
                  day === weekday && !marks.includes(day) && "border-lime text-lime",
                )}
              >
                {day}
              </li>
            ))}
          </ol>
          <button type="button" onClick={markDay} disabled={todayMarked} className={cn(BTN_GHOST, "disabled:opacity-100")}>
            {todayMarked ? `День ${weekday} отмечен 🔥` : `Отметить день ${weekday} ✓`}
          </button>
          <p className="-mt-1 text-center text-xs text-muted">5 из 7 дней: карта в Коллекцию. Все 7: золотая</p>
        </section>
      )}

      <section aria-labelledby="gaz-packs" className="flex flex-col gap-2.5">
        <Head id="gaz-packs" title="Наборы 💎" hint="Premium" />
        <ul className="-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1">
          {gaz.packs.map((pack) => (
            <li key={pack.id} className="shrink-0 snap-start">
              <button
                type="button"
                onClick={() => packClick(pack.id)}
                className="gaz-press flex min-h-[150px] w-[150px] flex-col gap-1.5 rounded-[20px] border border-[#62D2FF]/45 bg-surface p-3.5 text-left shadow-[0_0_16px_rgb(98_210_255/0.14)]"
              >
                <span aria-hidden="true" className="text-3xl leading-none">
                  {pack.emoji}
                </span>
                <b className="font-display text-[13px] leading-tight font-semibold">{pack.title}</b>
                <small className="text-xs text-muted">{pack.text}</small>
                <span className="mt-auto text-[11px] font-bold text-[#62D2FF]">Скоро 💎</span>
              </button>
            </li>
          ))}
        </ul>
        {packMessage && (
          <p role="status" className="rounded-[14px] border border-line bg-[#2A2531] px-3 py-2.5 text-[13px]">
            {packMessage}
          </p>
        )}
      </section>

      <section aria-labelledby="gaz-mine" className="flex flex-col gap-2.5">
        <Head id="gaz-mine" title="Мои задания" hint="уходят в Коллекцию 🃏" />
        <ul className="flex flex-wrap gap-2">
          {mine.map((item, i) => {
            const task = findGazTask(gaz, item.id);
            return (
              <li
                key={`${item.id}-${data.done.length - i}`}
                aria-label={task ? `${task.text}${item.gold ? " (золотая карта)" : ""}` : "Задание"}
                className={cn(
                  "grid h-[76px] w-[58px] place-items-center rounded-xl border bg-surface text-[26px]",
                  item.gold ? "border-[#FFC83A] shadow-[0_0_14px_rgb(255_200_58/0.35)]" : "border-line",
                  justDone && i === 0 && "gaz-pop border-orange",
                )}
              >
                <span aria-hidden="true">{task?.emoji ?? "🃏"}</span>
              </li>
            );
          })}
          <li
            aria-label="Здесь появится следующая карта"
            className="grid h-[76px] w-[58px] place-items-center rounded-xl border border-dashed border-line bg-surface font-display text-sm font-extrabold text-muted"
          >
            ???
          </li>
        </ul>
      </section>

      <CollectionFlash />
    </div>
  );
}

function ChipRow<T extends string>({
  label,
  value,
  options,
  onPick,
  columns = 3,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onPick: (value: T) => void;
  columns?: 2 | 3;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1.5">
      <div aria-hidden="true" className="text-[10px] font-bold tracking-[0.14em] text-muted uppercase">
        {label}
      </div>
      <div className={cn("grid gap-1.5", columns === 2 ? "grid-cols-2" : "grid-cols-3")}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onPick(o.value)}
            className={cn(
              "min-h-12 rounded-[14px] border px-1.5 py-2 text-center text-[13px] font-bold transition-colors motion-reduce:transition-none",
              value === o.value ? "border-lime bg-lime/[0.12] text-lime" : "border-line bg-[#2A2531]",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
