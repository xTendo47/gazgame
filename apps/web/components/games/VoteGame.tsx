"use client";

// Механика vote на экране: «Кто из компании?».
// Телефон передают по кругу: экран «передай телефон» → тайный голос → следующий игрок.
import { useState, type ReactNode } from "react";
import type { Deck, VoteGame as VoteGameData } from "@gazgame/content";
import {
  createVoteState,
  currentVoter,
  roundResult,
  voteReducer,
  voteSummary,
  VOTE_MIN_PLAYERS,
  type VoteState,
} from "@gazgame/engine";
import { Button } from "@gazgame/ui";
import { getProgress } from "@/lib/progress";
import { GameOver } from "./GameOver";
import { PlayersForm } from "./PlayersForm";

export function VoteGame({ game, deck, related }: { game: VoteGameData; deck: Deck; related?: ReactNode }) {
  const [state, setState] = useState<VoteState | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  /** false — экран «передай телефон», true — текущий игрок голосует. */
  const [voting, setVoting] = useState(false);

  const dispatch = (action: Parameters<typeof voteReducer>[1]) => {
    if (!state) return;
    const next = voteReducer(state, action);
    if (next.phase === "finished" && state.phase !== "finished") getProgress().recordGamePlayed(game.id);
    setState(next);
  };

  if (!state) {
    return (
      <PlayersForm
        min={Math.max(VOTE_MIN_PLAYERS, game.players.min)}
        max={game.players.max}
        onSubmit={(names) => {
          setPlayers(names);
          setState(createVoteState(names, deck));
        }}
      />
    );
  }

  const card = deck.cards[state.questions[state.round] ?? 0];
  const header = (
    <div className="text-sm font-bold text-muted">
      Вопрос {state.round + 1} из {state.questions.length}
    </div>
  );

  if (state.phase === "finished") {
    const summary = voteSummary(state, deck);
    return (
      <GameOver
        game={game}
        related={related}
        onRestart={() => {
          setVoting(false);
          setState(createVoteState(players, deck));
        }}
      >
        <h2 className="text-center font-display text-2xl font-bold">Итоги вечера 🏆</h2>
        {summary.stars.length > 0 && (
          <div className="rounded-card bg-orange p-5 text-center text-bg">
            <div className="text-sm font-extrabold uppercase">Звезда вечера ⭐</div>
            <div className="mt-1 font-display text-2xl font-black">
              {summary.stars.map((i) => summary.players[i]?.name).join(" и ")}
            </div>
          </div>
        )}
        <ul className="flex flex-col gap-3">
          {summary.players.map((p) => (
            <li key={p.name} className="rounded-card bg-surface p-4">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-display text-lg font-bold">{p.name}</span>
                <span className="text-sm text-muted">голосов: {p.totalVotes}</span>
              </div>
              <p className="mt-1 text-[15px]">
                {p.awards.length > 0 ? p.awards.join(" · ") : <span className="text-muted">Тёмная лошадка 🐴</span>}
              </p>
            </li>
          ))}
        </ul>
      </GameOver>
    );
  }

  if (state.phase === "reveal") {
    const { counts, winners } = roundResult(state);
    return (
      <div className="flex flex-col gap-4">
        {header}
        <p className="font-display text-xl font-bold">{card?.text}</p>
        <div className="rounded-card bg-lime p-5 text-center text-bg">
          <div className="text-sm font-extrabold uppercase">{card?.award ?? "Победитель раунда"}</div>
          <div className="mt-1 font-display text-3xl font-black">
            {winners.map((i) => state.players[i]).join(" и ")}
          </div>
        </div>
        <ul className="flex flex-col gap-2" aria-label="Голоса">
          {state.players.map((name, i) => (
            <li key={name} className="flex items-center gap-3">
              <span className="w-24 truncate font-semibold">{name}</span>
              <span className="h-3 flex-1 overflow-hidden rounded-full bg-surface">
                <span
                  className="block h-full rounded-full bg-orange"
                  style={{ width: `${((counts[i] ?? 0) / state.players.length) * 100}%` }}
                />
              </span>
              <span className="w-6 text-right text-muted">{counts[i]}</span>
            </li>
          ))}
        </ul>
        <Button variant="primary" onClick={() => dispatch({ type: "next" })}>
          {state.round + 1 < state.questions.length ? "Следующий вопрос 👉" : "Итоги 🏆"}
        </Button>
        {state.round + 1 < state.questions.length && (
          <Button variant="ghost" size="md" onClick={() => dispatch({ type: "finish" })}>
            Закончить и подвести итоги
          </Button>
        )}
      </div>
    );
  }

  const voter = state.players[currentVoter(state)] ?? "";

  if (!voting) {
    return (
      <div className="flex flex-col gap-5">
        {header}
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div aria-hidden="true" className="text-6xl">
            📱
          </div>
          <h2 className="font-display text-2xl font-bold">Передай телефон: {voter}</h2>
          <p className="text-muted">Голосуем тайно — остальные не подглядывают 🙈</p>
        </div>
        <Button variant="primary" onClick={() => setVoting(true)}>
          Я {voter}, голосую
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {header}
      <h2 className="font-display text-2xl font-bold leading-tight">{card?.text}</h2>
      <p className="text-muted">Голосует {voter}. Выбери одного:</p>
      <div className="grid grid-cols-2 gap-3">
        {state.players.map((name, i) => (
          <Button
            key={name}
            variant="option"
            size="md"
            className="justify-center text-center"
            onClick={() => {
              dispatch({ type: "vote", target: i });
              setVoting(false);
            }}
          >
            {name}
          </Button>
        ))}
      </div>
    </div>
  );
}
