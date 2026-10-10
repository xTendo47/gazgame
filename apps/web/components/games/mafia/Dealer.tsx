"use client";

// Раздача карт по кругу (общая для «Мафии» и «Шпиона»): рубашка → карта переворачивается → «Скрыть» →
// «Передай следующему» → следующая. Колода под верхней картой тает по одной. После последней — done.
import { useState, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Button } from "@gazgame/ui";
import { CardBack } from "./RoleCard";

type DealStep = "back" | "face" | "pass";

export function Dealer({
  total,
  face,
  faceLabel,
  texts,
  done,
}: {
  total: number;
  /** Лицо карты игрока i (с нуля). */
  face: (i: number) => ReactNode;
  /** Что прочитает скринридер, когда карта открыта. */
  faceLabel: (i: number) => string;
  /** deal — «Игрок {n} из {total}…», hide — кнопка «Скрыть», pass — «Передай следующему», cardBack — надпись на рубашке. */
  texts: { deal: string; hide: string; pass: string; cardBack: string };
  /** Экран после последней карты. */
  done: ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<DealStep>("back");
  const remaining = total - index - 1; // карт под верхней
  const deal = texts.deal.replace("{n}", String(index + 1)).replace("{total}", String(total));

  if (index >= total) return <>{done}</>;

  if (step === "pass") {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-card bg-surface p-8 text-center">
          <p className="font-display text-2xl font-bold leading-snug">{texts.pass}</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setIndex(index + 1);
            setStep("back");
          }}
        >
          Дальше
        </Button>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col items-center gap-5">
        <p className="text-center font-semibold text-muted" aria-live="polite">
          {deal}
        </p>
        <div className="relative w-full max-w-64" style={{ perspective: 1200 }}>
          {/* Колода под верхней картой: тает по одной */}
          {Array.from({ length: Math.min(remaining, 3) }, (_, i) => (
            <CardBack
              key={i}
              label={texts.cardBack}
              className="absolute inset-0"
              style={{ transform: `translate(${(i + 1) * 5}px, ${(i + 1) * 5}px)`, zIndex: 0, opacity: 1 - i * 0.2 }}
            />
          ))}
          <AnimatePresence mode="wait">
            <motion.button
              key={index}
              type="button"
              aria-label={step === "back" ? "Перевернуть карту" : faceLabel(index)}
              disabled={step !== "back"}
              onClick={() => setStep("face")}
              className="relative z-10 block w-full rounded-[22px] text-left"
              style={{ transformStyle: "preserve-3d" }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0, rotateY: step === "face" ? 180 : 0 }}
              exit={{ x: 420, rotate: 25, opacity: 0, transition: { duration: 0.35 } }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <CardBack label={texts.cardBack} style={{ backfaceVisibility: "hidden" }} />
              <div className="absolute inset-0" style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}>
                {face(index)}
              </div>
            </motion.button>
          </AnimatePresence>
        </div>
        {step === "face" ? (
          <Button variant="primary" onClick={() => setStep("pass")}>
            {texts.hide}
          </Button>
        ) : (
          <p className="text-sm text-muted">Карт в колоде: {remaining + 1}</p>
        )}
      </div>
    </MotionConfig>
  );
}
