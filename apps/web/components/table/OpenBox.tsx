// «Чем займёмся?» (экран 3 макета v6.4): открытая коробка — лоток с четырьмя плитками и нижний ряд:
// «Коллекция», «Предложи своё», VIP-кейс. Тусовка, Романтика, Дневник ведут в свои разделы; GAZ GAME $HOW закрыт («скоро»).
// Картинки плиток вырезаны из макета (public/table/*.webp, 2x, прозрачный фон); рамка лотка, подписи для экранных
// дикторов, замок и ссылки — разметка. Открытие коробки (анимация крышки) — следующий шаг.
import Image from "next/image";
import Link from "next/link";
import { backTagClass } from "@gazgame/ui";
import { CollectionDot } from "@/components/collection/CollectionDot";
import { TrackedLink } from "@/components/home/TrackedLink";
import { HOME_SECTIONS, MINI_BUTTONS } from "@/lib/menu";
import { OPEN_DECOR } from "./decor-art";
import "./table.css";
import "./table-decor.css";
import "./table-open.css";

/** Раздел меню по id (список в lib/menu.ts всегда содержит все три). */
const section = (id: "party" | "love" | "solo") => HOME_SECTIONS.find((s) => s.id === id)!;
const SUGGEST = MINI_BUTTONS.find((m) => m.id === "suggest");

/** Размеры картинок (CSS-пиксели): плитка 163×192, нижний ряд — по своим размерам. */
const TILE = { width: 163, height: 192 };

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
              <TrackedLink href={party.href} track={{ kind: "section", section: party.id }} className="gz-obj gt-tile" aria-label={`${party.title}, ${party.who.toLowerCase()}`}>
                <Image src="/table/tile-party.webp" alt="" {...TILE} unoptimized priority />
              </TrackedLink>
            </li>
            <li>
              <TrackedLink href={love.href} track={{ kind: "section", section: love.id }} className="gz-obj gt-tile" aria-label={`${love.title}, ${love.who.toLowerCase()}`}>
                <Image src="/table/tile-love.webp" alt="" {...TILE} unoptimized priority />
              </TrackedLink>
            </li>
            <li>
              {/* Раздел «Соло» в меню называется «Дневник» (как на плитке макета) */}
              <TrackedLink href={solo.href} track={{ kind: "section", section: solo.id }} className="gz-obj gt-tile" aria-label={`Дневник, ${solo.who.toLowerCase()}`}>
                <Image src="/table/tile-diary.webp" alt="" {...TILE} unoptimized priority />
              </TrackedLink>
            </li>
            <li>
              {/* GAZ GAME $HOW — раздел ещё не готов: плитка закрыта лентой «скоро» и ведёт на экран «Скоро» */}
              <TrackedLink href="/soon/show" track={{ kind: "home", target: "show" }} className="gz-obj gt-tile gt-tile-locked" aria-label="GAZ GAME $HOW, квиз-шоу: скоро">
                <Image src="/table/tile-show.webp" alt="" {...TILE} unoptimized />
                <span className="gt-soon" aria-hidden="true">
                  <svg viewBox="0 0 24 28" width="22" height="26">
                    <path d="M7 11V8a5 5 0 0 1 10 0v3" fill="none" stroke="#d8d8de" strokeWidth="2.4" strokeLinecap="round" />
                    <rect x="3" y="11" width="18" height="15" rx="2.5" fill="#f2c318" stroke="#141217" strokeWidth="1.4" />
                    <circle cx="12" cy="18" r="2.2" fill="#141217" />
                    <path d="M12 19v3.4" stroke="#141217" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  <b>СКОРО</b>
                </span>
              </TrackedLink>
            </li>
          </ul>
        </nav>

        <nav aria-label="Ещё" className="gt-extras">
          <TrackedLink href="/collection" track={{ kind: "home", target: "collection" }} className="gz-obj gt-extra gt-extra-album" aria-label="Коллекция: альбом карт">
            <Image src="/table/extra-album.webp" alt="" width={150} height={126} unoptimized />
            <CollectionDot />
          </TrackedLink>
          <TrackedLink
            href={SUGGEST?.href ?? "/soon/suggest"}
            external={SUGGEST?.external}
            track={{ kind: "home", target: "suggest" }}
            className="gz-obj gt-extra gt-extra-note"
            aria-label="Предложи своё: канал в Telegram"
          >
            <Image src="/table/extra-note.webp" alt="" width={148} height={122} unoptimized />
          </TrackedLink>
          <TrackedLink href="/premium" track={{ kind: "home", target: "premium" }} className="gz-obj gt-extra gt-extra-vip" aria-label="VIP: всё открыто">
            <Image src="/table/extra-vip.webp" alt="" width={147} height={131} unoptimized />
          </TrackedLink>
        </nav>
      </div>
    </div>
  );
}
