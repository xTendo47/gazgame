"use client";

// Экран колоды «Романтики» (образец — _design/etalon/07_romantika_igry.png): тонкое розовое название, «наугад»,
// карточки-билеты на тёмной сливе с двойной рамкой, орнаментом по углам, круглой камеей, плашкой «2 · 20 мин» и номером.
import { useSyncExternalStore, type CSSProperties } from "react";
import { BackTag } from "@gazgame/ui";
import { RandomButton } from "@/components/casino/CasinoDeckView";
import { sfx } from "@/lib/sfx";
import { useCardAnim } from "@/lib/card-anim";
import { prefersReducedMotion } from "@/lib/gaz";
import { FLOUR, LACE, ROSE } from "./love-art";
import { GoldLock, HeartBead } from "./LoveScene";
import "@/components/casino/casino-deck.css";
import "./love.css";
import "./love-deck.css";

export interface LoveCard {
  /** Номер карточки в списке вкладки (по нему SectionScreen знает, что открыть). */
  index: number;
  title: string;
  emoji: string;
  /** «2 · 20 МИН» для игры, «ТЕСТ · 5 МИН» для теста; null — подписи нет. */
  meta: string | null;
  soon: boolean;
  /** Закрыто без Premium: на карте замок. */
  locked: boolean;
}

const noSubscribe = () => () => {};

const CLR = "rgb(214 176 97 / 0.55)";
const svgBg = (body: string, w: number, h: number) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' width='${w}' height='${h}'><g fill='none' stroke='#d6b061' stroke-opacity='.6' stroke-width='1.1' stroke-linecap='round' stroke-linejoin='round'>${body}</g></svg>`)}")`;

/** Свой узор на фоне у каждой игры и теста (в одном стиле: тонкое золото по сливе); ключ — название. Остальные получают общий узор из сердечек. */
const PATTERN: Record<string, CSSProperties> = {
  // круги-мишень
  "Правда или действие": { backgroundImage: `repeating-radial-gradient(circle at 50% 38%, transparent 0 14px, ${CLR} 15px 16px)` },
  // засечки-счётчик
  "Я никогда не… вдвоём": { backgroundImage: svgBg("<path d='M6 4v12M10 4v12M14 4v12M18 4v12M3 15l18-8'/>", 26, 26), backgroundSize: "34px 34px" },
  // сплетённые кольца
  "Насколько ты меня знаешь": { backgroundImage: svgBg("<circle cx='9' cy='10' r='5'/><circle cx='15' cy='10' r='5'/>", 24, 20), backgroundSize: "30px 26px" },
  // кольца и сердце
  "Совпадём?": { backgroundImage: svgBg("<circle cx='8' cy='12' r='4.5'/><circle cx='15' cy='12' r='4.5'/><path d='M23 11c-3-2-3-5 0-5 1.500 0 2 1 2 1s.5-1 2-1c3 0 3 3 0 5l-2 2z'/>", 34, 22), backgroundSize: "40px 28px" },
  // песочные часы
  "Капсула времени": { backgroundImage: svgBg("<path d='M5 3h12M5 21h12M6 3c0 6 5 7 5 9s-5 3-5 9M16 3c0 6-5 7-5 9s5 3 5 9'/>", 22, 24), backgroundSize: "34px 38px" },
  // чекбоксы-галочки
  "Наш список 100 дел": { backgroundImage: svgBg("<rect x='3' y='4' width='8' height='8' rx='1.500'/><path d='M5 8l2 2 4-5M15 8h10M15 5h7'/>", 28, 16), backgroundSize: "38px 24px" },
  // «норм» и «стрём»: половинки
  "Норм или стрём": { backgroundImage: svgBg("<path d='M4 8l3 3 6-7M20 4l8 8M28 4l-8 8'/>", 32, 16), backgroundSize: "36px 24px" },
  // привязанность: звенья цепи
  "Тип привязанности": { backgroundImage: svgBg("<rect x='2' y='5' width='11' height='7' rx='3.500'/><rect x='10' y='5' width='11' height='7' rx='3.500'/>", 24, 17), backgroundSize: "34px 26px" },
  "Привязанность пары": { backgroundImage: svgBg("<rect x='2' y='5' width='11' height='7' rx='3.500'/><rect x='10' y='5' width='11' height='7' rx='3.500'/>", 24, 17), backgroundSize: "34px 26px" },
  // языки любви: сердечки-речи
  "Языки любви": { backgroundImage: svgBg("<path d='M8 14c-5-3-5-8-1-8 1.500 0 2 1.500 2 1.500S9.500 6 11 6c4 0 4 5-1 8z'/><path d='M16 4h7v5h-3l-2 2v-2h-2z'/>", 26, 18), backgroundSize: "36px 26px" },
  "Языки любви вдвоём": { backgroundImage: svgBg("<path d='M8 14c-5-3-5-8-1-8 1.500 0 2 1.500 2 1.500S9.500 6 11 6c4 0 4 5-1 8z'/><path d='M16 4h7v5h-3l-2 2v-2h-2z'/>", 26, 18), backgroundSize: "36px 26px" },
  // ревность: глаза
  "Насколько ты ревнуешь": { backgroundImage: svgBg("<path d='M2 8c4-6 10-6 14 0-4 6-10 6-14 0z'/><circle cx='9' cy='8' r='2'/>", 18, 16), backgroundSize: "32px 24px" },
  // романтика: лепестки
  "Сколько в тебе романтики": { backgroundImage: svgBg("<path d='M4 12c0-7 7-8 9-8 0 7-3 10-9 8z'/><path d='M8 10c1-2 3-3 4-4'/>", 16, 16), backgroundSize: "30px 30px" },
  // флаги
  "Красный флаг, зелёный флаг": { backgroundImage: svgBg("<path d='M4 3v16M4 4h10l-2 3 2 3H4'/>", 18, 20), backgroundSize: "32px 34px" },
  // конверты
  "Что тебе нужно в любви": { backgroundImage: svgBg("<rect x='2' y='3' width='16' height='11' rx='1.500'/><path d='M2 4l8 6 8-6'/>", 20, 17), backgroundSize: "34px 28px" },
  // расставание: расходящиеся линии
  "Как ты переживаешь расставания": { backgroundImage: svgBg("<path d='M4 2l4 6-5 4 6 6M18 2l-3 5 5 4-4 7'/>", 24, 20), backgroundSize: "36px 30px" },
  // 36 вопросов: знаки вопроса
  "36 вопросов": { backgroundImage: svgBg("<path d='M4 6c0-4 8-4 8 0 0 3-4 3-4 6M8 16v1'/>", 16, 20), backgroundSize: "28px 32px" },
  // светофор: кружки в ряд
  "Здоровые ли у вас отношения?": { backgroundImage: svgBg("<rect x='4' y='2' width='8' height='20' rx='4'/><circle cx='8' cy='7' r='1.800'/><circle cx='8' cy='12' r='1.800'/><circle cx='8' cy='17' r='1.800'/>", 16, 24), backgroundSize: "28px 40px" },
  // вулкан/волны темперамента
  "Темперамент пары": { backgroundImage: svgBg("<path d='M1 8c3-4 5 4 8 0s5 4 8 0'/>", 18, 12), backgroundSize: "30px 22px" },
  // ценности: ромбы
  "Ценности пары": { backgroundImage: svgBg("<path d='M9 2l6 6-6 6-6-6z'/><path d='M9 5l3 3-3 3-3-3z'/>", 18, 16), backgroundSize: "30px 28px" },
  // паспорт: штамп-кружки
  "Паспорт пары": { backgroundImage: svgBg("<circle cx='10' cy='10' r='7'/><circle cx='10' cy='10' r='4'/><path d='M3 10h14'/>", 20, 20), backgroundSize: "34px 34px" },
};
const DEFAULT_PATTERN: CSSProperties = { backgroundImage: svgBg("<path d='M9 14c-5-3-5-8-1-8 1.500 0 2 1.500 2 1.500S10.500 6 12 6c4 0 4 5-1 8z'/>", 20, 18), backgroundSize: "32px 28px" };

/** Наклон карт на столе: чуть в разные стороны. */
const TILT = [-1.8, 1.4, 1.1, -1.5, -1.2, 1.7, 1.3, -1.6, -1.1];

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
  onRandom: ((chosen?: number) => void) | null;
}) {
  const [animRef, anim] = useCardAnim("love");
  // «Уменьшить движение» узнаём после показа (на сервере экрана нет), чтобы разметка совпала
  const still = useSyncExternalStore(
    noSubscribe,
    () => prefersReducedMotion(),
    () => false,
  );
  const vars = { "--lv-lace": `url("${LACE}")`, "--lv-rose": `url("${ROSE}")`, "--lv-flour": `url("${FLOUR}")` } as CSSProperties;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="lv-page ld-page" data-deck={deckId} data-still={still || undefined} style={vars} ref={animRef}>
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
            {onRandom && <RandomButton onClick={() => anim.roll((i) => onRandom(i))} />}
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
                  data-card=""
                  data-card-index={c.index}
                  data-soon={c.soon || undefined}
                  data-locked={c.locked || undefined}
                  style={{ "--k": i, "--tilt": `${TILT[i % TILT.length]}deg` } as CSSProperties}
                  aria-label={`${c.title}${c.meta ? `, ${c.meta.toLowerCase()}` : ""}${c.soon ? ", скоро" : ""}${c.locked && !c.soon ? ", закрыто: нужен Premium" : ""}`}
                  onClick={(e) => anim.open(e.currentTarget, () => onPick(c.index))}
                >
                  <span className="ld-pat" aria-hidden="true" style={PATTERN[c.title] ?? DEFAULT_PATTERN} />
                  <span className="ld-flour ld-f1" aria-hidden="true" />
                  <span className="ld-flour ld-f2" aria-hidden="true" />
                  <span className="ld-flour ld-f3" aria-hidden="true" />
                  <span className="ld-flour ld-f4" aria-hidden="true" />
                  <span className="ld-badge" aria-hidden="true">
                    <i>{c.emoji}</i>
                    <em>2</em>
                  </span>
                  <span className="ld-cameo" aria-hidden="true">
                    <span className="ld-emoji">{c.emoji}</span>
                  </span>
                  <HeartBead className="ld-bead" />
                  <b className="ld-name">{c.title}</b>
                  {c.meta && <span className="ld-meta">{c.meta}</span>}
                  <span className="ld-no" aria-hidden="true">
                    <s />№ {pad(numberBase + i + 1)} / {pad(numberTotal)}
                  </span>
                  {(c.soon || c.locked) && (
                    <span className="ld-hang" aria-hidden="true">
                      <GoldLock />
                      <em>{c.soon ? "скоро" : "Premium"}</em>
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
