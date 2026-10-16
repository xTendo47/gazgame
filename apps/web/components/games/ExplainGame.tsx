"use client";

// «Объясни 🪧» (mechanic: explain), наш Alias + Крокодил. Один телефон, 2–4 команды.
// Настройки → правила → ход команды → игра (таймер, свайпы) → «Последнее слово» → итог раунда (тап по слову исправляет)
// → следующая команда … → победа после полного круга (ничья — ещё круг) → «Реванш 🔥».
// Логика — packages/engine/src/mechanics/explain.ts, слова и имена команд — data/games/explain.json.
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ExplainGame as ExplainGameData } from "@gazgame/content";
import {
  answerWord,
  beginTurn,
  chooseLastWinner,
  defaultExplainSettings,
  endExplain,
  finishRound,
  rematchExplain,
  roundEndsGame,
  roundPoints,
  scoresAfterRound,
  startExplain,
  timeUp,
  toggleWord,
  type ExplainSettings,
  type ExplainState,
} from "@gazgame/engine";
import { cn } from "@gazgame/ui";
import {
  trackDeeperClick,
  trackExplainFinish,
  trackExplainHardClick,
  trackExplainRoundEnd,
  trackExplainStart,
} from "@/lib/analytics";
import { prefersReducedMotion } from "@/lib/gaz";
import { haptic } from "@/lib/haptics";
import { usePremium } from "@/lib/premium";
import { getProgress } from "@/lib/progress";
import { PlayScreen } from "./explain/PlayScreen";
import { BIG_BUTTON, GHOST_BUTTON, Rules, ScoreTable, Setup, TEAM_COLORS } from "./explain/parts";

type Stage = "setup" | "rules" | "game";

/** Показанные слова хранятся на устройстве по уровню: пока колода уровня не кончится, повторов нет. */
const usedKey = (gameId: string, levelId: string) => `${gameId}/${levelId}`;

export function ExplainGame({ game, related }: { game: ExplainGameData; related?: ReactNode }) {
  const premium = usePremium();
  const [stage, setStage] = useState<Stage>("setup");
  const [settings, setSettings] = useState<ExplainSettings>(() =>
    defaultExplainSettings(game.levels[0]?.id ?? "", game.teamNames),
  );
  const [state, setState] = useState<ExplainState | null>(null);
  const [hardMessage, setHardMessage] = useState("");
  const [left, setLeft] = useState(0);
  const [sound, setSound] = useState(false);
  const endAt = useRef(0);
  const lastLeft = useRef(0);

  const level = game.levels.find((l) => l.id === (state?.settings.levelId ?? settings.levelId)) ?? game.levels[0];
  const words = level?.words ?? [];
  const phase = state?.phase;

  // Показанные слова — на устройство (по уровню), чтобы следующая игра не повторяла их
  const used = state?.used;
  const usedLevel = state?.settings.levelId;
  useEffect(() => {
    if (used && usedLevel) getProgress().saveLastCards(usedKey(game.id, usedLevel), used);
  }, [used, usedLevel, game.id]);

  // Каждый новый экран — с самого верха
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [stage, phase]);

  // Таймер хода: по меткам времени, а не по числу тиков (фон и «заснувший» телефон не ломают отсчёт)
  useEffect(() => {
    if (phase !== "play") return;
    const id = window.setInterval(() => {
      const next = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      if (next !== lastLeft.current) {
        lastLeft.current = next;
        setLeft(next);
        if (next > 0 && next <= 5) haptic("hot");
      }
      if (next <= 0) {
        window.clearInterval(id);
        haptic("timeUp");
        setState((s) => (s ? timeUp(s) : s));
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [phase]);

  function patch(next: Partial<ExplainSettings>) {
    setSettings((s) => ({ ...s, ...next }));
    if (next.levelId) setHardMessage("");
  }

  /** Тап по закрытому «Тяжёлому 💎»: считаем интерес, тот же сигнал, что у остальных платных уровней. */
  function hardTap() {
    haptic("double");
    trackExplainHardClick();
    trackDeeperClick({ id: game.id, kind: "game", source: "locked-deck" });
    setHardMessage("Тяжёлый уровень скоро в Premium 💎");
  }

  function toRules() {
    // пустое имя команды заменяем «Команда N»
    const teams = settings.teams.map((t, i) => t.trim() || `Команда ${i + 1}`);
    const final = { ...settings, teams };
    setSettings(final);
    setState(startExplain(final, getProgress().getLastCards(usedKey(game.id, final.levelId))));
    trackExplainStart({ mode: final.mode, level: final.levelId, teams: teams.length, time: final.time, goal: final.goal, penalty: final.penalty });
    setStage("rules");
  }

  function startTurn() {
    if (!state) return;
    endAt.current = Date.now() + state.settings.time * 1000;
    lastLeft.current = state.settings.time;
    setLeft(state.settings.time);
    setState(beginTurn(state, words));
  }

  /** Победа (или итог раунда): события и вибро. */
  function settle(before: ExplainState, after: ExplainState) {
    trackExplainRoundEnd({
      level: before.settings.levelId,
      guessed: before.round.filter((w) => w.ok).length,
      skipped: before.round.filter((w) => !w.ok).length,
    });
    if (after.phase === "win") {
      haptic("win");
      getProgress().recordGamePlayed(game.id);
      trackExplainFinish({ mode: after.settings.mode, level: after.settings.levelId, teams: after.settings.teams.length, rounds: after.rounds });
    }
  }

  function nextTeam() {
    if (!state) return;
    const after = finishRound(state);
    settle(state, after);
    setState(after);
  }

  /** «Закончить» в игре без лимита. */
  function finishGame() {
    if (!state) return;
    const after = endExplain(state);
    if (after.phase === "win") {
      haptic("win");
      getProgress().recordGamePlayed(game.id);
      trackExplainFinish({ mode: after.settings.mode, level: after.settings.levelId, teams: after.settings.teams.length, rounds: after.rounds });
    }
    setState(after);
  }

  if (stage === "setup" || !state) {
    return (
      <Setup game={game} settings={settings} premium={premium} hardMessage={hardMessage} onChange={patch} onHardTap={hardTap} onStart={toRules} />
    );
  }
  if (stage === "rules") return <Rules settings={state.settings} onNext={() => setStage("game")} />;

  const { settings: s } = state;
  const team = s.teams[state.cur] ?? "";
  const nextName = s.teams[(state.cur + 1) % s.teams.length] ?? "";

  if (state.phase === "turn") {
    return (
      <section className="today-pop flex flex-col gap-4" aria-label="Ход команды">
        <div className="flex flex-col gap-2 rounded-3xl border-[1.5px] border-orange/50 bg-[linear-gradient(160deg,#2A1F22,#1B1822)] px-[18px] py-[22px] text-center shadow-[0_0_30px_rgb(255_90_31/0.15)]">
          <span className="text-[10px] font-bold tracking-[0.14em] text-muted uppercase">Ход команды</span>
          <h2 className="font-display text-[30px] leading-[1.1] font-extrabold [overflow-wrap:anywhere]">{team}</h2>
          <p className="text-sm text-muted">
            {s.mode === "words"
              ? "Объясняет один, остальные угадывают. Экран видит только объясняющий"
              : "Показывает один, остальные угадывают. Экран видит только показывающий"}
          </p>
        </div>
        {state.tie && (
          <p role="status" className="today-pop rounded-[14px] border border-orange/50 bg-orange/10 px-3 py-2.5 text-sm font-bold text-orange">
            Ничья! Ещё круг 🔥
          </p>
        )}
        <ScoreTable teams={s.teams} scores={state.scores} goal={s.goal} now={state.cur} />
        <button type="button" onClick={startTurn} className={BIG_BUTTON}>
          Старт ⏱
        </button>
        {s.goal === 0 && state.cur === 0 && state.rounds > 0 && (
          <button type="button" onClick={finishGame} className={GHOST_BUTTON}>
            Закончить
          </button>
        )}
      </section>
    );
  }

  if (state.phase === "play") {
    return (
      <PlayScreen
        state={state}
        levelTitle={level?.title ?? ""}
        left={left}
        sound={sound}
        onToggleSound={() => setSound((v) => !v)}
        onAnswer={(ok) => setState((cur) => (cur ? answerWord(cur, ok, words) : cur))}
      />
    );
  }

  if (state.phase === "last") {
    return (
      <section className="today-pop flex flex-col gap-4" aria-labelledby="explain-last">
        <h2 id="explain-last" className="font-display text-lg leading-tight font-semibold text-balance">
          Время! Последнее слово
        </h2>
        <div className="flex flex-col gap-1.5 rounded-3xl border-[1.5px] border-[#FFC83A] bg-surface px-4 py-[22px] text-center shadow-[0_0_30px_rgb(255_200_58/0.18)]">
          <span className="text-[10px] font-bold tracking-[0.14em] text-muted uppercase">угадать может любая команда</span>
          <b className="font-display text-[30px] leading-[1.1] font-extrabold [overflow-wrap:anywhere]">{state.word}</b>
        </div>
        <span className="text-[10px] font-bold tracking-[0.14em] text-muted uppercase">Кто угадал?</span>
        <div className="flex flex-col gap-2">
          {s.teams.map((name, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setState(chooseLastWinner(state, i))}
              className="gaz-press flex min-h-14 items-center gap-2.5 rounded-2xl border border-line bg-surface px-3.5 py-3.5 text-left font-display text-[15px] font-semibold"
            >
              <span aria-hidden="true" className="size-3 rounded-full" style={{ background: TEAM_COLORS[i] }} />
              <span className="min-w-0 [overflow-wrap:anywhere]">{name}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setState(chooseLastWinner(state, null))}
            className="gaz-press min-h-14 rounded-2xl border border-line bg-surface px-3.5 py-3.5 text-left font-display text-[15px] font-semibold"
          >
            Никто
          </button>
        </div>
      </section>
    );
  }

  if (state.phase === "round") {
    const pts = roundPoints(state);
    const unit = s.penalty ? "✗ −1" : "✗ 0";
    return (
      <section className="today-pop flex flex-col gap-4" aria-labelledby="explain-round">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="explain-round" className="font-display text-lg leading-tight font-semibold text-balance">
            Раунд команды {team}
          </h2>
          <b className="font-display text-[34px] font-extrabold tabular-nums" aria-label={`Очков за раунд: ${pts}`}>
            {pts > 0 ? "+" : ""}
            {pts}
          </b>
        </div>
        <p className="text-xs text-muted">Свайпнули не туда? Нажми на слово</p>
        <ul className="flex max-h-[340px] flex-col gap-1.5 overflow-auto pr-0.5">
          {state.round.length === 0 && <li className="text-xs text-muted">В этом раунде не было свайпов</li>}
          {state.round.map((w, i) => (
            <li key={i}>
              <button
                type="button"
                aria-pressed={w.ok}
                aria-label={`${w.word}: ${w.ok ? "угадали" : "пропуск"}. Нажми, чтобы изменить`}
                onClick={() => {
                  haptic("tick");
                  setState(toggleWord(state, i));
                }}
                className="flex min-h-12 w-full items-center justify-between gap-2.5 rounded-[14px] border border-line bg-surface px-3.5 py-2.5 text-left text-sm font-semibold"
              >
                <span className={cn("min-w-0 [overflow-wrap:anywhere]", !w.ok && "text-muted line-through")}>{w.word}</span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-[3px] font-display text-[13px] font-extrabold",
                    w.ok ? "bg-lime/[0.12] text-lime" : "bg-orange/[0.12] text-orange",
                  )}
                >
                  {w.ok ? "✓ +1" : unit}
                </span>
              </button>
            </li>
          ))}
          <li className="flex min-h-12 items-center justify-between gap-2.5 rounded-[14px] border border-[#FFC83A]/50 bg-surface px-3.5 py-2.5 text-sm font-semibold">
            <span className="min-w-0 [overflow-wrap:anywhere]">Последнее слово: {state.word}</span>
            <span className="shrink-0 font-display text-[13px] font-extrabold text-[#FFC83A]">
              {typeof state.lastBy === "number" ? `${s.teams[state.lastBy]} +1` : "никто"}
            </span>
          </li>
        </ul>
        <ScoreTable teams={s.teams} scores={scoresAfterRound(state)} goal={s.goal} label="Счёт после раунда" />
        <button type="button" onClick={nextTeam} className={BIG_BUTTON}>
          {roundEndsGame(state) ? "Итоги 👑" : `Ход команды ${nextName}`}
        </button>
      </section>
    );
  }

  // победа
  const winner = state.winner ?? 0;
  return (
    <section className="today-pop flex flex-col gap-4" aria-label="Победа">
      <div className="flex flex-col items-center gap-2 rounded-[28px] border-[1.5px] border-[#FFC83A] bg-[radial-gradient(120%_90%_at_50%_0%,rgb(255_200_58/0.22),transparent_60%),#221E27] px-[18px] py-[26px] text-center">
        <span aria-hidden="true" className="explain-bob text-[54px] leading-none">
          👑
        </span>
        <span className="text-[10px] font-bold tracking-[0.14em] text-muted uppercase">Победа</span>
        <h2 className="font-display text-[30px] leading-[1.1] font-extrabold [overflow-wrap:anywhere]">{s.teams[winner]}</h2>
        <p className="text-xs text-muted">{s.goal > 0 ? `первыми набрали ${s.goal}` : "победа по очкам"}</p>
      </div>
      <ScoreTable teams={s.teams} scores={state.scores} goal={s.goal} label="Итоговый счёт" />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setState(null);
            setStage("setup");
          }}
          className={GHOST_BUTTON}
        >
          Другие настройки
        </button>
        <button type="button" onClick={() => setState(rematchExplain(state))} className={BIG_BUTTON}>
          Реванш 🔥
        </button>
      </div>
      {related}
    </section>
  );
}
