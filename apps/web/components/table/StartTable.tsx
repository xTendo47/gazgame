"use client";

// Главный стол (экран «Стол» макета v6.4): полка (музыка, кубики, правила, обои), билет «Продолжим», коробка GAZ GAME,
// календарь «Батл дня» с серией, «Мне скучно» и VIP-карта, жетон «Профиль». Логика прежняя: «Продолжить», «Сегодня»,
// подбор игры кубиками, GAZ, Premium; новое — скин коробки (лампочка и «Обои»), пауза музыки, имя на жетоне.
// Эмодзи на столе нет: значки — разметка и SVG.
import { useState, useSyncExternalStore, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SectionsFile } from "@gazgame/content";
import { currentStreak, pluralDays, type ContinueGame, type DiceItem } from "@gazgame/engine";
import { ContinueTicket, Jeton } from "@gazgame/ui";
import { RandomDice } from "@/components/RandomDice";
import { Sheet } from "@/components/Sheet";
import { TrackedLink } from "@/components/home/TrackedLink";
import { useContinuePick, type ContinueTestSummary } from "@/components/home/ContinueCard";
import { trackHomeClick } from "@/lib/analytics";
import { BOX_SKINS, nextBoxSkin, setBoxSkin, useBoxSkin } from "@/lib/box-skin";
import { setBoxFlight } from "@/lib/box-flight";
import { prefersReducedMotion, useNow } from "@/lib/gaz";
import { haptic } from "@/lib/haptics";
import { isMusicPlaying, subscribeMusic, toggleMusic } from "@/lib/music";
import { profileInitial, useProfileName } from "@/lib/profile-name";
import { useTodayData } from "@/lib/today";
import { BULB_SVG, CARD_BACK, CARD_BACK_RED, START_CARDS, START_DECOR, START_PROPS } from "./decor-art";
import { BoxFace, PlayGlyph } from "./BoxFace";
import { BoxRulesSheet } from "./BoxRules";
import { DiceIcon, Plate, RulesIcon, VinylIcon, WallsIcon } from "./ShelfIcons";
import "./table.css";
import "./table-box.css";
import "./table-decor.css";
import "./table-shelf.css";

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

/** Пламя серии в календаре. */
function FlameGlyph() {
  return (
    <svg viewBox="0 0 24 30" width="14" height="17" aria-hidden="true" style={{ display: "inline-block", marginLeft: 1, verticalAlign: "-1px" }}>
      <path d="M12 1c1 5 7 8 7 15a7 7 0 0 1-14 0c0-3 1.5-5 3-6.5.2 2 1 3 2 3.5C9.5 8 10 4.5 12 1z" fill="#ff7a1a" />
      <path d="M12 13c.6 2.5 3.5 4 3.5 7a3.5 3.5 0 0 1-7 0c0-1.6.8-2.6 1.5-3.4.2 1 .6 1.5 1 1.8C10.8 16 11.2 14.6 12 13z" fill="#ffd34a" />
    </svg>
  );
}

/** Предупреждающий треугольник у надписи DANGER. */
function WarnGlyph() {
  return (
    <svg viewBox="0 0 14 12" width="10" height="9" aria-hidden="true" style={{ display: "inline-block", marginRight: 3, verticalAlign: "-0.5px" }}>
      <path d="M7 .8 13.4 11.2H.6z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M7 4.6v3.2M7 9.2v.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function StartTable({ tests, games, diceItems, diceConfig, boredIds }: StartTableProps) {
  const router = useRouter();
  const skin = useBoxSkin();
  const pick = useContinuePick(tests, games);
  const todayData = useTodayData();
  const profileName = useProfileName();
  const now = useNow(0);
  const streak = currentStreak(todayData, now);
  const playing = useSyncExternalStore(subscribeMusic, isMusicPlaying, () => false);
  const [sheet, setSheet] = useState<"rules" | "wallpaper" | null>(null);
  const [torn, setTorn] = useState(false);
  const [lifting, setLifting] = useState(false);
  const [leaving, setLeaving] = useState(false);

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

  /** «Мне скучно»: случайная игра из тех же, что в подборе кубиками, или задание из колоды «Мне скучно» (примерно каждый третий раз). */
  function bored() {
    if (lifting) return;
    trackHomeClick({ target: "gaz" });
    haptic("tick");
    // Колпак откидывается, потом переходим (при «Уменьшить движение» — сразу)
    if (prefersReducedMotion()) {
      goBored();
      return;
    }
    setLifting(true);
    setTimeout(goBored, 380);
  }

  function goBored() {
    const onlyGames = diceItems.filter((i) => i.kind === "game");
    const pool = onlyGames.length > 0 ? onlyGames : diceItems;
    const wantTask = boredIds.length > 0 && (pool.length === 0 || Math.random() < 1 / 3);
    if (wantTask) {
      router.push(`/gaz?dare=${boredIds[Math.floor(Math.random() * boredIds.length)]}`);
    } else if (pool.length > 0) {
      router.push(pool[Math.floor(Math.random() * pool.length)]!.href);
    } else {
      router.push("/gaz");
    }
  }

  /** Нажали на коробку: стол отъезжает, коробка «вылетает» в лоток (на «Чем займёмся?» продолжится), потом переход. */
  function openBox(e: React.MouseEvent<HTMLAnchorElement>) {
    if (prefersReducedMotion() || e.metaKey || e.ctrlKey || e.shiftKey) return; // обычный переход по ссылке
    e.preventDefault();
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    setBoxFlight({
      cx: r.left + r.width / 2,
      cy: r.top + r.height / 2,
      w: el.offsetWidth,
      h: el.offsetHeight,
      rot: parseFloat(getComputedStyle(el).getPropertyValue("--r")) || 0,
    });
    haptic("tick");
    setLeaving(true);
    setTimeout(() => router.push("/open"), 460);
  }

  const nextName = BOX_SKINS.find((s) => s.id === nextBoxSkin(skin))?.name;
  const continueItem = pick ? (pick.kind === "test" ? pick.test : pick.game) : null;

  return (
    <div className="gt-table" data-box={skin} data-leaving={leaving}>
      {/* Предметы на столе (SVG макета): гирлянда, карты, часы, домино, фишки… Под содержимым, не нажимаются */}
      <div
        className="gt-decor"
        aria-hidden="true"
        style={{ "--gt-back": CARD_BACK, "--gt-bkp": CARD_BACK_RED } as CSSProperties}
        dangerouslySetInnerHTML={{ __html: START_DECOR + START_PROPS + START_CARDS }}
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
        <Link
          href="/profile"
          className="gt-profile"
          aria-label={profileName ? `Профиль: ${profileName}` : "Профиль"}
          onClick={() => trackHomeClick({ target: "profile" })}
        >
          <span aria-hidden="true">{profileInitial(profileName)}</span>
        </Link>

        {/* Полка: пробковые диски с бирками */}
        <div className="gt-shelf" role="group" aria-label="Инструменты стола">
          <button
            type="button"
            className="gt-tool"
            aria-label={playing ? "Музыка: поставить на паузу" : "Музыка: включить"}
            aria-pressed={playing}
            onClick={() => {
              trackHomeClick({ target: "music" });
              void toggleMusic();
            }}
          >
            <VinylIcon playing={playing} />
            <Plate>музыка</Plate>
          </button>
          {diceConfig ? (
            <RandomDice bare items={diceItems} config={diceConfig} className="gt-tool">
              <DiceIcon />
              <Plate>кубики</Plate>
            </RandomDice>
          ) : (
            <span aria-hidden="true" />
          )}
          <button
            type="button"
            className="gt-tool"
            aria-label="Правила"
            aria-haspopup="dialog"
            onClick={() => {
              trackHomeClick({ target: "rules" });
              setSheet("rules");
            }}
          >
            <RulesIcon />
            <Plate>правила</Plate>
          </button>
          <button
            type="button"
            className="gt-tool"
            aria-label="Обои: оформление коробки"
            aria-haspopup="dialog"
            onClick={() => {
              trackHomeClick({ target: "wallpaper" });
              setSheet("wallpaper");
            }}
          >
            <WallsIcon />
            <Plate>обои</Plate>
          </button>
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
                <PlayGlyph size={13} />
              </span>
            </ContinueTicket>
          </div>
        )}

        {/* Коробка: ведёт на «Чем займёмся?» */}
        <TrackedLink href="/open" track={{ kind: "home", target: "play" }} onClick={openBox} className="gz-obj gt-box" data-skin={skin} aria-label="Играть: открыть коробку">
          <BoxFace skin={skin} />
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
              <span className="gt-cal-pages" />
              <span className="gt-cal-bind">
                <i />
                <i />
                <i />
                <i />
                <span>{month}</span>
              </span>
              <span className="gt-cal-perf" />
              <span className="gt-cal-stamp">
                {streak}
                <FlameGlyph />
              </span>
              <span className="gt-cal-t">Батл дня</span>
              <span className="gt-cal-curl" />
            </TrackedLink>
            <span className="gt-label">{streak > 0 ? `${streak} ${pluralDays(streak)} подряд` : "Начни серию"}</span>
          </div>

          <div className="gt-item">
            <button type="button" onClick={bored} className="gt-panic" data-lift={lifting} aria-label="GAZ: мне скучно. Случайная игра или задание">
              <span className="gt-panic-house" />
              <span className="gt-panic-plate" />
              <span className="gt-panic-collar" />
              <span className="gt-panic-dome">GAZ</span>
              <span className="gt-panic-cover" />
              <span className="gt-panic-danger">
                <WarnGlyph />
                DANGER
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

      {sheet === "rules" && <BoxRulesSheet onClose={() => setSheet(null)} />}
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
