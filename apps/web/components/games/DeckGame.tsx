"use client";

// Механика deck на экране: «Я никогда не…», «Правда или действие».
import { useReducer, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Deck, DeckGame as DeckGameData } from "@gazgame/content";
import { ANY_TYPE, createDeckState, currentCard, deckReducer, isExhausted, remaining } from "@gazgame/engine";
import { Button } from "@gazgame/ui";
import { getProgress } from "@/lib/progress";
import { GameOver } from "./GameOver";

export function DeckGame({ game, deck, related }: { game: DeckGameData; deck: Deck; related?: ReactNode }) {
  const typed = Boolean(game.cardTypes);
  const [state, dispatch] = useReducer(deckReducer, deck, (d) => createDeckState(d, { typed }));
  const [finished, setFinished] = useState(false);
  const card = currentCard(state, deck);
  const cardType = game.cardTypes?.find((t) => t.id === card?.type);

  function finish() {
    getProgress().recordGamePlayed(game.id);
    setFinished(true);
  }

  if (finished) {
    return (
      <GameOver
        game={game}
        related={related}
        onRestart={() => {
          dispatch({ type: "reset", state: createDeckState(deck, { typed }) });
          setFinished(false);
        }}
      >
        <div className="py-6 text-center">
          <div aria-hidden="true" className="text-6xl">
            🎉
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold">Колода пройдена!</h2>
          <p className="mt-2 text-muted">Сыграно карточек: {state.drawn}. Хотите ещё острее?</p>
        </div>
      </GameOver>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-sm font-bold text-muted" aria-live="polite">
        {deck.emoji} {deck.title} · карточка {state.drawn} из {state.total}
      </div>

      <div className="relative min-h-64">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.drawn}
            initial={{ opacity: 0, y: 30, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: -30, rotate: 2 }}
            transition={{ duration: 0.25 }}
            className="flex min-h-64 flex-col justify-center gap-3 rounded-card bg-orange p-6 text-bg"
            aria-live="polite"
          >
            {card ? (
              <>
                {cardType && (
                  <span className="text-sm font-extrabold uppercase tracking-wide">
                    {cardType.emoji} {cardType.title}
                  </span>
                )}
                <p className="font-display text-2xl font-bold leading-snug">{card.text}</p>
              </>
            ) : (
              <p className="font-display text-2xl font-bold leading-snug">
                {typed ? "Выбирай: правда или действие?" : "Тяни первую карточку 👇"}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {isExhausted(state) ? (
        <Button variant="accent" onClick={finish}>
          Финиш 🏁
        </Button>
      ) : typed && game.cardTypes ? (
        <div className="grid grid-cols-2 gap-3">
          {game.cardTypes.map((t) => (
            <Button
              key={t.id}
              variant={t.id === game.cardTypes?.[0]?.id ? "primary" : "accent"}
              disabled={remaining(state, t.id) === 0}
              onClick={() => dispatch({ type: "draw", cardType: t.id })}
            >
              {t.emoji} {t.title}
            </Button>
          ))}
        </div>
      ) : (
        <Button variant="primary" onClick={() => dispatch({ type: "draw", cardType: ANY_TYPE })}>
          {state.drawn === 0 ? "Газ! 🔥" : "Следующая 👉"}
        </Button>
      )}

      {state.drawn > 0 && !isExhausted(state) && (
        <button
          type="button"
          onClick={finish}
          className="min-h-11 self-center rounded-full px-4 text-[15px] font-semibold text-muted hover:text-cream"
        >
          Закончить игру
        </button>
      )}
    </div>
  );
}
