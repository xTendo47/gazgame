// Искры-огоньки: летят снизу вверх и гаснут. Только CSS-анимация transform и opacity — телефон не нагружается.
// Позиции «случайные», но с постоянным зерном: сервер и браузер рисуют одно и то же (без прыжков при загрузке).
import type { CSSProperties } from "react";
import { seededRandom } from "@gazgame/engine";

export function Embers({ count, seed, rise }: { count: number; seed: number; rise: [number, number] }) {
  const random = seededRandom(seed);
  const embers = Array.from({ length: count }, () => {
    const duration = 2.5 + random() * 2.5;
    const small = random() < 0.4;
    return {
      left: `${(5 + random() * 90).toFixed(1)}%`,
      size: small ? 3 : 4,
      dx: `${Math.round(random() * 40 - 20)}px`,
      dy: `${-Math.round(rise[0] + random() * (rise[1] - rise[0]))}px`,
      duration: `${duration.toFixed(2)}s`,
      delay: `${(-random() * duration).toFixed(2)}s`,
    };
  });
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]">
      {embers.map((e, i) => (
        <i
          key={i}
          className="ember"
          style={
            {
              left: e.left,
              width: e.size,
              height: e.size,
              "--dx": e.dx,
              "--dy": e.dy,
              animationDuration: e.duration,
              animationDelay: e.delay,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}
