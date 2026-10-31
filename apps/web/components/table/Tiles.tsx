"use client";

// Плитки экрана «Чем займёмся?» (SVG + CSS, без картинок). Рисунки макета — tile-art.ts, стили и анимации — table-tiles.css.
// Живые эффекты: рулетка Тусовки крутится; в Дневнике компас иногда поворачивается и из страниц идёт золотой свет;
// $HOW — шторы раскрываются при нажатии, лампа «В ЭФИРЕ» пульсирует; VIP-кейс при нажатии открывает крышку.
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CollectionDot } from "@/components/collection/CollectionDot";
import { TrackedLink } from "@/components/home/TrackedLink";
import { trackHomeClick } from "@/lib/analytics";
import { prefersReducedMotion } from "@/lib/gaz";
import { sfx } from "@/lib/sfx";
import { COMPASS, DIARY_COVER, LOVE_MAT, NOTE_BULB, PARTY_MAT, PARTY_SCENE, SHOW_DRAPE, SHOW_STAGE, SHOW_TV, VIP_HANDLE, VIP_INSIDE, VIP_LID } from "./tile-art";
import "./table-tiles.css";

/** Готовый SVG макета на всю площадь блока. */
function Art({ html, className }: { html: string; className?: string }) {
  return <span className={className ? `gt-art ${className}` : "gt-art"} aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />;
}

type SectionLinkProps = {
  href: string;
  section: "party" | "love" | "solo";
  label: string;
  children: ReactNode;
};

/** Плитка раздела: ссылка с отметкой в аналитике. */
function SectionTile({ href, section, label, children }: SectionLinkProps) {
  return (
    <TrackedLink href={href} track={{ kind: "section", section }} className="gz-obj gt-card" aria-label={label}>
      <span className="gt-in">{children}</span>
    </TrackedLink>
  );
}

/** Тусовка: казино, рулетка крутится (анимация внутри SVG, ключевые кадры raysr — в table-tiles.css). */
export function PartyTile({ href, label }: { href: string; label: string }) {
  return (
    <SectionTile href={href} section="party" label={label}>
      <Art html={PARTY_MAT} />
      <Art html={PARTY_SCENE} />
      <span className="gt-plaque">Тусовка</span>
    </SectionTile>
  );
}

/** Романтика: розовый конверт с восковой печатью, розой и маркой. */
export function LoveTile({ href, label }: { href: string; label: string }) {
  return (
    <SectionTile href={href} section="love" label={label}>
      <Art html={LOVE_MAT} />
      <svg className="gt-love-body" viewBox="0 0 146 175" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs>
          <linearGradient id="gt-lv-paper" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#fdeef3" />
            <stop offset="1" stopColor="#f7d4e0" />
          </linearGradient>
          <linearGradient id="gt-lv-flap" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#fff7fa" />
            <stop offset="1" stopColor="#f6d9e4" />
          </linearGradient>
          <radialGradient id="gt-lv-seal" cx=".38" cy=".3" r=".8">
            <stop offset="0" stopColor="#ff8fc0" />
            <stop offset=".6" stopColor="#d6337f" />
            <stop offset="1" stopColor="#8f1450" />
          </radialGradient>
          <radialGradient id="gt-lv-rose" cx=".4" cy=".35" r=".75">
            <stop offset="0" stopColor="#e5476a" />
            <stop offset=".6" stopColor="#a8123a" />
            <stop offset="1" stopColor="#5a0a22" />
          </radialGradient>
        </defs>
        {/* конверт */}
        <rect x="9" y="30" width="128" height="124" rx="2.5" fill="url(#gt-lv-paper)" stroke="rgb(176 82 125 / .45)" strokeWidth=".8" />
        <path d="M9 154 73 98 137 154" fill="none" stroke="rgb(176 82 125 / .35)" strokeWidth=".8" />
        <path d="M9 30h128L73 92z" fill="url(#gt-lv-flap)" stroke="rgb(176 82 125 / .5)" strokeWidth=".9" />
        <path d="M9 30h128" stroke="#fff" strokeWidth="1.4" strokeDasharray="3 2.4" opacity=".9" />
        {/* восковая печать с сердцем */}
        <g className="gt-heart-pulse">
          <circle cx="73" cy="90" r="15.5" fill="url(#gt-lv-seal)" stroke="#8f1450" strokeWidth=".8" />
          <path d="M73 98.5c-6-3.8-8.6-6.8-8.6-10 0-2.5 1.9-4.2 4.1-4.2 1.9 0 3.6 1.1 4.5 3 .9-1.9 2.6-3 4.5-3 2.2 0 4.1 1.7 4.1 4.2 0 3.2-2.6 6.2-8.6 10z" fill="#fff" opacity=".92" />
          <ellipse cx="66.5" cy="83" rx="4.5" ry="2.2" fill="#fff" opacity=".35" transform="rotate(-25 66.5 83)" />
        </g>
        {/* роза на ветке */}
        <g transform="translate(4 8)">
          <path d="M6 44C22 36 38 26 60 14" fill="none" stroke="#3f6a2e" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M20 38l-3-6 7 3zM34 29l-2-7 7 4z" fill="#3f6a2e" />
          <ellipse cx="26" cy="33" rx="6.5" ry="3" fill="#4f8038" transform="rotate(-35 26 33)" />
          <ellipse cx="42" cy="24" rx="6.5" ry="3" fill="#4f8038" transform="rotate(-30 42 24)" />
          <circle cx="62" cy="13" r="10" fill="url(#gt-lv-rose)" stroke="#4a081c" strokeWidth=".6" />
          <path d="M57 12c3-4 9-3 10 1M58 16c3 3 8 2 9-1M62 9c2 1 3 3 2 5" fill="none" stroke="#e8708a" strokeWidth=".9" strokeLinecap="round" opacity=".8" />
        </g>
        {/* марка с сердцем */}
        <g transform="rotate(8 120 34)">
          <rect x="105" y="14" width="29" height="36" rx="1.5" fill="#fff" stroke="#e8b3c8" strokeWidth=".8" strokeDasharray="1.6 1.2" />
          <rect x="108.5" y="17.5" width="22" height="29" fill="#ffc2d8" />
          <path d="M119.5 39c-5.500-3.300-7.500-5.800-7.500-8.500 0-2.100 1.600-3.600 3.500-3.600 1.600 0 3 .9 4 2.500 1-1.600 2.400-2.500 4-2.500 1.900 0 3.500 1.500 3.500 3.600 0 2.700-2 5.200-7.500 8.500z" fill="#d6337f" />
        </g>
      </svg>
      <span className="gt-love-title">Романтика</span>
      <span className="gt-love-sub">вдвоём</span>
    </SectionTile>
  );
}

/** Дневник: кожаная книга с компасом; компас иногда поворачивается, из страниц идёт золотой свет. */
export function DiaryTile({ href, label }: { href: string; label: string }) {
  return (
    <SectionTile href={href} section="solo" label={label}>
      <span className="gt-book">
        <span className="gt-book-pages" />
        <span className="gt-book-cover">
          <Art html={DIARY_COVER} />
          <span className="gt-book-title">ДНЕВНИК</span>
          <span className="gt-book-compass" dangerouslySetInnerHTML={{ __html: COMPASS }} aria-hidden="true" />
          <span className="gt-book-kanji" aria-hidden="true">
            自 · 心 · 道
          </span>
        </span>
        <span className="gt-book-strap" aria-hidden="true">
          <span className="gt-book-buckle" />
        </span>
        <span className="gt-book-ribbon" aria-hidden="true" />
        <span className="gt-book-glow" aria-hidden="true" />
      </span>
    </SectionTile>
  );
}

/** $HOW: сцена, ретро-ТВ, шторы, лампа «В ЭФИРЕ». Нажатие раздвигает шторы, потом открывается экран «Скоро». */
export function ShowTile({ href, label }: { href: string; label: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <Link
      href={href}
      className="gz-obj gt-card"
      aria-label={label}
      data-open={open}
      onClick={(e) => {
        e.preventDefault();
        trackHomeClick({ target: "show" });
        if (prefersReducedMotion()) {
          router.push(href);
          return;
        }
        setOpen(true);
        sfx.swish();
        sfx.tap(0.5);
        setTimeout(() => router.push(href), 800);
      }}
    >
      <span className="gt-in">
        <Art html={SHOW_STAGE} />
        <span className="gt-show-tv" aria-hidden="true" dangerouslySetInnerHTML={{ __html: SHOW_TV }} />
        <Art html={SHOW_DRAPE} className="gt-drape" />
        <span className="gt-air" aria-hidden="true">
          <span className="gt-air-lamp" />
          <span className="gt-air-tx">
            <small>КВИЗ-ШОУ</small>
            <b>В ЭФИРЕ</b>
          </span>
        </span>
        {/* лента «СКОРО» в углу: раздел ещё не готов */}
        <span className="gt-soon" aria-hidden="true">
          <span className="gt-soon-band">
            <svg viewBox="0 0 24 28">
              <path d="M7 11V8a5 5 0 0 1 10 0v3" fill="none" stroke="#ffd21a" strokeWidth="3" strokeLinecap="round" />
              <rect x="3" y="11" width="18" height="15" rx="2.5" fill="#ffd21a" />
            </svg>
            <b>СКОРО</b>
          </span>
        </span>
      </span>
    </Link>
  );
}

/** «Коллекция»: кожаный альбом с торчащей картой. */
export function AlbumExtra() {
  return (
    <TrackedLink href="/collection" track={{ kind: "home", target: "collection" }} className="gz-obj gt-ex" aria-label="Коллекция: альбом карт" onClick={() => sfx.page()}>
      <span className="gt-ex-in gt-album">
        <span className="gt-album-pages" />
        <span className="gt-album-cover">
          <span className="gt-album-stitch" />
          <span className="gt-album-t">Коллекция</span>
          <span className="gt-album-s">альбом карт</span>
          <span className="gt-album-corner" />
        </span>
        <span className="gt-album-band" />
        <span className="gt-album-peek" />
      </span>
      <CollectionDot />
    </TrackedLink>
  );
}

/** «Предложи своё»: записка с зачёркнутой строкой и лампочкой. Ведёт в Telegram-канал. */
export function NoteExtra({ href, external }: { href: string; external?: boolean }) {
  return (
    <TrackedLink href={href} external={external} track={{ kind: "home", target: "suggest" }} className="gz-obj gt-ex" aria-label="Предложи своё: канал в Telegram">
      <span className="gt-ex-in gt-note">
        <span className="gt-note-glow" aria-hidden="true" />
        <span className="gt-note-paper">
          <span className="gt-note-t">Предложи своё</span>
          <span className="gt-note-l1">ещё одна колода</span>
          <span className="gt-note-l2">твоя идея →</span>
        </span>
        <span className="gt-note-bulb" aria-hidden="true" dangerouslySetInnerHTML={{ __html: NOTE_BULB }} />
      </span>
    </TrackedLink>
  );
}

/** VIP-кейс: при нажатии открывает крышку и показывает карту, потом ведёт на экран VIP. */
export function VipExtra({ href }: { href: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <Link
      href={href}
      className="gz-obj gt-ex"
      aria-label="VIP: всё открыто"
      onClick={(e) => {
        e.preventDefault();
        trackHomeClick({ target: "premium" });
        if (prefersReducedMotion()) {
          router.push(href);
          return;
        }
        setOpen(true);
        sfx.lock();
        sfx.tin();
        setTimeout(() => router.push(href), 950);
      }}
    >
      <span className="gt-ex-in gt-vipcase" data-open={open}>
        <span className="gt-vc-glow" />
        <span className="gt-vc-inside" aria-hidden="true" dangerouslySetInnerHTML={{ __html: VIP_INSIDE }} />
        <span className="gt-vc-lid">
          <Art html={VIP_LID} />
          <span className="gt-vc-handle" aria-hidden="true" dangerouslySetInnerHTML={{ __html: VIP_HANDLE }} />
        </span>
        <span className="gt-vc-lab">VIP</span>
      </span>
    </Link>
  );
}
