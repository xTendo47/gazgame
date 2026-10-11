// Пункты «Что ты получишь» с подстановками. {weakestScale} — название самой слабой шкалы;
// нет значения — пункт с подстановкой не показываем (как предложение в UpsellText).
import { fillPlaceholders } from "@gazgame/engine";

export function upsellItems(items: readonly string[], weakestScale?: string): string[] {
  return items.map((item) => fillPlaceholders(item, { weakestScale })).filter(Boolean);
}
