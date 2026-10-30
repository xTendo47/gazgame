"use client";

// Главный стол (экран «Стол» макета v6.4): полка (музыка, кубики, правила, обои), билет «Продолжим», коробка GAZ GAME,
// календарь «Батл дня» с серией, «Мне скучно» и VIP-карта. Логика — прежняя: «Продолжить», «Сегодня», 🎲, GAZ, Premium;
// новое — скин коробки (лампочка и «Обои») и пауза музыки.
import { useState, useSyncExternalStore, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SectionsFile } from "@gazgame/content";
import { currentStreak, pluralDays, type ContinueGame, type DiceItem } from "@gazgame/engine";
import { ContinueTicket, Jeton, Tag } from "@gazgame/ui";
import { RandomDice } from "@/components/RandomDice";
import { Sheet } from "@/components/Sheet";
import { TrackedLink } from "@/components/home/TrackedLink";
import { useContinuePick, type ContinueTestSummary } from "@/components/home/ContinueCard";
import { trackHomeClick } from "@/lib/analytics";
import { BOX_SKINS, nextBoxSkin, setBoxSkin, useBoxSkin } from "@/lib/box-skin";
import { prefersReducedMotion, useNow } from "@/lib/gaz";
import { haptic } from "@/lib/haptics";
import { isMusicPlaying, subscribeMusic, toggleMusic } from "@/lib/music";
import { useTodayData } from "@/lib/today";
import { BULB_SVG, CARD_BACK, CARD_BACK_RED, SKIN_ART, START_CARDS, START_DECOR } from "./decor-art";
import "./table.css";
import "./table-decor.css";

/** Цвета для образцов в шторке «Обои» (тот же набор, что в table.css). */
const SKIN_SWATCH: Record<string, string> = {
  classic: "linear-gradient(160deg,#ff7a1a,#e2470f)",
  sand: "linear-gradient(160deg,#ecd8a8,#c9a56a)",
  ice: "linear-gradient(160deg,#c4ecff,#4aa7d6)",
  west: "linear-gradient(160deg,#b5651d,#7a3f12)",
  baroque: "linear-gradient(160deg,#6a1c38,#2e0a18)",
};

export interface StartTableProps {
  tests: ContinueTestSummary[];
  games: ContinueGame[];
  diceItems: DiceItem[];
  /** Нет настроек кубика (sections.json без dice) — кубика на полке нет, как раньше на главной. */
  diceConfig?: SectionsFile["dice"];
  /** id заданий из колоды «Мне скучно» (/gaz?dare=…): для кнопки «Мне скучно». */
  boredIds: string[];
}

/** Буква на жетоне «Профиль». Имени пользователя в проекте пока нет, поэтому «Я». */
const PROFILE_INITIAL = "Я";

export function StartTable({ tests, games, diceItems, diceConfig, boredIds }: StartTableProps) {
  const router = useRouter();
  const skin = useBoxSkin();
  const pick = useContinuePick(tests, games);
  const todayData = useTodayData();
  const now = useNow(0);
  const streak = currentStreak(todayData, now);
  const playing = useSyncExternalStore(subscribeMusic, isMusicPlaying, () => false);
  const [sheet, setSheet] = useState<"rules" | "wallpaper" | null>(null);
  const [torn, setTorn] = useState(false);

  const month = now.toLocaleDateString("ru-RU", { month: "long" }).toUpperCase();

  function cycleSkin() {
    trackHomeClick({ target: "skin" });
    haptic("tick");
    setBoxSkin(nextBoxSkin(skin));
  }

  function continueGame() {
    if (!pick) return;
    trackHomeClick({ target: "continue" });
    const item = pick.kind === "test" ? pick.test : pick.game;
    const href = pick.kind === "test" ? `/test/${item.slug}` : `/game/${item.slug}`;
    if (prefersReducedMotion()) {
      router.push(href);
      return;
    }
    // Корешок «отрывается», потом переходим
    setTorn(true);
    setTimeout(() => router.push(href), 450);
  }

  /** «Мне скучно»: случайная игра из тех же, что в 🎲, или задание из колоды «Мне скучно» (примерно каждый третий раз). */
  function bored() {
    trackHomeClick({ target: "gaz" });
    haptic("tick");
    const games = diceItems.filter((i) => i.kind === "game");
    const pool = games.length > 0 ? games : diceItems;
    const wantTask = boredIds.length > 0 && (pool.length === 0 || Math.random() < 1 / 3);
    if (wantTask) {
      router.push(`/gaz?dare=${boredIds[Math.floor(Math.random() * boredIds.length)]}`);
    } else if (pool.length > 0) {
      router.push(pool[Math.floor(Math.random() * pool.length)]!.href);
    } else {
      router.push("/gaz");
    }
  }

  const nextName = BOX_SKINS.find((s) => s.id === nextBoxSkin(skin))?.name;
  const continueItem = pick ? (pick.kind === "test" ? pick.test : pick.game) : null;

  return (
    <div className="gt-table" data-box={skin}>
      {/* Предметы на столе (SVG макета): гирлянда, карты, часы, домино, фишки… Под содержимым, не нажимаются */}
      <div
        className="gt-decor"
        aria-hidden="true"
        style={{ "--gt-back": CARD_BACK, "--gt-bkp": CARD_BACK_RED } as CSSProperties}
        dangerouslySetInnerHTML={{ __html: START_DECOR + START_CARDS }}
      />
      <div className="gt-decor" style={{ filter: "none", zIndex: 3 }}>
        <button
          type="button"
          className="gt-bulb"
          onClick={cycleSkin}
          aria-label={`Сменить оформление коробки. Сейчас: ${BOX_SKINS.find((s) => s.id === skin)?.name}. Дальше: ${nextName}`}
        >
          <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: BULB_SVG }} />
          <span className="gt-bulb-glow" aria-hidden="true" />
        </button>
      </div>
      <div className="gt-inner">
        <Link href="/profile" className="gt-profile" aria-label="Профиль" onClick={() => trackHomeClick({ target: "profile" })}>
          <span aria-hidden="true">{PROFILE_INITIAL}</span>
        </Link>

        {/* Полка */}
        <div className="gt-shelf" role="group" aria-label="Инструменты стола">
          <div className="gt-tool">
            <button
              type="button"
              className="gt-tool-disc"
              aria-label={playing ? "Музыка: поставить на паузу" : "Музыка: включить"}
              aria-pressed={playing}
              onClick={() => {
                trackHomeClick({ target: "music" });
                void toggleMusic();
              }}
            >
              <span className="gt-vinyl" data-playing={playing} aria-hidden="true" />
            </button>
            <Tag>Музыка</Tag>
          </div>
          <div className="gt-tool">
            {diceConfig && <RandomDice items={diceItems} config={diceConfig} className="gt-tool-disc" />}
            <Tag>Кубики</Tag>
          </div>
          <div className="gt-tool">
            <button
              type="button"
              className="gt-tool-disc"
              aria-label="Правила"
              aria-haspopup="dialog"
              onClick={() => {
                trackHomeClick({ target: "rules" });
                setSheet("rules");
              }}
            >
              <span aria-hidden="true">📜</span>
            </button>
            <Tag>Правила</Tag>
          </div>
          <div className="gt-tool">
            <button
              type="button"
              className="gt-tool-disc"
              aria-label="Обои: оформление коробки"
              aria-haspopup="dialog"
              onClick={() => {
                trackHomeClick({ target: "wallpaper" });
                setSheet("wallpaper");
              }}
            >
              <span aria-hidden="true">🎨</span>
            </button>
            <Tag>Обои</Tag>
          </div>
        </div>

        {/* Билет «Продолжим» — только если есть что продолжать */}
        {continueItem && (
          <div className="gt-ticket-wrap">
            <ContinueTicket stub="GAZ" number="оторви" torn={torn} onClick={continueGame} aria-label={`Продолжим: ${continueItem.title}`}>
              <span className="gt-ticket-main-text">
                <small>ПРОДОЛЖИМ</small>
                <b>{continueItem.title}</b>
                {pick?.kind === "test" && <span>{`Вопрос ${pick.question} из ${pick.total}`}</span>}
              </span>
              <span className="gt-play" aria-hidden="true">
                ▶
              </span>
            </ContinueTicket>
          </div>
        )}

        {/* Коробка: ведёт на «Чем займёмся?» */}
        <TrackedLink href="/open" track={{ kind: "home", target: "play" }} className="gz-obj gt-box" data-skin={skin} aria-label="Играть: открыть коробку">
          {skin !== "classic" && <span className="gt-box-art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: SKIN_ART[skin] }} />}
          <span className="gt-box-band">
            <span>НАСТОЛЬНАЯ ИГРА</span>
            <span>1–10 игроков</span>
          </span>
          <span className="gt-box-title">
            <b>GAZ</b> GAME
          </span>
          <span className="gt-box-tag">Не сиди. Не тупи. Играй!</span>
          <span className="gt-box-bar" aria-hidden="true" />
          <span className="gt-box-stamp" aria-hidden="true">
            GAZ
          </span>
          <span className="gt-box-b16" aria-hidden="true">
            16+
          </span>
          <span className="gt-box-b30" aria-hidden="true">
            <span>
              <b>30+</b>игр
            </span>
          </span>
          <span className="gt-box-play">Играть ▶</span>
          <span className="gt-box-foot" aria-hidden="true">
            ОТКРЫВАТЬ С ДРУЗЬЯМИ ✦
          </span>
        </TrackedLink>

        {/* Календарь, «Мне скучно», VIP */}
        <div className="gt-trio">
          <div className="gt-item">
            <TrackedLink
              href="/today"
              track={{ kind: "home", target: "today" }}
              className="gz-obj gt-cal"
              aria-label={streak > 0 ? `Батл дня. Серия ${streak} ${pluralDays(streak)}` : "Батл дня. Начни серию"}
            >
              <span className="gt-cal-head">{month}</span>
              <span className="gt-cal-ring">
                <span>
                  {streak}
                  <small aria-hidden="true">🔥</small>
                </span>
              </span>
              <span className="gt-cal-label block">Батл дня</span>
            </TrackedLink>
            <span className="gt-label">{streak > 0 ? `${streak} ${pluralDays(streak)}` : "Начни серию"}</span>
          </div>

          <div className="gt-item">
            <button type="button" onClick={bored} className="gt-panic" aria-label="GAZ: мне скучно. Случайная игра или задание">
              <span className="gt-panic-danger">⚠ DANGER</span>
              <span className="gt-panic-well">
                <span className="gt-panic-dome">GAZ</span>
              </span>
              <span className="gt-panic-dont">НЕ НАЖИМАЙ</span>
            </button>
            <span className="gt-label gt-label-dark" style={{ "--r": "0deg" } as CSSProperties}>
              МНЕ СКУЧНО
            </span>
          </div>

          <div className="gt-item">
            <TrackedLink href="/premium" track={{ kind: "home", target: "premium" }} className="gz-obj gt-vip" aria-label="VIP: всё открыто">
              <small>GAZ GAME</small>
              <b>VIP</b>
              <span className="gt-vip-chip" aria-hidden="true" />
              <small>ВСЁ ОТКРЫТО</small>
            </TrackedLink>
            <span className="gt-label">VIP</span>
          </div>
        </div>
      </div>

      {sheet === "rules" && (
        <Sheet label="Правила GAZ GAME" onClose={() => setSheet(null)}>
          <h2 className="font-display text-[19px] leading-tight font-extrabold">Правила GAZ GAME</h2>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-[15px] leading-snug">
            <li>Жми «Играть» и открывай коробку: внутри разделы для компании, для пары и для себя.</li>
            <li>Выбери то, что ближе, и тапни игру или тест. Правила каждой игры — в одно касание.</li>
            <li>Не знаешь, во что играть? Кинь кубики или жми «Мне скучно».</li>
          </ol>
          <p className="text-[12px] text-muted">[черновик: настоящие правила напишет основатель]</p>
          <Jeton onClick={() => setSheet(null)}>Понятно</Jeton>
        </Sheet>
      )}
      {sheet === "wallpaper" && (
        <Sheet label="Обои: оформление коробки" onClose={() => setSheet(null)}>
          <h2 className="font-display text-[19px] leading-tight font-extrabold">Обои</h2>
          <p className="-mt-1.5 text-[13.5px] text-muted">Как будет выглядеть коробка на столе.</p>
          <div className="gt-skins" role="group" aria-label="Оформление коробки">
            {BOX_SKINS.map((s) => (
              <button
                key={s.id}
                type="button"
                className="gt-skin-btn"
                aria-pressed={skin === s.id}
                onClick={() => {
                  haptic("tick");
                  setBoxSkin(s.id);
                }}
              >
                <span className="gt-skin-sw" style={{ background: SKIN_SWATCH[s.id] }} />
                {s.name}
              </button>
            ))}
          </div>
          <Jeton onClick={() => setSheet(null)}>Готово</Jeton>
        </Sheet>
      )}
    </div>
  );
}
