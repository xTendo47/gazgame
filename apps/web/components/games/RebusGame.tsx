"use client";

// «Угадай по эмодзи 🧩» (механика rebus): настройки → правила → карточка-ребус (свайп вправо «Угадали», влево «Пас») →
// финал «Сколько угадали?» или победа команды. Ввода текста нет: ответ выкрикивает компания и сама решает, угадали ли.
// Логика — packages/engine/src/mechanics/rebus.ts, ребусы и тексты — data/games/emoji-guess.json.
// Из «Объясни» взяты: вибро, имена команд (🎲), таблица очков и переключатели; таймер идёт по меткам времени, как там.
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, motion, type PanInfo } from "motion/react";
import { Lock } from "lucide-react";
import type { Deck, RebusGame as RebusData } from "@gazgame/content";
import {
  askRebusHint,
  deckAccess,
  hintParts,
  planRebus,
  randomTeamName,
  resolveRebus,
  revealRebusAnswer,
  startRebus,
  type RebusSettings,
  type RebusState,
} from "@gazgame/engine";
import { Button, buttonVariants, cn } from "@gazgame/ui";
import { trackDeeperClick } from "@/lib/analytics";
import { prefersReducedMotion } from "@/lib/gaz";
import { haptic } from "@/lib/haptics";
import { tierFor, usePremium } from "@/lib/premium";
import { getProgress } from "@/lib/progress";
import { FlexMenu } from "../result/FlexMenu";
import { BIG_BUTTON, Field, ScoreTable, Seg, TEAM_COLORS } from "./explain/parts";
import { stripEmoji } from "@/lib/text";
import { GIcon, Glyph } from "@/components/casino/GIcon";

type Stage = "setup" | "rules" | "play";

/** Сколько протянуть карточку (px) или как быстро смахнуть, чтобы свайп засчитался. */
const SWIPE_OFFSET = 90;
const SWIPE_VELOCITY = 500;
const usedKey = (game: RebusData, deck: Deck) => `${game.id}/${deck.id}`;

/** Карточки новой игры без повторов с прошлыми (на устройстве хранятся тексты ребусов: номера могут сдвинуться при правке колоды). */
function planGame(game: RebusData, deck: Deck, teams: boolean) {
  const usedTexts = new Set(getProgress().getLastCards(usedKey(game, deck)));
  const used = deck.cards.flatMap((c, i) => (usedTexts.has(c.text) ? [i] : []));
  const plan = planRebus(deck.cards.length, game.roundSize, teams, used);
  getProgress().saveLastCards(
    usedKey(game, deck),
    plan.used.map((i) => deck.cards[i]?.text ?? ""),
  );
  return plan;
}

const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (all, key: string) => (key in values ? String(values[key]) : all));

export function RebusGame({ game, related }: { game: RebusData; related?: ReactNode }) {
  const router = useRouter();
  const premium = usePremium();
  const userTier = tierFor(premium);
  const [stage, setStage] = useState<Stage>("setup");
  const [settings, setSettings] = useState<RebusSettings>(() => ({
    deckId: game.decks[0]?.id ?? "",
    teams: false,
    teamNames: [game.teamNames[0] as string, game.teamNames[1] as string],
    goal: game.goalDefault,
    timer: false,
  }));
  const [state, setState] = useState<RebusState | null>(null);
  const t = game.texts;

  const deck = game.decks.find((d) => d.id === (state?.settings.deckId ?? settings.deckId)) ?? (game.decks[0] as Deck);
  const phase = state?.phase;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [stage, phase]);

  function patch(next: Partial<RebusSettings>) {
    setSettings((s) => ({ ...s, ...next }));
  }

  function chooseDeck(d: Deck) {
    if (!deckAccess(d, { userTier }).open) {
      haptic("double");
      trackDeeperClick({ id: game.id, kind: "game", source: "locked-deck" });
      router.push("/deeper");
      return;
    }
    patch({ deckId: d.id });
  }

  function launch(next: RebusSettings, showRules: boolean) {
    const chosen = game.decks.find((d) => d.id === next.deckId) ?? (game.decks[0] as Deck);
    const plan = planGame(game, chosen, next.teams);
    setState(startRebus(next, plan.cards));
    setSettings(next);
    setStage(showRules ? "rules" : "play");
  }

  function finishCard(guessed: boolean) {
    if (!state || state.phase !== "card") return;
    haptic(guessed ? "yes" : "no");
    const next = resolveRebus(state, guessed);
    if (next.phase !== "card") haptic("win");
    setState(next);
  }

  // ---------- настройки ----------
  if (stage === "setup") {
    const [a, b] = settings.teamNames;
    const setTeam = (i: 0 | 1, name: string) => patch({ teamNames: i === 0 ? [name, b] : [a, name] });
    return (
      <div className="flex flex-col gap-5">
        <Field name={t.deck}>
          <div role="radiogroup" aria-label={t.deck} className="flex flex-col gap-2">
            {game.decks.map((d) => {
              const open = deckAccess(d, { userTier }).open;
              return (
                <button
                  key={d.id}
                  type="button"
                  role="radio"
                  aria-checked={settings.deckId === d.id}
                  onClick={() => chooseDeck(d)}
                  className={cn(
                    "flex min-h-14 items-center gap-3 rounded-2xl border-2 px-4 py-2.5 text-left transition",
                    settings.deckId === d.id ? "border-lime bg-surface" : "border-line bg-surface",
                    !open && "diamond-glow",
                  )}
                >
                  <span aria-hidden="true" className="text-3xl leading-none">
                    <Glyph emoji={d.emoji} label={d.title} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block font-display text-base font-bold">{d.title}</b>
                    {d.description && <small className="block text-[13px] text-muted">{d.description}</small>}
                  </span>
                  {!open && <Lock aria-label="Premium" size={18} className="shrink-0 text-[#62D2FF]" />}
                </button>
              );
            })}
          </div>
        </Field>

        <Switch label={t.teams} checked={settings.teams} onChange={(teams) => patch({ teams })} />
        {settings.teams && (
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3.5">
            {([0, 1] as const).map((i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ background: TEAM_COLORS[i] }} />
                <input
                  value={settings.teamNames[i]}
                  maxLength={16}
                  aria-label={`Команда ${i + 1}`}
                  onChange={(e) => setTeam(i, e.target.value)}
                  className="min-h-11 min-w-0 flex-1 rounded-[14px] border border-line bg-bg px-3.5 py-2.5 font-display text-sm font-semibold"
                />
                <button
                  type="button"
                  aria-label={`Случайное имя для команды ${i + 1}`}
                  onClick={() => {
                    haptic("click");
                    setTeam(i, randomTeamName(game.teamNames, settings.teamNames));
                  }}
                  className="grid size-11 shrink-0 place-items-center rounded-[14px] border border-line bg-bg text-lg"
                >
                  <GIcon name="dice" />
                </button>
              </div>
            ))}
            <Field name={t.goal}>
              <Seg name={t.goal} value={settings.goal} options={game.goals.map((g) => ({ value: g, label: String(g) }))} onPick={(goal) => patch({ goal })} />
            </Field>
          </div>
        )}

        <Switch label={t.timer} checked={settings.timer} onChange={(timer) => patch({ timer })} />

        <Button
          variant="primary"
          onClick={() =>
            launch(
              { ...settings, teamNames: [settings.teamNames[0].trim() || (game.teamNames[0] as string), settings.teamNames[1].trim() || (game.teamNames[1] as string)] },
              true,
            )
          }
        >
          {t.go}
        </Button>
      </div>
    );
  }

  if (!state) return null;
  const { teamNames } = state.settings;

  // ---------- правила ----------
  if (stage === "rules") {
    return (
      <section aria-labelledby="rules-title" className="flex flex-col gap-4">
        <h2 id="rules-title" className="font-display text-2xl font-bold">
          {t.rulesTitle} <GIcon name="puzzle" />
        </h2>
        <ol className="flex list-inside list-decimal flex-col gap-2 rounded-card bg-surface p-5 text-[17px] leading-snug marker:font-bold marker:text-lime">
          {game.rules.map((rule) => (
            <li key={rule}>{stripEmoji(rule)}</li>
          ))}
        </ol>
        <button type="button" className={BIG_BUTTON} onClick={() => setStage("play")}>
          {t.rulesOk}
        </button>
      </section>
    );
  }

  // ---------- финал без команд ----------
  if (state.phase === "final") {
    const total = state.cards.length;
    const flex = fill(game.finale.flexText, { guessed: state.guessed, total });
    return (
      <div className="flex flex-col gap-4">
        <section className="flex flex-col items-center gap-2 rounded-card bg-lime p-6 text-center text-bg">
          <div aria-hidden="true" className="text-6xl leading-none">
            <Glyph emoji={game.finale.emoji} />
          </div>
          <h2 className="font-display text-3xl font-black">{game.finale.title}</h2>
          <p className="font-display text-5xl font-black tabular-nums">
            {state.guessed} / {total} <GIcon name="check" />
          </p>
        </section>
        <Button variant="primary" onClick={() => launch(state.settings, false)}>
          {game.finale.again}
        </Button>
        <Button variant="outline" onClick={() => setStage("setup")}>
          {game.finale.otherDeck}
        </Button>
        <FlexMenu linkPath={`/game/${game.slug}`} fileName={`gazgame-${game.slug}`} shareText={flex} card={{ label: game.title, emoji: game.emoji, title: `${state.guessed} / ${total}`, text: flex }} />
        <Upsell game={game} deck={deck} premium={premium} />
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "md" })}>
          В меню
        </Link>
        {related}
      </div>
    );
  }

  // ---------- победа команды ----------
  if (state.phase === "win") {
    const winner = state.winner === null ? null : teamNames[state.winner];
    const flex = fill(game.win.flexText, { team: winner ?? "" });
    return (
      <div className="flex flex-col gap-4">
        <section className="flex flex-col items-center gap-2 rounded-card bg-lime p-6 text-center text-bg">
          <div aria-hidden="true" className="text-6xl leading-none">
            <Glyph emoji={game.win.emoji} />
          </div>
          <h2 className="font-display text-3xl font-black">{winner ? fill(game.win.title, { team: winner }) : game.win.tie}</h2>
        </section>
        <ScoreTable teams={teamNames} scores={state.scores} goal={state.settings.goal} label={t.scoreTitle} />
        <Button variant="primary" onClick={() => launch(state.settings, false)}>
          {game.win.rematch}
        </Button>
        <Button variant="outline" onClick={() => setStage("setup")}>
          {game.finale.otherDeck}
        </Button>
        {winner && <FlexMenu linkPath={`/game/${game.slug}`} fileName={`gazgame-${game.slug}`} shareText={flex} card={{ label: game.title, emoji: game.emoji, title: fill(game.win.title, { team: winner }), text: flex }} />}
        <Upsell game={game} deck={deck} premium={premium} />
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "md" })}>
          В меню
        </Link>
        {related}
      </div>
    );
  }

  // ---------- карточка ----------
  const card = deck.cards[state.cards[state.index] ?? -1];
  const hint = card ? hintParts(deck, card) : null;
  const onSwipe = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_OFFSET || info.velocity.x > SWIPE_VELOCITY) finishCard(true);
    else if (info.offset.x < -SWIPE_OFFSET || info.velocity.x < -SWIPE_VELOCITY) finishCard(false);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col gap-4">
        {state.settings.timer && (
          <TimerBar key={state.index} seconds={game.timerSec} onZero={() => setState((s) => (s ? revealRebusAnswer(s) : s))} />
        )}
        <div className="flex items-center justify-between text-sm font-bold text-muted" aria-live="polite">
          <span>
            <Glyph emoji={deck.emoji} label={deck.title} /> {deck.title}
          </span>
          <span className="font-display text-base text-cream">
            {state.settings.teams ? fill(t.turn, { team: teamNames[state.team] }) : `${state.index + 1} / ${state.cards.length}`}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={state.index}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            dragSnapToOrigin
            onDragEnd={onSwipe}
            initial={{ opacity: 0, y: 30, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, x: -140, rotate: -6 }}
            transition={{ duration: 0.25 }}
            className="cg-rebus flex min-h-64 cursor-grab touch-pan-y flex-col items-center justify-center gap-3 rounded-card bg-surface p-5 text-center select-none active:cursor-grabbing"
          >
            <GIcon name="spade" size={16} className="cg-rebus-pip cg-rebus-tl" />
            <GIcon name="spade" size={16} className="cg-rebus-pip cg-rebus-br" />
            <p className="cg-rebus-face text-[clamp(2.75rem,16vw,4.5rem)] leading-[1.1] break-all" aria-label="Ребус из эмодзи">
              {card?.text}
            </p>
            {state.hint && hint && (
              <div className="flex flex-col gap-0.5 rounded-xl bg-lime/10 px-3 py-2 text-[15px] font-semibold text-lime" role="status">
                <span>{fill(t.hintTheme, { deck: hint.theme })}</span>
                <span>{fill(t.hintLetter, { letter: hint.letter })}</span>
                {hint.hint && <span className="text-cream/90">{hint.hint}</span>}
              </div>
            )}
            {state.revealed && (
              <p role="status" className="font-display text-2xl leading-tight font-black text-orange text-balance">
                {card?.answer}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={state.hint}
            onClick={() => {
              haptic("click");
              setState(askRebusHint(state));
            }}
            className="gaz-press min-h-14 rounded-2xl border border-line bg-[#2A2531] px-2 py-3 text-center text-sm font-extrabold disabled:opacity-45"
          >
            {game.buttons.hint}
          </button>
          <button
            type="button"
            disabled={state.revealed}
            onClick={() => {
              haptic("click");
              setState(revealRebusAnswer(state));
            }}
            className="gaz-press min-h-14 rounded-2xl border border-line bg-[#2A2531] px-2 py-3 text-center text-sm font-extrabold disabled:opacity-45"
          >
            {game.buttons.answer}
          </button>
          <button
            type="button"
            onClick={() => finishCard(false)}
            className="gaz-press min-h-16 rounded-2xl border-2 border-orange px-2 py-3 text-center font-display text-base font-extrabold text-orange"
          >
            {game.buttons.pass}
          </button>
          <button
            type="button"
            onClick={() => finishCard(true)}
            className="gaz-press min-h-16 rounded-2xl bg-lime px-2 py-3 text-center font-display text-base font-extrabold text-bg"
          >
            {game.buttons.guessed}
          </button>
        </div>

        {state.settings.teams && (
          <ScoreTable teams={teamNames} scores={state.scores} goal={state.settings.goal} now={state.team} label={t.scoreTitle} />
        )}
      </div>
    </MotionConfig>
  );
}

/**
 * Полоска таймера карточки: тает за seconds секунд, последние 5 секунд оранжевая, на нуле вызывает onZero (ответ открывается сам).
 * Отсчёт по меткам времени, как в «Объясни»; у каждой карточки свой экземпляр (key), поэтому полоска всегда начинается с полной.
 */
function TimerBar({ seconds, onZero }: { seconds: number; onZero: () => void }) {
  const [left, setLeft] = useState(seconds);
  const zero = useRef(onZero);
  useEffect(() => {
    zero.current = onZero;
  });
  useEffect(() => {
    const endAt = Date.now() + seconds * 1000;
    let last = seconds;
    const id = window.setInterval(() => {
      const next = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      if (next === last) return;
      last = next;
      setLeft(next);
      if (next > 0 && next <= 5) haptic("hot");
      if (next === 0) {
        window.clearInterval(id);
        haptic("timeUp");
        zero.current();
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [seconds]);
  const hot = left > 0 && left <= 5;
  return (
    <div role="timer" aria-label={`Осталось секунд: ${left}`} className="h-2.5 overflow-hidden rounded-full bg-surface-2">
      <div
        className={cn("h-full rounded-full transition-[width] duration-1000 ease-linear motion-reduce:transition-none", hot ? "bg-orange" : "bg-lime")}
        style={{ width: `${(left / seconds) * 100}%` }}
      />
    </div>
  );
}

/** Переключатель «включить / выключить», как «Штраф за пропуск» в «Объясни». */
function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 text-left"
    >
      <span className="font-display text-base font-bold">{label}</span>
      <span aria-hidden="true" className={cn("flex h-7 w-12 items-center rounded-full p-1 transition", checked ? "justify-end bg-lime" : "justify-start bg-surface-2")}>
        <span className="size-5 rounded-full bg-bg" />
      </span>
    </button>
  );
}

/** «Слишком легко? В Хардкоре ребусы…» — с Premium звать некуда. */
function Upsell({ game, deck, premium }: { game: RebusData; deck: Deck; premium: boolean }) {
  if (!deck.upsellText || premium) return null;
  return (
    <Link
      href="/deeper"
      onClick={() => trackDeeperClick({ id: game.id, kind: "game", source: "game-over" })}
      className="diamond-glow min-h-11 self-center rounded-full bg-surface px-5 py-2.5 text-center text-[15px] font-semibold text-cream"
    >
      {deck.upsellText}
    </Link>
  );
}
