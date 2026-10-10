"use client";

// Экран игры: выбор уровня (колоды) → нужная механика.
// Новая механика = новый компонент + строка в Mechanic ниже.
// «Насколько ты меня знаешь» (guess-partner) сама спрашивает имена и уровень — у неё свой порядок экранов.
import { useState, type ReactNode } from "react";
import type { Deck, DeckBasedGame, Game } from "@gazgame/content";
import { deckAccess } from "@gazgame/engine";
import { Button } from "@gazgame/ui";
import { DeckGame } from "./DeckGame";
import { DeckPicker } from "./DeckPicker";
import { GuessPartnerGame } from "./GuessPartnerGame";
import { MafiaGame } from "./MafiaGame";
import { RoundDeckGame } from "./RoundDeckGame";
import { VoteGame } from "./VoteGame";

function Mechanic({ game, deck, related }: { game: DeckBasedGame; deck: Deck; related?: ReactNode }) {
  switch (game.mechanic) {
    case "deck":
      // roundSize — игра раундами («Кто из нас?»), иначе — обычная колода
      return game.roundSize !== undefined ? (
        <RoundDeckGame game={game} deck={deck} related={related} />
      ) : (
        <DeckGame game={game} deck={deck} related={related} />
      );
    case "vote":
      return <VoteGame game={game} deck={deck} related={related} />;
    case "guess-partner":
      return null; // открывается ниже целиком, без выбора колоды здесь
  }
}

export function GameScreen({ game, related }: { game: Game; related?: ReactNode }) {
  // «Мафия» и «Насколько ты меня знаешь» ведут игру сами, у остальных сначала выбор колоды
  if (game.mechanic === "mafia") return <MafiaGame game={game} related={related} />;
  if (game.mechanic === "guess-partner") return <GuessPartnerGame game={game} related={related} />;
  return <DecksScreen game={game} related={related} />;
}

function DecksScreen({ game, related }: { game: DeckBasedGame; related?: ReactNode }) {
  const [deckId, setDeckId] = useState<string | null>(null);
  const deck = game.decks.find((d) => d.id === deckId);

  if (deck) return <Mechanic game={game} deck={deck} related={related} />;

  const single = game.decks.length === 1 && game.decks[0];
  if (single && deckAccess(single).open) {
    return (
      <Button variant="primary" onClick={() => setDeckId(single.id)}>
        Газ! 🔥
      </Button>
    );
  }

  return <DeckPicker game={game} title="Выбери режим" onPick={(d) => setDeckId(d.id)} />;
}
