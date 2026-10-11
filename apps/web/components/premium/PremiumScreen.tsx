"use client";

// Экран «Премиум» 💎 (вид — drafts-premium/mock.html): главная карточка с алмазом, три мини-плитки разделов
// со шторками, «Оформить Премиум» → шторка оплаты, «Есть код? 🔑» → шторка с кодом.
// Верный код: алмаз вспыхивает, разлетаются искры, длинная вибрация, потом экран перестраивается в «Премиум включён».
import { useState, type CSSProperties } from "react";
import Link from "next/link";
import type { PremiumFile } from "@gazgame/content";
import { cn } from "@gazgame/ui";
import { trackSubscribeClick, trackSubscribeWaitlist } from "@/lib/analytics";
import { activatePremium, usePremium } from "@/lib/premium";
import { getProgress } from "@/lib/progress";
import { BottomSheet } from "../BottomSheet";
import { HeaderBack } from "../HeaderBack";
import { Gem } from "./Gem";

type Sheet = { kind: "section"; id: string } | { kind: "pay" } | { kind: "code" } | null;

/** Куда ведёт «Пробовать закрытое 💎»: «Насколько ты меня знаешь», уровень Бездна. */
const TRY_HREF = "/game/know-each-other?deck=abyss";

/** Искры вау-момента: 16 штук по кругу на разное расстояние. */
const SPARKS = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * Math.PI * 2;
  const dist = 70 + (i % 3) * 28;
  return { dx: `${Math.round(Math.cos(angle) * dist)}px`, dy: `${Math.round(Math.sin(angle) * dist)}px` };
});

const ICE = "#62D2FF";

export function PremiumScreen({
  texts,
  found,
  hashes,
}: {
  texts: PremiumFile;
  /** Найден ли в контенте пункт шторки: found[sectionId][i]. Нет — «скоро». */
  found: Record<string, boolean[]>;
  hashes: string[];
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

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex items-center justify-between text-[13px] text-muted">
        <HeaderBack />
        <span>{texts.header}</span>
      </div>

      {/* Главная карточка */}
      <section aria-labelledby="premium-title" className="premium-hero relative flex flex-col items-center gap-2.5 rounded-[24px] px-[18px] pt-7 pb-[22px] text-center">
        <div className="relative">
          <Gem size={96} flash={burst} />
          {burst && (
            <span aria-hidden="true">
              {SPARKS.map((s, i) => (
                <span key={i} className="premium-spark" style={{ "--dx": s.dx, "--dy": s.dy } as CSSProperties} />
              ))}
            </span>
          )}
        </div>
        <div className="text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: ICE }}>
          {texts.badge}
        </div>
        <h1 id="premium-title" className="font-display text-[30px] leading-[1.05] font-black text-balance transition-opacity duration-500">
          {on ? texts.on.title : texts.title}
        </h1>
        <p aria-live="polite" className="max-w-[30ch] text-[15px] leading-[1.45] text-balance text-cream/85">
          {on ? texts.on.lead : texts.lead}
        </p>
      </section>

      {/* Мини-плитки разделов */}
      <div className="grid grid-cols-3 gap-2">
        {texts.sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSheet({ kind: "section", id: s.id })}
            className="flex min-w-0 flex-col gap-1.5 rounded-[18px] border border-line bg-surface px-2.5 py-3 text-left transition hover:-translate-y-0.5 hover:border-[#62D2FF]/60"
          >
            <span aria-hidden="true" className="text-[22px] leading-none">
              {s.emoji}
            </span>
            <b className="font-display text-xs leading-tight font-bold">{s.title}</b>
            <span className="text-xs leading-snug text-muted">{s.line}</span>
            {on && (
              <span className="mt-auto pt-1 text-[11px] font-bold" style={{ color: ICE }}>
                {texts.on.tileState}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2.5 rounded-2xl bg-surface px-3.5 py-3 text-[13px]">
        <span aria-hidden="true">{texts.fresh.emoji}</span>
        <span>
          {texts.fresh.text} <b className="font-bold text-lime">{texts.fresh.accent}</b>
        </span>
      </div>

      {on ? (
        <Link
          href={TRY_HREF}
          className="flex min-h-14 items-center justify-center rounded-[18px] px-4 py-4 text-center font-display text-base font-bold text-bg shadow-[0_8px_26px_rgb(98_210_255/0.35)]"
          style={{ background: ICE }}
        >
          {texts.on.cta}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => {
            trackSubscribeClick();
            setWaitDone(getProgress().hasJoinedWaitlist());
            setSheet({ kind: "pay" });
          }}
          className="min-h-14 rounded-[18px] bg-orange px-4 py-4 font-display text-base font-bold text-white shadow-[0_8px_26px_rgb(255_90_31/0.35)]"
        >
          {texts.cta}
        </button>
      )}
      {!on && (
        <button
          type="button"
          onClick={() => setSheet({ kind: "code" })}
          className="min-h-11 self-center text-sm font-medium text-muted underline underline-offset-[3px]"
        >
          {texts.code.link}
        </button>
      )}
      <p className="text-center text-xs text-muted">{on ? texts.on.fine : texts.fine}</p>

      {/* Шторка раздела */}
      <BottomSheet open={!!section} onClose={close} label={section ? `${section.title} ${section.emoji}` : ""}>
        {section && (
          <>
            <h2 className="font-display text-[17px] font-bold">
              {section.title} {section.emoji}
            </h2>
            <ul className="flex flex-col gap-2">
              {section.items.map((item, i) => {
                const ok = found[section.id]?.[i] === true;
                return (
                  <li key={item.label} className="flex justify-between gap-2.5 text-sm">
                    <span>{item.label}</span>
                    <em className="shrink-0 not-italic" style={{ color: ICE }}>
                      {ok ? (premium ? "✓" : "💎") : texts.soon}
                    </em>
                  </li>
                );
              })}
            </ul>
            <button type="button" onClick={close} className="min-h-12 rounded-[14px] border border-line text-sm font-semibold">
              {texts.sheetClose}
            </button>
          </>
        )}
      </BottomSheet>

      {/* Шторка оплаты */}
      <BottomSheet open={sheet?.kind === "pay"} onClose={close} label={texts.paySheet.title}>
        <h2 className="font-display text-[17px] font-bold">{texts.paySheet.title}</h2>
        <p className="text-sm leading-[1.45] text-cream/85">{texts.paySheet.text}</p>
        {waitDone ? (
          <p role="status" className="rounded-[14px] bg-surface p-4 text-center text-sm font-bold text-lime">
            {texts.paySheet.done}
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
            {texts.paySheet.button}
          </button>
        )}
      </BottomSheet>

      {/* Шторка кода */}
      <BottomSheet open={sheet?.kind === "code"} onClose={close} label={texts.code.title}>
        <h2 className="font-display text-[17px] font-bold">{texts.code.title}</h2>
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
              "min-h-14 rounded-[14px] border bg-bg px-3.5 text-base font-semibold tracking-[0.1em] uppercase outline-none focus:border-[#62D2FF]",
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
