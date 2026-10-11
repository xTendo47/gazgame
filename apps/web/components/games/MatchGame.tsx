"use client";

// «Совпадём?» (механика match, «это или то»): оба по очереди тайно отвечают на одни и те же вопросы.
// Имена (общие с «Насколько ты меня знаешь») → уровень → правила (один раз) → ход первого → «передай телефон» →
// ход второго → процент совпадения, звание, «Где разошлись» и «Где совпали».
// Вопрос — экран, расколотый пополам: сверху оранжевая половина, снизу салатовая, посередине «ИЛИ».
// Сверху и снизу, а не слева и справа: на 360px длинные варианты (до 44 символов) в узких колонках читаются плохо.
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ChevronDown, Lock } from "lucide-react";
import type { Deck, MatchGame as MatchGameData } from "@gazgame/content";
import {
  createMatchState,
  deckAccess,
  matchHalves,
  matchReducer,
  nextMatchDeck,
  pickMatchQuestions,
  rankFor,
  scoreMatch,
  type MatchAction,
  type MatchState,
} from "@gazgame/engine";
import { Button, buttonVariants, cn } from "@gazgame/ui";
import { trackDeeperClick } from "@/lib/analytics";
import { getProgress } from "@/lib/progress";
import { tierFor, usePremium } from "@/lib/premium";
import { FlexMenu } from "../result/FlexMenu";
import { DeckPicker } from "./DeckPicker";
import { useSavedPlayers } from "./GuessPartnerGame";
import { PlayersForm } from "./PlayersForm";

type Players = [string, string];

/** Имена пары — то же хранилище, что у «Насколько ты меня знаешь»: ввели там, здесь уже знаем. */
const NAMES_KEY = "know-each-other";

/** Половины экрана: первый вариант — оранжевая (светлый текст), второй — салатовая (тёмный текст). */
const HALF = ["bg-orange text-cream", "bg-lime text-bg"] as const;

/** Подставляет {a}, {b}, {pct}, {link}. */
const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (all, key: string) => (key in values ? String(values[key]) : all));

const usedKey = (game: MatchGameData, deck: Deck) => `${game.id}/${deck.id}`;

export function MatchGame({ game, related }: { game: MatchGameData; related?: ReactNode }) {
  const router = useRouter();
  const premium = usePremium();
  const userTier = tierFor(premium);
  const saved = useSavedPlayers(NAMES_KEY);
  const [players, setPlayers] = useState<Players | null>(null);
  const [editingNames, setEditingNames] = useState(false);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [state, setState] = useState<MatchState | null>(null);
  /** Правила показываем перед первой игрой, дальше — сразу ход. */
  const [rulesSeen, setRulesSeen] = useState(false);
  const [showMatched, setShowMatched] = useState(false);
  /** Уровни, доигранные до итогов (с устройства): второй открывается после первого. */
  const [completedDecks, setCompletedDecks] = useState<string[]>(() => getProgress().getCompletedDecks(game.id));

  /** Новая игра на уровне: 10 вопросов без повторов, пока не пройдена вся колода (с устройства). */
  function start(d: Deck, names: Players = players as Players) {
    const key = usedKey(game, d);
    const usedTexts = new Set(getProgress().getLastCards(key));
    const used = d.cards.flatMap((c, i) => (usedTexts.has(c.text) ? [i] : []));
    const pick = pickMatchQuestions(d.cards.length, d.questionsPerGame ?? 10, used);
    getProgress().saveLastCards(
      key,
      pick.used.map((i) => d.cards[i]?.text ?? ""),
    );
    setDeck(d);
    setState(createMatchState(names, pick.questions));
    setShowMatched(false);
  }

  function dispatch(action: MatchAction) {
    if (!state) return;
    const next = matchReducer(state, action);
    if (next.phase === "result" && state.phase !== "result") {
      getProgress().recordGamePlayed(game.id, { score: scoreMatch(next).percent });
      if (deck) {
        // Уровень доведён до итогов — следующий открывается (уровни по очереди), запоминаем на устройстве
        getProgress().markDeckCompleted(game.id, deck.id);
        setCompletedDecks(getProgress().getCompletedDecks(game.id));
      }
    }
    setState(next);
  }

  // ---------- 1. Имена ----------
  if (!players) {
    if (saved && !editingNames) {
      return (
        <section className="flex flex-col gap-4">
          <SplitBanner top="Играют" bottom={`${saved[0]} + ${saved[1]}`} />
          <Button variant="primary" onClick={() => setPlayers(saved)}>
            Дальше 👉
          </Button>
          <Button variant="ghost" size="md" onClick={() => setEditingNames(true)}>
            Поправить имена
          </Button>
        </section>
      );
    }
    return (
      <PlayersForm
        min={2}
        max={2}
        initial={saved ?? []}
        placeholders={["Имя первого", "Имя второго"]}
        submitLabel="Дальше 👉"
        onSubmit={([a = "", b = ""]) => {
          const names: Players = [a, b];
          getProgress().savePlayers(NAMES_KEY, names);
          setPlayers(names);
          setEditingNames(false);
        }}
      />
    );
  }

  const [first, second] = players;

  // ---------- 2. Уровень ----------
  if (!state || !deck) {
    return (
      <div className="flex flex-col gap-4">
        <DeckPicker game={game} title={game.texts.pickLevel} completedDecks={completedDecks} onPick={(d) => start(d)} />
        <Button variant="ghost" size="md" onClick={() => setPlayers(null)}>
          Играют {first} и {second} · Сменить
        </Button>
      </div>
    );
  }

  // ---------- 3. Правила (перед первой игрой) ----------
  if (!rulesSeen) {
    return (
      <section aria-labelledby="match-rules" className="flex flex-col gap-4">
        <h2 id="match-rules" className="font-display text-2xl font-bold">
          Правила {deck.emoji}
        </h2>
        <ol className="flex list-inside list-decimal flex-col gap-2 rounded-card bg-surface p-5 text-[17px] leading-snug marker:font-bold marker:text-lime">
          {game.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
        <Button variant="primary" onClick={() => setRulesSeen(true)}>
          Газ! 🔥
        </Button>
      </section>
    );
  }

  const answering = players[state.turn];
  const other = players[state.turn === 0 ? 1 : 0];

  // ---------- 4. Ход первого ----------
  if (state.phase === "turn") {
    return (
      <section className="flex flex-col gap-4">
        <SplitBanner
          top={fill(game.texts.turnTitle, { a: answering, b: other })}
          bottom={fill(game.texts.turnHint, { a: answering, b: other })}
          big
        />
        <Button variant="primary" onClick={() => dispatch({ type: "start" })}>
          {game.texts.start}
        </Button>
      </section>
    );
  }

  // ---------- 5. Передача телефона ----------
  if (state.phase === "pass") {
    return (
      <section className="flex flex-col gap-4">
        <SplitBanner top={fill(game.texts.pass, { a: first, b: second })} bottom={game.texts.passHint} big />
        <Button variant="primary" onClick={() => dispatch({ type: "pass" })}>
          {game.texts.passButton}
        </Button>
      </section>
    );
  }

  // ---------- 6. Итог ----------
  if (state.phase === "result") {
    const score = scoreMatch(state);
    const rank = rankFor(score.percent, game.ranks);
    const option = (card: number, i: number) => deck.cards[card]?.options?.[i] ?? "";
    const next = nextMatchDeck(game, deck.id);
    const nextOpen = next ? deckAccess(next, { decks: game.decks, userTier, completedDecks }).open : false;
    const link = `${window.location.origin}/game/${game.slug}`;
    const flex = fill(game.texts.flexText, { a: first, b: second, pct: score.percent, link });

    return (
      <div className="flex flex-col gap-4">
        <section
          aria-live="polite"
          className="flex flex-col items-center gap-2 overflow-hidden rounded-card p-6 text-center text-bg"
          style={{ backgroundImage: "linear-gradient(160deg, #FF5A1F 0%, #FF5A1F 48%, #D4FF3A 52%, #D4FF3A 100%)" }}
        >
          <div className="text-sm font-extrabold uppercase tracking-wide">
            {first} + {second} · {deck.title} {deck.emoji}
          </div>
          <div className="font-display text-7xl font-black leading-none">{score.percent}%</div>
          <div aria-hidden="true" className="mt-2 text-5xl leading-none">
            {rank.emoji}
          </div>
          <h2 className="font-display text-2xl font-black leading-tight text-balance">{rank.title}</h2>
          <p className="font-semibold text-balance">{rank.text}</p>
        </section>

        <section aria-labelledby="diverged-title" className="flex flex-col gap-3 rounded-card border-2 border-orange bg-surface p-5">
          <h2 id="diverged-title" className="font-display text-xl font-bold">
            {game.texts.diverged} <span className="text-orange">{score.diverged.length}</span>
          </h2>
          {score.diverged.length === 0 ? (
            <p className="text-[17px] font-semibold">{game.texts.divergedEmpty}</p>
          ) : (
            <>
              <ul className="flex flex-col gap-3">
                {score.diverged.map((l) => (
                  <li key={l.card} className="flex flex-col gap-1 border-b border-line pb-3 last:border-none last:pb-0">
                    <span className="font-bold leading-snug">{deck.cards[l.card]?.text}</span>
                    <span className="text-[15px] leading-snug text-cream/85">
                      <span className="font-bold text-orange">{first}:</span> {option(l.card, l.a)}
                      <span className="text-muted"> · </span>
                      <span className="font-bold text-lime">{second}:</span> {option(l.card, l.b)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-[15px] text-muted">{game.texts.divergedHint}</p>
            </>
          )}
        </section>

        {score.matched.length > 0 && (
          <section className="flex flex-col gap-3 rounded-card bg-surface p-5">
            <button
              type="button"
              aria-expanded={showMatched}
              aria-controls="matched-list"
              onClick={() => setShowMatched(!showMatched)}
              className="flex min-h-11 items-center justify-between gap-3 text-left"
            >
              <span className="font-display text-xl font-bold">
                {game.texts.matched} <span className="text-lime">{score.matched.length}</span>
              </span>
              <span className="flex items-center gap-1 text-sm font-bold text-muted">
                {showMatched ? game.texts.hide : game.texts.show}
                <ChevronDown aria-hidden="true" size={18} className={cn("transition", showMatched && "rotate-180")} />
              </span>
            </button>
            {showMatched && (
              <ul id="matched-list" className="flex flex-col gap-2">
                {score.matched.map((l) => (
                  <li key={l.card} className="leading-snug">
                    <span className="font-bold">{deck.cards[l.card]?.text}</span>{" "}
                    <span className="text-cream/85">— {option(l.card, l.a)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {deck.upsellText && !premium && (
          <Link
            href="/deeper"
            onClick={() => trackDeeperClick({ id: game.id, kind: "game", source: "game-over" })}
            className="diamond-glow min-h-11 self-center rounded-full bg-surface px-5 py-2.5 text-center text-[15px] font-semibold text-cream"
          >
            {deck.upsellText}
          </Link>
        )}

        <Button variant="primary" onClick={() => start(deck)}>
          {game.texts.again}
        </Button>
        {next &&
          (nextOpen ? (
            <Button variant="accent" onClick={() => start(next)}>
              {game.texts.next} {next.title} {next.emoji}
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="diamond-glow"
              aria-label={`${game.texts.next} ${next.title} — закрыто`}
              onClick={() => {
                trackDeeperClick({ id: game.id, kind: "game", source: "game-over" });
                router.push("/deeper");
              }}
            >
              <Lock aria-hidden="true" size={18} className="shrink-0" />
              {game.texts.next} {next.title} {next.emoji}
            </Button>
          ))}
        <FlexMenu
          linkPath={`/game/${game.slug}`}
          fileName={`gazgame-${game.slug}`}
          shareText={flex}
          card={{ label: game.title, emoji: rank.emoji, highlight: `${score.percent}%`, title: rank.title, text: `${first} + ${second}` }}
        />
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "md" })}>
          В меню
        </Link>
        {related}
      </div>
    );
  }

  // ---------- 7. Вопрос: экран пополам ----------
  const card = deck.cards[state.questions[state.index] ?? -1];
  const halves = matchHalves(state);
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm font-bold" aria-live="polite">
          <span className="text-muted">
            Отвечает <span className="text-cream">{answering}</span>
          </span>
          <span className="font-display text-base">
            {state.index + 1} / {state.questions.length}
          </span>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${state.turn}-${state.index}`}
            role="group"
            aria-label={`Вопрос ${state.index + 1} из ${state.questions.length}: выбери, что ближе`}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.14 }}
            className="relative grid h-[min(66svh,540px)] min-h-[400px] grid-rows-2 overflow-hidden rounded-card"
          >
            {halves.map((optionIndex, half) => (
              <motion.button
                key={half}
                type="button"
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.1 }}
                onClick={() => dispatch({ type: "answer", option: optionIndex })}
                className={cn(
                  "flex items-center justify-center px-7 text-center font-display text-[1.6rem] leading-tight font-black text-balance break-words",
                  half === 0 ? "pb-8" : "pt-8",
                  HALF[half],
                )}
              >
                {card?.options?.[optionIndex]}
              </motion.button>
            ))}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-bg bg-bg font-display text-sm font-black text-cream shadow-[0_6px_24px_rgb(0_0_0/0.45)]"
            >
              {game.texts.or}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

/** Плашка-раскол: сверху оранжевая, снизу салатовая — фирменный вид «Совпадём?». */
function SplitBanner({ top, bottom, big = false }: { top: string; bottom: string; big?: boolean }) {
  return (
    <div className="overflow-hidden rounded-card text-center">
      <div className={cn("bg-orange px-5 text-cream", big ? "py-10" : "py-5")}>
        <p className={cn("font-display font-black leading-tight text-balance", big ? "text-3xl" : "text-sm uppercase tracking-wide")}>{top}</p>
      </div>
      <div className={cn("bg-lime px-5 text-bg", big ? "py-8" : "py-5")}>
        <p className={cn("font-bold leading-snug text-balance", big ? "text-lg" : "font-display text-2xl font-black")}>{bottom}</p>
      </div>
    </div>
  );
}
