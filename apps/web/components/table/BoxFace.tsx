// Лицо коробки GAZ GAME: плашка, неоновое название, штрихкод, печать, 16+, «Играть», кромка. Рисунок скина — поверх фона.
// Одно и то же на столе (сама коробка) и на «Чем займёмся?» (крышка), поэтому вынесено. Цвета берёт из переменных скина (.gt-table[data-box]).
import { useId } from "react";
import { SKIN_ART } from "./decor-art";
import type { BoxSkinId } from "@/lib/box-skin";

/** Значок «играть» — треугольник; текстовый ▶ на iPhone превращается в цветной эмодзи. */
export function PlayGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 12 14" width={size * 0.86} height={size} aria-hidden="true" style={{ display: "inline-block", flex: "none" }}>
      <path d="M1.5 1.2v11.6a.7.7 0 0 0 1.07.6l9-5.8a.7.7 0 0 0 0-1.2l-9-5.8A.7.7 0 0 0 1.5 1.2z" fill="currentColor" />
    </svg>
  );
}

export function BoxFace({ skin }: { skin: BoxSkinId }) {
  const ringId = `gt-ring-${useId().replace(/:/g, "")}`;
  return (
    <>
      {skin !== "classic" && <span className="gt-box-art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: SKIN_ART[skin] }} />}
      <span className="gt-box-band">
        <span>НАСТОЛЬНАЯ ИГРА</span>
        <span>1–10 игроков</span>
      </span>
      <span className="gt-box-title">
        <b>GAZ</b> GAME
      </span>
      <span className="gt-box-tag">Не сиди. Не тупи. Играй!</span>
      <span className="gt-box-bar" aria-hidden="true">
        <i />
        <span>4 607001 202616</span>
      </span>
      <span className="gt-box-stamp" aria-hidden="true">
        <svg viewBox="0 0 60 60">
          <defs>
            <path id={ringId} d="M30 30m-21 0a21 21 0 1 1 42 0a21 21 0 1 1-42 0" />
          </defs>
          <circle cx="30" cy="30" r="28.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="30" cy="30" r="15" fill="none" stroke="currentColor" strokeWidth="0.9" />
          <text fontSize="5.4" fontWeight="800" letterSpacing="0.9" fill="currentColor" fontFamily="Manrope Variable, sans-serif">
            <textPath href={`#${ringId}`}>GAZ GAME · ИГРОВОЙ ВЕЧЕР · </textPath>
          </text>
          <text x="30" y="34.5" textAnchor="middle" fontSize="12" fontWeight="900" fontStyle="italic" fill="currentColor" fontFamily="Playfair Display, serif">
            GAZ
          </text>
        </svg>
      </span>
      <span className="gt-box-b16" aria-hidden="true">
        16+
      </span>
      <span className="gt-box-b30" aria-hidden="true">
        <span>
          <b>30+</b>игр
        </span>
      </span>
      <span className="gt-box-play">
        Играть <PlayGlyph size={17} />
      </span>
      <span className="gt-box-foot" aria-hidden="true">
        ОТКРЫВАТЬ С ДРУЗЬЯМИ ✦
      </span>
      <span className="gt-box-side" aria-hidden="true">
        <i />
        <span>ТИРАЖ № 001 · 30+ ИГР · ВОЗРАСТ 16+ · СДЕЛАНО В GAZ</span>
        <i />
      </span>
    </>
  );
}
