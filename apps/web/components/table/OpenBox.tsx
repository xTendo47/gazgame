"use client";

// «Чем займёмся?» (экран 3 макета v6.4): открытая коробка — лоток с четырьмя плитками, нижний ряд, папиросная бумага
// и крышка с вкладышем «Правила». Открытие, как в макете: коробка «вылетает» со стола, растягивается на весь лоток,
// приподнимается и съезжает вправо вверх (остаётся торчать из угла); сверху лежит папиросная бумага («тапни, чтобы развернуть»),
// потом плитки выпрыгивают по очереди. «На стол» играет всё в обратную сторону. Звуки — lib/sfx.ts.
// Крышка — копия коробки в выбранном скине, поэтому вариантов открытия ровно пять (классика, песок, лёд, West, барокко).
// Место коробки передаёт главная (lib/box-flight); если его нет (адрес, перезагрузка) или включено «Уменьшить движение» —
// коробка сразу открыта, без бумаги.
import { useCallback, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { backTagClass } from "@gazgame/ui";
import { clearBoxFlight, lastBoxFlight, markTissueSeen, peekBoxFlight, tissueSeen } from "@/lib/box-flight";
import { useBoxSkin } from "@/lib/box-skin";
import { CLOSE_DIM_OUT, CLOSE_TOTAL, OPEN_SPANS, STAGGER, closeSpan, shift, type Span } from "@/lib/box-timeline";
import { prefersReducedMotion } from "@/lib/gaz";
import { HOME_SECTIONS, MINI_BUTTONS } from "@/lib/menu";
import { sfx } from "@/lib/sfx";
import { BoxFace } from "./BoxFace";
import { BoxRulesSheet } from "./BoxRules";
import { OPEN_DECOR } from "./decor-art";
import { AlbumExtra, DiaryTile, LoveTile, NoteExtra, PartyTile, ShowTile, VipExtra } from "./Tiles";
import "./table.css";
import "./table-box.css";
import "./table-decor.css";
import "./table-open.css";

/** Раздел меню по id (список в lib/menu.ts всегда содержит все три). */
const section = (id: "party" | "love" | "solo") => HOME_SECTIONS.find((s) => s.id === id)!;
const SUGGEST = MINI_BUTTONS.find((m) => m.id === "suggest");

/** Где крышка остаётся после открытия: доля ширины и высоты лотка от его центра и наклон (LK[3] макета). */
/** Крышка: ширина как у лотка, центр — в точке сцены (x, y) в правом верхнем углу, наклон 12° (замеры по эталону 03). */
const REST = { x: 401, y: 50, turn: 12, ratio: 211 / 300, width: 1 };

/** Размер «макетного» экрана (эталон 03: 358×695). Сцена целиком масштабируется под экран, но не больше чем в 1,25 раза. */
const STAGE_W = 358;
const STAGE_H = 695;
const MAX_SCALE = 1.25;

/** Подгоняет сцену под экран: масштаб по меньшей стороне, высота сцены растёт, если экран выше макета. Возвращает масштаб. */
function fitStage(rootEl: HTMLElement, stageEl: HTMLElement): number {
  const vw = rootEl.clientWidth;
  const vh = window.innerHeight;
  const s = Math.min(vw / STAGE_W, vh / STAGE_H, MAX_SCALE);
  stageEl.style.setProperty("--s", String(s));
  stageEl.style.setProperty("--sh", String(vh / s));
  stageEl.dataset.ready = "true";
  return s;
}

type TissueState = "off" | "on" | "rustle" | "go";

/** Бумага лежит, только если пришли с анимации открытия, движение разрешено и за сеанс бумагу ещё не убирали. */
function initialTissue(): TissueState {
  if (typeof window === "undefined") return "off";
  return peekBoxFlight() && !prefersReducedMotion() && !tissueSeen() ? "on" : "off";
}

/** Значок «тапни» — рука-указатель, без эмодзи. */
function TapGlyph() {
  return (
    <svg viewBox="0 0 16 19" width="9" height="11" aria-hidden="true" style={{ display: "inline-block", verticalAlign: "-2px" }}>
      <path
        d="M5.2 9.6V3.2a1.4 1.4 0 0 1 2.8 0v5l.5-.1V6.2a1.3 1.3 0 0 1 2.6 0v2.1l.5-.1V7.5a1.3 1.3 0 0 1 2.6 0v5.2c0 3.2-1.6 5.3-4.8 5.3-2.3 0-3.6-1.1-4.8-3L2 11.6a1.3 1.3 0 0 1 2.1-1.5l1.1 1.4z"
        fill="#fff"
        stroke="#1d2a6a"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Подгоняет сцену под экран и ставит крышку на место (в координатах сцены). Зовётся при открытии и при повороте экрана. */
function placeLid(rootEl: HTMLElement, stageEl: HTMLElement, trayEl: HTMLElement, lidEl: HTMLElement) {
  const s = fitStage(rootEl, stageEl);
  const sr = stageEl.getBoundingClientRect();
  const tr = trayEl.getBoundingClientRect();
  const W = tr.width / s;
  const H = tr.height / s;
  const left = (tr.left - sr.left) / s;
  const top = (tr.top - sr.top) / s;
  const Wl = W * REST.width;
  const Hl = Wl * REST.ratio;
  const rest = pose(REST.x - (left + W / 2), REST.y - (top + H / 2), 0, REST.turn, 1);
  const hover = pose(0, -0.05 * H, 14, 0, 1.04);
  Object.assign(lidEl.style, { left: `${left + (W - Wl) / 2}px`, top: `${top + (H - Hl) / 2}px`, width: `${Wl}px`, height: `${Hl}px`, transform: rest });
  lidEl.dataset.ready = "true";
  return { s, sr, W, H, left, top, Wl, rest, hover, geo: { cx: left + W / 2, cy: top + H / 2, s, Wl, rest, hover, sx: sr.left, sy: sr.top } };
}

type Phase = "opening" | "open" | "closing";

/** Поза крышки одним и тем же набором функций — тогда браузер плавно проводит её между позами. */
const pose = (tx: number, ty: number, tilt: number, turn: number, scale: number) =>
  `translate(${tx}px, ${ty}px) perspective(900px) rotateX(${tilt}deg) rotate(${turn}deg) scale(${scale})`;

const EASE_OUT = "cubic-bezier(0.2, 0.75, 0.25, 1)";
/** Крышка: мягкий ease-out, чтобы движение было видно на всём отрезке 0–450 мс. */
const LID_EASE = "cubic-bezier(0.35, 0.45, 0.4, 1)";
const EASE_IN = "cubic-bezier(0.55, 0.1, 0.8, 0.4)";
const OUT: Keyframe = { opacity: 0 };
const ON: Keyframe = { opacity: 1 };

/** Выезд плитки и нижнего ряда из коробки: снизу вверх. */
const RISE: Keyframe[] = [
  { opacity: 0, transform: "translateY(38px)" },
  { opacity: 1, transform: "translateY(0)" },
];
/** Основание раскрывается: чуть меньше и прозрачное → на своём месте. */
const SPREAD: Keyframe[] = [
  { opacity: 0, transform: "scale(0.92)" },
  { opacity: 1, transform: "scale(1)" },
];
/** Памятка: спрятана за нижним краем крышки (её обрезает край) → выдвинута на своё место (тот же вид, что в CSS). */
const MEMO: Keyframe[] = [
  { transform: "translateY(135%) rotate(-9deg)" },
  { transform: "translateY(0%) rotate(-9deg)" },
];

export function OpenBox() {
  const router = useRouter();
  const skin = useBoxSkin();
  const [rules, setRules] = useState(false);
  const [tissue, setTissue] = useState<TissueState>(initialTissue);
  const withTissue = useRef(tissue === "on");
  const root = useRef<HTMLDivElement>(null);
  const tray = useRef<HTMLElement>(null);
  const lid = useRef<HTMLDivElement>(null);
  const extras = useRef<HTMLElement>(null);
  const memo = useRef<HTMLButtonElement>(null);
  const dim = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  /** Закрыто → открывается → открыто → закрывается. Пока идёт анимация, повторные нажатия игнорируются. */
  const phase = useRef<Phase>("open");
  const stage = useRef<HTMLDivElement>(null);
  const geo = useRef<{ cx: number; cy: number; s: number; Wl: number; rest: string; hover: string; sx: number; sy: number } | null>(null);

  const setPhase = (p: Phase) => {
    phase.current = p;
    if (root.current) root.current.dataset.phase = p;
  };

  /** Развернуть бумагу: шорох, половинки разъезжаются, печать улетает. */
  const tissueAway = useCallback(() => {
    setTissue((t) => {
      if (t !== "on") return t;
      markTissueSeen();
      sfx.rustle();
      timers.current.push(window.setTimeout(() => setTissue("go"), 180), window.setTimeout(() => setTissue("off"), 1150));
      return "rustle";
    });
  }, []);

  useLayoutEffect(() => {
    const rootEl = root.current;
    const trayEl = tray.current;
    const lidEl = lid.current;
    if (!rootEl || !trayEl || !lidEl) return;

    // Вся сцена рисуется в «макетном» экране STAGE_W×STAGE_H и целиком масштабируется под телефон (fitStage), поэтому
    // все размеры ниже считаем в координатах сцены: экранные пиксели делим на масштаб s. Размер крышки не меняется, двигается только transform.
    const stageEl = stage.current;
    if (!stageEl) return;
    const { s, sr, W, H, left, top, Wl, rest, hover, geo: g } = placeLid(rootEl, stageEl, trayEl, lidEl);
    geo.current = g;
    setPhase("open");

    const flight = peekBoxFlight();
    if (!flight || prefersReducedMotion() || typeof lidEl.animate !== "function") {
      clearBoxFlight();
      return;
    }

    setPhase("opening");
    sfx.arm();
    const anims: Animation[] = [];
    const play = (el: Element | null, frames: Keyframe[], span: Span, easing: string) => {
      if (!el) return;
      anims.push(el.animate(frames, { delay: span[0], duration: span[1] - span[0], easing, fill: "backwards" }));
    };

    // 0–450: крышка слетает со стола на коробку, приподнимается и открывается (уходит в угол). Размер не меняется
    const fromTable = pose((flight.cx - sr.left) / s - (left + W / 2), (flight.cy - sr.top) / s - (top + H / 2), 0, flight.rot, flight.w / s / Wl);
    play(lidEl, [{ transform: fromTable }, { transform: hover, offset: 0.45 }, { transform: rest }], OPEN_SPANS.lid, LID_EASE);
    // 350–750: основание раскрывается, вместе с ним проявляется заголовок
    play(trayEl, SPREAD, OPEN_SPANS.base, EASE_OUT);
    play(rootEl.querySelector(".gt-open-title"), [OUT, ON], OPEN_SPANS.base, EASE_OUT);
    // 600–1000: содержимое выезжает снизу вверх, плитка за плиткой
    const items = Array.from(trayEl.querySelectorAll<HTMLElement>(".gt-tray-grid > li"));
    items.forEach((li, i) => play(li, RISE, shift(OPEN_SPANS.items, i * STAGGER), EASE_OUT));
    play(extras.current, RISE, shift(OPEN_SPANS.items, items.length * STAGGER), EASE_OUT);
    // 650–1050: памятка выезжает из-под края крышки
    play(memo.current, MEMO, OPEN_SPANS.memo, EASE_OUT);
    // фон: проявляется 0–400, потом светлеет (в покое стол без затемнения, как в макете)
    if (dim.current) {
      anims.push(dim.current.animate([{ opacity: 0 }, { opacity: 1, offset: 0.4 }, { opacity: 0 }], { duration: 1000, easing: "ease-in-out", fill: "backwards" }));
    }
    timers.current.push(window.setTimeout(() => sfx.lid(), 120), window.setTimeout(() => sfx.thump(0.45), OPEN_SPANS.lid[1]));

    const all = Promise.all(anims.map((a) => a.finished));
    all
      .then(() => {
        setPhase("open");
        clearBoxFlight();
        // бумага сама убирается через 0,65 с после того, как коробка открылась
        if (withTissue.current) timers.current.push(window.setTimeout(tissueAway, 650));
      })
      .catch(() => {});
    return () => {
      anims.forEach((a) => a.cancel());
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
  }, [tissueAway]);

  // Повернули телефон или изменили окно: подгоняем сцену заново (только когда ничего не анимируется)
  useLayoutEffect(() => {
    const onResize = () => {
      const r = root.current;
      const st = stage.current;
      const tr = tray.current;
      const ld = lid.current;
      if (phase.current !== "open" || !r || !st || !tr || !ld) return;
      geo.current = placeLid(r, st, tr, ld).geo;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /** «На стол»: тот же порядок назад и чуть быстрее — памятка и содержимое уезжают, основание сжимается, крышка закрывается и летит на стол. */
  function closeBox(e: MouseEvent<HTMLAnchorElement>) {
    const lidEl = lid.current;
    const trayEl = tray.current;
    const rootEl = root.current;
    const g = geo.current;
    if (e.metaKey || e.ctrlKey || e.shiftKey || prefersReducedMotion() || !lidEl || !trayEl || !rootEl || !g || typeof lidEl.animate !== "function") return; // обычный переход
    e.preventDefault();
    if (phase.current !== "open") return; // уже открывается или закрывается — не обрываем
    setPhase("closing");
    setTissue("off");
    const target = lastBoxFlight();
    const anims: Animation[] = [];
    const play = (el: Element | null, frames: Keyframe[], span: Span, easing: string) => {
      if (!el) return;
      const [start, end] = closeSpan(span);
      anims.push(el.animate([...frames].reverse(), { delay: start, duration: end - start, easing, fill: "both" }));
    };

    const toTable = target
      ? pose((target.cx - g.sx) / g.s - g.cx, (target.cy - g.sy) / g.s - g.cy, 0, target.rot, target.w / g.s / g.Wl)
      : pose(0, 0, 0, 0, 1);
    // 0–: памятка уезжает под крышку первой, за ней содержимое — с последнего к первому
    play(memo.current, MEMO, OPEN_SPANS.memo, EASE_IN);
    const items = Array.from(trayEl.querySelectorAll<HTMLElement>(".gt-tray-grid > li"));
    items.forEach((li, i) => play(li, RISE, shift(OPEN_SPANS.items, i * STAGGER), EASE_IN));
    play(extras.current, RISE, shift(OPEN_SPANS.items, items.length * STAGGER), EASE_IN);
    // основание сжимается
    play(trayEl, SPREAD, OPEN_SPANS.base, EASE_IN);
    play(rootEl.querySelector(".gt-open-title"), [OUT, ON], OPEN_SPANS.base, EASE_IN);
    // крышка закрывается и ложится на место коробки на столе
    play(lidEl, [{ transform: toTable }, { transform: g.hover, offset: 0.55 }, { transform: g.rest }], OPEN_SPANS.lid, EASE_IN);
    // фон: проявляется в начале и плавно уходит в последние 300 мс
    if (dim.current) {
      anims.push(dim.current.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: "ease-out", fill: "both" }));
      anims.push(dim.current.animate([{ opacity: 1 }, { opacity: 0 }], { delay: CLOSE_TOTAL - CLOSE_DIM_OUT, duration: CLOSE_DIM_OUT, easing: "ease-in-out", fill: "both" }));
    }
    timers.current.push(window.setTimeout(() => sfx.lid(), closeSpan(OPEN_SPANS.lid)[0]), window.setTimeout(() => sfx.thump(0.7), CLOSE_TOTAL));
    Promise.all(anims.map((a) => a.finished))
      .then(() => router.push("/"))
      .catch(() => router.push("/"));
  }

  const party = section("party");
  const love = section("love");
  const solo = section("solo");
  return (
    <div className="gt-table gt-open" data-box={skin} ref={root}>
      <div className="gt-camdim" aria-hidden="true" ref={dim} />
      <div className="gt-stage" ref={stage}>
      {/* Предметы на столе (SVG макета), под содержимым */}
      <div className="gt-decor" aria-hidden="true" style={{ position: "absolute" }} dangerouslySetInnerHTML={{ __html: OPEN_DECOR }} />

      <div className="gt-inner">
        <header>
          <Link href="/" className={backTagClass()} onClick={closeBox}>
            ← На стол
          </Link>
        </header>
        <h1 className="gt-open-title">Чем займёмся?</h1>

        <nav aria-label="Разделы" className="gt-tray" ref={tray}>
          <span className="gt-tray-notch" aria-hidden="true" />
          <ul className="gt-tray-grid">
            <li>
              <PartyTile href={party.href} label={`${party.title}, ${party.who.toLowerCase()}`} />
            </li>
            <li>
              <LoveTile href={love.href} label={`${love.title}, ${love.who.toLowerCase()}`} />
            </li>
            <li>
              <DiaryTile href={solo.href} label={`${solo.title}, ${solo.who.toLowerCase()}`} />
            </li>
            <li>
              <ShowTile href="/show" label="GAZ GAME $HOW, квиз-шоу" />
            </li>
          </ul>
          {/* Папиросная бумага поверх лотка: тап или Enter убирают её */}
          {tissue !== "off" && (
            <div
              className="gt-tissue"
              data-state={tissue}
              role="button"
              tabIndex={tissue === "on" ? 0 : -1}
              aria-label="Убрать бумагу"
              onClick={tissueAway}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  tissueAway();
                }
              }}
            >
              <span className="gt-th gt-th-l" />
              <span className="gt-th gt-th-r" />
              <span className="gt-tissue-seal">GAZ</span>
              <span className="gt-tissue-tip">тапни, чтобы развернуть</span>
            </div>
          )}
        </nav>

        <nav aria-label="Ещё" className="gt-extras" ref={extras}>
          <AlbumExtra />
          <NoteExtra href={SUGGEST?.href ?? "/soon/suggest"} external={SUGGEST?.external} />
          <VipExtra href="/premium" />
        </nav>
      </div>

      {/* Крышка коробки лежит в углу. Памятка «Правила» лежит на ней и выезжает из-под нижнего края (край крышки её обрезает) */}
      <div className="gt-lidwrap" ref={lid}>
        <div className="gt-box gt-lid" data-skin={skin}>
          <BoxFace skin={skin} />
          <button
            type="button"
            className="gt-lid-insert"
            ref={memo}
            onClick={() => {
              sfx.page();
              setRules(true);
            }}
            aria-label="Правила за 10 секунд"
            aria-haspopup="dialog"
          >
            <b>ПРАВИЛА</b>
            <i>Внутри: 30+ игр, 4 раздела, 2 кубика.</i>
            <i>Открой то, что ближе.</i>
            <em>
              тапни <TapGlyph />
            </em>
          </button>
        </div>
      </div>
      </div>
      {rules && <BoxRulesSheet onClose={() => setRules(false)} />}
    </div>
  );
}
