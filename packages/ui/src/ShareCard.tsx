import type { Ref } from "react";

export interface ShareCardProps {
  /** Надпись сверху, например название теста. */
  label: string;
  emoji: string;
  title: string;
  text?: string;
  /** Крупная цифра, например «87%». */
  highlight?: string;
  ref?: Ref<HTMLDivElement>;
}

/**
 * Карточка результата для сторис, формат 9:16.
 * Размер фиксированный (270×480): при сохранении увеличивается в 4 раза → 1080×1920.
 */
export function ShareCard({ label, emoji, title, text, highlight, ref }: ShareCardProps) {
  return (
    <div
      ref={ref}
      className="relative flex h-[480px] w-[270px] shrink-0 flex-col overflow-hidden rounded-[28px] bg-bg p-6 text-cream"
      style={{
        backgroundImage:
          "radial-gradient(circle at 15% 10%, rgba(255,90,31,0.95), transparent 55%), radial-gradient(circle at 90% 95%, rgba(212,255,58,0.55), transparent 50%)",
      }}
    >
      <div className="text-xs font-extrabold uppercase tracking-widest opacity-90">{label}</div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <div className="text-[72px] leading-none">{emoji}</div>
        {highlight && <div className="font-display text-5xl font-black text-lime">{highlight}</div>}
        <div className="font-display text-[26px] font-black leading-tight">{title}</div>
        {text && <p className="line-clamp-5 text-sm font-semibold leading-snug">{text}</p>}
      </div>
      <div className="flex items-end justify-between">
        <div className="font-display text-lg font-black leading-none">
          GAZ<span className="text-orange">GAME</span>
        </div>
        <div className="text-right text-[10px] font-bold leading-tight opacity-80">
          Не сиди. Не тупи.
          <br />
          <span className="text-lime">Газ!</span>
        </div>
      </div>
    </div>
  );
}
