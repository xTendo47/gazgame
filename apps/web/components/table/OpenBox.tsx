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
const REST = { dx: 0.63, dy: -0.6, turn: 13, ratio: 211 / 300 };

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
/** Памятка: спрятана под нижним краем крышки → выдвинута (тот же вид, что в CSS). */
const MEMO: Keyframe[] = [
  { transform: "translateY(-100%) rotate(0deg)" },
  { transform: "translateY(-46%) rotate(-5deg)" },
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
  const geo = useRef<{ tx: number; ty: number; W: number; H: number; rest: string; hover: string; shape: (k: number) => Record<string, string> } | null>(null);

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

    // Крышка по размеру равна лотку по ширине и лежит центром на лотке; размер не меняется, двигается только transform
    const rr = rootEl.getBoundingClientRect();
    const tr = trayEl.getBoundingClientRect();
    const W = tr.width;
    const H = tr.height;
    const left = tr.left - rr.left;
    const top = tr.top - rr.top;
    const rest = pose(REST.dx * W, REST.dy * H, 0, REST.turn, 1);
    const hover = pose(0, -0.05 * H, 14, 0, 1.04);
    const Hr = W * REST.ratio;
    const shape = (k: number) => {
      const h = H + (Hr - H) * k;
      return { left: `${left}px`, top: `${top + (H - h) / 2}px`, width: `${W}px`, height: `${h}px` };
    };
    Object.assign(lidEl.style, { ...shape(1), transform: rest });
    lidEl.dataset.ready = "true";
    geo.current = { tx: left + W / 2, ty: top + H / 2, W, H, rest, hover, shape };
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
    const fromTable = pose(flight.cx - rr.left - (left + W / 2), flight.cy - rr.top - (top + H / 2), 0, flight.rot, flight.w / W);
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
    const rr = rootEl.getBoundingClientRect();
    const target = lastBoxFlight();
    const anims: Animation[] = [];
    const play = (el: Element | null, frames: Keyframe[], span: Span, easing: string) => {
      if (!el) return;
      const [start, end] = closeSpan(span);
      anims.push(el.animate([...frames].reverse(), { delay: start, duration: end - start, easing, fill: "both" }));
    };

    const toTable = target
      ? pose(target.cx - rr.left - g.tx, target.cy - rr.top - g.ty, 0, target.rot, target.w / g.W)
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
      {/* Предметы на столе (SVG макета), под содержимым */}
      <div className="gt-decor" aria-hidden="true" style={{ position: "absolute" }} dangerouslySetInnerHTML={{ __html: OPEN_DECOR }} />
      <div className="gt-camdim" aria-hidden="true" ref={dim} />

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

      {/* Крышка коробки лежит в углу. Памятка «Правила» — отдельный листок под её нижним краем: выдвигается из коробки */}
      <div className="gt-lidwrap" ref={lid}>
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
        <div className="gt-box gt-lid" data-skin={skin}>
          <BoxFace skin={skin} />
        </div>
      </div>
      {rules && <BoxRulesSheet onClose={() => setRules(false)} />}
    </div>
  );
}
