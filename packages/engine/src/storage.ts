// Хранение прогресса.
// Экраны работают только с интерфейсом ProgressStore и не знают, где лежат данные.
// Сейчас — localStorage на устройстве; позже можно подставить хранилище на сервере (apps/api)
// без переписывания экранов.

/** Минимальное «хранилище ключ-значение». localStorage подходит под этот интерфейс. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface TestRecord {
  resultId: string;
  completedAt: string;
}

export interface GameRecord {
  playedCount: number;
  lastPlayedAt: string;
  /** Лучший результат (например, процент совпадения). */
  bestScore?: number;
}

export interface ProgressData {
  version: 1;
  tests: Record<string, TestRecord>;
  games: Record<string, GameRecord>;
}

export interface ProgressStore {
  load(): ProgressData;
  getTestResult(testId: string): TestRecord | null;
  saveTestResult(testId: string, resultId: string, now?: Date): void;
  recordGamePlayed(gameId: string, options?: { score?: number; now?: Date }): void;
  clear(): void;
}

export const PROGRESS_KEY = "gazgame:progress:v1";

const emptyProgress = (): ProgressData => ({ version: 1, tests: {}, games: {} });

/** Хранилище в памяти — для тестов и как запасной вариант (например, в режиме инкогнито). */
export function createMemoryKeyValueStore(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
}

export function createProgressStore(kv: KeyValueStore | null, key = PROGRESS_KEY): ProgressStore {
  const store = kv ?? createMemoryKeyValueStore();

  function load(): ProgressData {
    try {
      const raw = store.getItem(key);
      if (!raw) return emptyProgress();
      const data = JSON.parse(raw) as Partial<ProgressData>;
      if (data.version !== 1) return emptyProgress();
      return { version: 1, tests: data.tests ?? {}, games: data.games ?? {} };
    } catch {
      return emptyProgress();
    }
  }

  function save(data: ProgressData) {
    try {
      store.setItem(key, JSON.stringify(data));
    } catch {
      // Хранилище недоступно или переполнено — прогресс просто не сохранится.
    }
  }

  return {
    load,
    getTestResult: (testId) => load().tests[testId] ?? null,
    saveTestResult(testId, resultId, now = new Date()) {
      const data = load();
      data.tests[testId] = { resultId, completedAt: now.toISOString() };
      save(data);
    },
    recordGamePlayed(gameId, { score, now = new Date() } = {}) {
      const data = load();
      const prev = data.games[gameId];
      const best = [prev?.bestScore, score].filter((s): s is number => s !== undefined);
      data.games[gameId] = {
        playedCount: (prev?.playedCount ?? 0) + 1,
        lastPlayedAt: now.toISOString(),
        ...(best.length > 0 ? { bestScore: Math.max(...best) } : {}),
      };
      save(data);
    },
    clear() {
      try {
        store.removeItem(key);
      } catch {
        // ничего страшного
      }
    },
  };
}
