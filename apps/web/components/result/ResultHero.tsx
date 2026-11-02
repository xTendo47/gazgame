"use client";

// Шапка экрана результата: эмодзи выпрыгивает пружинкой, название и подзаголовок всплывают следом,
// второй эмодзи смешанного результата — чуть позже. Всё укладывается в 0,5 с.
// Кому мешает движение: MotionConfig reducedMotion="user" гасит прыжки и сдвиги, остаётся мягкое проявление.
import { MotionConfig, motion } from "motion/react";
import { Glyph } from "@/components/casino/GIcon";
import { Em } from "@/components/Em";

/**
 * Размер заголовка по самому длинному слову: на узком телефоне (360px) слово должно влезать целиком,
 * без переноса посередине («Прикосновения», «Наблюдатель»).
 */
function titleSize(title: string): string {
  const longest = Math.max(...title.split(/\s+/).map((w) => w.length));
  // vw — чтобы влезало и на совсем узких экранах (320px); на обычных телефонах упирается в rem
  if (longest <= 8) return "text-[min(2.25rem,10.5vw)]";
  if (longest <= 10) return "text-[min(1.875rem,8.3vw)]";
  return "text-[min(1.6rem,7vw)]";
}

/** Тёмный или светлый текст на карточке цвета hex: чтобы читалось и на жёлтом, и на чёрном. */
function textOn(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.5 ? "#141217" : "#F3EEE6";
}

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay, ease: "easeOut" as const },
});

export function ResultHero({
  label,
  emoji,
  title,
  blendEmoji,
  blendTitle,
  subtitle,
  status,
  text,
  accent,
  tag,
}: {
  /** «🌡️ Твой темперамент · твой результат». */
  label: string;
  emoji: string;
  title: string;
  blendEmoji?: string;
  /** «с нотками холерика 🔥» — отдельной строкой под названием. */
  blendTitle?: string;
  subtitle?: string;
  /** Плашка-статус «в сети» под подзаголовком, например «Режим: 100 уведомлений» (тесты с костюмом messenger). */
  status?: string;
  text?: string;
  /** Цвет карточки итога (result.acc) и рамка со свечением (result.accBorder). Нет — оранжевая, как у всех. */
  accent?: { color: string; border?: string };
  /** Чип под названием: «по-научному: интроверт». */
  tag?: string;
}) {
  const fg = accent ? textOn(accent.color) : undefined;
  return (
    <MotionConfig reducedMotion="user">
      <section
        className={`flex flex-col items-center gap-3 overflow-hidden rounded-card px-5 pt-8 pb-7 text-center ${accent ? "" : "bg-orange text-bg"}`}
        style={
          accent
            ? {
                backgroundColor: accent.color,
                color: fg,
                ...(accent.border ? { border: `2px solid ${accent.border}`, boxShadow: `0 0 32px ${accent.border}55` } : {}),
              }
            : undefined
        }
      >
        <div className="text-sm font-extrabold uppercase tracking-wide text-balance"><Em text={label} /></div>
        {/* Второй эмодзи стоит в своём месте справа от первого, а не поверх — на текст не налезает */}
        <div aria-hidden="true" className="flex items-end justify-center gap-1 text-7xl leading-none">
          <motion.span
            className="inline-block"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 14, mass: 0.7 }}
          >
            <Glyph emoji={emoji} label={title} size="1em" />
          </motion.span>
          {blendEmoji && (
            <motion.span
              className="-ml-3 inline-block rounded-full bg-bg p-1.5 text-3xl leading-none"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 15, delay: 0.25 }}
            >
              <Glyph emoji={blendEmoji} label={blendTitle} size="1em" />
            </motion.span>
          )}
        </div>
        <motion.h1
          {...rise(0.1)}
          className={`font-display ${titleSize(title)} leading-tight font-black text-balance [overflow-wrap:anywhere]`}
        >
          {title}
        </motion.h1>
        {blendTitle && (
          <motion.p {...rise(0.16)} className="-mt-2 text-lg font-bold text-balance">
            <Em text={blendTitle} />
          </motion.p>
        )}
        {subtitle && (
          <motion.p
            {...rise(0.2)}
            className={`max-w-full rounded-full px-4 py-1 text-sm font-extrabold uppercase tracking-wide text-balance ${accent ? "" : "bg-bg text-orange"}`}
            style={accent ? { backgroundColor: fg, color: accent.color } : undefined}
          >
            {subtitle}
          </motion.p>
        )}
        {tag && (
          <motion.p {...rise(0.22)} className="max-w-full rounded-full border border-current/45 px-3 py-0.5 text-xs font-bold text-balance">
            {tag}
          </motion.p>
        )}
        {status && (
          <motion.p
            {...rise(0.24)}
            className="flex max-w-full items-center gap-2 rounded-full bg-bg/85 px-3.5 py-1.5 text-left text-[15px] font-bold text-cream"
          >
            <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
              <span className="absolute inset-0 animate-ping rounded-full bg-[#3DDC84] opacity-60 motion-reduce:animate-none" />
              <span className="relative size-2.5 rounded-full bg-[#3DDC84]" />
            </span>
            <span className="sr-only">В сети. </span>
            {status}
          </motion.p>
        )}
        {text && (
          <motion.p {...rise(0.2)} className="text-lg font-semibold">
            {text}
          </motion.p>
        )}
      </section>
    </MotionConfig>
  );
}
