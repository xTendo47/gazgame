"use client";

// Выбор уровня (колоды) игры. Закрытая колода — с замком и текстом:
// locked.reason "subscription" (или уровень выше подписки) ведёт туда же, куда «Глубже 💎»;
// "soon" и unlockAfter («Откроется после …») — просто замок, нажимать некуда.
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import type { Deck, DeckBasedGame } from "@gazgame/content";
import { deckAccess } from "@gazgame/engine";
import { Badge, Tile } from "@gazgame/ui";
import { trackDeeperClick } from "@/lib/analytics";
import { tierFor, usePremium } from "@/lib/premium";

export function DeckPicker({
  game,
  decks = game.decks,
  title = "Выбери уровень",
  completedDecks = [],
  onPick,
}: {
  game: DeckBasedGame;
  decks?: Deck[];
  title?: string;
  /** Колоды, которые уже доиграли до финала (для unlockAfter). */
  completedDecks?: readonly string[];
  onPick: (deck: Deck) => void;
}) {
  return (
    <section aria-labelledby="levels-title" className="flex flex-col gap-3">
      <h2 id="levels-title" className="font-display text-xl font-bold">
        {title}
      </h2>
      {decks.map((deck, i) => (
        <DeckTile
          key={deck.id}
          game={game}
          deck={deck}
          // цвет полоски — как у карточек колоды (deck.accent), иначе по очереди
          accent={deck.accent === "lime" || deck.accent === "orange" ? deck.accent : i % 2 ? "lime" : "orange"}
          completedDecks={completedDecks}
          onPick={onPick}
        />
      ))}
    </section>
  );
}

export function DeckTile({
  game,
  deck,
  accent = "orange",
  completedDecks = [],
  source = "locked-deck",
  onPick,
}: {
  game: DeckBasedGame;
  deck: Deck;
  accent?: "orange" | "lime";
  completedDecks?: readonly string[];
  /** Откуда нажали на закрытую колоду — для trackDeeperClick: выбор уровня или конец игры. */
  source?: "locked-deck" | "game-over";
  onPick: (deck: Deck) => void;
}) {
  const router = useRouter();
  // С Премиумом замок «по подписке» снят (Бездна, Без тормозов, Глубоко…)
  const premium = usePremium();
  const access = deckAccess(deck, { completedDecks, decks: game.decks, userTier: tierFor(premium) });
  const subtitle = deck.description ?? `${deck.cards.length} карточек`;

  if (access.open) {
    return (
      <button type="button" className="group block rounded-card text-left" onClick={() => onPick(deck)}>
        <Tile emoji={deck.emoji} title={deck.title} subtitle={subtitle} accent={accent} size="md" />
      </button>
    );
  }

  // Длинный текст замка («Дети, деньги, переезд… Откроется с подпиской 💎») в узкий значок не влезает —
  // переносим его второй строкой в подпись, а в значке оставляем замок и 💎.
  const longLock = access.text.length > 24;
  const lockedSubtitle = longLock ? `${subtitle}
${access.text}` : subtitle;
  const lock = (
    <Badge tone={access.reason === "subscription" ? "premium" : "soon"} className="max-w-32 text-right">
      <Lock aria-hidden="true" size={12} className="shrink-0" /> {longLock ? (access.reason === "subscription" ? "💎" : "") : access.text}
    </Badge>
  );

  if (access.reason === "subscription") {
    return (
      <button
        type="button"
        className="diamond-glow group block rounded-card text-left"
        aria-label={`Уровень «${deck.title}» закрыт: ${access.text}`}
        onClick={() => {
          trackDeeperClick({ id: game.id, kind: "game", source });
          router.push("/deeper");
        }}
      >
        <Tile emoji={deck.emoji} title={deck.title} subtitle={lockedSubtitle} accent="none" size="md" badge={lock}
          className="whitespace-pre-line" />
      </button>
    );
  }

  // «Скоро» и «Откроется после …» — нажимать некуда, просто показываем замок.
  return (
    <div role="group" aria-label={`Уровень «${deck.title}» закрыт: ${access.text}`} aria-disabled="true">
      <Tile emoji={deck.emoji} title={deck.title} subtitle={lockedSubtitle} accent="none" size="md" badge={lock}
          className="whitespace-pre-line" dimmed />
    </div>
  );
}
