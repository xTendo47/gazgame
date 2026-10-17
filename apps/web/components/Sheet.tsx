"use client";

// Шторка снизу в стиле главной и разделов (тёмная, с оранжевыми акцентами): «Как играть за 10 секунд», умный 🎲.
// Затемнение, закрытие тапом по фону и Esc; фокус уходит в шторку и возвращается обратно. Страница под ней не прокручивается.
import { useEffect, useRef, type ReactNode } from "react";

export function Sheet({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      before?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button type="button" aria-label="Закрыть" tabIndex={-1} className="absolute inset-0 bg-[rgb(10_8_12/0.7)]" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="sheet-up relative flex max-h-[92dvh] w-full max-w-[480px] flex-col gap-3.5 overflow-y-auto rounded-t-[26px] border border-b-0 border-line bg-surface px-[18px] pt-5 pb-[max(1.4rem,env(safe-area-inset-bottom))] outline-none"
      >
        {children}
      </div>
    </div>
  );
}
