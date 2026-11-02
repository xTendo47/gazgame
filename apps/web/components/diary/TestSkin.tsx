// Оформление экранов теста (прохождение, результат, «Глубже»): розыск, клиника или общий стиль Дневника.
// Фон лежит под страницей (fixed), весь экран — на «листе» (плакат, выписка, страница в линейку); токены цвета листа
// перекрашены в test-skin.css, поэтому карточки и кнопки внутри остаются теми же компонентами.
import type { ReactNode } from "react";
import { Screen } from "@gazgame/ui";
import type { TestTheme } from "@/lib/test-theme";
import "./test-skin.css";

/** Симметричная «клякса Роршаха» для клиники. */
function Blot({ className }: { className?: string }) {
  const d = "M0-24c6-4 14-2 17 4 2 4 0 8 4 11 4 3 3 9-2 11-3 1-3 4-1 6 2 3-1 7-5 6-4-1-5 2-4 5 0 3-3 5-6 3-3-2-3-6-3-9z";
  return (
    <svg className={className} viewBox="-30 -30 60 62" aria-hidden="true">
      <path d={d} fill="currentColor" />
      <path d={d} fill="currentColor" transform="scale(-1 1)" />
    </svg>
  );
}

function Star() {
  return (
    <svg viewBox="-12 -12 24 24" aria-hidden="true">
      <path d="M0-10l2.900 6.200 6.800-.8-4.200 5.400 4.200 5.400-6.800-.8L0 10l-2.900-6.200-6.800.8 4.200-5.400-4.200-5.400 6.800.8z" fill="currentColor" />
      <circle r="2.600" fill="var(--ts-sheet)" />
    </svg>
  );
}

export function TestSkin({ theme, children }: { theme: TestTheme; children: ReactNode }) {
  return (
    <>
      <div className="ts-backdrop" data-theme={theme} aria-hidden="true">
        {theme === "cosmos" && <span className="ts-planet" />}
        {theme === "wanted" && <span className="ts-holes" />}
        {theme === "clinic" && <Blot className="ts-blot" />}
      </div>
      <Screen className="ts-skin">
        <div className="ts-sheet" data-theme={theme}>
          {theme === "wanted" && (
            <p className="ts-banner" aria-hidden="true">
              <Star /> WANTED <Star />
            </p>
          )}
          {theme === "clinic" && <Blot className="ts-blot-sheet" />}
          {theme === "clinic" && (
            <p className="ts-banner" aria-hidden="true">
              <span>КЛИНИКА GAZ · ВЫПИСНОЙ ЭПИКРИЗ</span>
              <span>ФОРМА № 027/У</span>
            </p>
          )}
          {theme === "cosmos" && (
            <p className="ts-banner" aria-hidden="true">
              <span>ГЛУБЖЕ</span>
              <span>PREMIUM</span>
            </p>
          )}
          {children}
        </div>
      </Screen>
    </>
  );
}
