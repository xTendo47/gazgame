// Подпись «сколько игроков» для карточек игр: «2 ИГРОКА», «2–3 ИГРОКА», «3+ ИГРОКА», «5+ ИГРОКОВ» (как на картах в макете).
// Диапазон шире пяти — пишем «от N и больше» значком «+». Данные — players в файле игры (packages/content/data/games).

function noun(n: number): string {
  const last = n % 10;
  const tens = n % 100;
  if (last === 1 && tens !== 11) return "ИГРОК";
  if (last >= 2 && last <= 4 && (tens < 12 || tens > 14)) return "ИГРОКА";
  return "ИГРОКОВ";
}

export function playersLabel(players: { min: number; max: number }): string {
  const { min, max } = players;
  if (min === max) return `${min} ${noun(min)}`;
  if (max >= 6) return `${min}+ ${noun(min)}`;
  return `${min}–${max} ${noun(max)}`;
}
