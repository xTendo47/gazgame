"use client";

// «5 секунд ⏱️» (механика timer-deck): настройки → правила → «Ход: имя» (карта рубашкой вверх) → «Старт» → карта и кольцо таймера →
// «Засчитано / Не засчитано» → … → финал с таблицей очков. Один телефон по кругу.
// Логика — packages/engine/src/mechanics/timer-deck.ts, тексты и колоды — data/games/five-seconds.json.
// Вибро, таблица очков и отсчёт по меткам времени — те же, что в «Объясни» (lib/haptics, explain/parts, deadline-таймер).
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Lock, Plus, X } from "lucide-react";
import type { Deck, TimerDeckGame as TimerDeckData } from "@gazgame/content";
import {
  answerCard,
  beginCard,
  deckAccess,
  joinNames,
  planTimerDeck,
  playerNames,
  standings,
  startTimerDeck,
  type TimerDeckState,
} from "@gazgame/engine";
import { Button, buttonVariants, cn } from "@gazgame/ui";
import { trackDeeperClick } from "@/lib/analytics";
import { prefersReducedMotion } from "@/lib/gaz";
import { haptic } from "@/lib/haptics";
import { tierFor, usePremium } from "@/lib/premium";
import { getProgress } from "@/lib/progress";
import { FlexMenu } from "../result/FlexMenu";
import { BIG_BUTTON, ScoreTable } from "./explain/parts";

type Stage = "setup" | "rules" | "play";

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 10;
const usedKey = (game: TimerDeckData, deck: Deck) => `${game.id}/${deck.id}`;

/** Карты нового раунда без повторов с прошлыми (на устройстве хранятся тексты: номера могут сдвинуться при правке колоды). */
function planRound(game: TimerDeckData, deck: Deck, players: string[], perPlayer: number) {
  const usedTexts = new Set(getProgress().getLastCards(usedKey(game, deck)));
  const used = deck.cards.flatMap((c, i) => (usedTexts.has(c.text) ? [i] : []));
  const plan = planTimerDeck(deck.cards.length, { players, perPlayer }, used);
  getProgress().saveLastCards(
    usedKey(game, deck),
    plan.used.map((i) => deck.cards[i]?.text ?? ""),
  );
  return plan;
}

export function TimerDeckGame({ game, related }: { game: TimerDeckData; related?: ReactNode }) {
  const router = useRouter();
  const premium = usePremium();
  const userTier = tierFor(premium);
  const [stage, setStage] = useState<Stage>("setup");
  const [names, setNames] = useState<string[]>(["", ""]);
  const [perPlayer, setPerPlayer] = useState(game.cardsPerPlayerDefault);
  const [deckId, setDeckId] = useState(game.decks[0]?.id ?? "");
  const [chain, setChain] = useState(game.chainRuleDefault);
  const [state, setState] = useState<TimerDeckState | null>(null);
  /** Сколько секунд осталось на текущей карте. */
  const [left, setLeft] = useState(game.timerSec);
  /** Вспышка после ответа: id — чтобы анимация проигралась заново. */
  const [flash, setFlash] = useState<{ ok: boolean; name: string; id: number } | null>(null);
  const endAt = useRef(0);
  const lastLeft = useRef(game.timerSec);

  const deck = game.decks.find((d) => d.id === (state?.settings.deckId ?? deckId)) ?? (game.decks[0] as Deck);
  const phase = state?.phase;
  const t = game.texts;

  // Каждый новый экран — с самого верха
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [stage, phase, state?.index, state?.player]);

  // Таймер ответа: по меткам времени, а не по числу тиков (фон и «заснувший» телефон не ломают отсчёт).
  // Каждую секунду короткое вибро, последние 2 секунды — «горячее», в 0 — длинное.
  useEffect(() => {
    if (phase !== "card") return;
    const id = window.setInterval(() => {
      const next = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      if (next === lastLeft.current) return;
      lastLeft.current = next;
      setLeft(next);
      if (next === 0) {
        window.clearInterval(id);
        haptic("timeUp");
      } else haptic(next <= 2 ? "hot" : "tick");
    }, 200);
    return () => window.clearInterval(id);
  }, [phase, state?.index, state?.player, state?.hops]);

  function chooseDeck(d: Deck) {
    if (!deckAccess(d, { userTier }).open) {
      haptic("double");
      trackDeeperClick({ id: game.id, kind: "game", source: "locked-deck" });
      router.push("/deeper");
      return;
    }
    setDeckId(d.id);
  }

  function launch(next: { players: string[]; perPlayer: number; deck: Deck; chain: boolean }, showRules: boolean) {
    const plan = planRound(game, next.deck, next.players, next.perPlayer);
    setState(startTimerDeck({ players: next.players, perPlayer: next.perPlayer, deckId: next.deck.id, chain: next.chain }, plan.cards));
    setFlash(null);
    setStage(showRules ? "rules" : "play");
  }

  function begin() {
    if (!state) return;
    endAt.current = Date.now() + game.timerSec * 1000;
    lastLeft.current = game.timerSec;
    setLeft(game.timerSec);
    haptic("tick");
    setState(beginCard(state));
  }

  function answer(ok: boolean) {
    if (!state || state.phase !== "card") return;
    haptic(ok ? "yes" : "no");
    const who = state.settings.players[state.player] ?? "";
    const next = answerCard(state, ok);
    setFlash({ ok, name: who, id: Date.now() });
    window.setTimeout(() => setFlash((f) => (f && Date.now() - f.id >= 650 ? null : f)), 700);
    if (next.phase === "final") haptic("win");
    setState(next);
  }

  // ---------- настройки ----------
  if (stage === "setup") {
    return (
      <div className="flex flex-col gap-5">
        <section aria-labelledby="players-title" className="flex flex-col gap-3">
          <h2 id="players-title" className="font-display text-xl font-bold">
            {t.playersTitle}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {names.map((name, i) => (
              <li key={i} className="flex items-center gap-1 rounded-full border border-line bg-surface pr-1 pl-4">
                <label className="sr-only" htmlFor={`fs-player-${i}`}>
                  Игрок {i + 1}
                </label>
                <input
                  id={`fs-player-${i}`}
                  value={name}
                  maxLength={14}
                  size={9}
                  autoComplete="off"
                  placeholder={`Игрок ${i + 1}`}
                  onChange={(e) => setNames(names.map((n, j) => (j === i ? e.target.value : n)))}
                  className="min-h-11 w-28 bg-transparent text-base font-semibold placeholder:text-muted/70 focus:outline-none"
                />
                {names.length > MIN_PLAYERS && (
                  <button
                    type="button"
                    aria-label={`Убрать игрока ${i + 1}`}
                    onClick={() => setNames(names.filter((_, j) => j !== i))}
                    className="flex size-11 items-center justify-center rounded-full text-muted hover:text-cream"
                  >
                    <X aria-hidden="true" size={16} />
                  </button>
                )}
              </li>
            ))}
            {names.length < MAX_PLAYERS && (
              <li>
                <button
                  type="button"
                  onClick={() => setNames([...names, ""])}
                  className="flex min-h-11 items-center gap-1 rounded-full border border-dashed border-lime/60 px-4 text-base font-bold text-lime"
                >
                  <Plus aria-hidden="true" size={16} />
                  {t.addPlayer.replace(/^\+\s*/, "")}
                </button>
              </li>
            )}
          </ul>
        </section>

        <section aria-labelledby="per-title" className="flex flex-col gap-2">
          <h2 id="per-title" className="font-display text-base font-bold">
            {t.cardsPerPlayer}
          </h2>
          <div role="radiogroup" aria-labelledby="per-title" className="grid grid-cols-3 gap-2">
            {game.cardsPerPlayer.map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={perPlayer === n}
                onClick={() => setPerPlayer(n)}
                className={cn(
                  "min-h-12 rounded-2xl border-2 font-display text-lg font-extrabold transition",
                  perPlayer === n ? "border-lime bg-lime text-bg" : "border-line bg-surface text-cream",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="deck-title" className="flex flex-col gap-2">
          <h2 id="deck-title" className="font-display text-base font-bold">
            {t.deck}
          </h2>
          <div role="radiogroup" aria-labelledby="deck-title" className="flex flex-col gap-2">
            {game.decks.map((d) => {
              const open = deckAccess(d, { userTier }).open;
              return (
                <button
                  key={d.id}
                  type="button"
                  role="radio"
                  aria-checked={deckId === d.id}
                  onClick={() => chooseDeck(d)}
                  className={cn(
                    "flex min-h-14 items-center gap-3 rounded-2xl border-2 px-4 py-2.5 text-left transition",
                    deckId === d.id ? "border-lime bg-surface" : "border-line bg-surface",
                    !open && "diamond-glow",
                  )}
                >
                  <span aria-hidden="true" className="text-3xl leading-none">
                    {d.emoji}
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
        </section>

        <button
          type="button"
          role="switch"
          aria-checked={chain}
          onClick={() => setChain(!chain)}
          className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 text-left"
        >
          <span className="font-display text-base font-bold">{t.chainSwitch} 🔗</span>
          <span aria-hidden="true" className={cn("flex h-7 w-12 items-center rounded-full p-1 transition", chain ? "justify-end bg-lime" : "justify-start bg-surface-2")}>
            <span className="size-5 rounded-full bg-bg" />
          </span>
        </button>

        <Button
          variant="primary"
          onClick={() => {
            const players = playerNames(names);
            launch({ players, perPlayer, deck, chain }, true);
          }}
        >
          {t.go}
        </Button>
      </div>
    );
  }

  if (!state) return null;
  const { players } = state.settings;

  // ---------- правила ----------
  if (stage === "rules") {
    return (
      <section aria-labelledby="rules-title" className="flex flex-col gap-4">
        <h2 id="rules-title" className="font-display text-2xl font-bold">
          {t.rulesTitle} ⏱️
        </h2>
        <ol className="flex list-inside list-decimal flex-col gap-2 rounded-card bg-surface p-5 text-[17px] leading-snug marker:font-bold marker:text-lime">
          {game.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
        <button type="button" className={BIG_BUTTON} onClick={() => setStage("play")}>
          {t.rulesOk}
        </button>
      </section>
    );
  }

  // ---------- финал ----------
  if (state.phase === "final") {
    const st = standings(state.scores);
    const winnerNames = joinNames(st.winners.map((i) => players[i] ?? ""));
    const lastNames = joinNames(st.last.map((i) => players[i] ?? ""));
    const top = st.tie ? game.finale.tie : game.finale.winner;
    return (
      <div className="flex flex-col gap-4">
        <section className="flex flex-col items-center gap-2 rounded-card bg-lime p-6 text-center text-bg">
          <div aria-hidden="true" className="text-6xl leading-none">
            {top.emoji}
          </div>
          <h2 className="font-display text-3xl font-black">{top.title}</h2>
          <p className="font-display text-xl font-extrabold">{winnerNames}</p>
          <p className="text-lg font-semibold">{top.text}</p>
        </section>
        <ScoreTable teams={players} scores={state.scores} goal={state.settings.perPlayer} label={t.scoreTitle} />
        {st.last.length > 0 && (
          <section className="flex flex-col items-center gap-1 rounded-card border border-line bg-surface p-5 text-center">
            <div aria-hidden="true" className="text-4xl leading-none">
              {game.finale.last.emoji}
            </div>
            <h3 className="font-display text-xl font-bold">{game.finale.last.title}</h3>
            <p className="font-display text-lg font-extrabold text-orange">{lastNames}</p>
            <p className="text-[15px] text-cream/85">{game.finale.last.text}</p>
          </section>
        )}
        <Button variant="primary" onClick={() => launch({ players, perPlayer: state.settings.perPlayer, deck, chain: state.settings.chain }, false)}>
          {t.again} 🔄
        </Button>
        <Button variant="outline" onClick={() => setStage("setup")}>
          {t.changeDeck}
        </Button>
        <FlexMenu
          linkPath={`/game/${game.slug}`}
          fileName={`gazgame-${game.slug}`}
          shareText={t.flexText.replace("{name}", winnerNames)}
          card={{ label: game.title, emoji: top.emoji, title: top.title, text: t.flexText.replace("{name}", winnerNames) }}
        />
        {/* «Слишком легко? Дальше Мозговой штурм 🧠» — с Premium звать некуда, всё уже открыто */}
        {deck.upsellText && !premium && (
          <Link
            href="/deeper"
            onClick={() => trackDeeperClick({ id: game.id, kind: "game", source: "game-over" })}
            className="diamond-glow min-h-11 self-center rounded-full bg-surface px-5 py-2.5 text-center text-[15px] font-semibold text-cream"
          >
            {deck.upsellText}
          </Link>
        )}
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "md" })}>
          В меню
        </Link>
        {related}
      </div>
    );
  }

  // ---------- ход и карта ----------
  const card = deck.cards[state.cards[state.index] ?? -1];
  const name = players[state.player] ?? "";
  const hot = left <= 2 && left > 0;
  const over = left === 0;

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between text-sm font-bold text-muted" aria-live="polite">
          <span>
            {deck.emoji} {deck.title}
          </span>
          <span className="font-display text-base text-cream">
            {state.index + 1} / {state.cards.length}
          </span>
        </div>

        {state.phase === "turn" ? (
          <>
            {state.hops > 0 && (
              <p role="status" className="rounded-card border border-lime/50 bg-lime/10 px-4 py-3 text-center text-[15px] font-bold text-lime">
                {t.chain}
              </p>
            )}
            <p className="text-center font-display text-2xl leading-snug font-bold text-balance">{game.handoffText.replace("{name}", name)}</p>
            {/* карта лежит рубашкой вверх, чтобы игрок не подсмотрел заранее */}
            <div
              aria-hidden="true"
              className="flex min-h-56 items-center justify-center rounded-card border-2 border-lime/40 bg-surface text-7xl"
              style={{ backgroundImage: "repeating-linear-gradient(45deg, rgb(255 255 255 / 0.04) 0 10px, transparent 10px 20px)" }}
            >
              ⏱️
            </div>
            <button type="button" className={BIG_BUTTON} onClick={begin}>
              {t.start}
            </button>
          </>
        ) : (
          <>
            <motion.div
              key={`${state.index}-${state.hops}`}
              initial={{ rotateY: 90, opacity: 0, y: 12 }}
              animate={{ rotateY: 0, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 14 }}
              className={cn(
                "relative flex min-h-64 flex-col items-center justify-center gap-4 rounded-card p-6 text-center",
                over ? "bg-orange text-bg" : "bg-surface",
              )}
            >
              <p className={cn("text-sm font-extrabold tracking-wide uppercase", over ? "text-bg/80" : "text-lime")}>{game.cardPrompt}</p>
              <p className="font-display text-3xl leading-tight font-black break-words text-balance">{card?.text}</p>
              <div className="flex flex-col items-center gap-1">
                <Ring seconds={game.timerSec} left={left} hot={hot} over={over} resetKey={`${state.index}-${state.hops}`} />
                <p role="status" className={cn("min-h-7 font-display text-lg font-extrabold", over ? "text-bg" : "text-transparent")}>
                  {over ? t.timeUp : "."}
                </p>
              </div>
            </motion.div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => answer(true)}
                className="gaz-press min-h-16 rounded-2xl bg-lime px-2 py-3 text-center font-display text-base font-extrabold text-bg"
              >
                {game.buttons.yes}
              </button>
              <button
                type="button"
                onClick={() => answer(false)}
                className="gaz-press min-h-16 rounded-2xl border-2 border-orange px-2 py-3 text-center font-display text-base font-extrabold text-orange"
              >
                {game.buttons.no}
              </button>
            </div>
          </>
        )}

        <ScoreTable teams={players} scores={state.scores} goal={state.settings.perPlayer} now={state.player} label={t.scoreTitle} />

        <AnimatePresence>
          {flash && (
            <motion.div
              key={flash.id}
              aria-hidden="true"
              className={cn(
                "pointer-events-none fixed inset-0 z-50 flex items-start justify-center pt-40",
                flash.ok ? "bg-lime/25" : "bg-orange/25",
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <motion.span
                className={cn("font-display text-6xl font-black", flash.ok ? "text-lime" : "text-orange")}
                initial={{ y: 30, scale: 0.6, opacity: 0 }}
                animate={{ y: -20, scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {flash.ok ? `+1 ${flash.name}` : "✕"}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

/** Кольцо таймера: тает по кругу за timerSec секунд; последние 2 секунды оранжевое и пульсирует. */
function Ring({ seconds, left, hot, over, resetKey }: { seconds: number; left: number; hot: boolean; over: boolean; resetKey: string }) {
  return (
    <div
      role="timer"
      aria-label={`Осталось секунд: ${left}`}
      className={cn("relative size-28", hot && "animate-pulse motion-reduce:animate-none")}
    >
      <svg viewBox="0 0 120 120" aria-hidden="true" className="size-full -rotate-90">
        <circle cx="60" cy="60" r="52" fill="none" strokeWidth="9" stroke="rgb(255 255 255 / 0.12)" />
        <motion.circle
          key={resetKey}
          cx="60"
          cy="60"
          r="52"
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          stroke={over || hot ? "#FF5A1F" : "#D4FF3A"}
          initial={{ pathLength: 1 }}
          animate={{ pathLength: 0 }}
          transition={{ duration: seconds, ease: "linear" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-5xl font-black tabular-nums">{left}</span>
    </div>
  );
}
