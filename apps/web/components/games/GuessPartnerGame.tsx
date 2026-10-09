"use client";

// Механика guess-partner на экране: «Насколько хорошо вы знаете друг друга».
import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Deck, GuessPartnerGame as GuessPartnerGameData } from "@gazgame/content";
import {
  createGuessPartnerState,
  guessPartnerReducer,
  rankFor,
  scoreGuessPartner,
  type GuessPartnerAction,
  type GuessPartnerState,
} from "@gazgame/engine";
import { Button, ProgressBar } from "@gazgame/ui";
import { getProgress } from "@/lib/progress";
import { ShareResult } from "../ShareResult";
import { GameOver } from "./GameOver";
import { PlayersForm } from "./PlayersForm";

export function GuessPartnerGame({
  game,
  deck,
  related,
}: {
  game: GuessPartnerGameData;
  deck: Deck;
  related?: ReactNode;
}) {
  const [state, setState] = useState<GuessPartnerState | null>(null);
  const [started, setStarted] = useState(false);

  function dispatch(action: GuessPartnerAction) {
    if (!state) return;
    const next = guessPartnerReducer(state, action);
    if (next.phase === "finished" && state.phase !== "finished") {
      getProgress().recordGamePlayed(game.id, { score: scoreGuessPartner(next).percent });
    }
    setState(next);
  }

  if (!state) {
    return (
      <PlayersForm
        min={2}
        max={2}
        placeholders={["Имя первого", "Имя второго"]}
        submitLabel="Дальше 👉"
        onSubmit={([a = "", b = ""]) => setState(createGuessPartnerState([a, b], deck))}
      />
    );
  }

  const [first, second] = state.players;

  if (!started) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div aria-hidden="true" className="text-6xl">
            🙈
          </div>
          <h2 className="font-display text-2xl font-bold">Первым отвечает {first}</h2>
          <p className="text-muted">{second}, не подглядывай! Потом будет твоя очередь.</p>
        </div>
        <Button variant="primary" onClick={() => setStarted(true)}>
          Газ! 🔥
        </Button>
      </div>
    );
  }

  if (state.phase === "handoff") {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div aria-hidden="true" className="text-6xl">
            📱
          </div>
          <h2 className="font-display text-2xl font-bold">Передай телефон: {second}</h2>
          <p className="text-muted">{first}, теперь твоя очередь не подглядывать 😉</p>
        </div>
        <Button variant="primary" onClick={() => dispatch({ type: "continue" })}>
          Я {second}, поехали
        </Button>
      </div>
    );
  }

  if (state.phase === "finished") {
    const score = scoreGuessPartner(state);
    const rank = rankFor(score.percent, game.ranks);
    return (
      <GameOver
        game={game}
        related={related}
        onRestart={() => {
          setStarted(false);
          setState(createGuessPartnerState(state.players, deck));
        }}
      >
        <section className="flex flex-col items-center gap-2 rounded-card bg-orange p-6 text-center text-bg">
          <div className="text-sm font-extrabold uppercase">
            {first} + {second}
          </div>
          <div className="font-display text-6xl font-black">{score.percent}%</div>
          <div className="font-display text-2xl font-black">
            {rank.title} {rank.emoji}
          </div>
          <p className="font-semibold">{rank.text}</p>
        </section>
        <div className="grid grid-cols-2 gap-3 text-center">
          {state.players.map((name, i) => (
            <div key={name} className="rounded-card bg-surface p-4">
              <div className="font-display text-2xl font-bold">
                {score.correctByPlayer[i]}/{state.questions.length}
              </div>
              <div className="text-sm text-muted">{name} угадал(а)</div>
            </div>
          ))}
        </div>
        <details className="rounded-card bg-surface p-4">
          <summary className="cursor-pointer font-bold">Разбор ответов</summary>
          <ul className="mt-3 flex flex-col gap-3 text-[15px]">
            {score.questions.map((q) => {
              const c = deck.cards[q.card];
              const opt = (i: number | null) => (i === null ? "—" : (c?.options?.[i] ?? "—"));
              return (
                <li key={q.card}>
                  <div className="font-semibold">{c?.text}</div>
                  <div className="text-muted">
                    {first}: «{opt(q.self[0])}» — {second} {q.correct[1] ? "угадал(а) ✅" : "не угадал(а) ❌"}
                  </div>
                  <div className="text-muted">
                    {second}: «{opt(q.self[1])}» — {first} {q.correct[0] ? "угадал(а) ✅" : "не угадал(а) ❌"}
                  </div>
                </li>
              );
            })}
          </ul>
        </details>
        <ShareResult
          fileName={`gazgame-${game.slug}`}
          card={{ label: game.title, emoji: rank.emoji, highlight: `${score.percent}%`, title: rank.title, text: rank.text }}
        />
      </GameOver>
    );
  }

  const player = state.players[state.player];
  const partner = state.players[state.player === 0 ? 1 : 0];
  const card = deck.cards[state.questions[state.question] ?? 0];

  return (
    <div className="flex flex-col gap-5">
      <ProgressBar current={state.question + 1} total={state.questions.length} label={`Отвечает ${player}`} />
      <AnimatePresence mode="wait">
        <motion.fieldset
          key={`${state.player}-${state.question}-${state.step}`}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-3"
        >
          <legend className="mb-4 flex flex-col gap-2">
            <span
              className={
                state.step === "self"
                  ? "self-start rounded-full bg-lime px-3 py-1 text-sm font-extrabold text-bg"
                  : "self-start rounded-full bg-orange px-3 py-1 text-sm font-extrabold text-bg"
              }
            >
              {state.step === "self" ? "Про себя" : `Как ответит ${partner}?`}
            </span>
            <span className="font-display text-2xl font-bold leading-tight">{card?.text}</span>
          </legend>
          {card?.options?.map((option, i) => (
            <Button key={i} variant="option" onClick={() => dispatch({ type: "answer", option: i })}>
              {option}
            </Button>
          ))}
        </motion.fieldset>
      </AnimatePresence>
    </div>
  );
}
