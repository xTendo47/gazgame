"use client";

// Экран игры: выбор уровня (колоды) → нужная механика.
// Новая механика = новый компонент + строка в Mechanic ниже.
// «Насколько ты меня знаешь» (guess-partner) сама спрашивает имена и уровень — у неё свой порядок экранов.
import { useState, type ReactNode } from "react";
import type { Deck, DeckBasedGame, Game } from "@gazgame/content";
import { deckAccess } from "@gazgame/engine";
import { Button } from "@gazgame/ui";
import { tierFor, usePremium } from "@/lib/premium";
import { DeckGame } from "./DeckGame";
import { DeckPicker } from "./DeckPicker";
import { GuessPartnerGame } from "./GuessPartnerGame";
import { MafiaGame } from "./MafiaGame";
import { MatchGame } from "./MatchGame";
import { RoundDeckGame } from "./RoundDeckGame";
import { SpyGame } from "./SpyGame";
import { VoteGame } from "./VoteGame";

function Mechanic({
  game,
  deck,
  related,
  onChangeDeck,
}: {
  game: DeckBasedGame;
  deck: Deck;
  related?: ReactNode;
  onChangeDeck?: () => void;
}) {
  switch (game.mechanic) {
    case "deck":
      // roundSize — игра раундами («Кто из нас?»), иначе — обычная колода
      return game.roundSize !== undefined ? (
        <RoundDeckGame key={deck.id} game={game} deck={deck} related={related} onChangeDeck={onChangeDeck} />
      ) : (
        <DeckGame game={game} deck={deck} related={related} />
      );
    case "vote":
      return <VoteGame game={game} deck={deck} related={related} />;
    case "guess-partner":
    case "match":
      return null; // открываются ниже целиком, без выбора колоды здесь
  }
}

export function GameScreen({ game, related }: { game: Game; related?: ReactNode }) {
  // «Мафия», «Шпион» и «Насколько ты меня знаешь» ведут игру сами, у остальных сначала выбор колоды
  if (game.mechanic === "mafia") return <MafiaGame game={game} related={related} />;
  if (game.mechanic === "spy") return <SpyGame game={game} related={related} />;
  if (game.mechanic === "guess-partner") return <GuessPartnerGame game={game} related={related} />;
  if (game.mechanic === "match") return <MatchGame game={game} related={related} />;
  return <DecksScreen game={game} related={related} />;
}

function DecksScreen({ game, related }: { game: DeckBasedGame; related?: ReactNode }) {
  const [deckId, setDeckId] = useState<string | null>(null);
  const premium = usePremium();
  const deck = game.decks.find((d) => d.id === deckId);

  // «Сменить колоду» на финале игры раундами — только если колод больше одной
  const changeDeck = game.decks.length > 1 ? () => setDeckId(null) : undefined;
  if (deck) return <Mechanic game={game} deck={deck} related={related} onChangeDeck={changeDeck} />;

  const single = game.decks.length === 1 && game.decks[0];
  if (single && deckAccess(single, { userTier: tierFor(premium) }).open) {
    return (
      <Button variant="primary" onClick={() => setDeckId(single.id)}>
        Газ! 🔥
      </Button>
    );
  }

  return <DeckPicker game={game} title="Выбери режим" onPick={(d) => setDeckId(d.id)} />;
}
