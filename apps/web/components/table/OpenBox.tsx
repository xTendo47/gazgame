// «Чем займёмся?» (экран 3 макета v6.4): открытая коробка — лоток с четырьмя плитками и нижний ряд:
// «Коллекция», «Предложи своё», VIP-кейс. Тусовка, Романтика, Дневник ведут в свои разделы; GAZ GAME $HOW закрыт («скоро»).
// Плитки — SVG + CSS (Tiles.tsx), с живыми эффектами; тексты настоящие. Открытие коробки (анимация крышки) — следующий шаг.
import Link from "next/link";
import { backTagClass } from "@gazgame/ui";
import { HOME_SECTIONS, MINI_BUTTONS } from "@/lib/menu";
import { OPEN_DECOR } from "./decor-art";
import { AlbumExtra, DiaryTile, LoveTile, NoteExtra, PartyTile, ShowTile, VipExtra } from "./Tiles";
import "./table.css";
import "./table-decor.css";
import "./table-open.css";

/** Раздел меню по id (список в lib/menu.ts всегда содержит все три). */
const section = (id: "party" | "love" | "solo") => HOME_SECTIONS.find((s) => s.id === id)!;
const SUGGEST = MINI_BUTTONS.find((m) => m.id === "suggest");

export function OpenBox() {
  const party = section("party");
  const love = section("love");
  const solo = section("solo");
  return (
    <div className="gt-table gt-open">
      {/* Предметы на столе (SVG макета), под содержимым */}
      <div className="gt-decor" aria-hidden="true" style={{ position: "absolute" }} dangerouslySetInnerHTML={{ __html: OPEN_DECOR }} />

      <div className="gt-inner">
        <header>
          <Link href="/" className={backTagClass()}>
            ← На стол
          </Link>
        </header>
        <h1 className="gt-open-title">Чем займёмся?</h1>

        <nav aria-label="Разделы" className="gt-tray">
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

        <nav aria-label="Ещё" className="gt-extras">
          <AlbumExtra />
          <NoteExtra href={SUGGEST?.href ?? "/soon/suggest"} external={SUGGEST?.external} />
          <VipExtra href="/premium" />
        </nav>
      </div>
    </div>
  );
}
