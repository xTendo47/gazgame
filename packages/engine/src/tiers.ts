// Уровни глубины: free («Поверхность») → premium.
// Одна подписка (premium) открывает глубину во всех разделах.
import { TIERS, type Deck, type Tier } from "@gazgame/content";

export const TIER_LABELS: Record<Tier, string> = {
  free: "Поверхность",
  premium: "Premium",
};

/** Уровень пользователя, пока нет оплаты и профилей. Позже будет приходить с сервера (apps/api). */
export const DEFAULT_USER_TIER: Tier = "free";

/** Есть ли у пользователя с уровнем `user` доступ к контенту уровня `required`. */
export function hasAccess(user: Tier, required: Tier): boolean {
  return TIERS.indexOf(user) >= TIERS.indexOf(required);
}

export type DeckAccess =
  | { open: true }
  /** soon — «скоро», subscription — по подписке, after — откроется после другой колоды (unlockAfter). */
  | { open: false; reason: "soon" | "subscription" | "after"; text: string };

export interface DeckAccessOptions {
  userTier?: Tier;
  /** id колод этой игры, которые уже доиграли до финала (с устройства). */
  completedDecks?: readonly string[];
  /** Все колоды игры — чтобы назвать колоду из unlockAfter по имени. */
  decks?: readonly Deck[];
}

/**
 * Можно ли играть колодой. Закрыта, если:
 * в файле есть locked (замок «по подписке» подписчику не мешает); уровень колоды выше подписки пользователя;
 * есть unlockAfter, а ту колоду ещё не доиграли.
 */
export function deckAccess(
  deck: Deck,
  { userTier = DEFAULT_USER_TIER, completedDecks = [], decks = [] }: DeckAccessOptions = {},
): DeckAccess {
  const subscriber = hasAccess(userTier, "premium");
  if (deck.locked && !(deck.locked.reason === "subscription" && subscriber)) {
    return { open: false, reason: deck.locked.reason, text: deck.locked.text };
  }
  // Замок снят, а карточек ещё нет (колоду только готовим) — не открываем пустую игру
  if (deck.locked && deck.cards.length === 0) return { open: false, reason: "soon", text: "Скоро" };
  if (!hasAccess(userTier, deck.tier)) return { open: false, reason: "subscription", text: `${TIER_LABELS[deck.tier]} 💎` };
  // Уровни по очереди: второй закрыт, пока первый не доведён до итогов. С Premium все уровни открыты сразу.
  if (deck.unlockAfter && !subscriber && !completedDecks.includes(deck.unlockAfter)) {
    const before = decks.find((d) => d.id === deck.unlockAfter);
    const name = before ? `${before.title} ${before.emoji}` : deck.unlockAfter;
    return { open: false, reason: "after", text: `Сначала пройдите ${name}` };
  }
  return { open: true };
}
