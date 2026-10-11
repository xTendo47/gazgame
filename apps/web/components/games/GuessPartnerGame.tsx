"use client";

// «Насколько ты меня знаешь» (механика guess-partner).
// Имена (запоминаются на устройстве) → уровень → раунд 1: первый отвечает про себя, второй угадывает →
// «меняемся» или «результат сейчас» → раунд 2 наоборот → проценты и звание. Правильные ответы не показываем.
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Deck, GuessPartnerGame as GuessPartnerGameData } from "@gazgame/content";
import {
  createGuessPartnerState,
  currentView,
  deckAccess,
  guessPartnerReducer,
  nextDeck,
  playedCards,
  rankFor,
  roundRoles,
  scoreGuessPartner,
  type GuessPartnerAction,
  type GuessPartnerState,
} from "@gazgame/engine";
import { Button, ProgressBar } from "@gazgame/ui";
import { getProgress } from "@/lib/progress";
import { ShareResult } from "../ShareResult";
import { DeckPicker, DeckTile } from "./DeckPicker";
import { GameOver } from "./GameOver";
import { PlayersForm } from "./PlayersForm";

type Players = [string, string];

/** Сохранённые имена: на сервере их нет (null), в браузере — из ProgressStore. Снимок — строка, чтобы не перерисовывать зря. */
export function useSavedPlayers(gameId: string): Players | null {
  const snapshot = useSyncExternalStore(
    noopSubscribe,
    () => JSON.stringify(getProgress().getPlayers(gameId)),
    () => "null",
  );
  const names = JSON.parse(snapshot) as string[] | null;
  return names && names.length === 2 && names[0] && names[1] ? [names[0], names[1]] : null;
}
const noopSubscribe = () => () => {};

export function GuessPartnerGame({ game, related }: { game: GuessPartnerGameData; related?: ReactNode }) {
  const saved = useSavedPlayers(game.id);
  const [players, setPlayers] = useState<Players | null>(null);
  const [editingNames, setEditingNames] = useState(false);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [state, setState] = useState<GuessPartnerState | null>(null);
  /** Показали ли заставку «Сейчас отвечает …» перед раундом (по номеру раунда). */
  const [introSeen, setIntroSeen] = useState<[boolean, boolean]>([false, false]);
  /** Колоды, доигранные до финала (для unlockAfter). Экран уровней показывается только после нажатий — читаем с устройства. */
  const [completedDecks, setCompletedDecks] = useState<string[]>(() => getProgress().getCompletedDecks(game.id));

  function start(d: Deck, names: Players = players as Players) {
    const key = `${game.id}/${d.id}`;
    const lastTexts = new Set(getProgress().getLastCards(key));
    const previous = d.cards.flatMap((c, i) => (lastTexts.has(c.text) ? [i] : []));
    const next = createGuessPartnerState(names, d, { previous });
    getProgress().saveLastCards(
      key,
      playedCards(next).map((i) => d.cards[i]?.text ?? ""),
    );
    setDeck(d);
    setState(next);
    setIntroSeen([false, false]);
  }

  function dispatch(action: GuessPartnerAction) {
    if (!state) return;
    const next = guessPartnerReducer(state, action);
    if (next.phase === "finished" && state.phase !== "finished") {
      getProgress().recordGamePlayed(game.id, { score: scoreGuessPartner(next).percent });
      if (deck) {
        getProgress().markDeckCompleted(game.id, deck.id);
        setCompletedDecks(getProgress().getCompletedDecks(game.id));
      }
    }
    setState(next);
  }

  // 1. Имена
  if (!players) {
    if (saved && !editingNames) {
      return (
        <section className="flex flex-col gap-4">
          <div className="rounded-card bg-surface p-5">
            <div className="text-sm font-bold uppercase tracking-wide text-muted">Играют</div>
            <div className="mt-1 font-display text-2xl font-bold">
              {saved[0]} <span className="text-orange">+</span> {saved[1]}
            </div>
          </div>
          <Button variant="primary" onClick={() => setPlayers(saved)}>
            Дальше 👉
          </Button>
          <Button variant="ghost" size="md" onClick={() => setEditingNames(true)}>
            Сменить
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
          getProgress().savePlayers(game.id, names);
          setPlayers(names);
          setEditingNames(false);
        }}
      />
    );
  }

  const [first, second] = players;

  // 2. Уровень
  if (!state || !deck) {
    return (
      <div className="flex flex-col gap-4">
        <DeckPicker game={game} completedDecks={completedDecks} onPick={(d) => start(d)} />
        <Button variant="ghost" size="md" onClick={() => setPlayers(null)}>
          Играют {first} и {second} · Сменить
        </Button>
      </div>
    );
  }

  const { subject: subjectIndex, guesser: guesserIndex } = roundRoles(state.round);
  const subject = players[subjectIndex];
  const guesser = players[guesserIndex];

  // Заставка перед раундом: кто отвечает про себя, кто не подглядывает
  if (state.phase === "self" && state.question === 0 && !introSeen[state.round]) {
    return (
      <Pause
        emoji="🙈"
        title={`Сейчас ${subject} отвечает про себя`}
        text={`${guesser}, не подглядывай! Потом будешь угадывать.`}
        button="Газ! 🔥"
        onContinue={() => setIntroSeen(state.round === 0 ? [true, introSeen[1]] : [introSeen[0], true])}
      />
    );
  }

  if (state.phase === "handoff") {
    return (
      <Pause
        emoji="🙈"
        title="Передай телефон"
        text={`Телефон — ${guesser}. Угадай, что ответил(а) ${subject}. ${subject}, не подсказывай!`}
        button={`Я ${guesser}, поехали`}
        onContinue={() => dispatch({ type: "continue" })}
      />
    );
  }

  if (state.phase === "between") {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div aria-hidden="true" className="text-6xl">
            🔄
          </div>
          <h2 className="font-display text-2xl font-bold">Первый раунд сыгран</h2>
          <p className="text-muted">Меняемся местами или смотрим результат?</p>
        </div>
        <Button variant="primary" onClick={() => dispatch({ type: "continue" })}>
          Теперь {first} угадывает {second} →
        </Button>
        <Button variant="ghost" onClick={() => dispatch({ type: "finish" })}>
          Показать результат сейчас
        </Button>
      </div>
    );
  }

  if (state.phase === "finished") {
    const score = scoreGuessPartner(state);
    const rank = rankFor(score.percent, game.ranks);
    const lines = score.rounds.map((r) => `${players[r.guesser]} знает ${players[r.subject]} на ${r.percent}%`);
    const next = nextDeck(game, deck.id);
    return (
      <GameOver game={game} related={related} onRestart={() => start(deck)}>
        <section className="flex flex-col items-center gap-3 rounded-card bg-orange p-6 text-center text-bg">
          <div className="text-sm font-extrabold uppercase">
            {first} + {second} · {deck.title}
          </div>
          <div aria-hidden="true" className="text-6xl leading-none">
            {rank.emoji}
          </div>
          <div className="font-display text-3xl font-black">{rank.title}</div>
          <p className="font-semibold">{rank.text}</p>
        </section>
        <ul className="flex flex-col gap-3">
          {score.rounds.map((r, i) => (
            <li key={i} className="flex items-center justify-between gap-4 rounded-card bg-surface p-4">
              <span className="font-semibold">
                {players[r.guesser]} знает {players[r.subject]} на
              </span>
              <span className="font-display text-3xl font-black text-lime">{r.percent}%</span>
            </li>
          ))}
        </ul>
        <ShareResult
          fileName={`gazgame-${game.slug}`}
          shareText={lines.join("\n")}
          card={{ label: game.title, emoji: rank.emoji, highlight: `${score.percent}%`, title: rank.title, text: lines.join(" · ") }}
        />
        {next && (
          <section aria-labelledby="next-level" className="flex flex-col gap-2">
            <h2 id="next-level" className="font-display text-xl font-bold">
              Следующий уровень
            </h2>
            <DeckTile game={game} deck={next} completedDecks={completedDecks} onPick={(d) => start(d)} />
            {deckAccess(next, { completedDecks, decks: game.decks }).open && (
              <p className="text-sm text-muted">Те же игроки, новые вопросы.</p>
            )}
          </section>
        )}
      </GameOver>
    );
  }

  // Вопрос
  const view = currentView(state, deck);
  const isSelf = state.phase === "self";

  return (
    <div className="flex flex-col gap-5">
      <ProgressBar
        current={state.question + 1}
        total={state.questions.length}
        label={isSelf ? `${subject} про себя` : `${guesser} угадывает`}
      />
      <AnimatePresence mode="wait">
        <motion.fieldset
          key={`${state.round}-${state.phase}-${state.question}`}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-3"
        >
          <legend className="mb-4 flex flex-col gap-2">
            <span
              className={
                isSelf
                  ? "self-start rounded-full bg-lime px-3 py-1 text-sm font-extrabold text-bg"
                  : "self-start rounded-full bg-orange px-3 py-1 text-sm font-extrabold text-bg"
              }
            >
              {isSelf ? `${subject}, про себя 🤫` : `${guesser}, угадывай`}
            </span>
            <span className="font-display text-2xl font-bold leading-tight">{view?.text}</span>
          </legend>
          {view?.options.map((option, i) => (
            <Button key={`${state.question}-${i}`} variant="option" onClick={() => dispatch({ type: "answer", shown: i })}>
              {option}
            </Button>
          ))}
        </motion.fieldset>
      </AnimatePresence>
    </div>
  );
}

function Pause({
  emoji,
  title,
  text,
  button,
  onContinue,
}: {
  emoji: string;
  title: string;
  text: string;
  button: string;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div aria-hidden="true" className="text-6xl">
          {emoji}
        </div>
        <h2 className="font-display text-2xl font-bold">{title}</h2>
        <p className="text-muted">{text}</p>
      </div>
      <Button variant="primary" onClick={onContinue}>
        {button}
      </Button>
    </div>
  );
}
