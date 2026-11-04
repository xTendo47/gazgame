"use client";

// Экран «Сегодня 🔥»: /today. Сверху вниз: шапка с датой и серией, награды за серию, Батл дня ⚔️, Вопрос дня 💭,
// Задание дня ⚡ (из колоды «Мне скучно» раздела GAZ), плашка заморозки, «Мои ответы 📖».
// День засчитан, если сделано хоть одно из трёх. Всё одно и то же у всех в этот день и меняется в 00:00 МСК. Вид — по макету today.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { GazFile, TodayFile } from "@gazgame/content";
import {
  answerFor,
  finishCard,
  gazTaskCard,
  isDayCounted,
  ladderProgress,
  mskDay,
  mskWeekday,
  nextStep,
  pluralDays,
  saveAnswer,
  settleToday,
  skipTask,
  todayPicks,
  voteToday,
  weekChoices,
  type TodayChoice,
} from "@gazgame/engine";
import { cn } from "@gazgame/ui";
import {
  trackGazDone,
  trackTodayBattleShare,
  trackTodayBattleVote,
  trackTodayOpen,
  trackTodayQuestionAnswer,
  trackTodayTaskDone,
} from "@/lib/analytics";
import { updateGaz, useGazData, useNow } from "@/lib/gaz";
import { haptic } from "@/lib/haptics";
import { shareImage } from "@/lib/share";
import { siteUrl } from "@/lib/share-card";
import { announceCard } from "@/lib/collection";
import { countDay, updateToday, useTodayData } from "@/lib/today";
import { BackLink } from "../BackLink";
import { CollectionFlash } from "../collection/CollectionFlash";
import { Glyph } from "@/components/casino/GIcon";
import { Em } from "@/components/Em";

const BLOCK = "flex flex-col gap-3 rounded-[22px] border bg-surface p-4";
const BTN = "gaz-press min-h-12 rounded-[14px] px-2 py-3 text-center text-sm font-extrabold";
const DONE_NOTE =
  "today-pop flex items-center gap-2.5 rounded-[14px] border border-lime/35 bg-lime/[0.08] px-3 py-2.5 text-sm font-bold text-lime";
const ICE = "#62D2FF";

const dateFormat = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Moscow" });

/** «Понедельник, 12 октября». */
function formatDate(now: Date): string {
  const text = dateFormat.format(now);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function TodayScreen({ today, gaz, serverMs }: { today: TodayFile; gaz: GazFile; serverMs: number }) {
  const raw = useTodayData();
  const gazData = useGazData();
  const now = useNow(serverMs);
  // Показываем данные уже «с поправкой на сегодня»: заморозка, сгоревшая серия. Запись — при заходе (ниже) и при первом действии
  const data = settleToday(raw, now);
  const day = mskDay(now);
  const weekday = mskWeekday(now);
  const picks = todayPicks(today, gaz.bored, now);
  const counted = isDayCounted(data, now);
  const streak = data.streak;
  const next = nextStep(streak, today.ladder);

  useEffect(() => {
    updateToday((d) => settleToday(d, new Date()));
    trackTodayOpen();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <BackLink href="/">Меню</BackLink>

      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-lg leading-tight font-semibold">{formatDate(now)}</h1>
          <p className={cn("mt-1 text-[13px]", counted ? "text-lime" : "text-muted")}>
            <Em text={counted ? `День засчитан 🔥 Серия: ${streak} ${pluralDays(streak)}` : "Сделай хоть одно из трёх, и день засчитан"} />
          </p>
        </div>
        <div
          role="img"
          aria-label={`Серия ${streak} ${pluralDays(streak)}`}
          className={cn(
            "grid size-[68px] shrink-0 place-items-center rounded-[20px] border bg-surface text-center",
            counted ? "border-orange shadow-[0_0_22px_rgb(255_90_31/0.35)]" : "border-line",
          )}
        >
          <div>
            <div
              aria-hidden="true"
              className={cn("today-smooth text-2xl leading-none transition-[filter,opacity] duration-300", counted ? "today-flame" : "opacity-60 grayscale")}
            >
              <Em text="🔥" />
            </div>
            <b className="font-display text-lg leading-none font-extrabold tabular-nums">{streak}</b>
          </div>
        </div>
      </header>

      {data.notice?.day === day && (
        <p
          role="status"
          className={cn(
            "today-pop rounded-[14px] border px-3 py-2.5 text-sm font-bold",
            data.notice.kind === "freeze" ? "border-[#62D2FF]/50 bg-[#62D2FF]/10 text-[#62D2FF]" : "border-orange/50 bg-orange/10 text-orange",
          )}
        >
          <Em text={data.notice.kind === "freeze" ? "Заморозка сработала ❄️ Серия жива" : "Начнём заново? Огонь ждёт 🔥"} />
        </p>
      )}

      <section aria-labelledby="today-ladder" className={cn(BLOCK, "border-line")}>
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="today-ladder" className="font-display text-base leading-tight font-semibold">
            Награды за серию
          </h2>
          <span className="text-right text-xs text-muted">
            {next ? <>{`ещё ${next.days - streak} ${pluralDays(next.days - streak)} до `}<Glyph emoji={next.emoji} label={next.text} size="1.1em" /></> : "Все ступеньки пройдены"}
          </span>
        </div>
        <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-[#2A2531]">
          <i
            className="today-smooth block h-full rounded-full bg-[linear-gradient(90deg,#FF5A1F,#D4FF3A)] transition-[width] duration-500"
            style={{ width: `${Math.round(ladderProgress(streak, today.ladder) * 100)}%` }}
          />
        </div>
        <ol className="grid grid-cols-4 gap-1.5">
          {today.ladder.map((step) => {
            const got = !step.premium && streak >= step.days;
            const isNext = next?.days === step.days;
            return (
              <li key={step.days} className="flex min-w-0 flex-col items-center gap-1 text-center">
                <div
                  aria-hidden="true"
                  className={cn(
                    "grid size-[46px] place-items-center rounded-[14px] border bg-[#2A2531] text-[22px]",
                    got ? "border-orange bg-orange/15" : "border-line",
                    step.premium && "border-[#62D2FF]/55 shadow-[0_0_12px_rgb(98_210_255/0.18)]",
                    isNext && "border-dashed border-lime",
                  )}
                  style={step.premium && isNext ? { borderColor: ICE } : undefined}
                >
                  <Glyph emoji={step.emoji} label={step.text} size="1em" />
                </div>
                <b className="font-display text-[13px] font-extrabold tabular-nums">{step.days}</b>
                <small className="text-[11px] leading-tight text-muted">
                  {step.text}
                  {got && " ✓"}
                </small>
              </li>
            );
          })}
        </ol>
      </section>

      <Battle today={today} battle={picks.battle} day={day} weekday={weekday} now={now} />
      <Question today={today} question={picks.question} now={now} />

      <TaskBlock today={today} task={picks.task} day={day} done={gazData.done.some((x) => x.id === picks.task.id && x.date === day)} />

      <p className="flex items-start gap-2.5 rounded-[18px] bg-[#2A2531] px-3.5 py-3 text-[13px] text-muted">
        <span aria-hidden="true" className="text-[22px] leading-none">
          <Em text="❄️" />
        </span>
        <span>
          <b className="text-cream">Заморозка: 1 в неделю.</b> Пропущен день, а серия не сгорает.
        </span>
      </p>

      <Link
        href="/today/answers"
        className="flex min-h-12 items-center justify-center rounded-[14px] border border-line bg-surface px-4 text-[15px] font-bold transition hover:bg-surface-2"
      >
        <Em text="Мои ответы 📖" />
      </Link>

      <CollectionFlash />
    </div>
  );
}

// ---------- Батл дня ⚔️ ----------

function Battle({
  today,
  battle,
  day,
  weekday,
  now,
}: {
  today: TodayFile;
  battle: TodayFile["battles"][number];
  day: string;
  weekday: number;
  now: Date;
}) {
  const data = useTodayData();
  const voted: TodayChoice | undefined = data.votes[day];
  const [image, setImage] = useState<Blob | null>(null);
  const [status, setStatus] = useState("");

  // Картинку для «Спросить друзей» грузим заранее: делиться файлом нужно сразу по нажатию
  useEffect(() => {
    if (!voted) return;
    let alive = true;
    fetch(`/share/today?${new URLSearchParams({ b: battle.id, v: voted })}`)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((blob) => alive && setImage(blob))
      .catch(() => alive && setStatus("Картинка не загрузилась. Проверь интернет и обнови страницу."));
    return () => {
      alive = false;
    };
  }, [battle.id, voted]);

  function vote(choice: TodayChoice) {
    if (voted) return;
    haptic("click");
    trackTodayBattleVote({ id: battle.id, choice });
    updateToday((d) => voteToday(d, choice, new Date()));
    countDay(today.ladder);
  }

  async function ask() {
    if (!image || !voted) return;
    trackTodayBattleShare({ id: battle.id });
    const picked = battle[voted];
    const link = `${siteUrl(window.location.origin)}/today`;
    const outcome = await shareImage(image, `gaz-battle-${battle.id}.png`, `${battle.question} Я за ${picked.label}. А ты? ${link}`);
    if (outcome === "downloaded") setStatus("Картинка сохранена. Отправь её в чат или выложи в сторис");
  }

  const week = weekday === 7 ? weekChoices(data, today, now, weekday) : null;

  return (
    <section aria-labelledby="today-battle" className={cn(BLOCK, voted ? "border-lime/45" : "border-line")}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="today-battle" className="font-display text-base leading-tight font-semibold">
          <Em text="Батл дня ⚔️" />
        </h2>
        <span className="text-xs text-muted">новый в 00:00</span>
      </div>
      <p className="font-display text-[22px] leading-[1.15] font-extrabold">{battle.question}</p>
      <div className="grid grid-cols-2 gap-2">
        {(["a", "b"] as const).map((key) => {
          const option = battle[key];
          const picked = voted === key;
          return (
            <button
              key={key}
              type="button"
              disabled={voted !== undefined}
              aria-pressed={voted ? picked : undefined}
              onClick={() => vote(key)}
              className={cn(
                "today-smooth flex min-h-28 flex-col items-center justify-center gap-1.5 rounded-[18px] px-2 py-[18px] font-display text-base font-extrabold text-bg transition-[transform,opacity,filter] duration-[250ms]",
                key === "a" ? "bg-orange" : "bg-lime",
                !voted && "active:scale-[0.96] motion-reduce:active:scale-100",
                voted && !picked && "scale-[0.94] opacity-30 grayscale-[0.6]",
                voted && picked && "scale-[1.03]",
              )}
            >
              <span aria-hidden="true" className="text-[40px] leading-none">
                <Glyph emoji={option.emoji} label={option.label} size="1em" />
              </span>
              {option.label}
            </button>
          );
        })}
      </div>
      {voted && (
        <div className="today-pop flex flex-col gap-2">
          <p className={DONE_NOTE}>
            Ты за {battle[voted].label} <Glyph emoji={battle[voted].emoji} label={battle[voted].label} size="1.1em" />
          </p>
          <button
            type="button"
            onClick={() => void ask()}
            disabled={!image}
            className={cn(BTN, "border border-lime/50 bg-lime/10 text-lime disabled:opacity-60")}
          >
            {image ? <Em text="Спросить друзей 👆" /> : "Рисуем картинку…"}
          </button>
          <p role="status" className="min-h-4 text-center text-xs text-muted">
            {status || "Карточка батла уйдёт в сторис или в чат"}
          </p>
        </div>
      )}
      {week && (
        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <h3 className="font-display text-sm font-semibold">Твоя неделя в батлах</h3>
          <ol className="grid grid-cols-7 gap-1.5" aria-label="Выборы за неделю">
            {week.map((choice, i) => (
              <li
                key={i}
                aria-label={choice ? choice.label : "Не голосовал"}
                className={cn(
                  "grid aspect-square place-items-center rounded-full border text-xl",
                  choice ? "border-line bg-[#2A2531]" : "border-dashed border-line text-xs text-muted",
                )}
              >
                {choice ? <span aria-hidden="true"><Glyph emoji={choice.emoji} size="1.1em" /></span> : "·"}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

// ---------- Вопрос дня 💭 ----------

function Question({ today, question, now }: { today: TodayFile; question: TodayFile["questions"][number]; now: Date }) {
  const data = useTodayData();
  const saved = answerFor(data, now);
  const [draft, setDraft] = useState("");
  const [empty, setEmpty] = useState(false);
  const field = useRef<HTMLTextAreaElement>(null);

  function save() {
    if (!draft.trim()) {
      setEmpty(true);
      field.current?.focus();
      return;
    }
    haptic("click");
    trackTodayQuestionAnswer({ id: question.id });
    updateToday((d) => saveAnswer(d, question.text, draft, new Date()));
    countDay(today.ladder);
  }

  return (
    <section aria-labelledby="today-question" className={cn(BLOCK, saved ? "border-lime/45" : "border-line")}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="today-question" className="font-display text-base leading-tight font-semibold">
          <Em text="Вопрос дня 💭" />
        </h2>
        <span className="text-xs text-muted">ответ видишь только ты</span>
      </div>
      <p className="font-display text-lg leading-[1.3] font-semibold text-pretty">{question.text}</p>
      {saved ? (
        <div>
          <p className={DONE_NOTE}><Em text="Сохранено в дневник 📖" /></p>
          <p className="mt-2 text-center text-xs text-muted">Через месяц можно пролистать все свои ответы</p>
        </div>
      ) : (
        <>
          <textarea
            ref={field}
            aria-label="Ответ на вопрос дня"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setEmpty(false);
            }}
            placeholder={empty ? "Хоть пару слов" : "Пиши как есть, это твой дневник"}
            className="min-h-[84px] w-full resize-y rounded-[14px] border border-line bg-[#2A2531] p-3 text-[15px] placeholder:text-muted"
          />
          <button type="button" onClick={save} className={cn(BTN, "bg-lime font-display text-[15px] text-bg")}>
            Сохранить ✓
          </button>
        </>
      )}
    </section>
  );
}

// ---------- Задание дня ⚡ ----------

function TaskBlock({ today, task, day, done }: { today: TodayFile; task: GazFile["bored"][number]; day: string; done: boolean }) {
  const data = useTodayData();
  const gazData = useGazData();
  const skipped = !done && data.skipped === day;

  /** То же, что «Сделано 🔥» в разделе GAZ: +1 к «Сделано», карта в Коллекцию. Заодно засчитывает день. */
  function finish() {
    trackTodayTaskDone({ id: task.id });
    trackGazDone({ id: task.id, source: "daily", gold: false });
    // первое такое задание — новая карта в Коллекции
    if (!gazData.done.some((x) => x.id === task.id)) announceCard(gazTaskCard(task, { count: 1, gold: false, date: day }));
    updateGaz((g) => {
      const result = finishCard(g, task.id, false, new Date());
      // «в процессе» другого задания не трогаем
      return g.active && g.active.id !== task.id ? { ...result, active: g.active } : result;
    });
    countDay(today.ladder);
  }

  return (
    <section aria-labelledby="today-task" className={cn(BLOCK, done ? "border-lime/45" : "border-line")}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="today-task" className="font-display text-base leading-tight font-semibold">
          <Em text="Задание дня ⚡" />
        </h2>
        <span className="text-xs text-muted"><Em text="из раздела GAZ 🚀" /></span>
      </div>
      <p className="font-display text-[17px] leading-[1.35] font-semibold text-pretty">{task.text}</p>
      <ul className="flex flex-wrap gap-1.5">
        {["⏱ 5 минут", "🙋 соло"].map((t) => (
          <li key={t} className="rounded-full bg-cream/[0.06] px-[9px] py-1 text-xs font-bold text-muted">
            <Em text={t} />
          </li>
        ))}
      </ul>
      {done ? (
        <p className={DONE_NOTE}>Карта в Коллекции 🃏</p>
      ) : skipped ? (
        <p role="status" className="text-center text-xs text-muted">
          <Em text="Окей, завтра будет новое ⚡ Батл и вопрос всё ещё ждут" />
        </p>
      ) : (
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-2">
          <button type="button" onClick={finish} className={cn(BTN, "bg-orange font-display text-[15px] text-bg")}>
            <Em text="Сделано 🔥" />
          </button>
          <button
            type="button"
            onClick={() => updateToday((d) => skipTask(d, new Date()))}
            className={cn(BTN, "border border-line bg-[#2A2531]")}
          >
            Не сегодня
          </button>
        </div>
      )}
    </section>
  );
}
