"use client";

// Вопрос $HOW: тема категории на фоне, таймер по кругу, вопрос и лестница уровней (у супер-квиза — лестница сумм),
// варианты A–D, подсказки (50:50, спроси зал, дай телефон другу, риск ×2), экран ответа с пояснением и итоги со счётом.
// Подсчёт и порядок — в движке (mechanics/quiz.ts); здесь только показ, таймер и звуки.
import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import type { QuizQuestion } from "@gazgame/content";
import {
  QUIZ_TIME,
  answerQuiz,
  answerText,
  isInputQuestion,
  quizTime,
  currentPlayer,
  currentQuestion,
  nextQuiz,
  pickRank,
  quizSummary,
  startQuiz,
  toggleRisk,
  fiftyFifty,
  takeHelp,
  type QuizMode,
  type QuizState,
} from "@gazgame/engine";
import { backTagClass } from "@gazgame/ui";
import { GIcon } from "@/components/casino/GIcon";
import { haptic } from "@/lib/haptics";
import { sfx } from "@/lib/sfx";
import { SHOW_CAM_L, SHOW_CAM_R, SHOW_CAT_GENERAL, SHOW_CAT_KINO, SHOW_CAT_MUSIC, SHOW_CAT_RIDDLE, SHOW_CAT_SUPER } from "./show-art";
import "./show.css";

const THEME_ART: Record<string, string> = { kino: SHOW_CAT_KINO, "rap-ru": SHOW_CAT_MUSIC, swag: SHOW_CAT_MUSIC, artist: SHOW_CAT_MUSIC, general: SHOW_CAT_GENERAL, riddle: SHOW_CAT_RIDDLE, super: SHOW_CAT_SUPER };
const LEVEL_COLORS = ["#ff4d4d", "#4de0ff", "#f2c94c"];

export interface QuizRoundConfig {
  /** Ключ темы (kino, rap-ru, swag, general, riddle, super) — для фона. */
  theme: string;
  title: string;
  mode: QuizMode;
  players: number;
  /** Имена игроков (режим «Компания»); нет — «Игрок 1…». */
  names?: string[];
  questions: QuizQuestion[];
  /** Лестница сумм супер-квиза (снизу вверх) и несгораемые ступени. */
  ladder?: string[];
  safe?: number[];
  /** Вопрос дня: одна ступень, итог записывается в серию. */
  daily?: boolean;
  /** Режим «знаешь ли ты артиста»: slug артиста (для «Ещё раз») и звания по проценту верных ответов. */
  artist?: { slug: string; ranks: { minPercent: number; title: string; text?: string; draft?: boolean }[] };
}

const MODE_NAMES: Record<QuizMode, string> = { solo: "Соло", duo: "Вдвоём", party: "Компания" };
const HELPS = [
  { id: "fifty", main: "50:50", sub: "убрать два" },
  { id: "hall", main: "спроси", sub: "зал" },
  { id: "friend", main: "дай телефон", sub: "другу" },
  { id: "risk", main: "риск ×2", sub: "верно: два очка" },
] as const;

export function QuizPlay({
  config,
  onExit,
  onFinish,
  onAgain,
}: {
  config: QuizRoundConfig;
  onExit: () => void;
  /** Раунд закончился: верно ли ответили на вопрос дня (для серии) — только у daily. */
  onFinish?: (state: QuizState) => void;
  onAgain: () => void;
}) {
  const [state, setState] = useState<QuizState>(() => startQuiz(config.questions, config.mode, config.players));
  const [left, setLeft] = useState(QUIZ_TIME);
  const [toast, setToast] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const leftRef = useRef(QUIZ_TIME);
  const inputRef = useRef<HTMLInputElement>(null);
  const finishedRef = useRef(false);

  const q = currentQuestion(state);
  const isInput = !!q && isInputQuestion(q);
  /** Сколько секунд на этот вопрос: у вопроса с вводом своё время (time), у остальных 15. */
  const total = q ? quizTime(q) : QUIZ_TIME;
  const player = currentPlayer(state);
  const nameOf = (i: number) => config.names?.[i] || `Игрок ${i + 1}`;
  const who = state.players > 1 ? nameOf(player) : null;

  const say = useCallback((text: string) => {
    setToast(text);
    window.setTimeout(() => setToast((t) => (t === text ? null : t)), 2400);
  }, []);

  const answer = useCallback((choice: number) => {
    setState((s) => {
      const next = answerQuiz(s, choice);
      if (next === s) return s;
      if (next.results[next.results.length - 1]) {
        sfx.right();
        haptic("yes");
      } else {
        sfx.wrong();
        haptic("no");
      }
      return next;
    });
  }, []);

  /** Ответ печатным текстом (вопрос с вводом): кнопка «Ответить» или Enter. */
  const submitText = useCallback((text: string) => {
    setState((s) => {
      const next = answerText(s, text);
      if (next === s) return s;
      if (next.results[next.results.length - 1]) {
        sfx.right();
        haptic("yes");
      } else {
        sfx.wrong();
        haptic("no");
      }
      return next;
    });
  }, []);

  // таймер: на экране вопроса тикает раз в секунду; последние пять — щелчки; ноль — «время вышло»
  useEffect(() => {
    if (state.phase !== "question") return;
    const current = state.questions[state.index];
    const seconds = current ? quizTime(current) : QUIZ_TIME;
    leftRef.current = seconds;
    const reset = window.setTimeout(() => {
      setLeft(seconds);
      setDraft("");
    }, 0);
    const timer = window.setInterval(() => {
      leftRef.current -= 1;
      setLeft(leftRef.current);
      if (leftRef.current <= 5 && leftRef.current > 0) {
        sfx.tick();
        haptic("hot");
      }
      if (leftRef.current <= 0) {
        window.clearInterval(timer);
        answer(-1);
      }
    }, 1000);
    return () => {
      window.clearTimeout(reset);
      window.clearInterval(timer);
    };
  }, [state.phase, state.index, state.questions, answer]);

  // экранная клавиатура: поле ввода и таймер должны оставаться на виду
  useEffect(() => {
    if (!isInput || state.phase !== "question") return;
    const vv = window.visualViewport;
    const keep = () => inputRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    vv?.addEventListener("resize", keep);
    return () => vv?.removeEventListener("resize", keep);
  }, [isInput, state.phase, state.index]);

  useEffect(() => {
    if (state.phase === "done" && !finishedRef.current) {
      finishedRef.current = true;
      onFinish?.(state);
    }
  }, [state, onFinish]);

  const summary = quizSummary(state);
  const ladder = config.ladder;
  const rungs = ladder ? ladder.map((sum, i) => ({ label: sum, n: i + 1 })) : state.questions.map((_, i) => ({ label: `${i + 1}`, n: i + 1 }));

  if (state.phase === "done") {
    return (
      <div className="sw-page sw-q" data-th={config.theme} data-done>
        <ThemeDeco theme={config.theme} />
        <div className="sw-inner">
          <button type="button" className={backTagClass()} onClick={onExit}>
            ← В студию
          </button>
          <div className="sw-res">
            <span className="sw-res-tag">
              {config.title} · {MODE_NAMES[config.mode]}
            </span>
            <GIcon name="trophy" size="2.6em" className="sw-res-trophy" />
            <b className="sw-score">
              {config.mode === "party" ? summary.correct : summary.total} / {summary.max}
            </b>
            <p className="sw-res-line">
              {summary.correct === summary.max ? "Чистая победа" : summary.correct === 0 ? "В следующий раз повезёт" : `Верных ответов: ${summary.correct} из ${summary.max}`}
            </p>
            {config.artist && (
              <div className="sw-rank">
                <span>{Math.round((summary.correct / Math.max(1, summary.max)) * 100)}% верных</span>
                {(() => {
                  const rank = pickRank(config.artist.ranks, Math.round((summary.correct / Math.max(1, summary.max)) * 100));
                  return rank ? (
                    <>
                      <b>{rank.title}</b>
                      {rank.text && <p>{rank.text}</p>}
                      {rank.draft && <small>заглушка: настоящие звания добавим позже</small>}
                    </>
                  ) : null;
                })()}
              </div>
            )}
            {config.mode !== "solo" && (
              <ul className="sw-players">
                {summary.scores.map((s, i) => (
                  <li key={i} data-win={summary.winners.includes(i) || undefined}>
                    <span>{nameOf(i)}</span>
                    <b>{s}</b>
                  </li>
                ))}
              </ul>
            )}
            {config.mode === "duo" && <p className="sw-res-line">Команда набрала {summary.total} из {summary.max}</p>}
            {config.mode === "party" && summary.winners.length > 0 && (
              <p className="sw-res-line">
                {summary.winners.length === 1 ? "Побеждает" : "Побеждают"}: {summary.winners.map((w) => nameOf(w)).join(", ")}
              </p>
            )}
            {config.ladder && <p className="sw-res-demo">Демо: {summary.max} вопросов из {config.ladder.length}. Полная лестница появится с настоящими вопросами</p>}
            {!config.ladder && !config.artist && <p className="sw-res-demo">Демо-раунд. Настоящие вопросы добавим позже</p>}
            <div className="sw-row">
              {!config.daily && (
                <button type="button" className="sw-btn" onClick={onAgain}>
                  Ещё раз
                </button>
              )}
              <button type="button" className="sw-btn sw-btn-alt" onClick={onExit}>
                В студию
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!q) return null;
  const answered = state.phase === "answer";
  const lowTime = left <= 5;
  const riskUsed = state.riskUsed[player];

  return (
    <div className="sw-page sw-q" data-th={config.theme}>
      <ThemeDeco theme={config.theme} />
      <div className="sw-inner">
        <button type="button" className={backTagClass()} onClick={onExit}>
          ← В студию
        </button>
        <div className="sw-qtop">
          <span className="sw-ctag">
            {config.daily ? "ВОПРОС ДНЯ" : `${config.title} · ${MODE_NAMES[config.mode]}`.toUpperCase()}
            {who && <small>{who}</small>}
          </span>
          <span className="sw-timer" data-low={lowTime || undefined} style={{ "--p": answered ? 0 : (left / total) * 100 } as CSSProperties} role="timer" aria-label={`Осталось ${left} с`}>
            <span>{answered ? "·" : left}</span>
          </span>
        </div>

        <div className="sw-qwrap">
          <div className="sw-qpanel" key={state.index}>
            <small>
              УРОВЕНЬ {q.level} · ВОПРОС {state.index + 1} ИЗ {state.questions.length}
              {q.draft ? " · ДЕМО" : ""}
            </small>
            <p>{q.text}</p>
          </div>
          <ol className="sw-ladder" aria-label="Ступени">
            {[...rungs].reverse().map((r) => {
              const i = r.n - 1;
              const cls = i === state.index ? "on" : i < state.index ? "done" : "";
              const isSafe = config.safe?.includes(r.n);
              return (
                <li key={r.n} data-s={cls || undefined} data-safe={isSafe || undefined}>
                  {ladder ? <em>{r.n}</em> : <i style={{ "--c": LEVEL_COLORS[((state.questions[i]?.level ?? 1) - 1) % 3] } as CSSProperties} />}
                  <span>{r.label}</span>
                </li>
              );
            })}
          </ol>
        </div>

        {q && isInputQuestion(q) ? (
          <form
            className="sw-input"
            data-st={answered ? (state.picked === 0 ? "ok" : "bad") : undefined}
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (!answered && draft.trim() !== "") {
                sfx.tap();
                submitText(draft);
              }
            }}
          >
            <label htmlFor="sw-answer" className="sw-input-label">
              Твой ответ
            </label>
            <input
              id="sw-answer"
              ref={inputRef}
              key={state.index}
              type="text"
              value={answered ? (state.typed ?? "") : draft}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={() => window.setTimeout(() => inputRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }), 250)}
              disabled={answered}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="sentences"
              spellCheck={false}
              enterKeyHint="send"
              placeholder="Напиши ответ"
              maxLength={60}
            />
            {!answered && (
              <button type="submit" className="sw-btn" disabled={draft.trim() === ""}>
                Ответить
              </button>
            )}
          </form>
        ) : (
          q && (
            <div className="sw-ans" role="group" aria-label="Варианты ответа">
              {q.options.map((opt, i) => {
                const gone = state.hidden.includes(i);
                const status = answered ? (i === q.correct ? "ok" : i === state.picked ? "bad" : undefined) : undefined;
                return (
                  <button
                    key={i}
                    type="button"
                    data-l={"ABCD"[i]}
                    data-st={status}
                    data-gone={gone || undefined}
                    disabled={answered || gone}
                    onClick={() => {
                      sfx.tap();
                      answer(i);
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )
        )}

        {answered ? (
          <div className="sw-explain" role="status">
            <b>{state.results[state.results.length - 1] ? "Верно!" : state.picked === -1 ? "Время вышло" : "Мимо"}</b>
            {isInputQuestion(q) ? (
              <>
                {!state.results[state.results.length - 1] && state.typed && <p>Твой ответ: {state.typed}</p>}
                <p>Правильный ответ: {q.answers[0]}</p>
              </>
            ) : (
              state.picked !== q.correct && <p>Верный ответ: {q.options[q.correct]}</p>
            )}
            {q.explain && <p className="sw-explain-t">{q.explain}</p>}
            {state.players > 1 && state.index + 1 < state.questions.length && <p className="sw-explain-pass">Передай телефон: следующий — {nameOf((state.index + 1) % state.players)}</p>}
            <button
              type="button"
              className="sw-btn"
              onClick={() => {
                sfx.flip();
                setState((s) => nextQuiz(s));
              }}
            >
              {state.index + 1 >= state.questions.length ? "К итогам" : "Дальше"}
            </button>
          </div>
        ) : (
          <div className="sw-help">
            {HELPS.map((h) => {
              const blocked = isInput && (h.id === "fifty" || h.id === "hall");
              const used = blocked || (h.id === "risk" ? !!riskUsed : state.helps[h.id]);
              const pressed = h.id === "risk" ? state.riskArmed : undefined;
              return (
                <button
                  key={h.id}
                  type="button"
                  data-used={used || undefined}
                  aria-pressed={pressed}
                  aria-label={blocked ? `${h.main} ${h.sub}: недоступно для вопроса с вводом` : undefined}
                  disabled={used}
                  onClick={() => {
                    sfx.tap();
                    if (h.id === "fifty") setState((s) => fiftyFifty(s));
                    else if (h.id === "hall") {
                      setState((s) => takeHelp(s, "hall"));
                      say("Все в комнате, голосуйте пальцами: A, B, C или D");
                    } else if (h.id === "friend") {
                      setState((s) => takeHelp(s, "friend"));
                      say("Передай телефон тому, кто знает лучше");
                    } else {
                      setState((s) => toggleRisk(s));
                      say(state.riskArmed ? "Риск снят" : "Риск: верно — два очка");
                    }
                  }}
                >
                  <HelpIcon id={h.id} />
                  <b>{h.main}</b>
                  <small>{h.sub}</small>
                </button>
              );
            })}
          </div>
        )}
        {toast && (
          <p className="sw-toast" role="status">
            {toast}
          </p>
        )}
      </div>
    </div>
  );
}

function HelpIcon({ id }: { id: (typeof HELPS)[number]["id"] }) {
  if (id === "fifty") return <span className="sw-hi sw-hi-text">½</span>;
  const name = id === "hall" ? "megaphone" : id === "friend" ? "phone" : "dice";
  return (
    <span className="sw-hi">
      <GIcon name={name} size="1.3em" />
    </span>
  );
}

/** Фон темы: рисунок категории затемнён, у супер-квиза — камеры и лучи. */
function ThemeDeco({ theme }: { theme: string }) {
  return (
    <div className="sw-deco" aria-hidden="true" data-th={theme}>
      <span className="sw-deco-art" dangerouslySetInnerHTML={{ __html: THEME_ART[theme] ?? "" }} />
      {theme === "super" && (
        <>
          <span className="sw-rays" />
          <span className="sw-cam sw-cam-l" dangerouslySetInnerHTML={{ __html: SHOW_CAM_L }} />
          <span className="sw-cam sw-cam-r" dangerouslySetInnerHTML={{ __html: SHOW_CAM_R }} />
        </>
      )}
    </div>
  );
}
