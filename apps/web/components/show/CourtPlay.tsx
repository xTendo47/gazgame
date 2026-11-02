"use client";

// «Суд присяжных» (макет $HOW, экран #court): дело, весы и два вердикта. Верного ответа нет: очко — за совпадение
// с мнением большинства. Проценты пока демо (в данных дела), позже — настоящие голоса.
import { useState } from "react";
import type { QuizCourt } from "@gazgame/content";
import { courtResult, type CourtVote } from "@gazgame/engine";
import { backTagClass } from "@gazgame/ui";
import { haptic } from "@/lib/haptics";
import { sfx } from "@/lib/sfx";
import { SHOW_CAT_COURT } from "./show-art";
import "./show.css";

export function CourtPlay({ court, onExit }: { court: QuizCourt; onExit: () => void }) {
  const [caseIndex, setCaseIndex] = useState(0);
  const [vote, setVote] = useState<CourtVote | null>(null);
  const item = court.cases[caseIndex % court.cases.length];
  if (!item) return null;
  const result = vote ? courtResult(item, vote) : null;
  // чаша «виновен» тяжелее, если за неё больше голосов
  const tilt = result ? ((result.guiltyPercent - 50) / 50) * 9 : 0;

  function decide(v: CourtVote) {
    if (vote) return;
    setVote(v);
    sfx.knock(0.8);
    window.setTimeout(() => sfx.knock(0.6), 180);
    haptic("win");
  }

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

        <div className="sw-case">
          <span className="sw-case-no">ДЕЛО № {String(caseIndex + 1).padStart(3, "0")}{item.draft ? " · ДЕМО" : ""}</span>
          <span className="sw-case-st" data-v={vote ?? undefined}>
            {vote ? (vote === "guilty" ? "ВИНОВЕН" : "ОПРАВДАН") : "РАССМОТРЕНИЕ"}
          </span>
          <h2>{item.title}</h2>
          <p>{item.text}</p>
        </div>

        <div className="sw-scale">
          <svg viewBox="0 0 360 150" aria-hidden="true">
            <path d="M180 30v100M120 130h120" stroke="#d4b062" strokeWidth="5" strokeLinecap="round" />
            <g className="sw-beam" style={{ transform: `rotate(${tilt}deg)` }}>
              <path d="M80 44h200" stroke="#d4b062" strokeWidth="4" strokeLinecap="round" />
              <g>
                <path d="M80 44l-26 46h52z" fill="none" stroke="#d4b062" strokeWidth="2" />
                <path d="M50 90a30 10 0 0060 0z" fill="#8a1f12" />
                <text x="80" y="122" textAnchor="middle" fontFamily="Manrope Variable, Arial" fontWeight="800" fontSize="12" fill="#f2dc9a">
                  {result ? `ВИНОВЕН ${result.guiltyPercent}%` : "ВИНОВЕН"}
                </text>
              </g>
              <g>
                <path d="M280 44l-26 46h52z" fill="none" stroke="#d4b062" strokeWidth="2" />
                <path d="M250 90a30 10 0 0060 0z" fill="#1f6b4a" />
                <text x="280" y="122" textAnchor="middle" fontFamily="Manrope Variable, Arial" fontWeight="800" fontSize="12" fill="#f2dc9a">
                  {result ? `ОПРАВДАН ${result.freePercent}%` : "ОПРАВДАН"}
                </text>
              </g>
            </g>
            <circle cx="180" cy="44" r="8" fill="#f2dc9a" />
          </svg>
        </div>

        {result ? (
          <div className="sw-explain" role="status">
            <b>{result.withMajority ? "Ты с большинством: +1 очко" : "Ты в меньшинстве: очка нет"}</b>
            <p className="sw-explain-t">Проценты демо: настоящие голоса появятся позже.</p>
            <div className="sw-row">
              {court.cases.length > 1 && (
                <button
                  type="button"
                  className="sw-btn"
                  onClick={() => {
                    setCaseIndex((i) => i + 1);
                    setVote(null);
                  }}
                >
                  Ещё дело
                </button>
              )}
              <button type="button" className="sw-btn sw-btn-alt" onClick={onExit}>
                В студию
              </button>
            </div>
          </div>
        ) : (
          <div className="sw-verd">
            <button type="button" data-v="g" onClick={() => decide("guilty")}>
              ВИНОВЕН
            </button>
            <button type="button" data-v="o" onClick={() => decide("free")}>
              ОПРАВДАН
            </button>
          </div>
        )}
        <p className="sw-pct">
          Правильного ответа нет. Очки за то, совпал ли ты с <b>мнением большинства</b>.
        </p>
      </div>
    </div>
  );
}
