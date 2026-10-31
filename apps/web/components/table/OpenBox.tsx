"use client";

// «Чем займёмся?» (экран 3 макета v6.4): открытая коробка — лоток с четырьмя плитками, нижний ряд и крышка с вкладышем «Правила».
// Открытие, как в макете: коробка «вылетает» со стола на место лотка (место передаёт главная через lib/box-flight),
// приподнимается и съезжает вправо вверх, остаётся торчать из угла; плитки выпрыгивают из лотка по очереди.
// Крышка — копия коробки в выбранном скине, поэтому вариантов открытия ровно пять (классика, песок, лёд, West, барокко).
// Если место коробки не передано (адрес, перезагрузка) или включено «Уменьшить движение» — коробка сразу открыта.
import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { backTagClass } from "@gazgame/ui";
import { clearBoxFlight, peekBoxFlight } from "@/lib/box-flight";
import { useBoxSkin } from "@/lib/box-skin";
import { prefersReducedMotion } from "@/lib/gaz";
import { HOME_SECTIONS, MINI_BUTTONS } from "@/lib/menu";
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

/** Где крышка остаётся после открытия: доля ширины и высоты лотка от его центра (как LK[3] в макете). */
const REST = { dx: 0.78, dy: -0.55, turn: 13 };
/** Крышка в углу меньше лотка (доля его ширины); при вылете она увеличивается и накрывает лоток целиком. */
const LID_K = 0.92;

/** Значок «тапни» — рука-указатель, без эмодзи. */
function TapGlyph() {
  return (
    <svg viewBox="0 0 16 19" width="9" height="11" aria-hidden="true" style={{ display: "inline-block", verticalAlign: "-2px" }}>
      <path
        d="M5.2 9.6V3.2a1.4 1.4 0 0 1 2.8 0v5l.5-.1V6.2a1.3 1.3 0 0 1 2.6 0v2.100l.5-.1V7.500a1.300 1.300 0 0 1 2.600 0v5.200c0 3.200-1.600 5.300-4.800 5.300-2.300 0-3.600-1.100-4.800-3L2 11.600a1.300 1.300 0 0 1 2.100-1.500l1.100 1.400z"
        fill="#fff"
        stroke="#1d2a6a"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function OpenBox() {
  const skin = useBoxSkin();
  const [rules, setRules] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const tray = useRef<HTMLElement>(null);
  const lid = useRef<HTMLDivElement>(null);
  const extras = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const rootEl = root.current;
    const trayEl = tray.current;
    const lidEl = lid.current;
    if (!rootEl || !trayEl || !lidEl) return;

    // Крышка лежит на лотке: ширина лотка, центр по центру лотка (до анимации измеряем, чтобы не мигала)
    const rr = rootEl.getBoundingClientRect();
    const tr = trayEl.getBoundingClientRect();
    const W = tr.width;
    const H = tr.height;
    const lidW = W * LID_K;
    lidEl.style.width = `${lidW}px`;
    const lidH = lidEl.offsetHeight;
    lidEl.style.left = `${tr.left - rr.left + (W - lidW) / 2}px`;
    lidEl.style.top = `${tr.top - rr.top + H / 2 - lidH / 2}px`;
    const rest = `translate(${REST.dx * W}px, ${REST.dy * H}px) rotate(${REST.turn}deg)`;
    lidEl.style.transform = rest;
    lidEl.dataset.ready = "true";

    const flight = peekBoxFlight();
    if (!flight || prefersReducedMotion() || typeof lidEl.animate !== "function") {
      clearBoxFlight();
      return;
    }

    const dx = flight.cx - (tr.left + W / 2);
    const dy = flight.cy - (tr.top + H / 2);
    const s0 = flight.w / lidW;
    const big = 1 / LID_K;
    const start = `translate(${dx}px, ${dy}px) rotate(${flight.rot}deg) scale(${s0})`;
    const cover = `translate(0px, 0px) rotate(0deg) scale(${big})`;
    const lift = `translate(0px, ${-0.046 * H}px) perspective(900px) rotateX(10deg) rotate(-1deg) scale(${big * 1.035})`;
    const mid = `translate(${0.4 * W}px, ${-0.42 * H}px) perspective(900px) rotateX(6deg) rotate(6deg) scale(${(big + 1) / 2 * 1.05})`;

    const anims: Animation[] = [];
    // 1) вылет: коробка со стола летит на лоток; лоток растёт из-под неё
    // 2) приподнимается, 3) съезжает вправо вверх и остаётся в углу
    anims.push(
      lidEl.animate(
        [
          { transform: start, offset: 0, easing: "cubic-bezier(.5,0,.25,1)" },
          { transform: cover, offset: 0.36 },
          { transform: lift, offset: 0.46, easing: "cubic-bezier(.5,0,.3,1)" },
          { transform: mid, offset: 0.74 },
          { transform: rest, offset: 1 },
        ],
        { duration: 1800, fill: "both" },
      ),
    );
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
    if (extras.current) {
      anims.push(extras.current.animate([{ opacity: 0, transform: "translateY(24px)" }, { opacity: 1, transform: "none" }], { duration: 500, delay: 1250, easing: "ease-out", fill: "both" }));
    }
    anims[0]?.finished
      .then(() => {
        anims.forEach((a) => a.cancel());
        lidEl.style.transform = rest;
        clearBoxFlight();
      })
      .catch(() => {});
    return () => anims.forEach((a) => a.cancel());
  }, []);

  const party = section("party");
  const love = section("love");
  const solo = section("solo");
  return (
    <div className="gt-table gt-open" data-box={skin} ref={root}>
      {/* Предметы на столе (SVG макета), под содержимым */}
      <div className="gt-decor" aria-hidden="true" style={{ position: "absolute" }} dangerouslySetInnerHTML={{ __html: OPEN_DECOR }} />

      <div className="gt-inner">
        <header>
          <Link href="/" className={backTagClass()}>
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
        <button type="button" className="gt-lid-insert" onClick={() => setRules(true)} aria-label="Правила за 10 секунд" aria-haspopup="dialog">
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
