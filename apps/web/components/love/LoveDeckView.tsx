"use client";

// Экран колоды «Романтики» (образец — _design/etalon/07_romantika_igry.png): тонкое розовое название, «наугад»,
// карточки-билеты на тёмной сливе с двойной рамкой, орнаментом по углам, круглой камеей, плашкой «2 · 20 мин» и номером.
import { useSyncExternalStore, type CSSProperties } from "react";
import { BackTag } from "@gazgame/ui";
import { Glyph } from "@/components/casino/GIcon";
import { RandomButton } from "@/components/casino/CasinoDeckView";
import { sfx } from "@/lib/sfx";
import { prefersReducedMotion } from "@/lib/gaz";
import { FLOUR, LACE, ROSE } from "./love-art";
import { LoveIcon } from "./LoveIcon";
import { GoldLock, HeartBead } from "./LoveScene";
import "@/components/casino/casino-deck.css";
import "./love.css";
import "./love-deck.css";

export interface LoveCard {
  /** Номер карточки в списке вкладки (по нему SectionScreen знает, что открыть). */
  index: number;
  title: string;
  emoji: string;
  /** «2 · 20 МИН» для игры, «ТЕСТ» для теста; null — подписи нет. */
  meta: string | null;
  soon: boolean;
  /** Закрыто без Premium: на карте замок. */
  locked: boolean;
}

const noSubscribe = () => () => {};

export function LoveDeckView({
  deckId,
  title,
  cards,
  numberBase,
  numberTotal,
  onBack,
  onPick,
  onRandom,
}: {
  deckId: string;
  /** Название колоды (из sections.json). */
  title: string;
  cards: LoveCard[];
  /** Сколько карточек в разделе до этой колоды и всего — для номера «№ 01 / 11». */
  numberBase: number;
  numberTotal: number;
  onBack: () => void;
  onPick: (index: number) => void;
  /** Есть что открыть «Наугад» (хотя бы одна доступная игра). */
  onRandom: (() => void) | null;
}) {
  // «Уменьшить движение» узнаём после показа (на сервере экрана нет), чтобы разметка совпала
  const still = useSyncExternalStore(
    noSubscribe,
    () => prefersReducedMotion(),
    () => false,
  );
  const vars = { "--lv-lace": `url("${LACE}")`, "--lv-rose": `url("${ROSE}")`, "--lv-flour": `url("${FLOUR}")` } as CSSProperties;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="lv-page ld-page" data-deck={deckId} data-still={still || undefined} style={vars}>
      <div className="lv-beams" aria-hidden="true" />
      <div className="lv-scroll">
        <div className="lv-inner">
          <div className="ld-top">
            <BackTag
              onClick={() => {
                sfx.page();
                onBack();
              }}
            >
              ← К колодам
            </BackTag>
            {onRandom && <RandomButton onClick={onRandom} />}
          </div>

          <div className="lv-decor" aria-hidden="true">
            <i className="lv-lace" style={{ left: -30, top: 56, transform: "rotate(-9deg)" }} />
            <i className="lv-lace" style={{ left: 40, top: 40, transform: "rotate(-9deg)" }} />
            <i className="lv-lace" style={{ left: 120, top: 64, transform: "rotate(-9deg)" }} />
            <i className="lv-petal" style={{ left: 214, top: 70, transform: "rotate(30deg)" }} />
          </div>

          <h1 className="lv-title ld-title">{title}</h1>

          <ul className="ld-grid">
            {cards.map((c, i) => (
              <li key={`${c.title}-${c.index}`}>
                <button
                  type="button"
                  className="ld-card"
                  data-pat={i % 4}
                  data-soon={c.soon || undefined}
                  data-locked={c.locked || undefined}
                  style={{ "--k": i } as CSSProperties}
                  aria-label={`${c.title}${c.meta ? `, ${c.meta.toLowerCase()}` : ""}${c.soon ? ", скоро" : ""}${c.locked ? ", закрыто: нужен Premium" : ""}`}
                  onClick={() => {
                    sfx.flip();
                    onPick(c.index);
                  }}
                >
                  <span className="ld-pat" aria-hidden="true" />
                  <span className="ld-flour ld-f1" aria-hidden="true" />
                  <span className="ld-flour ld-f2" aria-hidden="true" />
                  <span className="ld-flour ld-f3" aria-hidden="true" />
                  <span className="ld-flour ld-f4" aria-hidden="true" />
                  <span className="ld-badge" aria-hidden="true">
                    <i>
                      <Glyph emoji={c.emoji} label={c.title} />
                    </i>
                    <em>2</em>
                  </span>
                  <span className="ld-cameo" aria-hidden="true">
                    <LoveIcon emoji={c.emoji} label={c.title} />
                  </span>
                  <HeartBead className="ld-bead" />
                  <b className="ld-name">{c.title}</b>
                  {c.meta && <span className="ld-meta">{c.meta}</span>}
                  <span className="ld-no" aria-hidden="true">
                    <s />№ {pad(numberBase + i + 1)} / {pad(numberTotal)}
                  </span>
                  {c.soon && (
                    <span className="ld-soon" aria-hidden="true">
                      СКОРО
                    </span>
                  )}
                  {c.locked && (
                    <span className="ld-lock" aria-hidden="true">
                      <GoldLock />
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
