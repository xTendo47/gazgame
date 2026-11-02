"use client";

// Звук на всё приложение: после первого касания включает фоновую музыку, усыпляет её, когда вкладка скрыта, и даёт каждому нажатию
// на кнопку или ссылку тихий щелчок. Ничего не рисует. Стоит один раз в корневом макете.
import { useEffect } from "react";
import { initMusicLifecycle } from "@/lib/music";
import { sfx } from "@/lib/sfx";

export function AudioBoot() {
  useEffect(() => {
    initMusicLifecycle();
    sfx.arm();
    const tap = (e: Event) => {
      const el = e.target instanceof Element ? e.target.closest("button, a[href], [role='button'], summary") : null;
      if (!el || el.closest("[data-silent]") || (el instanceof HTMLButtonElement && el.disabled)) return;
      sfx.soft();
    };
    document.addEventListener("pointerdown", tap, { capture: true, passive: true });
    return () => document.removeEventListener("pointerdown", tap, { capture: true });
  }, []);
  return null;
}
