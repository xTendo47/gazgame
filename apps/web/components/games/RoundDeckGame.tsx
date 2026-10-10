"use client";

// Механика deck раундами («Кто из нас?»): у игры задан roundSize.
// Правила → карточка «7 / 12» → экран handoffText → … → финал с подсказками, «Ещё раунд» и «Пофлексить 🧊».
// Сыгранные карточки запоминаются на устройстве — без повторов, пока колода не кончится.
import { useReducer, useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import type { Deck, DeckGame as DeckGameData } from "@gazgame/content";
import { createRoundState, pickHint, pickRound, roundReducer } from "@gazgame/engine";
import { Button, buttonVariants } from "@gazgame/ui";
import { trackDeeperClick } from "@/lib/analytics";
import { getProgress } from "@/lib/progress";
import { FlexMenu } from "../result/FlexMenu";

const usedKey = (game: DeckGameData, deck: Deck) => `${game.id}/${deck.id}`;

/**
 * Карточки нового раунда с учётом сыгранных на этом устройстве (храним тексты — номера могут сдвинуться при правке колоды).
 * Ничего не записывает: сыгранными карточки отмечает markRoundStarted, когда раунд правда начался.
 */
function planRound(game: DeckGameData, deck: Deck) {
  const usedTexts = new Set(getProgress().getLastCards(usedKey(game, deck)));
  const used = deck.cards.flatMap((c, i) => (usedTexts.has(c.text) ? [i] : []));
  return pickRound(deck.cards.length, game.roundSize ?? deck.cards.length, used);
}

function markRoundStarted(game: DeckGameData, deck: Deck, used: readonly number[]) {
  getProgress().saveLastCards(
    usedKey(game, deck),
    used.map((i) => deck.cards[i]?.text ?? ""),
  );
}

export function RoundDeckGame({ game, deck, related }: { game: DeckGameData; deck: Deck; related?: ReactNode }) {
  // Первый раунд планируем один раз; сыгранным он станет по нажатию «Газ!».
  const [firstRound] = useState(() => planRound(game, deck));
  const [state, dispatch] = useReducer(roundReducer, firstRound.cards, (cards) => createRoundState(cards));
  const [hint, setHint] = useState<string | null>(null);
  const finale = game.finale;

  if (state.phase === "rules") {
    return (
      <section aria-labelledby="rules-title" className="flex flex-col gap-4">
        <h2 id="rules-title" className="font-display text-2xl font-bold">
          Правила {deck.emoji}
        </h2>
        <ol className="flex list-inside list-decimal flex-col gap-2 rounded-card bg-surface p-5 text-[17px] leading-snug marker:font-bold marker:text-lime">
          {game.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
        <Button
          variant="primary"
          onClick={() => {
            markRoundStarted(game, deck, firstRound.used);
            dispatch({ type: "start" });
          }}
        >
          Газ! 🔥
        </Button>
      </section>
    );
  }

  if (state.phase === "handoff") {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-card bg-surface p-6 text-center">
          <p className="font-display text-2xl font-bold leading-snug">{game.handoffText ?? "Передай телефон дальше 👉"}</p>
        </div>
        <Button variant="primary" onClick={() => dispatch({ type: "next" })}>
          Дальше
        </Button>
      </div>
    );
  }

  if (state.phase === "finale") {
    return (
      <div className="flex flex-col gap-4">
        <section className="flex flex-col items-center gap-3 rounded-card bg-orange p-6 text-center text-bg">
          <div aria-hidden="true" className="text-6xl leading-none">
            {finale?.emoji ?? "🎉"}
          </div>
          <h2 className="font-display text-3xl font-black">{finale?.title ?? "Раунд сыгран!"}</h2>
          {finale?.text && <p className="text-lg font-semibold">{finale.text}</p>}
        </section>

        {finale && finale.hints.length > 0 && (
          <div className="flex flex-col gap-2">
            <Button variant="accent" onClick={() => setHint(pickHint(finale.hints, hint))}>
              {finale.hintButton}
            </Button>
            <p role="status" className="min-h-6 text-center text-lg font-semibold">
              {hint}
            </p>
          </div>
        )}

        <Button
          variant="primary"
          onClick={() => {
            setHint(null);
            const round = planRound(game, deck);
            markRoundStarted(game, deck, round.used);
            dispatch({ type: "newRound", cards: round.cards });
          }}
        >
          Ещё раунд 🔄
        </Button>
        <FlexMenu
          linkPath={`/game/${game.slug}`}
          fileName={`gazgame-${game.slug}`}
          shareText={finale?.flexText}
          card={{ label: game.title, emoji: finale?.emoji ?? game.emoji, title: finale?.title ?? game.title, text: finale?.flexText }}
        />

        {deck.upsellText && (
          <Link
            href="/deeper"
            onClick={() => trackDeeperClick({ id: game.id, kind: "game", source: "game-over" })}
            className="min-h-11 self-center px-2 py-2 text-center text-[15px] font-semibold text-muted underline-offset-4 hover:text-cream hover:underline"
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

  const card = deck.cards[state.cards[state.index] ?? -1];
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-sm font-bold text-muted" aria-live="polite">
        <span>
          {deck.emoji} {deck.title}
        </span>
        <span className="font-display text-base text-cream">
          {state.index + 1} / {state.cards.length}
        </span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={state.index}
          initial={{ opacity: 0, y: 30, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          exit={{ opacity: 0, y: -30, rotate: 2 }}
          transition={{ duration: 0.25 }}
          className="flex min-h-64 flex-col justify-center rounded-card bg-orange p-6 text-bg"
        >
          <p className="font-display text-2xl font-bold leading-snug">{card?.text}</p>
        </motion.div>
      </AnimatePresence>
      <Button variant="primary" onClick={() => dispatch({ type: "next" })}>
        {state.index + 1 < state.cards.length ? "Готово 👉" : "К финалу 🏁"}
      </Button>
    </div>
  );
}
