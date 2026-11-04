"use client";

// Экраны «Объясни 🪧», где не нужен таймер: настройки, правила, таблица очков. Вид — по макету explain.
import type { ExplainGame as ExplainGameData } from "@gazgame/content";
import {
  EXPLAIN_GOALS,
  EXPLAIN_MAX_TEAMS,
  EXPLAIN_MIN_TEAMS,
  EXPLAIN_TIMES,
  modeAllowed,
  randomTeamName,
  type ExplainSettings,
} from "@gazgame/engine";
import { cn } from "@gazgame/ui";
import { haptic } from "@/lib/haptics";
import { GIcon, Glyph } from "@/components/casino/GIcon";

/** Цвета команд по очереди. */
export const TEAM_COLORS = ["#E8483A", "#F6E3A1", "#62D2FF", "#4FD08A"] as const;

export const BIG_BUTTON =
  "gaz-press min-h-14 w-full rounded-2xl bg-orange px-2.5 py-[15px] text-center font-display text-base font-extrabold text-bg shadow-[0_8px_24px_rgb(255_90_31/0.25)]";
export const GHOST_BUTTON = "cg-ghost gaz-press min-h-12 w-full rounded-2xl border border-line bg-[#2A2531] px-2.5 py-[15px] text-center text-sm font-extrabold";

const label = "text-[10px] font-bold tracking-[0.14em] text-muted uppercase";

/** Переключатель из нескольких вариантов в одной плашке. */
export function Seg<T extends string | number>({
  name,
  value,
  options,
  onPick,
}: {
  name: string;
  value: T;
  options: readonly { value: T; label: string; premium?: boolean; /** Неактивна: подпись «Только словами». */ disabled?: boolean }[];
  onPick: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={name} className="grid auto-cols-fr grid-flow-col gap-1.5 rounded-2xl border border-line bg-surface p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={value === o.value}
          disabled={o.disabled}
          onClick={() => onPick(o.value)}
          className={cn(
            "min-h-11 rounded-xl px-1 py-2.5 text-[13.5px] font-bold transition-colors motion-reduce:transition-none",
            value === o.value ? "bg-[#2A2531] text-cream shadow-[inset_0_0_0_1.5px_#FF5A1F]" : o.premium ? "text-[#62D2FF]" : "text-muted",
            o.disabled && "opacity-45",
          )}
        >
          {o.label}
          {o.disabled && <small className="block text-[10px] leading-tight font-semibold">Только словами</small>}
        </button>
      ))}
    </div>
  );
}

export function Field({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className={label}>{name}</span>
      {children}
    </div>
  );
}

/** Настройки перед игрой: режим, уровень, команды, таймер, цель, штраф. */
export function Setup({
  game,
  settings,
  premium,
  hardMessage,
  onChange,
  onHardTap,
  onStart,
}: {
  game: ExplainGameData;
  settings: ExplainSettings;
  premium: boolean;
  /** «Тяжёлый уровень скоро в Premium 💎» после тапа по замку. */
  hardMessage: string;
  onChange: (patch: Partial<ExplainSettings>) => void;
  onHardTap: () => void;
  onStart: () => void;
}) {
  const { teams } = settings;
  const currentLevel = game.levels.find((l) => l.id === settings.levelId) ?? game.levels[0]!;
  const setTeam = (i: number, name: string) => onChange({ teams: teams.map((t, k) => (k === i ? name : t)) });

  return (
    <section className="today-pop flex flex-col gap-4" aria-label="Настройки игры">
      <Field name="Режим">
        <Seg
          name="Режим"
          value={settings.mode}
          options={[
            { value: "words", label: "Словами" },
            // На Тяжёлом 💎 «Жестами» нет колоды: кнопка неактивна с подписью «Только словами»
            { value: "gestures", label: "Жестами", disabled: !modeAllowed(currentLevel, "gestures") },
          ]}
          onPick={(mode) => onChange({ mode })}
        />
      </Field>

      <Field name="Уровень">
        <Seg
          name="Уровень"
          value={settings.levelId}
          // В режиме «Жестами» уровень без колоды (Тяжёлый 💎) неактивен с подписью «Только словами»
          options={game.levels.map((l) => ({
            value: l.id,
            label: l.tier === "premium" ? `${l.title} ◆` : l.title,
            premium: l.tier === "premium",
            disabled: settings.mode === "gestures" && !modeAllowed(l, "gestures"),
          }))}
          onPick={(id) => {
            const level = game.levels.find((l) => l.id === id);
            // Premium-уровень без подписки: замок, тап считается интересом
            if (level?.tier === "premium" && !premium) onHardTap();
            else onChange({ levelId: id });
          }}
        />
        {hardMessage && (
          <p role="status" className="rounded-[14px] border border-[#62D2FF]/40 bg-[#62D2FF]/10 px-3 py-2.5 text-[13px] font-bold text-[#62D2FF]">
            {hardMessage}
          </p>
        )}
      </Field>

      <Field name="Команды">
        <div className="flex flex-col gap-1.5">
          {teams.map((name, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ background: TEAM_COLORS[i] }} />
              <input
                value={name}
                maxLength={16}
                aria-label={`Команда ${i + 1}`}
                onChange={(e) => setTeam(i, e.target.value)}
                className="min-h-11 min-w-0 flex-1 rounded-[14px] border border-line bg-surface px-3.5 py-2.5 font-display text-sm font-semibold"
              />
              <button
                type="button"
                aria-label={`Случайное имя для команды ${i + 1}`}
                onClick={() => {
                  haptic("click");
                  setTeam(i, randomTeamName(game.teamNames, teams));
                }}
                className="grid size-11 shrink-0 place-items-center rounded-[14px] border border-line bg-surface text-lg"
              >
                <GIcon name="dice" />
              </button>
              {teams.length > EXPLAIN_MIN_TEAMS && (
                <button
                  type="button"
                  aria-label={`Убрать команду ${i + 1}`}
                  onClick={() => onChange({ teams: teams.filter((_, k) => k !== i) })}
                  className="grid size-11 shrink-0 place-items-center rounded-[14px] border border-line bg-surface text-lg"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {teams.length < EXPLAIN_MAX_TEAMS && (
            <button
              type="button"
              onClick={() => onChange({ teams: [...teams, randomTeamName(game.teamNames, teams)] })}
              className="min-h-11 rounded-[14px] border border-dashed border-line p-2.5 text-[13px] font-bold text-muted"
            >
              + Ещё команда
            </button>
          )}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field name="Таймер">
          <Seg name="Таймер, секунд" value={settings.time} options={EXPLAIN_TIMES.map((t) => ({ value: t, label: String(t) }))} onPick={(time) => onChange({ time })} />
        </Field>
        <Field name="Игра до">
          <Seg
            name="Игра до, очков"
            value={settings.goal}
            options={EXPLAIN_GOALS.map((g) => ({ value: g, label: g === 0 ? "∞" : String(g) }))}
            onPick={(goal) => onChange({ goal })}
          />
        </Field>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3">
        <span>
          <b className="block text-[15px]">Штраф за пропуск</b>
          <small className="block text-xs text-muted">Свайп влево отнимает очко</small>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={settings.penalty}
          aria-label="Штраф за пропуск"
          onClick={() => onChange({ penalty: !settings.penalty })}
          className={cn(
            "relative h-7 w-12 shrink-0 rounded-full transition-colors motion-reduce:transition-none",
            "after:absolute after:top-[3px] after:left-[3px] after:size-[22px] after:rounded-full after:bg-cream after:transition-transform motion-reduce:after:transition-none",
            settings.penalty ? "bg-orange after:translate-x-5" : "bg-line",
          )}
        />
      </div>

      <button type="button" onClick={onStart} className={BIG_BUTTON}>
        Погнали <GIcon name="fire" />
      </button>
      <p className="text-center text-xs text-muted">От 4 человек · 2–4 команды</p>
    </section>
  );
}

/** Правила одним экраном: словами или жестами; строка про свайп зависит от штрафа. */
export function Rules({ settings, onNext }: { settings: ExplainSettings; onNext: () => void }) {
  const words = settings.mode === "words";
  const rules: { emoji: string; title: string; text: string }[] = words
    ? [
        { emoji: "🪧", title: "Объясняй слово другими словами", text: "Замок: «то, что вешают на дверь, чтобы никто не вошёл»" },
        { emoji: "🚫", title: "Нельзя", text: "Однокоренные, по буквам, на другом языке, жесты" },
        { emoji: "🔥", title: "Успей больше", text: `${settings.time} секунд на ход, потом телефон следующей команде` },
      ]
    : [
        { emoji: "🤭", title: "Показывай слово только жестами", text: "Как в Крокодиле: руками, телом, мимикой" },
        { emoji: "🚫", title: "Нельзя", text: "Звуки и слова губами" },
        { emoji: "🔥", title: "Успей больше", text: `${settings.time} секунд на ход, потом телефон следующей команде` },
      ];
  return (
    <section className="today-pop flex flex-col gap-4" aria-labelledby="explain-rules">
      <h2 id="explain-rules" className="font-display text-lg leading-tight font-semibold text-balance">
        {words ? "Объясняем словами" : "Показываем жестами"}
      </h2>
      <ul className="flex flex-col gap-2">
        {rules.map((r) => (
          <li key={r.title} className="flex items-start gap-3 rounded-[18px] border border-line bg-surface px-3.5 py-3">
            <span aria-hidden="true" className="text-2xl leading-[1.1]">
              <Glyph emoji={r.emoji} />
            </span>
            <span>
              <b className="block font-display text-sm leading-[1.25] font-semibold">{r.title}</b>
              <small className="mt-0.5 block text-[13px] text-muted">{r.text}</small>
            </span>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-2 gap-2">
        <p className="rounded-[18px] border border-orange/40 bg-orange/10 px-2.5 py-3.5 text-center text-[13px] font-bold text-orange">
          <b className="block font-display text-[22px] font-extrabold">{settings.penalty ? "← −1" : "← 0"}</b>
          {settings.penalty ? "Влево: пропуск, −1" : "Влево: пропуск, без минуса"}
        </p>
        <p className="rounded-[18px] border border-lime/40 bg-lime/[0.08] px-2.5 py-3.5 text-center text-[13px] font-bold text-lime">
          <b className="block font-display text-[22px] font-extrabold">+1 →</b>
          Вправо: угадали, +1
        </p>
      </div>
      <button type="button" onClick={onNext} className={BIG_BUTTON}>
        Понятно, к игре
      </button>
    </section>
  );
}

/** Таблица очков с полосками до цели. now — подсветить ходящую команду. */
export function ScoreTable({
  teams,
  scores,
  goal,
  now,
  label = "Счёт",
}: {
  teams: readonly string[];
  scores: readonly number[];
  goal: number;
  now?: number;
  label?: string;
}) {
  const target = goal || Math.max(30, ...scores);
  return (
    <ul aria-label={label} className="flex flex-col gap-2 rounded-[20px] border border-line bg-surface p-3.5">
      {teams.map((name, i) => (
        <li key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1">
          <b className="truncate font-display text-sm font-semibold">
            {name}
            {i === now && <span className="text-[11px] font-bold text-orange"> · ходит</span>}
          </b>
          <span className="font-display text-base font-extrabold tabular-nums">{scores[i]}</span>
          <span aria-hidden="true" className="col-span-full h-1.5 overflow-hidden rounded-full bg-[#2A2531]">
            <i
              className="today-smooth block h-full rounded-full transition-[width] duration-500"
              style={{ width: `${Math.min(100, ((scores[i] ?? 0) / target) * 100)}%`, background: TEAM_COLORS[i % TEAM_COLORS.length] }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}
