"use client";

// Внутренний экран кармашка «Дневника»: листок в линейку на столе, тесты записаны строками. Рисунки кармашков «Ты в розыске»,
// «Психо» и «Глубже» по эталонам 09–11 делаются отдельными этапами; здесь стиль раздела (стол, бумага, чернила).
import { BackTag } from "@gazgame/ui";
import { Glyph } from "@/components/casino/GIcon";
import { RandomButton } from "@/components/casino/CasinoDeckView";
import { sfx } from "@/lib/sfx";
import { useCardAnim } from "@/lib/card-anim";
import "@/components/casino/casino-deck.css";
import "./diary.css";
import "./diary-deck.css";

export interface DiaryEntry {
  /** Номер в списке вкладки (по нему SectionScreen знает, что открыть). */
  index: number;
  title: string;
  text: string;
  emoji: string;
  soon: boolean;
  /** Закрыто без Premium. */
  locked: boolean;
  /** Подпись «тест · 4 мин». */
  meta?: string | null;
}

export function DiaryDeckView({
  title,
  entries,
  onBack,
  onPick,
  onRandom,
}: {
  /** Название кармашка («Ты в розыске»). */
  title: string;
  entries: DiaryEntry[];
  onBack: () => void;
  onPick: (index: number) => void;
  onRandom: ((chosen?: number) => void) | null;
}) {
  const [animRef, anim] = useCardAnim("solo");
  return (
    <div className="dr-page dd-page" ref={animRef}>
      <div className="dr-scroll">
        <div className="dr-inner">
          <div className="dd-top">
            <BackTag
              onClick={() => {
                sfx.page();
                onBack();
              }}
            >
              ← К книге
            </BackTag>
            {onRandom && <RandomButton onClick={() => anim.roll((i) => onRandom(i))} />}
          </div>
          <h1 className="dd-title">{title}</h1>
          <ul className="dd-sheet">
            {entries.map((e) => (
              <li key={`${e.title}-${e.index}`}>
                <button
                  type="button"
                  className="dd-row"
                  data-card=""
                  data-card-index={e.index}
                  data-soon={e.soon || undefined}
                  data-locked={e.locked || undefined}
                  aria-label={`${e.title}${e.soon ? ", скоро" : ""}${e.locked ? ", закрыто: нужен Premium" : ""}`}
                  onClick={(ev) => anim.open(ev.currentTarget, () => onPick(e.index))}
                >
                  <span className="dd-ico" aria-hidden="true">
                    <Glyph emoji={e.emoji} label={e.title} />
                  </span>
                  <span className="dd-txt">
                    <b>{e.title}</b>
                    <span>{e.text}</span>
                  </span>
                  {e.soon ? <i className="dd-chip dd-soon">скоро</i> : e.locked ? <i className="dd-chip dd-lock">VIP</i> : <i className="dd-chip">тест →</i>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
