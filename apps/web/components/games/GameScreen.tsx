"use client";

// Экран игры: выбор уровня (колоды) → нужная механика.
// Новая механика = новый компонент + строка в Mechanic ниже.
// «Насколько ты меня знаешь» (guess-partner) сама спрашивает имена и уровень — у неё свой порядок экранов.
import { useState, type ReactNode } from "react";
import type { Deck, Game } from "@gazgame/content";
import { deckAccess } from "@gazgame/engine";
import { Button } from "@gazgame/ui";
import { DeckGame } from "./DeckGame";
import { DeckPicker } from "./DeckPicker";
import { GuessPartnerGame } from "./GuessPartnerGame";
import { VoteGame } from "./VoteGame";

function Mechanic({ game, deck, related }: { game: Game; deck: Deck; related?: ReactNode }) {
  switch (game.mechanic) {
    case "deck":
      return <DeckGame game={game} deck={deck} related={related} />;
    case "vote":
      return <VoteGame game={game} deck={deck} related={related} />;
    case "guess-partner":
      return null; // открывается ниже целиком, без выбора колоды здесь
  }
}

export function GameScreen({ game, related }: { game: Game; related?: ReactNode }) {
  const [deckId, setDeckId] = useState<string | null>(null);
  const deck = game.decks.find((d) => d.id === deckId);

  if (game.mechanic === "guess-partner") return <GuessPartnerGame game={game} related={related} />;
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
