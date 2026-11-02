// $HOW: какие вопросы квиза уже показывали (по id), чтобы при повторном прохождении были новые.
// Лежит в localStorage; доступ запрещён (приватный режим) — просто каждый раз без памяти.
const KEY = "gazgame:quiz-seen";

export function readQuizSeen(): Set<string> {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
    const data = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(data) ? data.filter((x): x is string => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

export function writeQuizSeen(seen: ReadonlySet<string>): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...seen]));
  } catch {
    // сохранить не вышло — в этот раз без памяти
  }
}
