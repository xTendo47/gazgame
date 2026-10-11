// Формат кодов Premium 💎 — общий для скрипта npm run premium:codes и проверки на устройстве.
// Сами коды в git не попадают: в data/premium-codes.json лежит только SHA-256 (см. packages/engine/src/premium.ts).

/** Буквы и цифры кодов без похожих: нет 0/O и 1/I. */
export const PREMIUM_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** Код вида GAZ-7K2M. */
export function generatePremiumCode(random: () => number = Math.random): string {
  let tail = "";
  for (let i = 0; i < 4; i++) tail += PREMIUM_CODE_ALPHABET[Math.floor(random() * PREMIUM_CODE_ALPHABET.length)];
  return `GAZ-${tail}`;
}

/** Как сравниваем код: без пробелов, большими буквами («gaz - 7k2m» → «GAZ-7K2M»). */
export function normalizePremiumCode(code: string): string {
  return code.replace(/\s+/g, "").toUpperCase();
}
