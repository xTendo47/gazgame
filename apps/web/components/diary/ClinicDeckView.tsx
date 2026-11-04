"use client";

// Кармашек «Психо» (эталон 10_psiho.png): бирюзовая клеточка кабинета, планшет «Карта пациента», название с цветным сдвигом
// и «выписные эпикризы» по два в ряд: шапка «КЛИНИКА GAZ · ВЫПИСНОЙ ЭПИКРИЗ», строки Ф.И.О. и формы, печать «ВРАЧ GAZ»,
// значок теста в уголках-рамке, «ЖАЛОБЫ», зигзаг, «ДИАГНОЗ» (название теста), «назн.: тест · 4 мин» и подпись-закорючка.
// Всё SVG и CSS. Логика — в SectionScreen: сюда приходит готовый список и обработчики.
import type { CSSProperties } from "react";
import { BackTag } from "@gazgame/ui";
import { DiaryIcon } from "./DiaryIcons";
import { RandomButton } from "@/components/casino/CasinoDeckView";
import { sfx } from "@/lib/sfx";
import { useCardAnim } from "@/lib/card-anim";
import type { DiaryEntry } from "./DiaryDeckView";
import "@/components/casino/casino-deck.css";
import "./diary.css";
import "./diary-deck.css";
import "./clinic.css";

const TILTS = [-1.2, 0.9, 1.1, -0.8, -0.6, 1.2];

function Stamp() {
  return (
    <svg className="cl-stamp" viewBox="-30 -30 60 60" aria-hidden="true">
      <circle r="26" fill="none" stroke="#5a64c8" strokeWidth="2.200" opacity=".75" />
      <circle r="21" fill="none" stroke="#5a64c8" strokeWidth=".8" opacity=".6" />
      <g transform="rotate(-18)" fill="#5a64c8" opacity=".85" fontFamily="IBM Plex Mono, monospace" fontWeight="700" textAnchor="middle">
        <text y="-2" fontSize="8.500">ВРАЧ</text>
        <text y="8" fontSize="8.500">GAZ</text>
      </g>
    </svg>
  );
}

function Squiggle() {
  return (
    <svg className="cl-sign" viewBox="0 0 70 18" aria-hidden="true">
      <path d="M2 12c4-9 8-9 10-2s5 6 8-2 6-6 8 2 5 5 8-1 6-4 8 2 5 4 8-1" fill="none" stroke="#3a4ab8" strokeWidth="1.600" strokeLinecap="round" />
      <path d="M2 16h60" stroke="#3a4ab8" strokeWidth=".8" opacity=".6" />
    </svg>
  );
}

/** Планшет «Карта пациента» в левом верхнем углу. */
function Clipboard() {
  return (
    <svg className="cl-board" viewBox="0 0 150 190" aria-hidden="true">
      <rect x="6" y="14" width="124" height="168" rx="6" fill="#a8743a" />
      <rect x="14" y="26" width="108" height="150" fill="#fbfdfd" />
      <rect x="40" y="6" width="58" height="22" rx="5" fill="#9aa1ad" />
      <rect x="52" y="2" width="34" height="12" rx="4" fill="#c9ced6" />
      <text x="22" y="46" fontFamily="IBM Plex Mono, monospace" fontWeight="700" fontSize="8.500" fill="#37506a">
        КАРТА ПАЦИЕНТА
      </text>
      <g fill="none" stroke="#3a4ab8" strokeWidth="1.300" strokeLinecap="round">
        <path d="M22 62c10-6 18 4 28-2s14 2 22-2" />
        <path d="M22 76c12-4 20 4 30-2" />
      </g>
      <g stroke="#9ab" strokeWidth=".8">
        <path d="M22 92h92M22 106h92M22 120h92M22 134h60" />
      </g>
      <g transform="rotate(-14 62 150)">
        <rect x="26" y="140" width="64" height="20" rx="3" fill="none" stroke="#d04a4a" strokeWidth="1.600" />
        <text x="58" y="154" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontWeight="700" fontSize="11" fill="#d04a4a">
          НОРМА
        </text>
      </g>
    </svg>
  );
}

/** Таблетки и пузырёк справа у названия. */
function Pills() {
  return (
    <svg className="cl-pills" viewBox="0 0 100 80" aria-hidden="true">
      <rect x="44" y="6" width="38" height="62" rx="6" fill="#b87a30" />
      <rect x="44" y="6" width="38" height="14" rx="4" fill="#e9eef2" />
      <rect x="50" y="30" width="26" height="24" fill="#f6f1e2" />
      <g transform="rotate(-24 22 56)">
        <rect x="6" y="48" width="34" height="14" rx="7" fill="#fff" />
        <path d="M23 48h11a7 7 0 0 1 0 14H23z" fill="#3a8ad8" />
      </g>
    </svg>
  );
}

export function ClinicDeckView({
  title,
  entries,
  onBack,
  onPick,
  onRandom,
}: {
  title: string;
  entries: DiaryEntry[];
  onBack: () => void;
  onPick: (index: number) => void;
  onRandom: ((chosen?: number) => void) | null;
}) {
  const [animRef, anim] = useCardAnim("solo");
  return (
    <div className="dr-page cl-page" ref={animRef}>
      <div className="dr-scroll">
        <div className="dr-inner cl-inner">
          <Clipboard />
          <Pills />
          <div className="dd-top">
            <BackTag
              onClick={() => {
                sfx.page();
                onBack();
              }}
            >
              ← К колодам
            </BackTag>
            {onRandom && <RandomButton onClick={() => anim.roll((i) => onRandom(i))} />}
          </div>
          <h1 className="cl-title" data-text={title}>
            {title}
          </h1>
          <ul className="cl-grid">
            {entries.map((e, n) => {
              const style = { "--cl-tilt": `${TILTS[n % TILTS.length]}deg` } as CSSProperties;
              return (
                <li key={`${e.title}-${e.index}`} style={style}>
                  <button
                    type="button"
                    className="cl-slip"
                    data-card=""
                    data-card-index={e.index}
                    data-soon={e.soon || undefined}
                    data-locked={e.locked || undefined}
                    aria-label={`${e.title}${e.soon ? ", скоро" : ""}${e.locked ? ", закрыто: нужен Premium" : ""}`}
                    onClick={(ev) => anim.open(ev.currentTarget, () => onPick(e.index))}
                  >
                    <span className="cl-head">КЛИНИКА GAZ · ВЫПИСНОЙ ЭПИКРИЗ</span>
                    <span className="cl-line">Ф.И.О.: ТЫ · ВОЗРАСТ: ВНУТРЕННИЙ</span>
                    <span className="cl-line cl-dot">ФОРМА № 027/У · ОТД. САМОПОЗНАНИЯ</span>
                    <Stamp />
                    <span className="cl-photo">
                      <i className="cl-c1" />
                      <i className="cl-c2" />
                      <i className="cl-c3" />
                      <i className="cl-c4" />
                      <DiaryIcon kind="clinic" emoji={e.emoji} label={e.title} />
                    </span>
                    <span className="cl-complaint">ЖАЛОБЫ: ХОЧУ ПОНЯТЬ СЕБЯ</span>
                    <span className="cl-zig" aria-hidden="true" />
                    <span className="cl-dx">ДИАГНОЗ:</span>
                    <b className="cl-name">{e.title}</b>
                    <span className="cl-rx">{e.soon ? "назн.: скоро" : e.locked ? "назн.: Premium" : `назн.: ${e.meta ?? "тест"}`}</span>
                    <Squiggle />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
