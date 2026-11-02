"use client";

// «Суд присяжных» ($HOW): подсудимый и откуда он, обвинение, «Слово обвинению», «Слово защите», потом голосование «Виновен / Оправдан».
// Верного ответа нет: очко получает тот, чей голос совпал с большинством присяжных. Вдвоём и в компании присяжные голосуют по очереди
// (телефон передаётся), соло большинства нет. Дела берутся случайно, показанные запоминаются (как вопросы), счёт идёт по делам подряд.
import { useState } from "react";
import type { QuizCourt } from "@gazgame/content";
import { courtVerdict, nextCourtSeen, pickCourtCase, type CourtCase, type CourtVote } from "@gazgame/engine";
import { backTagClass } from "@gazgame/ui";
import { haptic } from "@/lib/haptics";
import { readQuizSeen, writeQuizSeen } from "@/lib/quiz-seen";
import { sfx } from "@/lib/sfx";
import { SHOW_CAT_COURT } from "./show-art";
import "./show.css";

type Step = "charge" | "prosecution" | "defense" | "vote" | "pass" | "result" | "final";

export function CourtPlay({ court, players, names, onExit }: { court: QuizCourt; players: number; names?: string[]; onExit: () => void }) {
  const nameOf = (i: number) => names?.[i] || `Игрок ${i + 1}`;
  const group = players > 1;

  /** Выбрать следующее дело и запомнить его как показанное. */
  const draw = (): CourtCase => {
    const seen = readQuizSeen();
    const picked = pickCourtCase(court.cases, seen) as CourtCase;
    writeQuizSeen(nextCourtSeen(court.cases, picked, seen));
    return picked;
  };

  const [item, setItem] = useState<CourtCase>(() => draw());
  const [round, setRound] = useState(1);
  /** Сколько дел доведено до решения (для итогов). */
  const [played, setPlayed] = useState(0);
  const [step, setStep] = useState<Step>("charge");
  const [votes, setVotes] = useState<CourtVote[]>([]);
  const [scores, setScores] = useState<number[]>(() => Array.from({ length: players }, () => 0));

  const verdict = step === "result" ? courtVerdict(votes, item.guiltyPercent) : null;
  const voter = votes.length;
  // чаша «виновен» тяжелее, если за неё больше голосов
  const tilt = verdict ? (verdict.guilty + verdict.free === 0 ? 0 : ((verdict.guilty - verdict.free) / (verdict.guilty + verdict.free)) * 9) : 0;

  function vote(v: CourtVote) {
    const next = [...votes, v];
    setVotes(next);
    sfx.knock(0.7);
    haptic("tick");
    if (next.length < players) {
      setStep("pass");
      return;
    }
    const done = courtVerdict(next, item.guiltyPercent);
    setScores((s) => s.map((x, i) => x + (done.matched[i] ? 1 : 0)));
    setPlayed((n) => n + 1);
    setStep("result");
    sfx.knock(0.8);
    window.setTimeout(() => sfx.knock(0.6), 180);
    haptic("win");
  }

  function nextCase() {
    sfx.page();
    setItem(draw());
    setRound((r) => r + 1);
    setVotes([]);
    setStep("charge");
  }

  const top = Math.max(...scores);
  const winners = group && top > 0 ? scores.flatMap((s, i) => (s === top ? [i] : [])) : [];

  return (
    <div className="sw-page sw-court">
      <div className="sw-deco" aria-hidden="true" data-th="court">
        <span className="sw-deco-art" dangerouslySetInnerHTML={{ __html: SHOW_CAT_COURT }} />
      </div>
      <div className="sw-inner">
        <button type="button" className={backTagClass()} onClick={onExit}>
          ← В студию
        </button>
        <h1 className="sw-court-sign">
          СУД ПРИСЯЖНЫХ
          <small>GAZGAME ШОУ · РАУНД</small>
        </h1>

        {step === "final" ? (
          <div className="sw-res">
            <span className="sw-res-tag">Суд присяжных</span>
            <b className="sw-score">{played}</b>
            <p className="sw-res-line">дел рассмотрено</p>
            {group ? (
              <>
                <ul className="sw-players">
                  {scores.map((s, i) => (
                    <li key={i} data-win={winners.includes(i) || undefined}>
                      <span>{nameOf(i)}</span>
                      <b>{s}</b>
                    </li>
                  ))}
                </ul>
                <p className="sw-res-line">{winners.length === 0 ? "Присяжные ни разу не совпали с большинством" : `${winners.length === 1 ? "Лучшее чутьё" : "Лучшее чутьё у"}: ${winners.map(nameOf).join(", ")}`}</p>
              </>
            ) : (
              <p className="sw-res-demo">Соло большинства нет: очки считаются, когда присяжных двое и больше.</p>
            )}
            <div className="sw-row">
              <button
                type="button"
                className="sw-btn"
                onClick={() => {
                  setScores(Array.from({ length: players }, () => 0));
                  setPlayed(0);
                  setRound(0);
                  nextCase();
                }}
              >
                Ещё суд
              </button>
              <button type="button" className="sw-btn sw-btn-alt" onClick={onExit}>
                В студию
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="sw-case">
              <span className="sw-case-no">
                ДЕЛО № {String(round).padStart(3, "0")}
                {item.draft ? " · ДЕМО" : ""}
              </span>
              <span className="sw-case-st" data-v={verdict && (verdict.majority === "guilty" || verdict.majority === "free") ? verdict.majority : undefined}>
                {verdict ? (verdict.majority === "guilty" ? "ВИНОВЕН" : verdict.majority === "free" ? "ОПРАВДАН" : verdict.majority === "tie" ? "ПОРОВНУ" : "ГОЛОС ПРИНЯТ") : "РАССМОТРЕНИЕ"}
              </span>
              <h2>{item.defendant}</h2>
              <p className="sw-case-src">из {item.source}</p>
              <p>
                <b>Обвинение:</b> {item.charge}
              </p>
            </div>

            {(step === "prosecution" || step === "defense" || step === "vote" || step === "pass" || step === "result") && (
              <div className="sw-speech" data-side="pro">
                <small>СЛОВО ОБВИНЕНИЮ</small>
                <p>{item.prosecution}</p>
              </div>
            )}
            {(step === "defense" || step === "vote" || step === "pass" || step === "result") && (
              <div className="sw-speech" data-side="def">
                <small>СЛОВО ЗАЩИТЕ</small>
                <p>{item.defense}</p>
              </div>
            )}

            {step === "charge" && (
              <button type="button" className="sw-btn sw-court-btn" onClick={() => setStep("prosecution")}>
                Слово обвинению
              </button>
            )}
            {step === "prosecution" && (
              <button type="button" className="sw-btn sw-court-btn" onClick={() => setStep("defense")}>
                Слово защите
              </button>
            )}
            {step === "defense" && (
              <button type="button" className="sw-btn sw-court-btn" onClick={() => setStep("vote")}>
                К голосованию
              </button>
            )}

            {step === "pass" && (
              <div className="sw-explain" role="status">
                <b>Голос принят</b>
                <p>Передай телефон: следующий присяжный — {nameOf(voter)}</p>
                <button type="button" className="sw-btn" onClick={() => setStep("vote")}>
                  {nameOf(voter)}, я готов
                </button>
              </div>
            )}

            {step === "vote" && (
              <>
                {group && <p className="sw-voter">Голосует: {nameOf(voter)}</p>}
                <div className="sw-verd">
                  <button type="button" data-v="g" onClick={() => vote("guilty")}>
                    ВИНОВЕН
                  </button>
                  <button type="button" data-v="o" onClick={() => vote("free")}>
                    ОПРАВДАН
                  </button>
                </div>
              </>
            )}

            {step === "result" && verdict && (
              <>
                <div className="sw-scale">
                  <svg viewBox="0 0 360 150" aria-hidden="true">
                    <path d="M180 30v100M120 130h120" stroke="#d4b062" strokeWidth="5" strokeLinecap="round" />
                    <g className="sw-beam" style={{ transform: `rotate(${tilt}deg)` }}>
                      <path d="M80 44h200" stroke="#d4b062" strokeWidth="4" strokeLinecap="round" />
                      <g>
                        <path d="M80 44l-26 46h52z" fill="none" stroke="#d4b062" strokeWidth="2" />
                        <path d="M50 90a30 10 0 0060 0z" fill="#8a1f12" />
                        <text x="80" y="122" textAnchor="middle" fontFamily="Manrope Variable, Arial" fontWeight="800" fontSize="12" fill="#f2dc9a">
                          {group ? `ВИНОВЕН ${verdict.guilty}` : "ВИНОВЕН"}
                        </text>
                      </g>
                      <g>
                        <path d="M280 44l-26 46h52z" fill="none" stroke="#d4b062" strokeWidth="2" />
                        <path d="M250 90a30 10 0 0060 0z" fill="#1f6b4a" />
                        <text x="280" y="122" textAnchor="middle" fontFamily="Manrope Variable, Arial" fontWeight="800" fontSize="12" fill="#f2dc9a">
                          {group ? `ОПРАВДАН ${verdict.free}` : "ОПРАВДАН"}
                        </text>
                      </g>
                    </g>
                    <circle cx="180" cy="44" r="8" fill="#f2dc9a" />
                  </svg>
                </div>
                <div className="sw-explain" role="status">
                  <b>
                    {verdict.majority === "guilty" ? "Присяжные: виновен" : verdict.majority === "free" ? "Присяжные: оправдан" : verdict.majority === "tie" ? "Голоса поровну: ничья, очков нет" : "Твой голос принят"}
                  </b>
                  {verdict.majority === "none" && <p>Соло большинства нет. Сыграйте вдвоём или в компании: очко получает тот, кто совпал с большинством.</p>}
                  {group && (verdict.majority === "guilty" || verdict.majority === "free") && (
                    <p className="sw-explain-t">
                      {verdict.matched.some(Boolean) ? `Очко: ${verdict.matched.flatMap((m, i) => (m ? [nameOf(i)] : [])).join(", ")}` : "Очков нет"}
                    </p>
                  )}
                  {group && (
                    <ul className="sw-players">
                      {scores.map((s, i) => (
                        <li key={i} data-win={verdict.matched[i] || undefined}>
                          <span>{nameOf(i)}</span>
                          <b>{s}</b>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="sw-row">
                    <button type="button" className="sw-btn" onClick={nextCase}>
                      Следующее дело
                    </button>
                    <button type="button" className="sw-btn sw-btn-alt" onClick={() => setStep("final")}>
                      Закончить
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
        <p className="sw-pct">
          Правильного ответа нет. Очки за то, совпал ли ты с <b>мнением большинства</b>.
        </p>
      </div>
    </div>
  );
}
