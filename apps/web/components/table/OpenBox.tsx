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
  const dim = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const busy = useRef(false);
  const geo = useRef<{ shape: (k: number) => { left: string; top: string; width: string; height: string }; W: number; H: number; rest: string } | null>(null);

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

    // Крышка лежит на лотке и по размеру равна ему (портретная): так она накрывает лоток целиком, как в макете
    const rr = rootEl.getBoundingClientRect();
    const tr = trayEl.getBoundingClientRect();
    const W = tr.width;
    const H = tr.height;
    const left = tr.left - rr.left;
    const top = tr.top - rr.top;
    const rest = `translate(${REST.dx * W}px, ${REST.dy * H}px) rotate(${REST.turn}deg)`;
    // k = 0: портретная крышка на весь лоток (при вылете); k = 1: она же, но ниже и шире по пропорциям коробки — такой лежит в углу
    const Hr = W * REST.ratio;
    const shape = (k: number) => {
      const h = H + (Hr - H) * k;
      return { left: `${left}px`, top: `${top + (H - h) / 2}px`, width: `${W}px`, height: `${h}px` };
    };
    Object.assign(lidEl.style, { ...shape(1), transform: rest });
    lidEl.dataset.ready = "true";
    geo.current = { shape, W, H, rest };

    const flight = peekBoxFlight();
    if (!flight || prefersReducedMotion() || typeof lidEl.animate !== "function") {
      clearBoxFlight();
      return;
    }

    const onTray = (transform: string, k = 0) => ({ ...shape(k), transform });
    const start = {
      left: `${flight.cx - flight.w / 2 - rr.left}px`,
      top: `${flight.cy - flight.h / 2 - rr.top}px`,
      width: `${flight.w}px`,
      height: `${flight.h}px`,
      transform: `rotate(${flight.rot}deg)`,
    };
    const cover = onTray("rotate(0deg)");
    const lift = onTray(`translate(0px, ${-0.046 * H}px) perspective(900px) rotateX(10deg) rotate(-1deg) scale(1.035)`);
    const mid = onTray(`translate(${0.4 * W}px, ${-0.42 * H}px) perspective(900px) rotateX(6deg) rotate(6deg) scale(1.05)`, 0.5);
    const end = onTray(rest, 1);

    sfx.arm();
    const anims: Animation[] = [];
    // 1) вылет: коробка летит на лоток и растягивается на него; лоток растёт из-под неё
    // 2) приподнимается, 3) съезжает вправо вверх и остаётся в углу
    const lidAnim = lidEl.animate(
      [
        { ...start, offset: 0, easing: "cubic-bezier(.5,0,.25,1)" },
        { ...cover, offset: 0.36 },
        { ...lift, offset: 0.46, easing: "cubic-bezier(.5,0,.3,1)" },
        { ...mid, offset: 0.74 },
        { ...end, offset: 1 },
      ],
      { duration: 1800, fill: "both" },
    );
    anims.push(lidAnim);
    timers.current.push(window.setTimeout(() => sfx.lid(), 620));
    anims.push(
      trayEl.animate(
        [
          { opacity: 0, transform: `scale(${Math.max(0.45, (flight.w / W) * 0.9)})` },
          { opacity: 1, transform: "none" },
        ],
        { duration: 650, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" },
      ),
    );
    // плитки выпрыгивают из лотка по очереди, когда крышка приподнялась
    trayEl.querySelectorAll<HTMLElement>(".gt-tray-grid > li").forEach((li, i) => {
      anims.push(
        li.animate(
          [
            { opacity: 0, transform: "translateY(26px) scale(0.6)" },
            { opacity: 1, transform: "translateY(-4px) scale(1.04)", offset: 0.7 },
            { opacity: 1, transform: "none" },
          ],
          { duration: 520, delay: 800 + i * 110, easing: "cubic-bezier(.3,1.2,.4,1)", fill: "both" },
        ),
      );
    });
    // стол затемнён, пока коробка летит и открывается (виньетка камеры в макете), потом светлеет
    if (dim.current) {
      anims.push(dim.current.animate([{ opacity: 1, offset: 0 }, { opacity: 1, offset: 0.4 }, { opacity: 0, offset: 0.8 }], { duration: 1800, fill: "both" }));
    }
    if (extras.current) {
      anims.push(extras.current.animate([{ opacity: 0, transform: "translateY(24px)" }, { opacity: 1, transform: "none" }], { duration: 500, delay: 1250, easing: "ease-out", fill: "both" }));
    }
    lidAnim.finished
      .then(() => {
        sfx.thump(0.45);
        anims.forEach((a) => a.cancel());
        Object.assign(lidEl.style, onTray(rest, 1));
        clearBoxFlight();
        // бумага сама убирается через 0,65 с после того, как крышка легла
        if (withTissue.current) timers.current.push(window.setTimeout(tissueAway, 650));
      })
      .catch(() => {});
    return () => {
      anims.forEach((a) => a.cancel());
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
  }, [tissueAway]);

  /** «На стол»: крышка возвращается на лоток, коробка сжимается и летит на своё место на столе, потом переход. */
  function closeBox(e: MouseEvent<HTMLAnchorElement>) {
    const lidEl = lid.current;
    const trayEl = tray.current;
    const rootEl = root.current;
    const g = geo.current;
    if (e.metaKey || e.ctrlKey || e.shiftKey || prefersReducedMotion() || !lidEl || !trayEl || !rootEl || !g || typeof lidEl.animate !== "function") return; // обычный переход
    e.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setTissue("off");
    const { shape, W, H, rest } = g;
    const onTray = (transform: string, k = 0) => ({ ...shape(k), transform });
    const rr = rootEl.getBoundingClientRect();
    const target = lastBoxFlight();
    sfx.lid();
    const back = lidEl.animate(
      [
        { ...onTray(rest, 1), offset: 0 },
        { ...onTray(`translate(${0.4 * W}px, ${-0.42 * H}px) perspective(900px) rotateX(6deg) rotate(6deg) scale(1.05)`, 0.5), offset: 0.3 },
        { ...onTray(`translate(0px, ${-0.046 * H}px) perspective(900px) rotateX(10deg) rotate(-1deg) scale(1.035)`), offset: 0.62 },
        { ...onTray("rotate(0deg)"), offset: 1 },
      ],
      { duration: 720, easing: "cubic-bezier(.5,0,.3,1)", fill: "both" },
    );
    back.finished
      .then(() => {
        sfx.thump(0.7);
        if (!target) {
          router.push("/");
          return undefined;
        }
        // сжимаемся до размера коробки и улетаем на её место; лоток уходит из-под крышки
        const to = {
          left: `${target.cx - target.w / 2 - rr.left}px`,
          top: `${target.cy - target.h / 2 - rr.top}px`,
          width: `${target.w}px`,
          height: `${target.h}px`,
          transform: `rotate(${target.rot}deg)`,
        };
        const fly = lidEl.animate([{ ...onTray("rotate(0deg)") }, to], { duration: 620, easing: "cubic-bezier(.5,0,.25,1)", fill: "both" });
        trayEl.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: `scale(${Math.max(0.45, (target.w / W) * 0.9)})` }], { duration: 620, easing: "cubic-bezier(.5,0,.25,1)", fill: "both" });
        rootEl.querySelectorAll<HTMLElement>(".gt-extras, .gt-open-title").forEach((el) => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "both" }));
        return fly.finished.then(() => router.push("/"));
      })
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
              <ShowTile href="/soon/show" label="GAZ GAME $HOW, квиз-шоу: скоро" />
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

      {/* Крышка коробки: лежит в углу, торчит вкладыш «Правила» */}
      <div className="gt-box gt-lid" data-skin={skin} ref={lid}>
        <BoxFace skin={skin} />
        <button
          type="button"
          className="gt-lid-insert"
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
      {rules && <BoxRulesSheet onClose={() => setRules(false)} />}
    </div>
  );
}
