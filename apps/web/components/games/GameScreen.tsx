"use client";

// Экран игры: выбор режима (колоды) → нужная механика.
// Новая механика = новый компонент + строка в MECHANICS ниже.
import { useState, type ReactNode } from "react";
import { Lock } from "lucide-react";
import type { Deck, Game } from "@gazgame/content";
import { DEFAULT_USER_TIER, hasAccess, TIER_LABELS } from "@gazgame/engine";
import { Badge, Button, Tile } from "@gazgame/ui";
import { trackDeeperClick } from "@/lib/analytics";
import { useRouter } from "next/navigation";
import { DeckGame } from "./DeckGame";
import { GuessPartnerGame } from "./GuessPartnerGame";
import { VoteGame } from "./VoteGame";

function Mechanic({ game, deck, related }: { game: Game; deck: Deck; related?: ReactNode }) {
  switch (game.mechanic) {
    case "deck":
      return <DeckGame game={game} deck={deck} related={related} />;
    case "vote":
      return <VoteGame game={game} deck={deck} related={related} />;
    case "guess-partner":
      return <GuessPartnerGame game={game} deck={deck} related={related} />;
  }
}

export function GameScreen({ game, related }: { game: Game; related?: ReactNode }) {
  const router = useRouter();
  const [deckId, setDeckId] = useState<string | null>(null);
  const deck = game.decks.find((d) => d.id === deckId);

  if (deck) return <Mechanic game={game} deck={deck} related={related} />;

  const single = game.decks.length === 1 && game.decks[0];
  if (single && hasAccess(DEFAULT_USER_TIER, single.tier)) {
    return (
      <Button variant="primary" onClick={() => setDeckId(single.id)}>
        Газ! 🔥
      </Button>
    );
  }

  return (
    <section aria-labelledby="modes-title" className="flex flex-col gap-3">
      <h2 id="modes-title" className="font-display text-xl font-bold">
        Выбери режим
      </h2>
      {game.decks.map((d, i) => {
        const open = hasAccess(DEFAULT_USER_TIER, d.tier);
        return (
          <button
            key={d.id}
            type="button"
            className="group block rounded-card text-left"
            aria-label={open ? `Режим «${d.title}»` : `Режим «${d.title}» — закрыт, нужен ${TIER_LABELS[d.tier]}`}
            onClick={() => {
              if (open) {
                setDeckId(d.id);
              } else {
                trackDeeperClick({ id: game.id, kind: "game", source: "locked-deck" });
                router.push("/deeper");
              }
            }}
          >
            <Tile
              emoji={d.emoji}
              title={d.title}
              subtitle={d.description ?? `${d.cards.length} карточек`}
              accent={open ? (i % 2 ? "lime" : "orange") : "none"}
              size="md"
              badge={
                open ? undefined : (
                  <Badge tone="premium">
                    <Lock aria-hidden="true" size={12} /> Глубже 💎
                  </Badge>
                )
              }
            />
          </button>
        );
      })}
    </section>
  );
}
