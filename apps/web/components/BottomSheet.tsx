"use client";

// Шторка снизу: затемнение, панель с голубой кромкой (как в макете «Premium»), закрытие по фону и Esc.
// Фокус переносится в шторку и возвращается обратно после закрытия.
import { useEffect, useRef, type ReactNode } from "react";

export function BottomSheet({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Подпись для скринридера: заголовок шторки. */
  label: string;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const before = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      before?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button type="button" aria-label="Закрыть" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="sheet-up relative flex max-h-[88svh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-t-[24px] border-t border-[#62D2FF]/40 bg-surface-2 px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgb(0_0_0/0.5)] outline-none"
      >
        {children}
      </div>
    </div>
  );
}
