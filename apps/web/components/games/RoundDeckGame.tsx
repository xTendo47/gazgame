"use client";

// Механика deck раундами («Кто из нас?»): у игры задан roundSize.
// Правила → карточка «7 / 12» → экран handoffText → … → финал с подсказками, «Ещё раунд» и «Пофлексить 🧊».
// Сыгранные карточки запоминаются на устройстве — без повторов, пока колода не кончится.
// Свайп влево по карточке = «Готово 👉». Цвет карточки и финала — из deck.accent, кнопка на карточке — game.cardButton.
import { useReducer, useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import type { Deck, DeckGame as DeckGameData } from "@gazgame/content";
import { createRoundState, pickHint, pickRound, roundReducer } from "@gazgame/engine";
import { Button, buttonVariants, cn } from "@gazgame/ui";
import { trackDeeperClick } from "@/lib/analytics";
import { usePremium } from "@/lib/premium";
import { getProgress } from "@/lib/progress";
import { FlexMenu } from "../result/FlexMenu";

const usedKey = (game: DeckGameData, deck: Deck) => `${game.id}/${deck.id}`;

/** Цвет карточки и финала по deck.accent: салатовый, оранжевый (по умолчанию) или тёмный с голубым свечением, как «Подписка». */
const ACCENT: Record<NonNullable<Deck["accent"]>, string> = {
  lime: "bg-lime text-bg",
  orange: "bg-orange text-bg",
  blue: "diamond-glow bg-surface text-cream",
};

/** Сколько протянуть влево (px) или как быстро смахнуть, чтобы карточка ушла. */
const SWIPE_OFFSET = 80;
const SWIPE_VELOCITY = 500;

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

export function RoundDeckGame({
  game,
  deck,
  related,
  onChangeDeck,
}: {
  game: DeckGameData;
  deck: Deck;
  related?: ReactNode;
  /** «Сменить колоду» на финале — только если у игры колод больше одной. */
  onChangeDeck?: () => void;
}) {
  // Первый раунд планируем один раз; сыгранным он станет по нажатию «Газ!».
  const [firstRound] = useState(() => planRound(game, deck));
  const [state, dispatch] = useReducer(roundReducer, firstRound.cards, (cards) => createRoundState(cards));
  const [hint, setHint] = useState<string | null>(null);
  /** Номер вспышки «Рассказывай! 👀»; null — анимации нет. */
  const [peek, setPeek] = useState<number | null>(null);
  const finale = game.finale;
  const accent = ACCENT[deck.accent ?? "orange"];
  const premium = usePremium();

  function showPeek() {
    const id = Date.now();
    setPeek(id);
    window.setTimeout(() => setPeek((current) => (current === id ? null : current)), 1000);
  }

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
        <section className={cn("flex flex-col items-center gap-3 rounded-card p-6 text-center", accent)}>
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

        <div className={cn("grid gap-3", onChangeDeck && "grid-cols-2")}>
          <Button
            variant="primary"
            className={cn(onChangeDeck && "px-3 text-base whitespace-nowrap")}
            onClick={() => {
              setHint(null);
              const round = planRound(game, deck);
              markRoundStarted(game, deck, round.used);
              dispatch({ type: "newRound", cards: round.cards });
            }}
          >
            Ещё раунд 🔄
          </Button>
          {onChangeDeck && (
            <Button variant="outline" className="px-3 text-base whitespace-nowrap" onClick={onChangeDeck}>
              Сменить колоду
            </Button>
          )}
        </div>
        <FlexMenu
          linkPath={`/game/${game.slug}`}
          fileName={`gazgame-${game.slug}`}
          shareText={finale?.flexText}
          card={{ label: game.title, emoji: finale?.emoji ?? game.emoji, title: finale?.title ?? game.title, text: finale?.flexText }}
        />

        {/* «Слишком мило? Попробуйте Без тормозов 💎» — с Премиумом звать некуда, всё уже открыто */}
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

  const card = deck.cards[state.cards[state.index] ?? -1];
  const next = () => dispatch({ type: "next" });
  const onSwipe = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_OFFSET || info.velocity.x < -SWIPE_VELOCITY) next();
  };

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
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={{ left: 0.7, right: 0.15 }}
          dragSnapToOrigin
          onDragEnd={onSwipe}
          initial={{ opacity: 0, y: 30, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          exit={{ opacity: 0, x: -160, rotate: -6 }}
          transition={{ duration: 0.25 }}
          className={cn(
            "flex min-h-64 cursor-grab touch-pan-y flex-col justify-center gap-5 rounded-card p-6 select-none active:cursor-grabbing",
            accent,
          )}
        >
          <p className="font-display text-2xl font-bold leading-snug break-words">{card?.text}</p>
          {game.cardButton && (
            <button
              type="button"
              onClick={showPeek}
              onPointerDownCapture={(e) => e.stopPropagation()}
              className={cn(
                "min-h-11 self-start rounded-full px-4 text-[15px] font-bold",
                deck.accent === "blue" ? "bg-cream/10 text-cream" : "bg-bg/15 text-bg",
              )}
            >
              {game.cardButton}
            </button>
          )}
        </motion.div>
      </AnimatePresence>
      <p className="-mt-3 text-center text-sm text-muted">Смахни влево, чтобы дальше</p>
      <AnimatePresence>
        {peek !== null && (
          <motion.div
            key={peek}
            aria-hidden="true"
            data-testid="peek"
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-bg/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.span
              className="text-[160px] leading-none"
              initial={{ scale: 0.3, rotate: -20 }}
              animate={{ scale: [0.3, 1.25, 1], rotate: [-20, 12, -6, 0], x: [0, -14, 14, 0] }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              👀
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
      <Button variant="primary" onClick={next}>
        {state.index + 1 < state.cards.length ? "Готово 👉" : "К финалу 🏁"}
      </Button>
    </div>
  );
}
