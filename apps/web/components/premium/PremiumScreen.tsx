"use client";

// Экран VIP (макет v6.4: тёмная комната с прожектором и канатом, чёрно-золотая карта, перечень, золотая кнопка).
// Логика прежняя: перечень (разделы) со шторками, «Стать VIP» → шторка оплаты (очередь «Хочу первым»), «Есть код?» → шторка с кодом.
// Верный код: карта вспыхивает, разлетаются искры, длинная вибрация, потом экран перестраивается в «VIP включён».
// Тексты — из packages/content/data/premium.json; эмодзи из них при показе убираются (значки рисуем SVG).
import { useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import type { PremiumFile } from "@gazgame/content";
import { backTagClass, cn } from "@gazgame/ui";
import { trackHomeClick, trackSubscribeClick, trackSubscribeWaitlist } from "@/lib/analytics";
import { activatePremium, usePremium } from "@/lib/premium";
import { getProgress } from "@/lib/progress";
import { sfx } from "@/lib/sfx";
import { stripEmoji } from "@/lib/text";
import { BottomSheet } from "../BottomSheet";
import { Trident } from "../ultimate/Trident";
import { VipCard, VipSparks } from "./VipCard";
import { CheckGlyph, ChiliIcon, ClapperIcon, LockGlyph, MagnetIcon, PuzzleIcon } from "./VipIcons";
import { VipRoom } from "./VipRoom";
import "./vip.css";

type Sheet = { kind: "section"; id: string } | { kind: "pay" } | { kind: "code" } | null;

/** Куда ведёт «Пробовать закрытое»: «Насколько ты меня знаешь», уровень Бездна. */
const TRY_HREF = "/game/know-each-other?deck=abyss";

/** Искры вау-момента: 16 штук по кругу на разное расстояние. */
const SPARKS = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * Math.PI * 2;
  const dist = 70 + (i % 3) * 28;
  return { dx: `${Math.round(Math.cos(angle) * dist)}px`, dy: `${Math.round(Math.sin(angle) * dist)}px` };
});

/** Значок и порядок строк перечня по id раздела (в макете: перец, магнит, пазл, хлопушка). */
const PERK_ICON: Record<string, ReactNode> = { company: <ChiliIcon />, pairs: <MagnetIcon />, solo: <PuzzleIcon /> };
const PERK_ORDER = ["company", "pairs", "solo"];

export function PremiumScreen({
  texts,
  found,
  hashes,
  ultimate,
}: {
  texts: PremiumFile;
  /** Найден ли в контенте пункт шторки: found[sectionId][i]. Нет — «скоро». */
  found: Record<string, boolean[]>;
  hashes: string[];
  /** Плитка Ultimate (название и «скоро») из ultimate.json: ссылка на /ultimate. */
  ultimate?: { title: string; subtitle: string };
}) {
  const premium = usePremium();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [waitDone, setWaitDone] = useState(false);
  const [code, setCode] = useState("");
  const [wrong, setWrong] = useState(0);
  /** Вау-момент: пока искры летят, экран ещё в старом виде. */
  const [burst, setBurst] = useState(false);
  const on = premium && !burst;

  const close = () => setSheet(null);

  function submitCode() {
    if (!activatePremium(code, hashes)) {
      setWrong(wrong + 1);
      return;
    }
    setSheet(null);
    setCode("");
    setWrong(0);
    sfx.seal();
    try {
      navigator.vibrate?.(600);
    } catch {
      // вибрации нет — не страшно
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setBurst(true);
    window.setTimeout(() => setBurst(false), 1000);
  }

  const section = sheet?.kind === "section" ? texts.sections.find((s) => s.id === sheet.id) : undefined;
  const perks = [...texts.sections].sort((a, b) => PERK_ORDER.indexOf(a.id) - PERK_ORDER.indexOf(b.id));

  return (
    <div className="vip-page">
      <div className="vip-inner">
        <Link href="/open" className={backTagClass()} onClick={() => sfx.page()}>
          ← В коробку
        </Link>
        <h1 className="vip-title">VIP</h1>

        <div className="vip-stage">
          <VipRoom />
          <div className="vip-card-wrap">
            <VipCard burst={burst} />
            {burst && <VipSparks sparks={SPARKS} />}
          </div>
        </div>

        <p className="vip-lead" aria-live="polite">
          {on ? (
            stripEmoji(texts.on.lead)
          ) : (
            <>
              <b>VIP</b> открывает всё, что сейчас под замком:
            </>
          )}
        </p>

        <ul className="vip-perks">
          {perks.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                className="vip-perk"
                style={{ "--i": i } as CSSProperties}
                onClick={() => {
                  sfx.page();
                  setSheet({ kind: "section", id: s.id });
                }}
                aria-haspopup="dialog"
              >
                <span className="vip-perk-ico">{PERK_ICON[s.id]}</span>
                <b>{stripEmoji(s.title)}</b>
                <CheckGlyph />
              </button>
            </li>
          ))}
          <li>
            <div className="vip-perk" style={{ "--i": perks.length } as CSSProperties}>
              <span className="vip-perk-ico">
                <ClapperIcon />
              </span>
              <b>{stripEmoji(`${texts.fresh.text} ${texts.fresh.accent}`).replace(/Premium/g, "VIP")}</b>
              <CheckGlyph />
            </div>
          </li>
        </ul>

        {ultimate && (
          <Link
            href="/ultimate"
            onClick={() => {
              trackHomeClick({ target: "ultimate" });
              sfx.lock();
            }}
            className="vip-ultimate"
          >
            <Trident size={34} />
            <b>{ultimate.title}</b>
            <em>{stripEmoji(ultimate.subtitle)}</em>
          </Link>
        )}

        {on ? (
          <Link href={TRY_HREF} className="vip-cta">
            {stripEmoji(texts.on.cta)}
          </Link>
        ) : (
          <button
            type="button"
            className="vip-cta"
            onClick={() => {
              trackSubscribeClick();
              sfx.seal();
              setWaitDone(getProgress().hasJoinedWaitlist());
              setSheet({ kind: "pay" });
            }}
          >
            Стать VIP
          </button>
        )}
        {!on && (
          <button type="button" onClick={() => setSheet({ kind: "code" })} className="vip-code">
            {stripEmoji(texts.code.link)}
          </button>
        )}
        <p className="vip-fine">{(on ? stripEmoji(texts.on.fine) : stripEmoji(texts.fine)).replace(/Premium/g, "VIP")}</p>
      </div>

      {/* Шторка раздела */}
      <BottomSheet open={!!section} onClose={close} label={section ? stripEmoji(section.title) : ""}>
        {section && (
          <>
            <h2 className="font-display text-[17px] font-bold">{stripEmoji(section.title)}</h2>
            <ul className="flex flex-col gap-2">
              {section.items.map((item, i) => {
                const ok = found[section.id]?.[i] === true;
                return (
                  <li key={item.label} className="flex justify-between gap-2.5 text-sm">
                    <span>{stripEmoji(item.label)}</span>
                    <em className="shrink-0 not-italic" style={{ color: "#f2dc9a" }}>
                      {ok ? premium ? <CheckGlyph /> : <LockGlyph /> : stripEmoji(texts.soon)}
                    </em>
                  </li>
                );
              })}
            </ul>
            <button type="button" onClick={close} className="min-h-12 rounded-[14px] border border-line text-sm font-semibold">
              {stripEmoji(texts.sheetClose)}
            </button>
          </>
        )}
      </BottomSheet>

      {/* Шторка оплаты */}
      <BottomSheet open={sheet?.kind === "pay"} onClose={close} label={stripEmoji(texts.paySheet.title)}>
        <h2 className="font-display text-[17px] font-bold">{stripEmoji(texts.paySheet.title)}</h2>
        <p className="text-sm leading-[1.45] text-cream/85">{stripEmoji(texts.paySheet.text)}</p>
        {waitDone ? (
          <p role="status" className="rounded-[14px] bg-surface p-4 text-center text-sm font-bold text-lime">
            {stripEmoji(texts.paySheet.done)}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (getProgress().joinWaitlist()) trackSubscribeWaitlist();
              setWaitDone(true);
            }}
            className="min-h-14 rounded-[18px] bg-orange px-4 font-display text-base font-bold text-white"
          >
            {stripEmoji(texts.paySheet.button)}
          </button>
        )}
      </BottomSheet>

      {/* Шторка кода */}
      <BottomSheet open={sheet?.kind === "code"} onClose={close} label={stripEmoji(texts.code.title)}>
        <h2 className="font-display text-[17px] font-bold">{stripEmoji(texts.code.title)}</h2>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            submitCode();
          }}
        >
          <label htmlFor="premium-code" className="sr-only">
            {texts.code.placeholder}
          </label>
          <input
            key={wrong}
            id="premium-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={texts.code.placeholder}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-invalid={wrong > 0}
            aria-describedby={wrong > 0 ? "premium-code-wrong" : undefined}
            className={cn(
              "min-h-14 rounded-[14px] border bg-bg px-3.5 text-base font-semibold tracking-[0.1em] uppercase outline-none focus:border-[#c9a14e]",
              wrong > 0 ? "premium-shake border-orange" : "border-line",
            )}
          />
          {wrong > 0 && (
            <p id="premium-code-wrong" role="alert" className="-mt-1 text-sm font-semibold text-orange">
              {texts.code.wrong}
            </p>
          )}
          <button type="submit" className="min-h-14 rounded-[18px] bg-orange font-display text-base font-bold text-white">
            {texts.code.button}
          </button>
          <button type="button" onClick={close} className="min-h-12 rounded-[14px] border border-line text-sm font-semibold">
            {texts.code.cancel}
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
