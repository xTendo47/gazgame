"use client";

// Экран раздела $HOW (эталон 12_show.png): студия с камерами и лучами, вывеска «$HOW» в лампочках, билеты режимов
// (Соло / Вдвоём / Компания), «Вопрос дня», карточки категорий, «Загадки» и «Супер-квиз». Дальше — вопрос или суд.
// Всё SVG и CSS, без картинок и эмодзи. Что открывает карточка — решает ShowScreen.
import Link from "next/link";
import type { CSSProperties } from "react";
import type { QuizCategory, QuizCourt, QuizQuestion, QuizSuper } from "@gazgame/content";
import { QUIZ_PARTY_MAX, QUIZ_PARTY_MIN, dailyAnswered, pluralDays, showStreak, type QuizMode, type ShowData } from "@gazgame/engine";
import { backTagClass } from "@gazgame/ui";
import { GIcon } from "@/components/casino/GIcon";
import { sfx } from "@/lib/sfx";
import { useCardAnim } from "@/lib/card-anim";
import {
  SHOW_BILL,
  SHOW_BULBS_SIGN,
  SHOW_CAM_L,
  SHOW_CAM_R,
  SHOW_CAR,
  SHOW_CAT_COURT,
  SHOW_CAT_GENERAL,
  SHOW_CAT_KINO,
  SHOW_CAT_MUSIC,
  SHOW_CAT_RIDDLE,
  SHOW_CAT_SUPER,
  SHOW_YACHT,
} from "./show-art";
import "./show.css";

const ART: Record<string, string> = { kino: SHOW_CAT_KINO, "ruhiphop": SHOW_CAT_MUSIC, swag: SHOW_CAT_MUSIC, artist: SHOW_CAT_MUSIC, general: SHOW_CAT_GENERAL, riddle: SHOW_CAT_RIDDLE, court: SHOW_CAT_COURT, super: SHOW_CAT_SUPER };

export const MODES: { id: QuizMode; label: string; admit: string; no: string }[] = [
  { id: "solo", label: "Соло", admit: "ADMIT ONE", no: "№ 001" },
  { id: "duo", label: "Вдвоём", admit: "ADMIT TWO", no: "№ 002" },
  { id: "party", label: "Компания", admit: "ADMIT ALL", no: "№ 003" },
];

const MODE_HINT: Record<QuizMode, string> = {
  solo: "Один на один с вопросами",
  duo: "Вдвоём вы команда против вопросов: отвечаете по очереди",
  party: "Телефон по кругу: «спроси зал» голосует вся комната",
};

function Art({ html, className }: { html: string; className?: string }) {
  return <span className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Микрофон для «Вопроса дня». */
function MicArt() {
  return (
    <svg className="sw-mic" viewBox="0 0 40 60" aria-hidden="true">
      <rect x="12" y="2" width="16" height="26" rx="8" fill="#2a2e3a" stroke="#6b7280" strokeWidth="1.600" />
      <path d="M13 10h14M13 15h14M13 20h14" stroke="#8b94a8" strokeWidth="1" />
      <path d="M6 22a14 14 0 0 0 28 0M20 36v12M10 50h20" fill="none" stroke="#9aa3b5" strokeWidth="2.600" strokeLinecap="round" />
      <rect x="12" y="26" width="16" height="4" fill="#f2c94c" />
    </svg>
  );
}

export function ShowHub({
  categories,
  court,
  sup,
  mode,
  party,
  onMode,
  onParty,
  daily,
  show,
  now,
  onDaily,
  onCategory,
  onSuper,
  onCourt,
  onArtists,
}: {
  categories: QuizCategory[];
  court?: QuizCourt;
  sup?: QuizSuper;
  mode: QuizMode;
  party: number;
  onMode: (mode: QuizMode) => void;
  onParty: (n: number) => void;
  daily?: QuizQuestion;
  show: ShowData;
  now: Date;
  onDaily: () => void;
  onCategory: (id: string) => void;
  onSuper: () => void;
  onCourt: () => void;
  /** Режим «Насколько хорошо ты знаешь исполнителя?»: список артистов; нет артистов — карточки нет. */
  onArtists?: () => void;
}) {
  // карточки категорий раздаются и поднимаются так же, как карты в других разделах
  const [animRef, anim] = useCardAnim("show");
  // порядок карточек как в эталоне: Кино, Русский хип-хоп, Общее, Западный swag (Загадки — отдельной широкой карточкой)
  const ORDER = ["kino", "ruhiphop", "general", "swag"];
  const main = ORDER.flatMap((id) => categories.filter((c) => c.id === id));
  const riddle = categories.find((c) => c.id === "riddle");
  const answered = dailyAnswered(show, now);
  const streak = Math.max(1, showStreak(show, now));
  const cards = [
    ...main.map((c) => ({ id: c.id, title: c.title, sub: c.subtitle, go: () => onCategory(c.id) })),
    ...(court ? [{ id: "court", title: court.title, sub: court.subtitle, go: onCourt }] : []),
  ];

  return (
    <div className="sw-page sw-hub" ref={animRef}>
      <div className="sw-studio" aria-hidden="true">
        <span className="sw-rays" />
        <Art html={SHOW_CAM_L} className="sw-cam sw-cam-l" />
        <Art html={SHOW_CAM_R} className="sw-cam sw-cam-r" />
        <Art html={SHOW_CAR} className="sw-prize sw-car" />
        <Art html={SHOW_YACHT} className="sw-prize sw-yacht" />
        {[12, 38, 66, 84].map((x) => (
          <Art key={x} html={SHOW_BILL} className="sw-bill" />
        ))}
        <span className="sw-floor" />
      </div>
      <div className="sw-inner">
        <div className="sw-top">
          <Link href="/open" className={backTagClass()} onClick={() => sfx.page()}>
            ← В коробку
          </Link>
          <span className="sw-applause" aria-hidden="true">
            APPLAUSE
          </span>
        </div>

        <h1 className="sw-sign">
          <span className="sw-gz">GAZ GAME</span>
          <span className="sw-marquee">
            <svg viewBox="0 0 220 86" aria-hidden="true" dangerouslySetInnerHTML={{ __html: SHOW_BULBS_SIGN }} />
            <b>$HOW</b>
          </span>
        </h1>

        <div className="sw-modes" role="group" aria-label="Режим">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className="sw-ticket"
              data-m={m.id}
              aria-pressed={mode === m.id}
              onClick={() => {
                sfx.tap();
                onMode(m.id);
              }}
            >
              <span className="sw-admit">{m.admit}</span>
              <b>{m.label}</b>
              <span className="sw-no">{m.no}</span>
            </button>
          ))}
        </div>
        <p className="sw-hint" aria-live="polite">
          {MODE_HINT[mode]}
        </p>
        {mode === "party" && (
          <div className="sw-party" role="group" aria-label="Сколько игроков">
            <button type="button" onClick={() => onParty(party - 1)} disabled={party <= QUIZ_PARTY_MIN} aria-label="Меньше игроков">
              −
            </button>
            <span>
              Игроков: <b>{party}</b>
            </span>
            <button type="button" onClick={() => onParty(party + 1)} disabled={party >= QUIZ_PARTY_MAX} aria-label="Больше игроков">
              +
            </button>
          </div>
        )}

        {daily && (
          <button type="button" className="sw-daily" onClick={onDaily} data-answered={answered || undefined}>
            <span className="sw-live">
              <i>
                <b />
                LIVE
              </i>
              <span>
                ВОПРОС ДНЯ · <GIcon name="fire" size="1.1em" /> {streak} {pluralDays(streak).toUpperCase()}
              </span>
            </span>
            <span className="sw-daily-body">
              <span className="sw-daily-q">Один вопрос для всех. Ответь, пока не сгорело</span>
              <MicArt />
            </span>
            <span className="sw-daily-foot">
              <span>{answered ? <>Сегодня: <b>{show.lastCorrect ? "верно" : "мимо"}</b></> : <>Ответили верно: <b>— %</b></>}</span>
              <span>обновится в 00:00</span>
            </span>
            <span className="sw-daily-bar" aria-hidden="true" />
          </button>
        )}

        <div className="sw-cats">
          {cards.map((c) => (
            <button
              key={c.id}
              type="button"
              className={c.id === "court" ? "sw-cat sw-wide" : "sw-cat"}
              data-c={c.id}
              data-card=""
              onClick={(e) => anim.open(e.currentTarget, c.go)}
            >
              <Art html={ART[c.id] ?? ""} className="sw-cat-art" />
              <span className="sw-cat-t">
                <b>{c.title}</b>
                <small>{c.sub}</small>
              </span>
            </button>
          ))}
          {riddle && (
            <button
              type="button"
              className="sw-cat sw-wide"
              data-c="riddle"
              data-card=""
              onClick={(e) => anim.open(e.currentTarget, () => onCategory("riddle"))}
            >
              <Art html={ART.riddle ?? ""} className="sw-cat-art" />
              <span className="sw-cat-t">
                <b>{riddle.title}</b>
                <small>{riddle.subtitle}</small>
              </span>
            </button>
          )}
        </div>

        {onArtists && (
          <button
            type="button"
            className="sw-cat sw-wide"
            data-c="artist"
            data-card=""
            onClick={(e) => anim.open(e.currentTarget, onArtists)}
          >
            <Art html={ART.artist ?? ""} className="sw-cat-art" />
            <span className="sw-cat-t">
              <b>Знаешь артиста?</b>
              <small>15 вопросов про одного · 5 + 5 + 5</small>
            </span>
          </button>
        )}

        {sup && (
          <button
            type="button"
            className="sw-super"
            onClick={() => {
              sfx.page();
              onSuper();
            }}
          >
            <Art html={ART.super ?? ""} className="sw-cat-art" />
            <span className="sw-cat-t">
              <b>{sup.title}</b>
              <small>{sup.subtitle}</small>
              <em>{sup.prize}</em>
            </span>
          </button>
        )}

        <p className="sw-demo" style={{ "--n": 0 } as CSSProperties}>
          База раздела. Вопросы пока демо, настоящие добавим позже.
        </p>
      </div>
    </div>
  );
}
