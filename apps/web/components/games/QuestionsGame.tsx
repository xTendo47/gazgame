"use client";

// «36 вопросов 🗝️» (механика ladder): уровни → карточки по порядку (без перемешивания) → экран «Уровень пройден» →
// после последнего уровня 4 минуты глаза в глаза → «Как вы?» и шеринг. Один телефон, двое напротив друг друга.
// Пройденные уровни запоминаются на устройстве (getCompletedDecks), порядок уровней можно выбирать любой.
// Правила — в engine/src/mechanics/ladder.ts, тексты — в data/games/36-questions.json.
import { useEffect, useReducer, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import type { Deck, LadderGame } from "@gazgame/content";
import { clock, createTimer, ladderNumber, ladderStarter, nextLadderDeck, timerReducer } from "@gazgame/engine";
import { Button, buttonVariants, cn } from "@gazgame/ui";
import { getProgress } from "@/lib/progress";
import { FlexMenu } from "../result/FlexMenu";
import { DeckPicker } from "./DeckPicker";

/** Таймер в секундах: тикает раз в секунду, пока идёт. */
function useTimer(seconds: number) {
  const [timer, dispatch] = useReducer(timerReducer, seconds, createTimer);
  useEffect(() => {
    if (!timer.running) return;
    const id = window.setInterval(() => dispatch({ type: "tick" }), 1000);
    return () => window.clearInterval(id);
  }, [timer.running]);
  return [timer, dispatch] as const;
}

type Screen =
  | { name: "pick" }
  | { name: "card"; deck: number; index: number }
  | { name: "levelDone"; deck: number }
  | { name: "eyes" }
  | { name: "after" };

const noSubscribe = () => () => {};

export function QuestionsGame({ game, related }: { game: LadderGame; related?: ReactNode }) {
  const [screen, setScreen] = useState<Screen>({ name: "pick" });
  // пройденные уровни читаем из хранилища уже в браузере (чтобы сервер и браузер совпали); обновляются при каждой смене экрана
  const client = useSyncExternalStore(noSubscribe, () => true, () => false);
  const completed = client ? getProgress().getCompletedDecks(game.id) : [];

  function finishLevel(deckIndex: number) {
    const deck = game.decks[deckIndex] as Deck;
    getProgress().markDeckCompleted(game.id, deck.id);
    // последний уровень: сразу глаза в глаза, иначе экран «Перерыв или дальше?»
    setScreen(nextLadderDeck(game, deckIndex) ? { name: "levelDone", deck: deckIndex } : { name: "eyes" });
  }

  if (screen.name === "pick") {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-card border border-line bg-surface p-4 text-[15px] leading-relaxed text-cream/85">{game.fact}</p>
        <DeckPicker
          game={game}
          completedDecks={completed}
          onPick={(deck) => {
            getProgress().markGameStarted(game.id);
            setScreen({ name: "card", deck: game.decks.indexOf(deck), index: 0 });
          }}
        />
        {completed.length > 0 && (
          <p className="text-center text-sm text-muted">
            Пройдено уровней: {completed.filter((id) => game.decks.some((d) => d.id === id)).length} из {game.decks.length}
          </p>
        )}
        {related}
      </div>
    );
  }

  if (screen.name === "card") {
    const deck = game.decks[screen.deck] as Deck;
    return (
      <LevelCard
        key={`${deck.id}-${screen.index}`}
        game={game}
        deck={deck}
        deckIndex={screen.deck}
        index={screen.index}
        onNext={() =>
          screen.index + 1 < deck.cards.length ? setScreen({ name: "card", deck: screen.deck, index: screen.index + 1 }) : finishLevel(screen.deck)
        }
      />
    );
  }

  if (screen.name === "levelDone") {
    const next = nextLadderDeck(game, screen.deck) as Deck;
    const done = game.levelDone;
    return (
      <div className="flex flex-col gap-4">
        <section className="flex flex-col items-center gap-3 rounded-card bg-lime p-6 text-center text-bg">
          <div aria-hidden="true" className="text-6xl leading-none">
            {done.emoji}
          </div>
          <h2 className="font-display text-3xl font-black">{done.title}</h2>
          <p className="text-lg font-semibold">{done.text}</p>
        </section>
        <Button variant="primary" onClick={() => setScreen({ name: "card", deck: screen.deck + 1, index: 0 })}>
          {done.next.replace("{level}", next.title)}
        </Button>
        <Button variant="outline" onClick={() => setScreen({ name: "pick" })}>
          {done.later}
        </Button>
        {related}
      </div>
    );
  }

  if (screen.name === "eyes") {
    return (
      <EyesFinale
        game={game}
        onDone={() => {
          getProgress().recordGamePlayed(game.id);
          setScreen({ name: "after" });
        }}
      />
    );
  }

  const finale = game.finale;
  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col items-center gap-3 rounded-card bg-orange p-6 text-center text-bg">
        <div aria-hidden="true" className="text-6xl leading-none">
          {finale.after.emoji}
        </div>
        <h2 className="font-display text-3xl font-black">{finale.after.title}</h2>
        <p className="text-lg font-semibold">{finale.after.text}</p>
      </section>
      <FlexMenu
        linkPath={`/game/${game.slug}`}
        fileName={`gazgame-${game.slug}`}
        shareText={finale.flexText}
        card={{ label: game.title, emoji: game.emoji, title: game.title, text: finale.flexText }}
      />
      <Button variant="outline" onClick={() => setScreen({ name: "pick" })}>
        К уровням
      </Button>
      <Link href="/" className={buttonVariants({ variant: "ghost", size: "md" })}>
        В меню
      </Link>
      {related}
    </div>
  );
}

function LevelCard({
  game,
  deck,
  deckIndex,
  index,
  onNext,
}: {
  game: LadderGame;
  deck: Deck;
  deckIndex: number;
  index: number;
  onNext: () => void;
}) {
  const card = deck.cards[index];
  const t = game.texts;
  const starter = ladderStarter(game, deckIndex, index);
  const [timer, dispatch] = useTimer(card?.timerSec ?? 0);
  const last = index + 1 === deck.cards.length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-sm font-bold text-muted" aria-live="polite">
        <span>
          {deck.emoji} {deck.title}
        </span>
        <span className="font-display text-base text-cream">
          {index + 1} / {deck.cards.length}
        </span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex min-h-64 flex-col justify-center gap-4 rounded-card bg-surface p-6"
        >
          <p className="text-sm font-extrabold uppercase tracking-wide text-lime">
            {card?.together ? t.together : t.starts.replace("{player}", t.players[starter])}
          </p>
          <p className="font-display text-2xl leading-snug font-bold break-words">{card?.text}</p>
          {card?.timerSec !== undefined && (
            <div className="flex flex-col gap-2">
              <p className="font-display text-4xl font-black tabular-nums" aria-live="off">
                {clock(timer.remaining)}
              </p>
              <Button variant="accent" size="md" onClick={() => dispatch({ type: "toggle" })} disabled={timer.remaining === 0}>
                {timer.running ? t.pause : timer.remaining < card.timerSec ? t.resume : t.timer}
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <p className="-mt-2 text-center text-sm text-muted">
        {ladderNumber(game, deckIndex, index) + 1} из {game.decks.reduce((sum, d) => sum + d.cards.length, 0)}
      </p>
      <div className={cn("grid grid-cols-2 gap-3")}>
        <Button variant="outline" onClick={onNext}>
          {t.pass}
        </Button>
        <Button variant="primary" onClick={onNext}>
          {last ? "К итогам 🏁" : t.next}
        </Button>
      </div>
    </div>
  );
}

/** «4 минуты глаза в глаза 👀»: большой таймер со стартом и паузой. Закончился — «Как вы?». */
function EyesFinale({ game, onDone }: { game: LadderGame; onDone: () => void }) {
  const finale = game.finale;
  const [timer, dispatch] = useTimer(finale.seconds);
  const started = timer.remaining < finale.seconds;

  useEffect(() => {
    if (started && timer.remaining === 0) onDone();
  }, [started, timer.remaining, onDone]);

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col items-center gap-3 rounded-card bg-surface p-6 text-center">
        <div aria-hidden="true" className="text-6xl leading-none">
          {finale.emoji}
        </div>
        <h2 className="font-display text-3xl font-black">{finale.title}</h2>
        <p className="font-display text-6xl font-black tabular-nums" role="timer" aria-label={clock(timer.remaining)}>
          {clock(timer.remaining)}
        </p>
        <p className="text-lg font-semibold text-cream/85">{finale.note}</p>
      </section>
      <Button variant="primary" onClick={() => dispatch({ type: "toggle" })}>
        {timer.running ? finale.pause : started ? finale.resume : finale.start}
      </Button>
      <Button variant="ghost" onClick={onDone}>
        {finale.skip}
      </Button>
    </div>
  );
}
