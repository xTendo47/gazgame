"use client";

// Общая анимация карт для всех разделов (Тусовка, Романтика, Дневник, $HOW). Образец — макет v6.4 (gaz-design-v6-4.html):
// riffle() + deal() + deal5 — тасовка, потом карты по очереди вылетают из колоды и ложатся на стол; zoom() — карта поднимается
// и выезжает вперёд; кубики «наугад» катятся, колода тасуется, выбранная карта выезжает вперёд.
// Как подключить: корню экрана — ref из хука, каждой карте — data-card и data-card-index (номер карточки в списке),
// у закрытых и «скоро» ещё data-soon / data-locked, кубикам — data-dice. Анимируются только transform и opacity (WAAPI).
// Повторные нажатия, пока идёт анимация, игнорируются; при «Уменьшить движение» всё происходит сразу, без движения.
// Звуки — lib/sfx.ts (Web Audio, громкость общим ползунком «Звуки»).
import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { prefersReducedMotion } from "@/lib/gaz";
import { sfx } from "@/lib/sfx";
import "@/components/cards/cards-anim.css";

export type CardVariant = "party" | "love" | "solo" | "show";

const CARDS = "[data-card]";
/** Пауза между картами при раздаче, мс (в макете 85). */
const STEP = 85;
/** Раздача начинается после тасовки колоды, мс (в макете 0,85 с). */
const DEAL_AFTER = 850;
const NICE = "cubic-bezier(.3,.7,.3,1)";

/** Текущий наклон карты (из её CSS-transform), градусы: к нему карта должна вернуться в конце анимации. */
function tiltOf(el: Element): number {
  const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
  return (Math.atan2(m.b, m.a) * 180) / Math.PI;
}

/** Во сколько раз экран увеличен через CSS zoom (колоды «Тусовки» рисуются в «макетной» ширине): смещения в пикселях экрана делим на это число. */
function zoomOf(root: HTMLElement): number {
  return parseFloat(getComputedStyle(root).getPropertyValue("--z")) || 1;
}

function center(r: DOMRect) {
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export interface CardAnim {
  /** Тап по карте: карта поднимается и выезжает вперёд, потом вызываем done. Закрытая или «скоро» — короткое покачивание. */
  open: (card: HTMLElement, done: () => void) => void;
  /** «Наугад»: кубики катятся, колода тасуется, выбранная карта выезжает вперёд; в done приходит номер её карточки. */
  roll: (done: (index: number | undefined) => void) => void;
}

/** Возвращает [корень, управление]: ref корня вешаем на контейнер экрана; свой ref можно передать вторым аргументом. */
export function useCardAnim(variant: CardVariant, rootRef?: RefObject<HTMLDivElement | null>): [RefObject<HTMLDivElement | null>, CardAnim] {
  const own = useRef<HTMLDivElement>(null);
  const ref = rootRef ?? own;
  const busy = useRef(false);
  const anims = useRef<Animation[]>([]);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const track = (a: Animation | undefined) => {
    if (a) anims.current.push(a);
    return a;
  };

  /** Пачка рубашек в центре: тасуется (разъезжаются и сходятся) и улетает. Возвращает, сколько мс идёт. */
  const riffle = (atY = 0.44) => {
      const rf = document.createElement("div");
      rf.className = "ca-riffle";
      rf.dataset.variant = variant;
      rf.style.top = `${Math.round(window.innerHeight * atY)}px`;
      rf.innerHTML = Array.from({ length: 12 }, (_, k) => `<i style="--k:${k};--side:${k % 2 ? 1 : -1};--dd:${(0.3 + k * 0.035).toFixed(3)}s"></i>`).join("");
      document.body.appendChild(rf);
      later(() => rf.remove(), 1250);
      sfx.riffle(0.3, 12);
      return 850;
    };

  // раздача при показе экрана колоды
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion() || typeof root.animate !== "function") return;
    const cards = Array.from(root.querySelectorAll<HTMLElement>(CARDS));
    if (!cards.length) return;
    sfx.arm();
    const k = zoomOf(root);
    const ox = window.innerWidth / 2;
    const oy = window.innerHeight * 0.44;
    riffle();
    cards.forEach((card, i) => {
      const r = card.getBoundingClientRect();
      const c = center(r);
      const fx = (ox - c.x) / k;
      const fy = (oy - c.y) / k;
      const a = tiltOf(card);
      const delay = DEAL_AFTER + 50 + Math.min(i, 14) * STEP;
      track(
        card.animate(
          [
            { opacity: 0, transform: `translate(${fx}px, ${fy}px) rotate(${a - 190}deg) scale(.3)`, offset: 0 },
            { opacity: 1, offset: 0.1 },
            { transform: `translate(${fx * 0.35}px, ${fy * 0.35 - 80}px) rotate(${a + 16}deg) scale(.92)`, offset: 0.55 },
            { transform: `translateY(-6px) rotate(${a - 2}deg) scale(1.03)`, offset: 0.8 },
            { transform: `translateY(1.5px) rotate(${a}deg) scale(.99, 1.01)`, offset: 0.9 },
            { opacity: 1, transform: `rotate(${a}deg)`, offset: 1 },
          ],
          { duration: 760, delay, easing: NICE, fill: "backwards" },
        ),
      );
      if (i < 10) {
        const t = (DEAL_AFTER + 50 + i * STEP) / 1000;
        sfx.swish(t);
        sfx.tap(t + 0.6);
      }
    });
    return () => {
      anims.current.forEach((a) => a.cancel());
      anims.current = [];
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
      document.querySelectorAll(".ca-riffle").forEach((e) => e.remove());
    };
    // раздаём один раз при показе экрана
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      anims.current.forEach((a) => a.cancel());
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  /** Карта поднимается, чуть поворачивается и выезжает в центр экрана; остальные темнеют. */
  const lift = (root: HTMLElement, card: HTMLElement, after: () => void) => {
      const k = zoomOf(root);
      const r = card.getBoundingClientRect();
      const c = center(r);
      const zx = (window.innerWidth / 2 - c.x) / k;
      const zy = (window.innerHeight * 0.44 - c.y) / k;
      const a = tiltOf(card);
      // широкие плитки не должны вылезать за экран: увеличение ограничено шириной окна
      const grow = Math.min(1.5, (window.innerWidth * 0.94) / r.width);
      card.style.zIndex = "30";
      root.querySelectorAll<HTMLElement>(CARDS).forEach((o) => {
        if (o !== card) track(o.animate([{ opacity: 1 }, { opacity: 0.18 }], { duration: 300, fill: "forwards" }));
      });
      sfx.flip();
      const an = track(
        card.animate(
          [
            { transform: `rotate(${a}deg)`, offset: 0 },
            { transform: `translateY(-14px) rotate(${a}deg) scale(1.06)`, offset: 0.28 },
            { transform: `translate(${zx}px, ${zy}px) perspective(800px) rotateY(14deg) rotate(0deg) scale(${grow * 0.97})`, offset: 0.75 },
            { transform: `translate(${zx}px, ${zy}px) perspective(800px) rotateY(0deg) rotate(0deg) scale(${grow})`, offset: 1 },
          ],
          { duration: 520, easing: NICE, fill: "forwards" },
        ),
      );
      const finish = () => {
        sfx.tap();
        after();
        // если экран не сменился (шторка, «скоро»), возвращаем карты на место
        later(() => {
          anims.current.forEach((x) => x.cancel());
          anims.current = [];
          card.style.zIndex = "";
          busy.current = false;
        }, 700);
      };
      if (an) an.finished.then(finish).catch(() => (busy.current = false));
      else finish();
    };

  const open = (card: HTMLElement, done: () => void) => {
      const root = ref.current;
      if (busy.current) return;
      if (!root || prefersReducedMotion() || typeof card.animate !== "function") {
        sfx.flip();
        done();
        return;
      }
      busy.current = true;
      if (card.hasAttribute("data-soon") || card.hasAttribute("data-locked")) {
        // закрытая карта: покачивается, как замок в макете (jig)
        const a = tiltOf(card);
        sfx.lock();
        const an = track(
          card.animate(
            [
              { transform: `rotate(${a}deg)` },
              { transform: `rotate(${a - 3}deg) translateX(-3px)` },
              { transform: `rotate(${a + 3}deg) translateX(3px)` },
              { transform: `rotate(${a - 2}deg) translateX(-2px)` },
              { transform: `rotate(${a}deg)` },
            ],
            { duration: 340, easing: "ease-in-out" },
          ),
        );
        done();
        if (an) an.finished.then(() => (busy.current = false)).catch(() => (busy.current = false));
        else busy.current = false;
        return;
      }
      lift(root, card, done);
    };

  const roll = (done: (index: number | undefined) => void) => {
      const root = ref.current;
      if (busy.current) return;
      const pool = root ? Array.from(root.querySelectorAll<HTMLElement>(CARDS)).filter((c) => !c.hasAttribute("data-soon") && !c.hasAttribute("data-locked")) : [];
      if (!root || prefersReducedMotion() || typeof root.animate !== "function" || !pool.length) {
        sfx.rattle(true);
        done(undefined);
        return;
      }
      busy.current = true;
      const dice = root.querySelector<HTMLElement>("[data-dice]");
      // 1) кубики катятся: прыгают по столу с поворотами, стук о стол
      sfx.rattle(true);
      if (dice) {
        track(
          dice.animate(
            [
              { transform: "translate(0,0) rotate(0deg)", offset: 0 },
              { transform: "translate(-26px,22px) rotate(-200deg)", offset: 0.25 },
              { transform: "translate(-14px,6px) rotate(-300deg)", offset: 0.45 },
              { transform: "translate(-34px,26px) rotate(-420deg)", offset: 0.7 },
              { transform: "translate(0,0) rotate(-360deg)", offset: 1 },
            ],
            { duration: 1100, easing: "cubic-bezier(.4,0,.3,1)" },
          ),
        );
      }
      later(() => sfx.knock(0.6), 260);
      later(() => sfx.knock(0.45, 0.05), 520);
      later(() => sfx.clack(0.5), 780);
      later(() => sfx.knock(0.35), 980);
      // 2) колода тасуется: все карты сходятся в центр и расходятся обратно
      const shuffleAt = 1100;
      const k = zoomOf(root);
      const ox = window.innerWidth / 2;
      const oy = window.innerHeight * 0.44;
      const all = Array.from(root.querySelectorAll<HTMLElement>(CARDS));
      later(() => {
        sfx.riffle(0, 12);
        all.forEach((card, i) => {
          const c = center(card.getBoundingClientRect());
          const a = tiltOf(card);
          const gx = (ox - c.x) / k;
          const gy = (oy - c.y) / k;
          track(
            card.animate(
              [
                { transform: `rotate(${a}deg)`, offset: 0 },
                { transform: `translate(${gx}px, ${gy}px) rotate(${(i % 2 ? 1 : -1) * 8}deg) scale(.5)`, offset: 0.45 },
                { transform: `translate(${gx}px, ${gy}px) rotate(${(i % 2 ? -1 : 1) * 5}deg) scale(.5)`, offset: 0.6 },
                { transform: `rotate(${a}deg)`, offset: 1 },
              ],
              { duration: 900, delay: Math.min(i, 8) * 25, easing: "cubic-bezier(.45,0,.3,1)" },
            ),
          );
        });
      }, shuffleAt);
      // 3) выбранная карта выезжает вперёд
      const pick = pool[Math.floor(Math.random() * pool.length)] as HTMLElement;
      later(() => {
        anims.current.forEach((x) => x.cancel());
        anims.current = [];
        lift(root, pick, () => {
          const idx = Number(pick.dataset.cardIndex);
          done(Number.isFinite(idx) ? idx : undefined);
        });
      }, shuffleAt + 1000);
    };

  return [ref, { open, roll }];
}
