// Механика "mafia": раздатчик ролей, выбывшие и автопобеда. Один телефон, имён нет.
// Состав: роли с плюсом/минусом, мирные (auto) — остаток. По умолчанию — из defaults по числу игроков БЕЗ ведущего.
import type { MafiaGame, MafiaRole } from "@gazgame/content";
import { shuffle, type RandomFn } from "../random";

/** Сколько каких ролей (кроме мирных и ведущего — они считаются отдельно). */
export type Lineup = Record<string, number>;

export function hostRole(game: MafiaGame): MafiaRole | undefined {
  return game.roles.find((r) => r.side === "host");
}

export function civilianRole(game: MafiaGame): MafiaRole {
  const role = game.roles.find((r) => r.auto);
  if (!role) throw new Error("У «Мафии» нет роли с auto: true");
  return role;
}

/** Роли, которые настраиваются плюсом и минусом. */
export function configurableRoles(game: MafiaGame): MafiaRole[] {
  return game.roles.filter((r) => !r.auto && r.side !== "host");
}

/** Состав по умолчанию для `playing` игроков без ведущего. Если такого числа нет в defaults — ближайший состав. */
export function defaultLineup(game: MafiaGame, playing: number): Lineup {
  const sorted = [...game.defaults].sort((a, b) => a.from - b.from);
  const range =
    sorted.find((d) => d.from <= playing && playing <= d.to) ??
    (playing < (sorted[0]?.from ?? 0) ? sorted[0] : sorted[sorted.length - 1]);
  return Object.fromEntries(configurableRoles(game).map((r) => [r.id, range?.roles[r.id] ?? 0]));
}

export type LineupProblem =
  /** Ролей больше, чем игроков: мирных получилось меньше 0. */
  | "too-many-roles"
  /** Мафии 0. */
  | "no-mafia"
  /** Мафии не меньше, чем остальных игроков без ведущего. */
  | "mafia-majority";

export interface LineupCheck {
  ok: boolean;
  problem?: LineupProblem;
  /** Сколько выходит мирных (может быть меньше 0 — тогда раздавать нельзя). */
  civilians: number;
  mafia: number;
  /** Все, кроме мафии и ведущего. */
  others: number;
}

/**
 * Можно ли раздавать.
 * @param total сколько всего игроков (вместе с ведущим, если он тянет карту)
 * @param host 0 — ведущего выбрали сами, 1 — его роль тоже раздаётся
 */
export function checkLineup(game: MafiaGame, total: number, host: number, lineup: Lineup): LineupCheck {
  const playing = total - host;
  const roles = configurableRoles(game);
  const assigned = roles.reduce((sum, r) => sum + (lineup[r.id] ?? 0), 0);
  const mafia = roles.filter((r) => r.side === "mafia").reduce((sum, r) => sum + (lineup[r.id] ?? 0), 0);
  const civilians = playing - assigned;
  const others = playing - mafia;
  const base = { civilians, mafia, others };
  if (civilians < 0) return { ok: false, problem: "too-many-roles", ...base };
  if (mafia === 0) return { ok: false, problem: "no-mafia", ...base };
  if (mafia >= others) return { ok: false, problem: "mafia-majority", ...base };
  return { ok: true, ...base };
}

/** Карты для раздачи по порядку: игрок 1, игрок 2, … (id ролей, перемешаны). */
export function dealRoles(game: MafiaGame, total: number, host: number, lineup: Lineup, random: RandomFn = Math.random): string[] {
  const check = checkLineup(game, total, host, lineup);
  if (!check.ok) throw new Error(`Состав не подходит: ${check.problem}`);
  const cards: string[] = [];
  for (const role of configurableRoles(game)) for (let i = 0; i < (lineup[role.id] ?? 0); i++) cards.push(role.id);
  for (let i = 0; i < check.civilians; i++) cards.push(civilianRole(game).id);
  const hostId = hostRole(game)?.id;
  if (host > 0 && hostId) cards.push(hostId);
  return shuffle(cards, random);
}

// ---------- Партия: кто выбыл и кто победил ----------

export interface MafiaMatch {
  /** Роль каждого игрока по порядку раздачи. */
  cards: string[];
  /** Выбывшие роли по порядку — для «Отменить последнее». */
  eliminated: string[];
}

export type Winner = "city" | "mafia";

export function createMatch(cards: string[]): MafiaMatch {
  return { cards, eliminated: [] };
}

/** Сколько осталось живых каждой роли (ведущий не в счёт). */
export function aliveByRole(game: MafiaGame, match: MafiaMatch): Record<string, number> {
  const hostId = hostRole(game)?.id;
  const alive: Record<string, number> = {};
  for (const id of match.cards) if (id !== hostId) alive[id] = (alive[id] ?? 0) + 1;
  for (const id of match.eliminated) alive[id] = (alive[id] ?? 0) - 1;
  return alive;
}

/** Живые мафия и город. Ведущий не считается, все роли кроме мафии — город. */
export function aliveSides(game: MafiaGame, match: MafiaMatch): { mafia: number; city: number } {
  const side = new Map(game.roles.map((r) => [r.id, r.side]));
  let mafia = 0;
  let city = 0;
  for (const [id, n] of Object.entries(aliveByRole(game, match))) {
    if (side.get(id) === "mafia") mafia += n;
    else city += n;
  }
  return { mafia, city };
}

/** Победитель или null, если игра идёт: мафий 0 → город; мафий не меньше остальных живых → мафия. */
export function winner(game: MafiaGame, match: MafiaMatch): Winner | null {
  const { mafia, city } = aliveSides(game, match);
  if (mafia === 0) return "city";
  if (mafia >= city) return "mafia";
  return null;
}

/** «Кто выбыл?»: убрать одного живого игрока с этой ролью. Ведущего и уже выбывших не убирает. */
export function eliminate(game: MafiaGame, match: MafiaMatch, roleId: string): MafiaMatch {
  if (winner(game, match)) return match;
  if ((aliveByRole(game, match)[roleId] ?? 0) <= 0) return match;
  return { ...match, eliminated: [...match.eliminated, roleId] };
}

export function undoElimination(match: MafiaMatch): MafiaMatch {
  return match.eliminated.length === 0 ? match : { ...match, eliminated: match.eliminated.slice(0, -1) };
}
