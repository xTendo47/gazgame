// Уровни глубины: free («Поверхность») → premium → supreme.
// Одна подписка открывает глубину во всех разделах.
import { TIERS, type Tier } from "@gazgame/content";

export const TIER_LABELS: Record<Tier, string> = {
  free: "Поверхность",
  premium: "Premium",
  supreme: "Supreme",
};

/** Уровень пользователя, пока нет оплаты и профилей. Позже будет приходить с сервера (apps/api). */
export const DEFAULT_USER_TIER: Tier = "free";

/** Есть ли у пользователя с уровнем `user` доступ к контенту уровня `required`. */
export function hasAccess(user: Tier, required: Tier): boolean {
  return TIERS.indexOf(user) >= TIERS.indexOf(required);
}
