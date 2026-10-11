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
  /** Имена игроков по играм — чтобы при следующем заходе они уже были подставлены. */
  players?: Record<string, string[]>;
  /** Тексты карточек прошлой игры по ключу "<игра>/<колода>" — в новой игре сначала будут другие. */
  lastCards?: Record<string, string[]>;
  /** Колоды, которые доиграли до финала, по играм — для unlockAfter. */
  completedDecks?: Record<string, string[]>;
  /** Итог друга, который прислал ссылку, по тестам — для строки «Ты: … · Друг: …» и «ответки». */
  friendResults?: Record<string, FriendResult>;
  /** Выбранная версия теста («Кто проходит?»), по тестам. */
  audiences?: Record<string, string>;
  /** Premium включён кодом: хэш кода (не сам код) и когда. */
  premium?: { hash: string; activatedAt: string };
  /** Нажал «Хочу первым 🔔» в шторке оплаты — считаем один раз на устройство. */
  waitlist?: boolean;
  /** Нажал «Хочу первым 🔔» на экране Ultimate — тоже один раз на устройство. */
  ultimateWaitlist?: boolean;
  /** Уровни, чьё открытие уже показали подсветкой, по играм — подсвечиваем один раз. */
  unlocksSeen?: Record<string, string[]>;
}

export interface FriendResult {
  resultId: string;
  blendId?: string;
  receivedAt: string;
}

export interface ProgressStore {
  load(): ProgressData;
  getTestResult(testId: string): TestRecord | null;
  saveTestResult(testId: string, resultId: string, now?: Date): void;
  recordGamePlayed(gameId: string, options?: { score?: number; now?: Date }): void;
  getPlayers(gameId: string): string[] | null;
  savePlayers(gameId: string, names: readonly string[]): void;
  getLastCards(key: string): string[];
  saveLastCards(key: string, cardTexts: readonly string[]): void;
  getCompletedDecks(gameId: string): string[];
  getFriendResult(testId: string): FriendResult | null;
  getAudience(testId: string): string | null;
  saveAudience(testId: string, audienceId: string): void;
  saveFriendResult(testId: string, result: { resultId: string; blendId?: string }, now?: Date): void;
  markDeckCompleted(gameId: string, deckId: string): void;
  isPremium(): boolean;
  /** Включить Premium по хэшу верного кода. */
  activatePremium(hash: string, now?: Date): void;
  /** Отметить «Хочу первым»: true — впервые на этом устройстве (тогда шлём событие). */
  joinWaitlist(): boolean;
  hasJoinedWaitlist(): boolean;
  /** «Хочу первым» в Ultimate: true — впервые на этом устройстве (тогда шлём событие). */
  joinUltimateWaitlist(): boolean;
  hasJoinedUltimateWaitlist(): boolean;
  /** Подсветку «уровень открылся» уже показывали? */
  isUnlockSeen(gameId: string, deckId: string): boolean;
  markUnlockSeen(gameId: string, deckId: string): void;
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
      return {
        version: 1,
        tests: data.tests ?? {},
        games: data.games ?? {},
        ...(data.players ? { players: data.players } : {}),
        ...(data.lastCards ? { lastCards: data.lastCards } : {}),
        ...(data.completedDecks ? { completedDecks: data.completedDecks } : {}),
        ...(data.friendResults ? { friendResults: data.friendResults } : {}),
        ...(data.audiences ? { audiences: data.audiences } : {}),
        ...(data.premium ? { premium: data.premium } : {}),
        ...(data.waitlist ? { waitlist: true } : {}),
        ...(data.ultimateWaitlist ? { ultimateWaitlist: true } : {}),
        ...(data.unlocksSeen ? { unlocksSeen: data.unlocksSeen } : {}),
      };
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
    getPlayers: (gameId) => load().players?.[gameId] ?? null,
    savePlayers(gameId, names) {
      const data = load();
      data.players = { ...data.players, [gameId]: [...names] };
      save(data);
    },
    getLastCards: (key) => load().lastCards?.[key] ?? [],
    saveLastCards(key, cardTexts) {
      const data = load();
      data.lastCards = { ...data.lastCards, [key]: [...cardTexts] };
      save(data);
    },
    getCompletedDecks: (gameId) => load().completedDecks?.[gameId] ?? [],
    markDeckCompleted(gameId, deckId) {
      const data = load();
      const done = data.completedDecks?.[gameId] ?? [];
      if (done.includes(deckId)) return;
      data.completedDecks = { ...data.completedDecks, [gameId]: [...done, deckId] };
      save(data);
    },
    getFriendResult: (testId) => load().friendResults?.[testId] ?? null,
    saveFriendResult(testId, { resultId, blendId }, now = new Date()) {
      const data = load();
      const record: FriendResult = { resultId, receivedAt: now.toISOString(), ...(blendId ? { blendId } : {}) };
      data.friendResults = { ...data.friendResults, [testId]: record };
      save(data);
    },
    getAudience: (testId) => load().audiences?.[testId] ?? null,
    saveAudience(testId, audienceId) {
      const data = load();
      data.audiences = { ...data.audiences, [testId]: audienceId };
      save(data);
    },
    isPremium: () => load().premium !== undefined,
    activatePremium(hash, now = new Date()) {
      const data = load();
      data.premium = { hash, activatedAt: now.toISOString() };
      save(data);
    },
    joinWaitlist() {
      const data = load();
      if (data.waitlist) return false;
      data.waitlist = true;
      save(data);
      return true;
    },
    hasJoinedWaitlist: () => load().waitlist === true,
    joinUltimateWaitlist() {
      const data = load();
      if (data.ultimateWaitlist) return false;
      data.ultimateWaitlist = true;
      save(data);
      return true;
    },
    hasJoinedUltimateWaitlist: () => load().ultimateWaitlist === true,
    isUnlockSeen: (gameId, deckId) => load().unlocksSeen?.[gameId]?.includes(deckId) ?? false,
    markUnlockSeen(gameId, deckId) {
      const data = load();
      const seen = data.unlocksSeen?.[gameId] ?? [];
      if (seen.includes(deckId)) return;
      data.unlocksSeen = { ...data.unlocksSeen, [gameId]: [...seen, deckId] };
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
