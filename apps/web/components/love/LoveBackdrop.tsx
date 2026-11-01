// Задний план «Романтики» для экранов игр и итогов: винная слива, лучи, полоска кружева сверху и бархат с розовой линией внизу.
// Лежит под содержимым (fixed, z-index −1); цвета карточек, кнопок и плашек внутри страницы перекрашивает класс .lv-skin (love-game.css).
import { LACE } from "./love-art";
import "./love.css";
import "./love-game.css";

export function LoveBackdrop() {
  return (
    <div className="lv-backdrop" aria-hidden="true" style={{ "--lv-lace": `url("${LACE}")` } as React.CSSProperties}>
      <span className="lv-beams" />
      <span className="lv-backlace" />
      <span className="lv-velvet" />
    </div>
  );
}
