// Значки полки стола (макет v6.4): пробковый диск и на нём предмет — кубики, блокнот правил, веер обоев, виниловая пластинка.
// Всё нарисовано разметкой и CSS (table-shelf.css), эмодзи нет. Подпись — деревянная бирка с выжженным текстом.
import type { ReactNode } from "react";
import { cn } from "@gazgame/ui";

/** Какие из 9 точек сетки грани — «глаза» (индексы 0..8), для граней 1..6. */
const PIPS = [[4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]];

function Cube({ turn }: { turn: string }) {
  return (
    <span className="gt-cube" style={{ transform: turn }}>
      <span className="gt-core" />
      <span className="gt-core gt-c1" />
      <span className="gt-core gt-c2" />
      {PIPS.map((on, n) => (
        <span key={n} className={`gt-fc gt-f${n + 1}`}>
          {Array.from({ length: 9 }, (_, i) => (
            <i key={i} className={on.includes(i) ? "p" : undefined} />
          ))}
        </span>
      ))}
    </span>
  );
}

/** Круглый пробковый диск; `dark` — тёмный (под винил). */
export function Cork({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <span className={cn("gt-cork", dark && "gt-cork-dark")} aria-hidden="true">
      {children}
    </span>
  );
}

/** Деревянная бирка с выжженной подписью. */
export function Plate({ children }: { children: ReactNode }) {
  return <span className="gt-plate">{children}</span>;
}

/** Два кубика, лежащие под углом. */
export function DiceIcon() {
  return (
    <Cork>
      <span className="gt-pair">
        <span className="gt-pd" style={{ left: 21, top: 9 }}>
          <Cube turn="rotateX(-32deg) rotateY(28deg) rotateZ(10deg)" />
        </span>
        <span className="gt-pd" style={{ left: 8, top: 19 }}>
          <Cube turn="rotateX(-26deg) rotateY(-40deg) rotateZ(-14deg)" />
        </span>
      </span>
    </Cork>
  );
}

/** Брошюра с правилами. */
export function RulesIcon() {
  return (
    <Cork>
      <span className="gt-book">
        <span className="gt-bk2" />
        <span className="gt-bk1">
          <b />
        </span>
      </span>
    </Cork>
  );
}

/** Веер из трёх образцов обоев на булавке. */
export function WallsIcon() {
  return (
    <Cork>
      <span className="gt-fan">
        <i className="gt-sw gt-sw-a" />
        <i className="gt-sw gt-sw-b" />
        <i className="gt-sw gt-sw-c" />
        <i className="gt-pin" />
      </span>
    </Cork>
  );
}

/** Виниловая пластинка с оранжевой этикеткой; крутится, пока играет музыка. */
export function VinylIcon({ playing }: { playing: boolean }) {
  return (
    <Cork dark>
      <span className="gt-rec">
        <svg viewBox="0 0 100 100" className="gt-rec-svg" data-playing={playing} aria-hidden="true">
          <defs>
            <radialGradient id="gt-vn" cx=".5" cy=".5" r=".5">
              <stop offset=".3" stopColor="#2a2a2e" />
              <stop offset=".31" stopColor="#0c0c0e" />
              <stop offset="1" stopColor="#050506" />
            </radialGradient>
            <linearGradient id="gt-vs" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset=".45" stopColor="#fff" stopOpacity=".22" />
              <stop offset=".55" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="49" fill="url(#gt-vn)" stroke="#000" strokeWidth="1" />
          <g fill="none" stroke="#2c2c32" strokeWidth=".6">
            {[44, 40, 36, 32, 28, 24].map((r) => (
              <circle key={r} cx="50" cy="50" r={r} />
            ))}
          </g>
          <circle cx="50" cy="50" r="17" fill="#ff7a1a" />
          <circle cx="50" cy="50" r="17" fill="none" stroke="#c9a14e" strokeWidth="1" />
          <text x="50" y="47" textAnchor="middle" fontFamily="Unbounded Variable, Arial" fontWeight="800" fontSize="7" fill="#1a0c04">
            GAZ
          </text>
          <text x="50" y="56" textAnchor="middle" fontFamily="Manrope Variable, Arial" fontWeight="800" fontSize="3.6" letterSpacing=".5" fill="#1a0c04">
            TIPTOES
          </text>
          <path d="M38 50a12 12 0 0 1 4-9" stroke="#fff" strokeOpacity=".5" strokeWidth="1.2" fill="none" />
          <circle cx="50" cy="50" r="2.2" fill="#d8dce2" />
          <circle cx="50" cy="50" r="49" fill="url(#gt-vs)" />
        </svg>
      </span>
    </Cork>
  );
}
