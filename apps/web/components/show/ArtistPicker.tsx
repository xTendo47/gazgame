"use client";

// Режим «Насколько хорошо ты знаешь исполнителя?»: выбор артиста из списка. Дальше — 15 вопросов только про него
// (5 лёгких → 5 средних → 5 сложных), в конце счёт и звание по проценту верных. Оформление — как весь раздел $HOW.
import type { QuizArtist } from "@gazgame/content";
import { ARTIST_PER_LEVEL, type QuizMode } from "@gazgame/engine";
import { backTagClass } from "@gazgame/ui";
import { sfx } from "@/lib/sfx";
import "./show.css";

const MODE_NAMES: Record<QuizMode, string> = { solo: "Соло", duo: "Вдвоём", party: "Компания" };

export function ArtistPicker({ artists, mode, onBack, onPick }: { artists: QuizArtist[]; mode: QuizMode; onBack: () => void; onPick: (slug: string) => void }) {
  return (
    <div className="sw-page sw-q" data-th="artist">
      <div className="sw-inner">
        <button type="button" className={backTagClass()} onClick={onBack}>
          ← В студию
        </button>
        <h1 className="sw-picker-title">Выбери артиста</h1>
        <p className="sw-picker-sub">
          15 вопросов только про него: {ARTIST_PER_LEVEL} лёгких, {ARTIST_PER_LEVEL} средних, {ARTIST_PER_LEVEL} сложных. Режим: {MODE_NAMES[mode]}. В конце счёт и звание.
        </p>
        <ul className="sw-artists">
          {artists.map((a) => (
            <li key={a.slug}>
              <button
                type="button"
                className="sw-artist"
                data-demo={a.draft || undefined}
                onClick={() => {
                  sfx.page();
                  onPick(a.slug);
                }}
              >
                <b>{a.name}</b>
                <small>15 вопросов</small>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
